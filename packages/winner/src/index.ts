import {
  canonical,
  DomainError,
  sha256,
  type Receipt,
  type State,
  type Stamp,
} from '../../domain/src/index.js';

export const MARK_TYPES = [
  'BAND',
  'GLYPH',
  'SCAR',
  'RING',
  'GLOW_PATTERN',
] as const;
export type MarkType = (typeof MARK_TYPES)[number];
export type RelayStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';
export type VoteKind = 'MUTATION' | 'NEXT_STOP';
export type VoteStatus = 'OPEN' | 'CLOSED' | 'APPROVED' | 'CANCELLED';
export type LivingWillieState =
  | 'SLEEPING'
  | 'WAKING'
  | 'ALIVE'
  | 'CHARGING'
  | 'READY'
  | 'PREPARING'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'AWAITING_ACCEPTANCE'
  | 'RECEIVED'
  | 'PAUSED'
  | 'RECOVERING'
  | 'EVOLVED';

export interface Relay {
  id: string;
  campaignId: string;
  willieId: string;
  title: string;
  mission: string;
  origin: string;
  currentHolder: string;
  missionTarget: number;
  progress: number;
  communitiesVisited: number;
  successfulHandoffs: number;
  status: RelayStatus;
  startedAt: number;
  completedAt?: number;
  currentWillieVersion: number;
  nextDestination?: string;
}

export interface CommunityMark {
  id: string;
  campaignId: string;
  relayId: string;
  willieId: string;
  community: string;
  creator: string;
  type: MarkType;
  visualResult: {
    signature: string;
    variant: number;
    intensity: number;
    orientation: number;
  };
  selectionMethod: 'CHAT_VOTE_CREATOR_APPROVED' | 'CREATOR_SELECTED';
  createdAt: number;
  willieVersion: number;
  passportChapterId: string;
  provenanceHash: string;
}

export interface VoteSession {
  id: string;
  campaignId: string;
  relayId: string;
  kind: VoteKind;
  community: string;
  creator: string;
  willieVersion: number;
  candidates: string[];
  status: VoteStatus;
  opensAt: number;
  closesAt: number;
  winnerCandidate?: string;
  approvedCandidate?: string;
  tie?: boolean;
  counts?: Record<string, number>;
  approvedAt?: number;
}

export interface VoteBallot {
  sessionId: string;
  voterKey: string;
  candidate: string;
  castAt: number;
  providerEventId?: string;
}

export interface PassportChapter {
  id: string;
  relayId: string;
  campaignId: string;
  chapterNumber: number;
  community: string;
  creator: string;
  arrivalAt: number;
  departureAt?: number;
  whatCommunityAdded?: string;
  participationMetric: number;
  willieBefore: number;
  willieAfter?: number;
  markId?: string;
  relayProgress: number;
  nextDestination?: string;
  providerVerification?: {
    provider: string;
    evidenceClass: string;
    providerEventId: string;
  };
  receiptId?: string;
  clipStatus: 'UNAVAILABLE' | 'REQUESTED' | 'PENDING' | 'AVAILABLE' | 'FAILED';
  clipUrl?: string;
}

function rule(value: unknown, code: string): asserts value {
  if (!value) throw new DomainError(code);
}

function safeText(value: string, max = 500): string {
  const text = value.trim();
  rule(text.length > 0 && text.length <= max, 'INVALID_RELAY_TEXT');
  return text;
}

export function livingWillieState(state: State): LivingWillieState {
  if (state.paused) return 'PAUSED';
  if (state.handoff?.status === 'PAUSED') return 'RECOVERING';
  if (state.handoff?.status === 'PREPARED') return 'PREPARING';
  if (state.handoff?.status === 'PROVIDER_VERIFIED') return 'ARRIVED';
  if (state.handoff?.status === 'AWAITING_ACCEPTANCE') return 'AWAITING_ACCEPTANCE';
  if (state.handoff?.status === 'COMMITTING') return 'RECEIVED';
  if (state.handoff?.status === 'COMMITTED') return 'RECEIVED';
  if (state.progress >= 100) return 'EVOLVED';
  if (state.progress >= 75) return 'READY';
  if (state.progress >= 50) return 'CHARGING';
  if (state.progress > 0) return 'ALIVE';
  return 'SLEEPING';
}

