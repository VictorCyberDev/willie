CREATE TABLE IF NOT EXISTS winner_clip_tokens(
  user_id text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  encrypted_token jsonb NOT NULL,
  scopes jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS winner_clip_oauth_states(
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS winner_clip_requests(
  id text PRIMARY KEY,
  campaign_id text NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  relay_id text NOT NULL REFERENCES relays(id) ON DELETE CASCADE,
  chapter_id text NOT NULL UNIQUE REFERENCES passport_chapters(id) ON DELETE CASCADE,
  broadcaster_id text NOT NULL REFERENCES users(id),
  twitch_clip_id text,
  status text NOT NULL CHECK(status IN('REQUESTED','PENDING','AVAILABLE','FAILED','UNAVAILABLE')),
  requested_at bigint NOT NULL,
  resolved_at bigint,
  url text,
  error_code text,
  CHECK((status='AVAILABLE' AND url IS NOT NULL) OR status<>'AVAILABLE')
);
CREATE INDEX IF NOT EXISTS winner_clip_requests_campaign_idx ON winner_clip_requests(campaign_id,requested_at DESC);

INSERT INTO schema_migrations(version) VALUES(9) ON CONFLICT DO NOTHING;
