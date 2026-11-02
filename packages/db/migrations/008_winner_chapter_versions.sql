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
        after_version=COALESCE(after_version, new_version),
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

INSERT INTO schema_migrations(version) VALUES(8) ON CONFLICT DO NOTHING;
