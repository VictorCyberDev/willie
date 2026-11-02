CREATE OR REPLACE FUNCTION sync_winner_chapter_contribution() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE passport_chapters
    SET contribution_count=contribution_count+1,
        data=data||jsonb_build_object('participationMetric',contribution_count+1)
    WHERE campaign_id=NEW.campaign_id AND departure_at IS NULL;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS contributions_sync_winner_chapter ON contributions;
CREATE TRIGGER contributions_sync_winner_chapter
AFTER INSERT ON contributions
FOR EACH ROW EXECUTE FUNCTION sync_winner_chapter_contribution();

INSERT INTO schema_migrations(version) VALUES(6) ON CONFLICT DO NOTHING;
