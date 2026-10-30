import type {FastifyInstance, FastifyRequest} from 'fastify';
import {Pool, type PoolClient} from 'pg';
import {z} from 'zod';
import {DomainError} from '../../../packages/domain/src/index.js';
import {
  availableClipMemory,
  clipMemoryId,
  createLegacyArtifact,
  failedClipMemory,
  requestedClipMemory,
  safeTwitchClipUrl,
  type ClipMemory,
} from '../../../packages/winner-memory/src/index.js';
import {decrypt, digest, encrypt, secretToken} from './security.js';

const Id = z.string().min(1).max(200);
const Chapter = z.object({id: Id, chapter: z.coerce.number().int().positive()});
const Legacy = z.object({willieId: Id, chapter: z.coerce.number().int().positive()});
const fail = (code: string): never => {
  throw new DomainError(code);
};
const Token = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_at: z.number(),
  scope: z.array(z.string()).default([]),
});
type ClipToken = z.infer<typeof Token>;
type Env = {
  TWITCH_CLIENT_ID?: string;
  TWITCH_CLIENT_SECRET?: string;
  TOKEN_ENCRYPTION_KEY?: string;
  APP_URL?: string;
  NODE_ENV?: string;
};

export function registerWinnerMemoryRoutes(
  app: FastifyInstance,
  databaseUrl?: string,
  env: Env = process.env,
): void {
  const pool = databaseUrl ? new Pool({connectionString: databaseUrl, max: 3}) : undefined;
  const db = () => pool ?? fail('DATABASE_UNAVAILABLE');
  const base = new URL(env.APP_URL ?? 'http://localhost:3000').origin;
  const secure = env.NODE_ENV === 'production';
  app.addHook('onClose', async () => {
    if (pool) await pool.end();
  });

  async function sessionUser(req: FastifyRequest): Promise<string> {
    const token = req.cookies.willie_session;
    if (!token) fail('AUTH_REQUIRED');
    const result = await db().query<{user_id: string}>(
      'SELECT s.user_id FROM creator_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.deleted_at IS NULL',
      [digest(token)],
    );
    return result.rows[0]?.user_id ?? fail('AUTH_REQUIRED');
  }

  async function active(
    client: Pool | PoolClient,
    campaignId: string,
    userId: string,
  ): Promise<void> {
    const result = await client.query(
      'SELECT 1 FROM campaign_members WHERE campaign_id=$1 AND user_id=$2 AND active=true',
      [campaignId, userId],
    );
    if (!result.rowCount) fail('FORBIDDEN');
  }

  async function tx<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await db().connect();
    try {
      await client.query('BEGIN');
      const output = await work(client);
      await client.query('COMMIT');
      return output;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  function requireTwitchConfig(): void {
    if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET || !env.TOKEN_ENCRYPTION_KEY)
      fail('TWITCH_CLIP_CONFIGURATION_REQUIRED');
  }

  async function loadClipToken(userId: string): Promise<ClipToken> {
    requireTwitchConfig();
    const row = await db().query<{encrypted_token: {iv: string; tag: string; data: string}}>(
      'SELECT encrypted_token FROM winner_clip_tokens WHERE user_id=$1',
      [userId],
    );
    if (!row.rows[0]) fail('CLIP_SCOPE_REQUIRED');
    let token = Token.parse(decrypt(row.rows[0].encrypted_token, env.TOKEN_ENCRYPTION_KEY!));
    if (token.expires_at - Date.now() > 30_000) return token;

    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
        client_id: env.TWITCH_CLIENT_ID!,
        client_secret: env.TWITCH_CLIENT_SECRET!,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) fail('TWITCH_CLIP_TOKEN_REFRESH_FAILED');
    const body = z
      .object({
        access_token: z.string(),
        refresh_token: z.string().optional(),
        expires_in: z.number().positive(),
        scope: z.array(z.string()).optional(),
      })
      .parse(await response.json());
    token = {
      access_token: body.access_token,
      refresh_token: body.refresh_token ?? token.refresh_token,
      expires_at: Date.now() + body.expires_in * 1000,
      scope: body.scope ?? token.scope,
    };
    await db().query(
      'UPDATE winner_clip_tokens SET encrypted_token=$2,scopes=$3,updated_at=now() WHERE user_id=$1',
      [
        userId,
        JSON.stringify(encrypt(token, env.TOKEN_ENCRYPTION_KEY!)),
        JSON.stringify(token.scope),
      ],
    );
    return token;
  }

  app.get('/auth/twitch/clip-memory', async (req, reply) => {
    requireTwitchConfig();
    const actor = await sessionUser(req);
    const state = secretToken();
    await db().query('DELETE FROM winner_clip_oauth_states WHERE expires_at<=now()');
    await db().query(
      "INSERT INTO winner_clip_oauth_states(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '10 minutes')",
      [digest(state), actor],
    );
    reply.setCookie('willie_clip_oauth', state, {
      signed: true,
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/auth/twitch/clip-memory/callback',
      maxAge: 600,
    });
    const url = new URL('https://id.twitch.tv/oauth2/authorize');
    url.search = new URLSearchParams({
      client_id: env.TWITCH_CLIENT_ID!,
      redirect_uri: base + '/auth/twitch/clip-memory/callback',
      response_type: 'code',
      scope: 'clips:edit',
      state,
    }).toString();
    return reply.redirect(url.toString());
  });

  app.get('/auth/twitch/clip-memory/callback', async (req, reply) => {
    requireTwitchConfig();
    const query = z
      .object({code: z.string().min(1).max(2048), state: z.string().min(20).max(200)})
      .parse(req.query);
    const signed = req.cookies.willie_clip_oauth;
    const checked = signed ? req.unsignCookie(signed) : undefined;
    reply.clearCookie('willie_clip_oauth', {path: '/auth/twitch/clip-memory/callback'});
    if (!checked?.valid || checked.value !== query.state) fail('OAUTH_STATE_INVALID');
    const state = await db().query<{user_id: string}>(
      'DELETE FROM winner_clip_oauth_states WHERE token_hash=$1 AND expires_at>now() RETURNING user_id',
      [digest(query.state)],
    );
    const expected = state.rows[0]?.user_id ?? fail('OAUTH_STATE_INVALID');
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: env.TWITCH_CLIENT_ID!,
        client_secret: env.TWITCH_CLIENT_SECRET!,
        code: query.code,
        grant_type: 'authorization_code',
        redirect_uri: base + '/auth/twitch/clip-memory/callback',
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) fail('OAUTH_EXCHANGE_FAILED');
    const raw = z
      .object({
        access_token: z.string(),
        refresh_token: z.string(),
        expires_in: z.number().positive(),
        scope: z.array(z.string()).optional(),
      })
      .parse(await tokenResponse.json());
    if (!(raw.scope ?? []).includes('clips:edit')) fail('CLIP_SCOPE_REQUIRED');
    const validation = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers: {Authorization: 'OAuth ' + raw.access_token},
      signal: AbortSignal.timeout(10_000),
    });
    if (!validation.ok) fail('OAUTH_TOKEN_INVALID');
    const identity = z
      .object({client_id: z.string(), user_id: z.string()})
      .parse(await validation.json());
    if (identity.client_id !== env.TWITCH_CLIENT_ID || identity.user_id !== expected)
      fail('OAUTH_IDENTITY_MISMATCH');
    const token: ClipToken = {
      access_token: raw.access_token,
      refresh_token: raw.refresh_token,
      expires_at: Date.now() + raw.expires_in * 1000,
      scope: raw.scope ?? [],
    };
    await db().query(
      'INSERT INTO winner_clip_tokens(user_id,encrypted_token,scopes) VALUES($1,$2,$3) ON CONFLICT(user_id) DO UPDATE SET encrypted_token=excluded.encrypted_token,scopes=excluded.scopes,updated_at=now()',
      [
        expected,
        JSON.stringify(encrypt(token, env.TOKEN_ENCRYPTION_KEY!)),
        JSON.stringify(token.scope),
      ],
    );
    return reply.redirect('/app?clipMemory=connected');
  });

  app.post('/api/winner/clip-memory/disconnect', async (req) => {
    const actor = await sessionUser(req);
    await db().query('DELETE FROM winner_clip_tokens WHERE user_id=$1', [actor]);
    return {disconnected: true};
  });

  app.post('/api/campaigns/:id/passport/chapters/:chapter/clip', async (req) => {
    const {id, chapter} = Chapter.parse(req.params);
    const actor = await sessionUser(req);
    const input = z
      .object({title: z.string().trim().min(1).max(100).optional()})
      .strict()
      .parse(req.body ?? {});
    requireTwitchConfig();
    return tx(async (client) => {
      await active(client, id, actor);
      const row = await client.query<{
        chapter_id: string;
        relay_id: string;
        creator_id: string;
        receipt_id: string | null;
        handoff: unknown;
      }>(
        `SELECT pc.id chapter_id,pc.relay_id,pc.creator_id,pc.receipt_id,s.state->'handoff' handoff
         FROM passport_chapters pc
         JOIN willie_snapshots s ON s.campaign_id=pc.campaign_id
         WHERE pc.campaign_id=$1 AND pc.chapter_number=$2 FOR UPDATE`,
        [id, chapter],
      );
      const chapterRow = row.rows[0] ?? fail('PASSPORT_CHAPTER_NOT_FOUND');
      if (chapterRow.creator_id !== actor) fail('CLIP_CREATOR_REQUIRED');
      const existing = await client.query<{status: string; url: string | null}>(
        'SELECT status,url FROM winner_clip_requests WHERE chapter_id=$1 FOR UPDATE',
        [chapterRow.chapter_id],
      );
      if (existing.rows[0] && ['PENDING', 'AVAILABLE'].includes(existing.rows[0].status))
        return {
          status: existing.rows[0].status,
          clipUrl:
            existing.rows[0].status === 'AVAILABLE' ? existing.rows[0].url ?? undefined : undefined,
        };

      const handoff = chapterRow.handoff as null | {source?: string; status?: string};
      const handoffMoment =
        handoff?.source === actor &&
        ['PREPARED', 'PROVIDER_VERIFIED', 'AWAITING_ACCEPTANCE'].includes(String(handoff.status));
      if (!handoffMoment && !chapterRow.receipt_id) fail('CLIP_HANDOFF_MOMENT_REQUIRED');
      const token = await loadClipToken(actor);
      const url = new URL('https://api.twitch.tv/helix/clips');
      url.searchParams.set('broadcaster_id', actor);
      if (input.title) url.searchParams.set('title', input.title);
      url.searchParams.set('duration', '30');
      const requestedAt = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: {Authorization: 'Bearer ' + token.access_token, 'Client-Id': env.TWITCH_CLIENT_ID!},
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) {
        const errorCode =
          response.status === 404 ? 'TWITCH_CLIP_STREAM_NOT_LIVE' : 'TWITCH_CLIP_CREATE_FAILED';
        const requestId = clipMemoryId({
          campaignId: id,
          relayId: chapterRow.relay_id,
          chapterId: chapterRow.chapter_id,
          broadcasterId: actor,
        });
        await client.query(
          `INSERT INTO winner_clip_requests(id,campaign_id,relay_id,chapter_id,broadcaster_id,status,requested_at,resolved_at,error_code)
           VALUES($1,$2,$3,$4,$5,'FAILED',$6,$6,$7)
           ON CONFLICT(chapter_id) DO UPDATE SET twitch_clip_id=NULL,status='FAILED',requested_at=excluded.requested_at,resolved_at=excluded.resolved_at,url=NULL,error_code=excluded.error_code`,
          [requestId, id, chapterRow.relay_id, chapterRow.chapter_id, actor, requestedAt, errorCode],
        );
        await client.query(
          "UPDATE passport_chapters SET clip_status='FAILED',clip_url=NULL WHERE id=$1",
          [chapterRow.chapter_id],
        );
        return {status: 'FAILED', errorCode};
      }
      const body = z
        .object({data: z.array(z.object({id: z.string().min(1)})).min(1)})
        .parse(await response.json());
      const requested = requestedClipMemory({
        campaignId: id,
        relayId: chapterRow.relay_id,
        chapterId: chapterRow.chapter_id,
        broadcasterId: actor,
        twitchClipId: body.data[0].id,
        requestedAt,
      });
      await client.query(
        `INSERT INTO winner_clip_requests(id,campaign_id,relay_id,chapter_id,broadcaster_id,twitch_clip_id,status,requested_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT(chapter_id) DO UPDATE SET twitch_clip_id=excluded.twitch_clip_id,status=excluded.status,requested_at=excluded.requested_at,resolved_at=NULL,url=NULL,error_code=NULL`,
        [
          requested.id,
          id,
          chapterRow.relay_id,
          chapterRow.chapter_id,
          actor,
          requested.twitchClipId,
          requested.status,
          requested.requestedAt,
        ],
      );
      await client.query(
        "UPDATE passport_chapters SET clip_status='PENDING',clip_url=NULL WHERE id=$1",
        [chapterRow.chapter_id],
      );
      return {status: 'PENDING', chapter, clipId: requested.twitchClipId};
    });
  });

  app.get('/api/campaigns/:id/passport/chapters/:chapter/clip', async (req) => {
    const {id, chapter} = Chapter.parse(req.params);
    const actor = await sessionUser(req);
    await active(db(), id, actor);
    const row = await db().query<{
      id: string;
      relay_id: string;
      chapter_id: string;
      broadcaster_id: string;
      twitch_clip_id: string | null;
      status: ClipMemory['status'];
      requested_at: string;
      url: string | null;
      error_code: string | null;
    }>(
      `SELECT r.* FROM winner_clip_requests r
       JOIN passport_chapters pc ON pc.id=r.chapter_id
       WHERE r.campaign_id=$1 AND pc.chapter_number=$2`,
      [id, chapter],
    );
    const saved = row.rows[0] ?? fail('CLIP_MEMORY_NOT_FOUND');
    if (saved.broadcaster_id !== actor) fail('CLIP_CREATOR_REQUIRED');
    if (saved.status === 'AVAILABLE' || saved.status === 'FAILED')
      return {
        status: saved.status,
        clipUrl: saved.url ?? undefined,
        errorCode: saved.error_code ?? undefined,
      };

    const token = await loadClipToken(actor);
    const response = await fetch(
      'https://api.twitch.tv/helix/clips?id=' + encodeURIComponent(saved.twitch_clip_id ?? ''),
      {
        headers: {Authorization: 'Bearer ' + token.access_token, 'Client-Id': env.TWITCH_CLIENT_ID!},
        signal: AbortSignal.timeout(10_000),
      },
    );
    const requestedAt = Number(saved.requested_at);
    let memory: ClipMemory = {
      id: saved.id,
      campaignId: id,
      relayId: saved.relay_id,
      chapterId: saved.chapter_id,
      broadcasterId: actor,
      twitchClipId: saved.twitch_clip_id ?? undefined,
      status: saved.status,
      requestedAt,
    };
    if (response.ok) {
      const body = z
        .object({data: z.array(z.object({url: z.string().url()}))})
        .parse(await response.json());
      if (body.data[0]) {
        const clipUrl = (() => {
          try {
            return safeTwitchClipUrl(body.data[0].url);
          } catch {
            return fail('INVALID_TWITCH_CLIP_URL');
          }
        })();
        memory = availableClipMemory(memory, clipUrl, Date.now());
        await db().query(
          "UPDATE winner_clip_requests SET status='AVAILABLE',resolved_at=$2,url=$3,error_code=NULL WHERE id=$1",
          [saved.id, memory.resolvedAt, memory.url],
        );
        await db().query(
          "UPDATE passport_chapters SET clip_status='AVAILABLE',clip_url=$2 WHERE id=$1",
          [saved.chapter_id, memory.url],
        );
        return {status: 'AVAILABLE', clipUrl: memory.url};
      }
    }
    if (Date.now() - requestedAt >= 60_000 || !response.ok) {
      memory = failedClipMemory(
        memory,
        response.ok ? 'TWITCH_CLIP_NOT_AVAILABLE' : 'TWITCH_CLIP_LOOKUP_FAILED',
        Date.now(),
      );
      await db().query(
        "UPDATE winner_clip_requests SET status='FAILED',resolved_at=$2,error_code=$3,url=NULL WHERE id=$1",
        [saved.id, memory.resolvedAt, memory.errorCode],
      );
      await db().query(
        "UPDATE passport_chapters SET clip_status='FAILED',clip_url=NULL WHERE id=$1",
        [saved.chapter_id],
      );
      return {status: 'FAILED', errorCode: memory.errorCode};
    }
    return {status: 'PENDING', retryAfterMs: 2000};
  });

  app.get('/api/willie/:willieId/legacy/:chapter', async (req) => {
    const {willieId, chapter} = Legacy.parse(req.params);
    const row = await db().query<{
      current_holder: string;
      data: {
        community: string;
        participationMetric: number;
        nextDestination?: string;
        markId?: string;
      };
      mark_type: string | null;
      visual_result: {signature?: string} | null;
    }>(
      `SELECT r.current_holder,pc.data,cm.mark_type,cm.visual_result
       FROM relays r
       JOIN passport_chapters pc ON pc.relay_id=r.id
       LEFT JOIN community_marks cm ON cm.id=pc.mark_id
       WHERE r.willie_id=$1 AND pc.chapter_number=$2`,
      [willieId, chapter],
    );
    const item = row.rows[0] ?? fail('PASSPORT_CHAPTER_NOT_FOUND');
    const data = item.data;
    return createLegacyArtifact({
      willieId,
      chapterNumber: chapter,
      community: data.community,
      contributors: data.participationMetric ?? 0,
      sentTo: data.nextDestination,
      currentHolder: item.current_holder,
      mark:
        data.markId && item.mark_type
          ? {id: data.markId, type: item.mark_type, signature: item.visual_result?.signature}
          : undefined,
    });
  });
}
