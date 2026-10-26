
CREATE TABLE IF NOT EXISTS oauth_states(token_hash text PRIMARY KEY,expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS invitations(token_hash text PRIMARY KEY,campaign_id text NOT NULL REFERENCES campaigns(id),expires_at timestamptz NOT NULL);
ALTER TABLE campaign_members ADD COLUMN IF NOT EXISTS overlay_seen_at bigint NOT NULL DEFAULT 0;
ALTER TABLE campaign_members ADD COLUMN IF NOT EXISTS route_order integer NOT NULL DEFAULT 0;
ALTER TABLE overlay_sessions ADD COLUMN IF NOT EXISTS user_id text REFERENCES users(id);

ALTER TABLE willies ADD CONSTRAINT willies_campaign_custodian_fk FOREIGN KEY(campaign_id,custodian) REFERENCES campaign_members(campaign_id,user_id);
ALTER TABLE handoffs ADD CONSTRAINT handoffs_source_member_fk FOREIGN KEY(campaign_id,source_id) REFERENCES campaign_members(campaign_id,user_id);
ALTER TABLE handoffs ADD CONSTRAINT handoffs_destination_member_fk FOREIGN KEY(campaign_id,destination_id) REFERENCES campaign_members(campaign_id,user_id);
