
ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS data jsonb NOT NULL DEFAULT '{}';
ALTER TABLE adapter_connections ADD COLUMN IF NOT EXISTS creator_id text REFERENCES users(id);
CREATE UNIQUE INDEX IF NOT EXISTS adapter_campaign_creator_provider ON adapter_connections(campaign_id,creator_id,provider);
CREATE TABLE dual_consents(handoff_id text PRIMARY KEY REFERENCES handoffs(id) DEFERRABLE INITIALLY DEFERRED,campaign_id text NOT NULL REFERENCES campaigns(id),data jsonb NOT NULL);
CREATE TABLE shared_sessions(campaign_id text NOT NULL REFERENCES campaigns(id),session_id text NOT NULL,participants jsonb NOT NULL DEFAULT '[]',active boolean NOT NULL DEFAULT true,PRIMARY KEY(campaign_id,session_id));

ALTER TABLE adapter_connections ADD COLUMN IF NOT EXISTS health jsonb NOT NULL DEFAULT '{"status":"CONNECTING","checkedAt":"1970-01-01T00:00:00Z"}';

CREATE TABLE campaign_settings(campaign_id text PRIMARY KEY REFERENCES campaigns(id),handoff_expiry_seconds integer NOT NULL DEFAULT 120 CHECK(handoff_expiry_seconds BETWEEN 30 AND 300),paid_events_enabled boolean NOT NULL DEFAULT false);
