ALTER TABLE users ADD COLUMN auth_epoch integer NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN deleted_at timestamptz;
ALTER TABLE oauth_states ADD COLUMN issued_at timestamptz NOT NULL DEFAULT now();
CREATE TABLE account_identity_tombstones(provider text NOT NULL,identity_hash text NOT NULL,revoked_at timestamptz NOT NULL,PRIMARY KEY(provider,identity_hash));
