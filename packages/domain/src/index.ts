export type HandoffStatus =
  | 'PREPARED'
  | 'PROVIDER_VERIFIED'
  | 'AWAITING_ACCEPTANCE'
  | 'COMMITTING'
  | 'COMMITTED'
  | 'ABORTED'
  | 'PAUSED';
export interface Handoff {
  id: string;
  source: string;
  destination: string;
  version: number;
  preparedAt: number;
  expiresAt: number;
  status: HandoffStatus;
  evidenceId?: string;
  verifiedAt?: number;
  evidenceClass:
    'TWITCH_NATIVE_RAID' | 'DUAL_CONSENT' | 'SIMULATED_JUDGE_REPLAY';
}
export interface Stamp {
  stampId: string;
  campaignId: string;
  willieId: string;
  handoffId: string;
  custodian: string;
  receivedAt: number;
  versionReceived: number;
  progressReceived: number;
  releasedAt?: number;
  versionReleased?: number;
  progressReleased?: number;
}
export interface Receipt {
  receiptId: string;
  campaignId: string;
  willieId: string;
  handoffId: string;
  provider: string;
  evidenceClass: Handoff['evidenceClass'];
  source: string;
  destination: string;
  providerEventId: string;
  providerEventTimestamp: number;
  preparedAt: number;
  verifiedAt: number;
  acceptedAt: number;
  committedAt: number;
  previousVersion: number;
  newVersion: number;
  progressBefore: number;
  progressAfter: number;
  previousStateHash: string;
  newStateHash: string;
  result: 'COMMITTED';
}
export interface Event {
  id: string;
  type: string;
  at: number;
  payload: Record<string, unknown>;
}
export interface State {
  campaignId: string;
  willieId: string;
  version: number;
  custodian: string;
  progress: number;
  members: string[];
  paused: boolean;
  handoff: Handoff | null;
  passport: Stamp[];
  receipts: Receipt[];
  events: Event[];
  processed: string[];
  contributors: string[];
  commands: Record<string, number>;
  evidenceTime?: number;
}
export class DomainError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = 'DomainError';
  }
}
function requireRule(value: unknown, code: string): asserts value {
  if (!value) throw new DomainError(code);
}
export function canonical(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  return (
    '{' +
    Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => JSON.stringify(k) + ':' + canonical(v))
      .join(',') +
    '}'
  );
}
// Portable SHA-256 keeps the authoritative serializer identical in browser replay and Node.
export function sha256(input: string): string {
  const bytes = new TextEncoder().encode(input),
    words: number[] = [];
  for (let i = 0; i < bytes.length; i++)
    words[i >> 2] = (words[i >> 2] || 0) | (bytes[i] << (24 - (i % 4) * 8));
  words[bytes.length >> 2] =
    (words[bytes.length >> 2] || 0) | (0x80 << (24 - (bytes.length % 4) * 8));
  const length = (((bytes.length + 8) >> 6) + 1) * 16;
  words[length - 1] = bytes.length * 8;
  const k: number[] = [],
    h: number[] = [];
  let p = 2;
  while (k.length < 64) {
    let prime = true;
    for (let d = 2; d * d <= p; d++)
      if (p % d === 0) {
        prime = false;
        break;
      }
    if (prime) {
      if (h.length < 8) h.push(((Math.sqrt(p) % 1) * 0x100000000) | 0);
      k.push(((Math.cbrt(p) % 1) * 0x100000000) | 0);
    }
    p++;
  }
  const ro = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < length; offset += 16) {
    const w: number[] = [];
    for (let i = 0; i < 64; i++) {
      if (i < 16) w[i] = words[offset + i] || 0;
      else {
        const a = w[i - 15],
          b = w[i - 2];
        w[i] =
          ((ro(a, 7) ^ ro(a, 18) ^ (a >>> 3)) +
            w[i - 16] +
            (ro(b, 17) ^ ro(b, 19) ^ (b >>> 10)) +
            w[i - 7]) |
          0;
      }
    }
    let [a, b, c, d, e, f, g, j] = h;
    for (let i = 0; i < 64; i++) {
      const t =
        (j +
          (ro(e, 6) ^ ro(e, 11) ^ ro(e, 25)) +
          ((e & f) ^ (~e & g)) +
          k[i] +
          w[i]) |
        0;
      const u =
        ((ro(a, 2) ^ ro(a, 13) ^ ro(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) |
        0;
      j = g;
      g = f;
      f = e;
      e = (d + t) | 0;
      d = c;
      c = b;
      b = a;
      a = (t + u) | 0;
    }
    [a, b, c, d, e, f, g, j].forEach((v, i) => {
      h[i] = (h[i] + v) | 0;
    });
  }
  return h.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
}
export function hash(s: State): string {
  return sha256(
    canonical({
      campaignId: s.campaignId,
      willieId: s.willieId,
      version: s.version,
      custodian: s.custodian,
      progress: s.progress,
      passport: s.passport,
    }),
  );
}
function copy(s: State): State {
  return structuredClone(s);
}
function event(
  s: State,
  type: string,
  at: number,
  payload: Record<string, unknown> = {},
) {
  s.events.push({
    id: s.campaignId + ':' + s.events.length,
    type,
    at,
    payload,
  });
}
export function createDemo(): State {
  const s: State = {
    campaignId: 'wake-willie-demo',
    willieId: '0047',
    version: 1,
    custodian: 'maya',
    progress: 0,
    members: ['maya', 'victor', 'lex'],
    paused: false,
    handoff: null,
    passport: [],
    receipts: [],
    events: [],
    processed: [],
    contributors: [],
    commands: {},
  };
  s.passport.push({
    stampId: 'initial',
    campaignId: s.campaignId,
    willieId: s.willieId,
    handoffId: 'initial',
    custodian: 'maya',
    receivedAt: 0,
    versionReceived: 1,
    progressReceived: 0,
  });
  event(s, 'CAMPAIGN_CREATED', 0);
  event(s, 'WILLIE_CREATED', 0);
  return s;
}
export function prepare(
  state: State,
  source: string,
  destination: string,
  version: number,
  now: number,
  ttl = 120000,
  evidenceClass: Handoff['evidenceClass'] = 'SIMULATED_JUDGE_REPLAY',
): State {
  requireRule(!state.paused, 'CAMPAIGN_PAUSED');
  requireRule(state.custodian === source, 'UNAUTHORIZED_SOURCE');
  requireRule(
    state.members.includes(source) &&
      state.members.includes(destination) &&
      source !== destination,
    'INVALID_MEMBERSHIP',
  );
  requireRule(version === state.version, 'STALE_VERSION');
  requireRule(
    !state.handoff || ['COMMITTED', 'ABORTED'].includes(state.handoff.status),
    'HANDOFF_ACTIVE',
  );
  requireRule(ttl >= 30000 && ttl <= 300000, 'INVALID_EXPIRY');
  const s = copy(state);
  s.handoff = {
    id: s.campaignId + ':handoff:' + s.events.length,
    source,
    destination,
    version,
    preparedAt: now,
    expiresAt: now + ttl,
    status: 'PREPARED',
    evidenceClass,
  };
  event(s, 'HANDOFF_PREPARED', now, { ...s.handoff });
  return s;
}
export function evidence(
  state: State,
  id: string,
  source: string,
  destination: string,
  occurredAt: number,
  now: number,
): State {
  if (state.processed.includes(id)) return state;
  const s = copy(state);
  s.processed.push(id);
  event(s, 'PROVIDER_EVENT_RECEIVED', now, {
    id,
    source,
    destination,
    occurredAt,
  });
  const h = s.handoff;
  if (!h || h.status !== 'PREPARED') return s;
  if (now >= h.expiresAt || occurredAt >= h.expiresAt) {
    h.status = 'ABORTED';
    event(s, 'HANDOFF_EXPIRED', now);
    return s;
  }
  if (
    occurredAt < h.preparedAt ||
    occurredAt > now + 5000 ||
    now - occurredAt > 600000
  )
    return s;
  if (h.source !== source || h.destination !== destination) return s;
  requireRule(
    h.version === s.version && h.source === s.custodian,
    'STALE_VERSION',
  );
  h.status = 'PROVIDER_VERIFIED';
  h.evidenceId = id;
  h.verifiedAt = now;
  s.evidenceTime = occurredAt;
  event(s, 'HANDOFF_PROVIDER_VERIFIED', now, { id });
  h.status = 'AWAITING_ACCEPTANCE';
  return s;
}
export function accept(
  state: State,
  destination: string,
  version: number,
  now: number,
): State {
  const h = state.handoff;
  requireRule(h, 'NO_HANDOFF');
  requireRule(!state.paused, 'CAMPAIGN_PAUSED');
  requireRule(h.status === 'AWAITING_ACCEPTANCE', 'INVALID_STATE');
  requireRule(h.destination === destination, 'UNAUTHORIZED_DESTINATION');
  requireRule(
    state.members.includes(destination) && state.members.includes(h.source),
    'INVALID_MEMBERSHIP',
  );
  requireRule(
    version === state.version &&
      h.version === version &&
      state.custodian === h.source,
    'STALE_VERSION',
  );
  requireRule(now < h.expiresAt, 'HANDOFF_EXPIRED');
  requireRule(h.evidenceId && h.verifiedAt !== undefined, 'EVIDENCE_REQUIRED');
  const s = copy(state),
    t = s.handoff!;
  const previousStateHash = hash(state);
  t.status = 'COMMITTING';
  s.custodian = destination;
  s.version++;
  const last = s.passport[s.passport.length - 1];
  last.releasedAt = now;
  last.versionReleased = version;
  last.progressReleased = s.progress;
  s.passport.push({
    stampId: t.id + ':stamp',
    campaignId: s.campaignId,
    willieId: s.willieId,
    handoffId: t.id,
    custodian: destination,
    receivedAt: now,
    versionReceived: s.version,
    progressReceived: s.progress,
  });
  t.status = 'COMMITTED';
  event(s, 'HANDOFF_COMMITTED', now, {
    handoffId: t.id,
    destination,
    version: s.version,
  });
  event(s, 'CUSTODY_CHANGED', now, {
    source: t.source,
    destination,
    version: s.version,
  });
  event(s, 'PASSPORT_STAMPED', now, { handoffId: t.id });
  s.receipts.push({
    receiptId: t.id + ':receipt',
    campaignId: s.campaignId,
    willieId: s.willieId,
    handoffId: t.id,
    provider:
      t.evidenceClass === 'TWITCH_NATIVE_RAID'
        ? 'twitch'
        : t.evidenceClass === 'DUAL_CONSENT'
          ? 'willie'
          : 'simulator',
    evidenceClass: t.evidenceClass,
    source: t.source,
    destination,
    providerEventId: t.evidenceId!,
    providerEventTimestamp: s.evidenceTime!,
    preparedAt: t.preparedAt,
    verifiedAt: t.verifiedAt!,
    acceptedAt: now,
    committedAt: now,
    previousVersion: version,
    newVersion: s.version,
    progressBefore: state.progress,
    progressAfter: s.progress,
    previousStateHash,
    newStateHash: hash(s),
    result: 'COMMITTED',
  });
  return s;
}
export function abort(state: State, source: string, now: number): State {
  requireRule(source === state.custodian, 'UNAUTHORIZED_SOURCE');
  requireRule(
    state.handoff && !['COMMITTED', 'ABORTED'].includes(state.handoff.status),
    'INVALID_STATE',
  );
  const s = copy(state);
  s.handoff!.status = 'ABORTED';
  event(s, 'HANDOFF_ABORTED', now);
  return s;
}
export function gap(state: State, now: number): State {
  const s = copy(state);
  if (
    s.handoff &&
    ['PREPARED', 'PROVIDER_VERIFIED', 'AWAITING_ACCEPTANCE'].includes(
      s.handoff.status,
    )
  ) {
    s.handoff.status = 'PAUSED';
    event(s, 'HANDOFF_PAUSED', now, { reason: 'PROVIDER_EVIDENCE_GAP' });
  }
  return s;
}
export function pause(state: State, now: number): State {
  const s = gap(state, now);
  s.paused = true;
  event(s, 'CAMPAIGN_PAUSED', now);
  return s;
}
export function resume(state: State, now: number): State {
  const s = copy(state);
  s.paused = false;
  event(s, 'CAMPAIGN_RESUMED', now);
  return s;
}
export function contribute(
  state: State,
  id: string,
  user: string,
  command: string,
  now: number,
): State {
  if (state.processed.includes(id)) return state;
  const s = copy(state);
  s.processed.push(id);
  event(s, 'CONTRIBUTION_RECEIVED', now, {
    id,
    user,
    command: ['!charge', '!scan', '!shield', '!forge'].includes(command)
      ? command
      : '',
  });
  if (
    s.paused ||
    !['!charge', '!scan', '!shield', '!forge'].includes(command)
  ) {
    event(s, 'CONTRIBUTION_REJECTED', now, { reason: 'INVALID_OR_PAUSED' });
    return s;
  }
  const key = s.custodian + ':' + user;
  const prior = s.commands[key];
  if (prior !== undefined && now - prior < 30000) {
    event(s, 'CONTRIBUTION_REJECTED', now, { reason: 'COOLDOWN' });
    return s;
  }
  s.commands[key] = now;
  if (s.contributors.includes(key)) {
    event(s, 'CONTRIBUTION_REJECTED', now, { reason: 'UNIQUE_LIMIT' });
    return s;
  }
  const n = s.contributors.filter((k) =>
    k.startsWith(s.custodian + ':'),
  ).length;
  const weight = n < 20 ? 2 : n < 100 ? 0.25 : 0.025;
  const before = s.progress;
  s.progress = Math.min(100, Math.round((s.progress + weight) * 1000) / 1000);
  s.contributors.push(key);
  event(s, 'CONTRIBUTION_ACCEPTED', now, { id, weight });
  for (const threshold of [25, 50, 75, 100])
    if (before < threshold && s.progress >= threshold)
      event(
        s,
        threshold === 100 ? 'CAMPAIGN_COMPLETED' : 'MILESTONE_REACHED',
        now,
        { threshold },
      );
  return s;
}
export type ReplayAction =
  | {
      kind: 'prepare';
      source: string;
      destination: string;
      version: number;
      now: number;
    }
  | {
      kind: 'evidence';
      id: string;
      source: string;
      destination: string;
      at: number;
      now: number;
    }
  | { kind: 'accept'; destination: string; version: number; now: number }
  | { kind: 'gap'; now: number };
export function replay(initial: State, actions: ReplayAction[]): State {
  return actions.reduce(
    (s, a) =>
      a.kind === 'prepare'
        ? prepare(s, a.source, a.destination, a.version, a.now)
        : a.kind === 'evidence'
          ? evidence(s, a.id, a.source, a.destination, a.at, a.now)
          : a.kind === 'accept'
            ? accept(s, a.destination, a.version, a.now)
            : gap(s, a.now),
    initial,
  );
}

/** Rebuild state from the append-only input events; derived proof is regenerated. */
export function replayEvents(initial: State, events: Event[]): State {
  let s = structuredClone(initial);
  for (const e of events.slice(initial.events.length)) {
    const p = e.payload;
    if (e.type === 'HANDOFF_PREPARED')
      s = prepare(
        s,
        String(p.source),
        String(p.destination),
        Number(p.version),
        e.at,
        Number(p.expiresAt) - e.at,
        p.evidenceClass as Handoff['evidenceClass'],
      );
    else if (e.type === 'PROVIDER_EVENT_RECEIVED')
      s = evidence(
        s,
        String(p.id),
        String(p.source),
        String(p.destination),
        Number(p.occurredAt),
        e.at,
      );
    else if (e.type === 'HANDOFF_COMMITTED')
      s = accept(s, String(p.destination), Number(p.version) - 1, e.at);
    else if (e.type === 'CONTRIBUTION_RECEIVED')
      s = contribute(s, String(p.id), String(p.user), String(p.command), e.at);
    else if (e.type === 'HANDOFF_ABORTED') s = abort(s, s.custodian, e.at);
    else if (e.type === 'HANDOFF_PAUSED') s = gap(s, e.at);
    else if (e.type === 'CAMPAIGN_PAUSED') s = pause(s, e.at);
    else if (e.type === 'CAMPAIGN_RESUMED') s = resume(s, e.at);
  }
  return s;
}