export function createRelay(
  state: State,
  input: {
    id?: string;
    title?: string;
    mission?: string;
    missionTarget?: number;
  },
  now: number,
): Relay {
  rule(Number.isFinite(now) && now >= 0, 'INVALID_TIME');
  const target = input.missionTarget ?? 10;
  rule(Number.isSafeInteger(target) && target >= 2 && target <= 100, 'INVALID_RELAY_TARGET');
  const visited = Math.max(1, state.passport.length);
  const successfulHandoffs = state.receipts.length;
  const origin = state.passport[0]?.custodian ?? state.custodian;
  const progress = Math.min(target, visited);
  const completed = progress >= target;
  const startedAt = state.passport[0]?.receivedAt ?? now;
  const id =
    input.id ??
    'relay_' +
      sha256(
        canonical({
          campaignId: state.campaignId,
          willieId: state.willieId,
          startedAt,
        }),
      ).slice(0, 20);
  return {
    id,
    campaignId: state.campaignId,
    willieId: state.willieId,
    title: safeText(input.title ?? 'THE FIRST WILLIE RELAY', 120),
    mission: safeText(
      input.mission ?? 'Take Willie through 10 Twitch communities without breaking the chain.',
      500,
    ),
    origin,
    currentHolder: state.custodian,
    missionTarget: target,
    progress,
    communitiesVisited: visited,
    successfulHandoffs,
    status: completed ? 'COMPLETED' : state.paused ? 'PAUSED' : 'ACTIVE',
    startedAt,
    completedAt: completed ? now : undefined,
    currentWillieVersion: state.version,
  };
}

export function assertRelayCurrent(relay: Relay, state: State): void {
  rule(relay.campaignId === state.campaignId, 'RELAY_CAMPAIGN_MISMATCH');
  rule(relay.willieId === state.willieId, 'RELAY_WILLIE_MISMATCH');
  rule(relay.currentHolder === state.custodian, 'RELAY_HOLDER_STALE');
  rule(relay.currentWillieVersion === state.version, 'RELAY_VERSION_STALE');
}

export function advanceRelay(
  relay: Relay,
  input: { destination: string; newWillieVersion: number; committedAt: number },
): Relay {
  rule(relay.status !== 'COMPLETED', 'RELAY_COMPLETED');
  rule(Number.isFinite(input.committedAt) && input.committedAt >= relay.startedAt, 'INVALID_TIME');
  rule(input.destination.length > 0, 'INVALID_DESTINATION');
  rule(input.newWillieVersion === relay.currentWillieVersion + 1, 'RELAY_VERSION_STALE');
  const communitiesVisited = relay.communitiesVisited + 1;
  const progress = Math.min(relay.missionTarget, communitiesVisited);
  const completed = progress >= relay.missionTarget;
  return {
    ...relay,
    currentHolder: input.destination,
    currentWillieVersion: input.newWillieVersion,
    successfulHandoffs: relay.successfulHandoffs + 1,
    communitiesVisited,
    progress,
    status: completed ? 'COMPLETED' : 'ACTIVE',
    completedAt: completed ? input.committedAt : undefined,
    nextDestination: undefined,
  };
}

export function createCommunityMark(input: {
  campaignId: string;
  relayId: string;
  willieId: string;
  community: string;
  creator: string;
  type: MarkType;
  selectionMethod: CommunityMark['selectionMethod'];
  createdAt: number;
  willieVersion: number;
  passportChapterId: string;
}): CommunityMark {
  rule(MARK_TYPES.includes(input.type), 'INVALID_MARK_TYPE');
  rule(Number.isSafeInteger(input.willieVersion) && input.willieVersion > 0, 'STALE_VERSION');
  rule(Number.isFinite(input.createdAt) && input.createdAt >= 0, 'INVALID_TIME');
  for (const value of [
    input.campaignId,
    input.relayId,
    input.willieId,
    input.community,
    input.creator,
    input.passportChapterId,
  ])
    rule(value.length > 0, 'INVALID_MARK_IDENTITY');
  const base = {
    campaignId: input.campaignId,
    relayId: input.relayId,
    willieId: input.willieId,
    community: input.community,
    creator: input.creator,
    type: input.type,
    selectionMethod: input.selectionMethod,
    willieVersion: input.willieVersion,
    passportChapterId: input.passportChapterId,
  };
  const provenanceHash = sha256(canonical(base));
  const variant = (Number.parseInt(provenanceHash.slice(0, 4), 16) % 7) + 1;
  const intensity = Math.round((0.55 + (Number.parseInt(provenanceHash.slice(4, 8), 16) % 41) / 100) * 100) / 100;
  const orientation = Number.parseInt(provenanceHash.slice(8, 12), 16) % 360;
  return {
    id: 'mark_' + provenanceHash.slice(0, 24),
    ...base,
    createdAt: input.createdAt,
    visualResult: {
      signature: provenanceHash.slice(0, 16),
      variant,
      intensity,
      orientation,
    },
    provenanceHash,
  };
}

