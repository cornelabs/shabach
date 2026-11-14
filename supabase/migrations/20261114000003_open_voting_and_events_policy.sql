-- 20261114000003_open_voting_and_events_policy.sql
-- 1. Sets voting_status to 'open' for SHABACH 2026 Grand Finale
-- 2. Grants update permissions and creates RLS policy so client updates to voting_status persist

UPDATE events
SET voting_status = 'open',
    updated_at = timezone('utc'::text, now())
WHERE id = '00000000-0000-0000-0000-000000002026';

GRANT SELECT, UPDATE ON events TO anon, authenticated;
GRANT SELECT, UPDATE ON event_settings TO anon, authenticated;

DROP POLICY IF EXISTS "Public update events" ON events;
CREATE POLICY "Public update events"
  ON events FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update event settings" ON event_settings;
CREATE POLICY "Public update event settings"
  ON event_settings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
