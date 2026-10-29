CREATE TABLE IF NOT EXISTS relays(
  id text PRIMARY KEY,
  campaign_id text NOT NULL UNIQUE REFERENCES campaigns(id) ON DELETE CASCADE,
  willie_id text NOT NULL,
  title text NOT NULL,
  mission text NOT NULL,
  origin text NOT NULL,
  current_holder text NOT NULL REFERENCES users(id),
  mission_target integer NOT NULL CHECK(mission_target BETWEEN 2 AND 100),
  progress integer NOT NULL CHECK(progress >= 0),
  communities_visited integer NOT NULL CHECK(communities_visited >= 1),
  successful_handoffs integer NOT NULL CHECK(successful_handoffs >= 0),
  status text NOT NULL CHECK(status IN('ACTIVE','COMPLETED','PAUSED')),
  started_at bigint NOT NULL,
  completed_at bigint,
  current_willie_version integer NOT NULL CHECK(current_willie_version >= 1),
  next_destination text REFERENCES users(id),
  data jsonb NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS passport_chapters(
  id text PRIMARY KEY,
  campaign_id text NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  relay_id text NOT NULL REFERENCES relays(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL CHECK(chapter_number >= 1),
  community_id text NOT NULL REFERENCES users(id),
  creator_id text NOT NULL REFERENCES users(id),
  arrival_at bigint NOT NULL,
  departure_at bigint,
  contribution_count integer NOT NULL DEFAULT 0 CHECK(contribution_count >= 0),
  before_version integer NOT NULL CHECK(before_version >= 1),
  after_version integer,
  mark_id text,
  next_destination text REFERENCES users(id),
  provider_verification jsonb,
  receipt_id text UNIQUE,
  clip_status text NOT NULL DEFAULT 'UNAVAILABLE' CHECK(clip_status IN('UNAVAILABLE','REQUESTED','PENDING','AVAILABLE','FAILED')),
  clip_url text,
  data jsonb NOT NULL DEFAULT '{}',
  UNIQUE(relay_id,chapter_number)
);

CREATE TABLE IF NOT EXISTS community_marks(
  id text PRIMARY KEY,
  campaign_id text NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  relay_id text NOT NULL REFERENCES relays(id) ON DELETE CASCADE,
  willie_id text NOT NULL,
  community_id text NOT NULL REFERENCES users(id),
  creator_id text NOT NULL REFERENCES users(id),
  mark_type text NOT NULL CHECK(mark_type IN('BAND','GLYPH','SCAR','RING','GLOW_PATTERN')),
  visual_result jsonb NOT NULL,
  selection_method text NOT NULL CHECK(selection_method IN('CHAT_VOTE_CREATOR_APPROVED','CREATOR_SELECTED')),
  created_at bigint NOT NULL,
  willie_version integer NOT NULL CHECK(willie_version >= 1),
  passport_chapter_id text NOT NULL REFERENCES passport_chapters(id) ON DELETE CASCADE,
  provenance_hash text NOT NULL,
  UNIQUE(relay_id,passport_chapter_id),
  UNIQUE(relay_id,provenance_hash)
);

ALTER TABLE passport_chapters
  DROP CONSTRAINT IF EXISTS passport_chapters_mark_id_fkey;
ALTER TABLE passport_chapters
  ADD CONSTRAINT passport_chapters_mark_id_fkey
  FOREIGN KEY(mark_id) REFERENCES community_marks(id) DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE IF NOT EXISTS relay_votes(
  id text PRIMARY KEY,
  campaign_id text NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  relay_id text NOT NULL REFERENCES relays(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN('MUTATION','NEXT_STOP')),
  community_id text NOT NULL REFERENCES users(id),
  creator_id text NOT NULL REFERENCES users(id),
  willie_version integer NOT NULL CHECK(willie_version >= 1),
  candidates jsonb NOT NULL,
  status text NOT NULL CHECK(status IN('OPEN','CLOSED','APPROVED','CANCELLED')),
  opens_at bigint NOT NULL,
  closes_at bigint NOT NULL CHECK(closes_at > opens_at),
  winner_candidate text,
  approved_candidate text,
  tie boolean,
  counts jsonb,
  approved_at bigint,
  data jsonb NOT NULL DEFAULT '{}'
);
CREATE UNIQUE INDEX IF NOT EXISTS relay_votes_one_open_kind
  ON relay_votes(relay_id,kind) WHERE status='OPEN';

CREATE TABLE IF NOT EXISTS relay_vote_ballots(
  session_id text NOT NULL REFERENCES relay_votes(id) ON DELETE CASCADE,
  voter_key text NOT NULL,
  candidate text NOT NULL,
  cast_at bigint NOT NULL,
  provider_event_id text,
  PRIMARY KEY(session_id,voter_key),
  UNIQUE(session_id,provider_event_id)
);

CREATE OR REPLACE FUNCTION advance_winner_relay_from_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  r relays%ROWTYPE;
  next_visits integer;
  next_chapter integer;
  committed_at bigint;
  new_version integer;
BEGIN
  SELECT * INTO r FROM relays WHERE campaign_id=NEW.campaign_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  committed_at := COALESCE((NEW.data->>'committedAt')::bigint, (extract(epoch from now())*1000)::bigint);
  new_version := COALESCE((NEW.data->>'newVersion')::integer, r.current_willie_version + 1);
  next_visits := r.communities_visited + 1;
  next_chapter := r.successful_handoffs + 2;

  UPDATE passport_chapters
    SET departure_at=COALESCE(departure_at, committed_at),
        after_version=COALESCE(after_version, (NEW.data->>'previousVersion')::integer),
        next_destination=NEW.data->>'destination',
        provider_verification=jsonb_build_object(
          'provider',NEW.data->>'provider',
          'evidenceClass',NEW.data->>'evidenceClass',
          'providerEventId',NEW.data->>'providerEventId'
        ),
        receipt_id=NEW.id,
        data=data || jsonb_build_object('receiptId',NEW.id)
    WHERE relay_id=r.id AND departure_at IS NULL;

  UPDATE relays
    SET current_holder=NEW.data->>'destination',
        current_willie_version=new_version,
        successful_handoffs=successful_handoffs+1,
        communities_visited=next_visits,
        progress=LEAST(mission_target,next_visits),
        status=CASE WHEN next_visits>=mission_target THEN 'COMPLETED' ELSE 'ACTIVE' END,
        completed_at=CASE WHEN next_visits>=mission_target THEN committed_at ELSE NULL END,
        next_destination=NULL
    WHERE id=r.id;

  INSERT INTO passport_chapters(
    id,campaign_id,relay_id,chapter_number,community_id,creator_id,arrival_at,
    contribution_count,before_version,clip_status,data
  ) VALUES(
    r.id||':chapter:'||next_chapter,
    NEW.campaign_id,
    r.id,
    next_chapter,
    NEW.data->>'destination',
    NEW.data->>'destination',
    committed_at,
    0,
    new_version,
    'UNAVAILABLE',
    jsonb_build_object('sourceReceiptId',NEW.id)
  ) ON CONFLICT(relay_id,chapter_number) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS receipts_advance_winner_relay ON receipts;
CREATE TRIGGER receipts_advance_winner_relay
AFTER INSERT ON receipts
FOR EACH ROW EXECUTE FUNCTION advance_winner_relay_from_receipt();

INSERT INTO schema_migrations(version) VALUES(5) ON CONFLICT DO NOTHING;
