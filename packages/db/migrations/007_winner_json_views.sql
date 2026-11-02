CREATE OR REPLACE FUNCTION hydrate_winner_relay_data() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.data=COALESCE(NEW.data,'{}'::jsonb)||jsonb_build_object(
    'id',NEW.id,'campaignId',NEW.campaign_id,'willieId',NEW.willie_id,'title',NEW.title,
    'mission',NEW.mission,'origin',NEW.origin,'currentHolder',NEW.current_holder,
    'missionTarget',NEW.mission_target,'progress',NEW.progress,'communitiesVisited',NEW.communities_visited,
    'successfulHandoffs',NEW.successful_handoffs,'status',NEW.status,'startedAt',NEW.started_at,
    'completedAt',NEW.completed_at,'currentWillieVersion',NEW.current_willie_version,'nextDestination',NEW.next_destination
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS hydrate_winner_relay_data_trigger ON relays;
CREATE TRIGGER hydrate_winner_relay_data_trigger BEFORE INSERT OR UPDATE ON relays FOR EACH ROW EXECUTE FUNCTION hydrate_winner_relay_data();

CREATE OR REPLACE FUNCTION hydrate_winner_chapter_data() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.data=COALESCE(NEW.data,'{}'::jsonb)||jsonb_build_object(
    'id',NEW.id,'relayId',NEW.relay_id,'campaignId',NEW.campaign_id,'chapterNumber',NEW.chapter_number,
    'community',NEW.community_id,'creator',NEW.creator_id,'arrivalAt',NEW.arrival_at,'departureAt',NEW.departure_at,
    'participationMetric',NEW.contribution_count,'willieBefore',NEW.before_version,'willieAfter',NEW.after_version,
    'markId',NEW.mark_id,'nextDestination',NEW.next_destination,'providerVerification',NEW.provider_verification,
    'receiptId',NEW.receipt_id,'clipStatus',NEW.clip_status,'clipUrl',NEW.clip_url
  );
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS hydrate_winner_chapter_data_trigger ON passport_chapters;
CREATE TRIGGER hydrate_winner_chapter_data_trigger BEFORE INSERT OR UPDATE ON passport_chapters FOR EACH ROW EXECUTE FUNCTION hydrate_winner_chapter_data();

UPDATE relays SET data=data;
UPDATE passport_chapters SET data=data;
INSERT INTO schema_migrations(version) VALUES(7) ON CONFLICT DO NOTHING;