export function openVote(input: {
  campaignId: string;
  relayId: string;
  kind: VoteKind;
  community: string;
  creator: string;
  willieVersion: number;
  candidates: string[];
  opensAt: number;
  closesAt: number;
}): VoteSession {
  rule(Number.isSafeInteger(input.willieVersion) && input.willieVersion > 0, 'STALE_VERSION');
  rule(Number.isFinite(input.opensAt) && Number.isFinite(input.closesAt), 'INVALID_TIME');
  rule(input.closesAt - input.opensAt >= 5_000 && input.closesAt - input.opensAt <= 900_000, 'INVALID_VOTE_WINDOW');
  const candidates = input.candidates.map((c) => c.trim());
  rule(candidates.length >= 2 && candidates.length <= 6, 'INVALID_VOTE_CANDIDATES');
  rule(candidates.every((c) => c.length > 0 && c.length <= 200), 'INVALID_VOTE_CANDIDATES');
  rule(new Set(candidates).size === candidates.length, 'DUPLICATE_VOTE_CANDIDATE');
  if (input.kind === 'MUTATION')
    rule(candidates.every((c) => MARK_TYPES.includes(c as MarkType)), 'INVALID_MARK_TYPE');
  const id =
    'vote_' +
    sha256(
      canonical({
        campaignId: input.campaignId,
        relayId: input.relayId,
        kind: input.kind,
        community: input.community,
        creator: input.creator,
        willieVersion: input.willieVersion,
        candidates,
        opensAt: input.opensAt,
      }),
    ).slice(0, 24);
  return {...input, candidates, id, status: 'OPEN'};
}

export function castVote(
  session: VoteSession,
  ballots: VoteBallot[],
  input: {voterKey: string; candidate: string; castAt: number; providerEventId?: string},
): VoteBallot[] {
  rule(session.status === 'OPEN', 'VOTE_NOT_OPEN');
  rule(input.castAt >= session.opensAt && input.castAt < session.closesAt, 'VOTE_WINDOW_CLOSED');
  rule(session.candidates.includes(input.candidate), 'INVALID_VOTE_CANDIDATE');
  rule(input.voterKey.length > 0 && input.voterKey.length <= 300, 'INVALID_VOTER');
  rule(!ballots.some((b) => b.voterKey === input.voterKey), 'DUPLICATE_VOTE');
  if (input.providerEventId)
    rule(!ballots.some((b) => b.providerEventId === input.providerEventId), 'DUPLICATE_PROVIDER_EVENT');
  return [
    ...ballots,
    {
      sessionId: session.id,
      voterKey: input.voterKey,
      candidate: input.candidate,
      castAt: input.castAt,
      providerEventId: input.providerEventId,
    },
  ];
}

export function closeVote(session: VoteSession, ballots: VoteBallot[], now: number): VoteSession {
  rule(session.status === 'OPEN', 'VOTE_NOT_OPEN');
  rule(now >= session.closesAt, 'VOTE_STILL_OPEN');
  const counts = Object.fromEntries(session.candidates.map((candidate) => [candidate, 0]));
  for (const ballot of ballots) {
    if (ballot.sessionId !== session.id || !session.candidates.includes(ballot.candidate)) continue;
    counts[ballot.candidate]++;
  }
  const max = Math.max(...Object.values(counts));
  const winners = session.candidates.filter((candidate) => counts[candidate] === max);
  return {
    ...session,
    status: 'CLOSED',
    winnerCandidate: winners[0],
    tie: winners.length > 1,
    counts,
  };
}

export function approveVote(
  session: VoteSession,
  actor: string,
  candidate: string,
  now: number,
): VoteSession {
  rule(session.status === 'CLOSED', 'VOTE_NOT_CLOSED');
  rule(actor === session.creator, 'CREATOR_APPROVAL_REQUIRED');
  rule(candidate === session.winnerCandidate, 'VOTE_WINNER_REQUIRED');
  rule(now >= session.closesAt, 'INVALID_TIME');
  return {
    ...session,
    status: 'APPROVED',
    approvedCandidate: candidate,
    approvedAt: now,
  };
}

export function chapterFromStamp(input: {
  relay: Relay;
  stamp: Stamp;
  chapterNumber: number;
  nextStamp?: Stamp;
  receipt?: Receipt;
  mark?: CommunityMark;
}): PassportChapter {
  const {relay, stamp, nextStamp, receipt, mark} = input;
  rule(input.chapterNumber > 0, 'INVALID_CHAPTER');
  rule(stamp.campaignId === relay.campaignId && stamp.willieId === relay.willieId, 'CHAPTER_RELAY_MISMATCH');
  if (receipt) rule(receipt.campaignId === relay.campaignId, 'CHAPTER_RECEIPT_MISMATCH');
  return {
    id: relay.id + ':chapter:' + input.chapterNumber,
    relayId: relay.id,
    campaignId: relay.campaignId,
    chapterNumber: input.chapterNumber,
    community: stamp.custodian,
    creator: stamp.custodian,
    arrivalAt: stamp.receivedAt,
    departureAt: stamp.releasedAt,
    whatCommunityAdded: mark ? `${mark.type} ${mark.visualResult.signature}` : undefined,
    participationMetric: stamp.contributionCount ?? 0,
    willieBefore: stamp.versionReceived,
    willieAfter: stamp.versionReleased,
    markId: mark?.id,
    relayProgress: Math.min(relay.missionTarget, input.chapterNumber),
    nextDestination: nextStamp?.custodian,
    providerVerification: receipt
      ? {
          provider: receipt.provider,
          evidenceClass: receipt.evidenceClass,
          providerEventId: receipt.providerEventId,
        }
      : undefined,
    receiptId: receipt?.receiptId,
    clipStatus: 'UNAVAILABLE',
  };
}
