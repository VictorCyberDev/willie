import type {FastifyInstance, FastifyRequest} from 'fastify';
import {Pool, type PoolClient} from 'pg';
import {z} from 'zod';
import {DomainError, type State} from '../../../packages/domain/src/index.js';
import {
  MARK_TYPES,
  approveVote,
  castVote,
  chapterFromStamp,
  closeVote,
  createCommunityMark,
  createRelay,
  livingWillieState,
  openVote,
  type Relay,
  type VoteBallot,
  type VoteSession,
} from '../../../packages/winner/src/index.js';
import {digest} from './security.js';

const Id = z.string().min(1).max(200);
const Version = z.number().int().positive();
const CampaignParams = z.object({id: Id});
const StoryParams = z.object({willieId: Id});
const VoteParams = z.object({id: Id, voteId: Id});
const fail = (code: string): never => { throw new DomainError(code); };

function mapDbError(error: unknown): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as {code?: string}).code ?? '');
    if (code === '23505') fail('DUPLICATE_WINNER_WRITE');
    if (code === '23503') fail('INVALID_WINNER_REFERENCE');
  }
  throw error;
}

export function registerWinnerReleaseRoutes(app: FastifyInstance, databaseUrl?: string): void {
  const pool = databaseUrl ? new Pool({connectionString: databaseUrl, max: 4}) : undefined;
  const db = () => pool ?? fail('DATABASE_UNAVAILABLE');
  app.addHook('onClose', async () => { if (pool) await pool.end(); });

  async function sessionUser(req: FastifyRequest): Promise<string> {
    const token = req.cookies.willie_session;
    if (!token) fail('AUTH_REQUIRED');
    const result = await db().query<{user_id: string}>(
      `SELECT s.user_id
       FROM creator_sessions s
       JOIN users u ON u.id=s.user_id
       WHERE s.token_hash=$1 AND s.expires_at>now() AND u.deleted_at IS NULL`,
      [digest(token)],
    );
    return result.rows[0]?.user_id ?? fail('AUTH_REQUIRED');
  }

  async function activeMember(client: Pool | PoolClient, campaignId: string, userId: string): Promise<void> {
    const result = await client.query(
      'SELECT 1 FROM campaign_members WHERE campaign_id=$1 AND user_id=$2 AND active=true',
      [campaignId, userId],
    );
    if (!result.rowCount) fail('FORBIDDEN');
  }

  async function lockedState(client: PoolClient, campaignId: string): Promise<State> {
    const result = await client.query<{state: State}>(
      'SELECT state FROM willie_snapshots WHERE campaign_id=$1 FOR UPDATE',
      [campaignId],
    );
    return result.rows[0]?.state ?? fail('CAMPAIGN_NOT_FOUND');
  }

  async function lockedRelay(client: PoolClient, campaignId: string): Promise<Relay> {
    const result = await client.query<{data: Relay}>(
      'SELECT data FROM relays WHERE campaign_id=$1 FOR UPDATE',
      [campaignId],
    );
    return result.rows[0]?.data ?? fail('RELAY_NOT_FOUND');
  }

  async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await db().connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      mapDbError(error);
    } finally {
      client.release();
    }
  }

  app.get('/api/campaigns/:id/relay', async (req) => {
    const {id} = CampaignParams.parse(req.params);
    const actor = await sessionUser(req);
    await activeMember(db(), id, actor);
    const relay = await db().query('SELECT data FROM relays WHERE campaign_id=$1', [id]);
    const marks = await db().query('SELECT * FROM community_marks WHERE campaign_id=$1 ORDER BY created_at,id', [id]);
    const chapters = await db().query('SELECT data FROM passport_chapters WHERE campaign_id=$1 ORDER BY chapter_number', [id]);
    const votes = await db().query('SELECT data FROM relay_votes WHERE campaign_id=$1 ORDER BY opens_at DESC LIMIT 20', [id]);
    return {relay: relay.rows[0]?.data ?? null, marks: marks.rows, chapters: chapters.rows.map(r => r.data), votes: votes.rows.map(r => r.data)};
  });

  app.post('/api/campaigns/:id/relay', async (req) => {
    const {id} = CampaignParams.parse(req.params);
    const actor = await sessionUser(req);
    const input = z.object({
      version: Version,
      title: z.string().trim().min(1).max(120).optional(),
      mission: z.string().trim().min(1).max(500).optional(),
      missionTarget: z.number().int().min(2).max(100).optional(),
    }).strict().parse(req.body);
    return transaction(async (client) => {
      await activeMember(client, id, actor);
      const state = await lockedState(client, id);
      if (state.custodian !== actor) fail('UNAUTHORIZED_SOURCE');
      if (state.version !== input.version) fail('STALE_VERSION');
      const existing = await client.query('SELECT data FROM relays WHERE campaign_id=$1', [id]);
      if (existing.rowCount) fail('RELAY_EXISTS');
      const relay = createRelay(state, input, Date.now());
      await client.query(
        `INSERT INTO relays(id,campaign_id,willie_id,title,mission,origin,current_holder,mission_target,progress,communities_visited,successful_handoffs,status,started_at,completed_at,current_willie_version,next_destination,data)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [relay.id,id,relay.willieId,relay.title,relay.mission,relay.origin,relay.currentHolder,relay.missionTarget,relay.progress,relay.communitiesVisited,relay.successfulHandoffs,relay.status,relay.startedAt,relay.completedAt ?? null,relay.currentWillieVersion,relay.nextDestination ?? null,JSON.stringify(relay)],
      );
      for (let index=0; index<state.passport.length; index++) {
        const stamp=state.passport[index], next=state.passport[index+1], receipt=state.receipts[index];
        const chapter=chapterFromStamp({relay,stamp,nextStamp:next,receipt,chapterNumber:index+1});
        await client.query(
          `INSERT INTO passport_chapters(id,campaign_id,relay_id,chapter_number,community_id,creator_id,arrival_at,departure_at,contribution_count,before_version,after_version,next_destination,provider_verification,receipt_id,clip_status,clip_url,data)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
           ON CONFLICT(relay_id,chapter_number) DO NOTHING`,
          [chapter.id,id,relay.id,chapter.chapterNumber,chapter.community,chapter.creator,chapter.arrivalAt,chapter.departureAt ?? null,chapter.participationMetric,chapter.willieBefore,chapter.willieAfter ?? null,chapter.nextDestination ?? null,chapter.providerVerification ? JSON.stringify(chapter.providerVerification) : null,chapter.receiptId ?? null,chapter.clipStatus,chapter.clipUrl ?? null,JSON.stringify(chapter)],
        );
      }
      return {relay};
    });
  });

  app.post('/api/campaigns/:id/relay/mark', async (req) => {
    const {id} = CampaignParams.parse(req.params);
    const actor = await sessionUser(req);
    const input = z.object({version: Version, type: z.enum(MARK_TYPES)}).strict().parse(req.body);
    return transaction(async (client) => {
      await activeMember(client,id,actor);
      const state=await lockedState(client,id), relay=await lockedRelay(client,id);
      if (state.custodian!==actor || relay.currentHolder!==actor) fail('UNAUTHORIZED_SOURCE');
      if (state.version!==input.version || relay.currentWillieVersion!==input.version) fail('STALE_VERSION');
      const chapterRow=await client.query<{id:string}>('SELECT id FROM passport_chapters WHERE relay_id=$1 AND departure_at IS NULL ORDER BY chapter_number DESC LIMIT 1 FOR UPDATE',[relay.id]);
      const chapterId=chapterRow.rows[0]?.id ?? fail('PASSPORT_CHAPTER_NOT_FOUND');
      const mark=createCommunityMark({campaignId:id,relayId:relay.id,willieId:state.willieId,community:actor,creator:actor,type:input.type,selectionMethod:'CREATOR_SELECTED',createdAt:Date.now(),willieVersion:state.version,passportChapterId:chapterId});
      await client.query(`INSERT INTO community_marks(id,campaign_id,relay_id,willie_id,community_id,creator_id,mark_type,visual_result,selection_method,created_at,willie_version,passport_chapter_id,provenance_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,[mark.id,id,relay.id,state.willieId,actor,actor,mark.type,JSON.stringify(mark.visualResult),mark.selectionMethod,mark.createdAt,mark.willieVersion,chapterId,mark.provenanceHash]);
      await client.query('UPDATE passport_chapters SET mark_id=$2,data=data||$3::jsonb WHERE id=$1',[chapterId,mark.id,JSON.stringify({markId:mark.id,whatCommunityAdded:`${mark.type} ${mark.visualResult.signature}`})]);
      return {mark};
    });
  });

  app.post('/api/campaigns/:id/relay/votes', async (req) => {
    const {id}=CampaignParams.parse(req.params), actor=await sessionUser(req);
    const input=z.object({version:Version,kind:z.enum(['MUTATION','NEXT_STOP']),candidates:z.array(Id).min(2).max(6),durationMs:z.number().int().min(5_000).max(900_000).default(30_000)}).strict().parse(req.body);
    return transaction(async client=>{
      await activeMember(client,id,actor);
      const state=await lockedState(client,id),relay=await lockedRelay(client,id);
      if(state.paused)fail('CAMPAIGN_PAUSED');
      if(state.custodian!==actor||relay.currentHolder!==actor)fail('UNAUTHORIZED_SOURCE');
      if(state.version!==input.version||relay.currentWillieVersion!==input.version)fail('STALE_VERSION');
      if(input.kind==='NEXT_STOP')for(const candidate of input.candidates){if(candidate===actor)fail('INVALID_DESTINATION');await activeMember(client,id,candidate);}
      const opensAt=Date.now(),session=openVote({campaignId:id,relayId:relay.id,kind:input.kind,community:actor,creator:actor,willieVersion:state.version,candidates:input.candidates,opensAt,closesAt:opensAt+input.durationMs});
      await client.query(`INSERT INTO relay_votes(id,campaign_id,relay_id,kind,community_id,creator_id,willie_version,candidates,status,opens_at,closes_at,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,[session.id,id,relay.id,session.kind,actor,actor,state.version,JSON.stringify(session.candidates),session.status,session.opensAt,session.closesAt,JSON.stringify(session)]);
      return {vote:session};
    });
  });

  app.post('/api/campaigns/:id/relay/votes/:voteId/ballots', async req=>{
    const {id,voteId}=VoteParams.parse(req.params),actor=await sessionUser(req);
    const input=z.object({candidate:Id,voterKey:Id,providerEventId:Id.optional(),castAt:z.number().nonnegative().optional()}).strict().parse(req.body);
    return transaction(async client=>{
      await activeMember(client,id,actor);
      const row=await client.query<{data:VoteSession}>('SELECT data FROM relay_votes WHERE id=$1 AND campaign_id=$2 FOR UPDATE',[voteId,id]);
      const session=row.rows[0]?.data??fail('VOTE_NOT_FOUND');
      if(session.creator!==actor)fail('CREATOR_APPROVAL_REQUIRED');
      const relay=await lockedRelay(client,id),state=await lockedState(client,id);
      if(relay.currentHolder!==actor||state.custodian!==actor||state.version!==session.willieVersion)fail('STALE_VERSION');
      const current=await client.query<VoteBallot>('SELECT session_id AS "sessionId",voter_key AS "voterKey",candidate,cast_at AS "castAt",provider_event_id AS "providerEventId" FROM relay_vote_ballots WHERE session_id=$1 FOR UPDATE',[voteId]);
      const next=castVote(session,current.rows,{...input,castAt:input.castAt??Date.now()});
      const ballot=next.at(-1)!;
      await client.query('INSERT INTO relay_vote_ballots(session_id,voter_key,candidate,cast_at,provider_event_id) VALUES($1,$2,$3,$4,$5)',[voteId,ballot.voterKey,ballot.candidate,ballot.castAt,ballot.providerEventId??null]);
      return {accepted:true,total:next.length};
    });
  });

  app.post('/api/campaigns/:id/relay/votes/:voteId/close',async req=>{
    const {id,voteId}=VoteParams.parse(req.params),actor=await sessionUser(req);
    return transaction(async client=>{
      await activeMember(client,id,actor);
      const row=await client.query<{data:VoteSession}>('SELECT data FROM relay_votes WHERE id=$1 AND campaign_id=$2 FOR UPDATE',[voteId,id]);
      const session=row.rows[0]?.data??fail('VOTE_NOT_FOUND');if(session.creator!==actor)fail('CREATOR_APPROVAL_REQUIRED');
      const ballots=await client.query<VoteBallot>('SELECT session_id AS "sessionId",voter_key AS "voterKey",candidate,cast_at AS "castAt",provider_event_id AS "providerEventId" FROM relay_vote_ballots WHERE session_id=$1',[voteId]);
      const closed=closeVote(session,ballots.rows,Date.now());
      await client.query('UPDATE relay_votes SET status=$2,winner_candidate=$3,tie=$4,counts=$5,data=$6 WHERE id=$1',[voteId,closed.status,closed.winnerCandidate??null,closed.tie??false,JSON.stringify(closed.counts??{}),JSON.stringify(closed)]);
      return {vote:closed};
    });
  });

  app.post('/api/campaigns/:id/relay/votes/:voteId/approve',async req=>{
    const {id,voteId}=VoteParams.parse(req.params),actor=await sessionUser(req);
    const input=z.object({version:Version,candidate:Id}).strict().parse(req.body);
    return transaction(async client=>{
      await activeMember(client,id,actor);const state=await lockedState(client,id),relay=await lockedRelay(client,id);
      if(state.custodian!==actor||relay.currentHolder!==actor)fail('UNAUTHORIZED_SOURCE');
      if(state.version!==input.version||relay.currentWillieVersion!==input.version)fail('STALE_VERSION');
      const row=await client.query<{data:VoteSession}>('SELECT data FROM relay_votes WHERE id=$1 AND campaign_id=$2 FOR UPDATE',[voteId,id]);
      const session=row.rows[0]?.data??fail('VOTE_NOT_FOUND');if(session.willieVersion!==state.version)fail('STALE_VERSION');
      const approved=approveVote(session,actor,input.candidate,Date.now());let mark=null;
      if(session.kind==='MUTATION'){
        const chapterRow=await client.query<{id:string}>('SELECT id FROM passport_chapters WHERE relay_id=$1 AND departure_at IS NULL ORDER BY chapter_number DESC LIMIT 1 FOR UPDATE',[relay.id]);
        const chapterId=chapterRow.rows[0]?.id??fail('PASSPORT_CHAPTER_NOT_FOUND');
        mark=createCommunityMark({campaignId:id,relayId:relay.id,willieId:state.willieId,community:actor,creator:actor,type:approved.approvedCandidate as (typeof MARK_TYPES)[number],selectionMethod:'CHAT_VOTE_CREATOR_APPROVED',createdAt:Date.now(),willieVersion:state.version,passportChapterId:chapterId});
        await client.query(`INSERT INTO community_marks(id,campaign_id,relay_id,willie_id,community_id,creator_id,mark_type,visual_result,selection_method,created_at,willie_version,passport_chapter_id,provenance_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,[mark.id,id,relay.id,state.willieId,actor,actor,mark.type,JSON.stringify(mark.visualResult),mark.selectionMethod,mark.createdAt,mark.willieVersion,chapterId,mark.provenanceHash]);
        await client.query('UPDATE passport_chapters SET mark_id=$2,data=data||$3::jsonb WHERE id=$1',[chapterId,mark.id,JSON.stringify({markId:mark.id,whatCommunityAdded:`${mark.type} ${mark.visualResult.signature}`})]);
      }else{
        if(input.candidate===actor)fail('INVALID_DESTINATION');await activeMember(client,id,input.candidate);
        await client.query('UPDATE relays SET next_destination=$2,data=data||$3::jsonb WHERE id=$1',[relay.id,input.candidate,JSON.stringify({nextDestination:input.candidate})]);
      }
      await client.query('UPDATE relay_votes SET status=$2,approved_candidate=$3,approved_at=$4,data=$5 WHERE id=$1',[voteId,approved.status,approved.approvedCandidate,approved.approvedAt,JSON.stringify(approved)]);
      return {vote:approved,mark,nextDestination:session.kind==='NEXT_STOP'?input.candidate:undefined};
    });
  });

  app.get('/api/campaigns/:id/passport/chapters',async req=>{
    const {id}=CampaignParams.parse(req.params),actor=await sessionUser(req);await activeMember(db(),id,actor);
    const result=await db().query('SELECT data FROM passport_chapters WHERE campaign_id=$1 ORDER BY chapter_number',[id]);return{chapters:result.rows.map(r=>r.data)};
  });

  app.get('/api/willie/:willieId/story',async req=>{
    const {willieId}=StoryParams.parse(req.params);
    const snapshot=await db().query<{state:State;relay:Relay;relay_id:string}>(`SELECT s.state,r.data AS relay,r.id AS relay_id FROM willie_snapshots s JOIN relays r ON r.campaign_id=s.campaign_id WHERE r.willie_id=$1`,[willieId]);
    const row=snapshot.rows[0];if(!row)fail('WILLIE_NOT_FOUND');
    const [marks,chapters]=await Promise.all([db().query('SELECT id,mark_type,visual_result,community_id,creator_id,created_at,willie_version,provenance_hash FROM community_marks WHERE relay_id=$1 ORDER BY created_at,id',[row.relay_id]),db().query('SELECT data FROM passport_chapters WHERE relay_id=$1 ORDER BY chapter_number',[row.relay_id])]);
    return {willie:{id:row.state.willieId,version:row.state.version,livingState:livingWillieState(row.state),progress:row.state.progress,currentHolder:row.state.custodian,paused:row.state.paused},relay:row.relay,metrics:{communitiesVisited:row.relay.communitiesVisited,contributors:row.state.contributors.length,successfulHandoffs:row.relay.successfulHandoffs,marks:marks.rowCount,chapters:chapters.rowCount,ageMs:Math.max(0,Date.now()-row.relay.startedAt)},marks:marks.rows,chapters:chapters.rows.map(r=>r.data)};
  });
}
