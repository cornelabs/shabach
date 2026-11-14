-- 20261114000002_fix_scorecards_anon_access.sql
-- Grant anon and authenticated access to scorecards, durations, and event tables
-- so judges and score desk admins logging in via client PIN can read and submit scores.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON scorecards TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON durations TO anon, authenticated;
GRANT SELECT, UPDATE ON events TO anon, authenticated;
GRANT SELECT, UPDATE ON event_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON results_snapshots TO anon, authenticated;

ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE durations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read scorecards" ON scorecards;
CREATE POLICY "Public read scorecards"
  ON scorecards FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public insert scorecards" ON scorecards;
CREATE POLICY "Public insert scorecards"
  ON scorecards FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update scorecards" ON scorecards;
CREATE POLICY "Public update scorecards"
  ON scorecards FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public manage durations" ON durations;
CREATE POLICY "Public manage durations"
  ON durations FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION get_event_vote_counts(p_event_id UUID)
RETURNS TABLE (
  contestant_id UUID,
  vote_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT contestant_id, count(*)::BIGINT AS vote_count
  FROM votes
  WHERE event_id = p_event_id
  GROUP BY contestant_id;
$$;

GRANT EXECUTE ON FUNCTION get_event_vote_counts(UUID) TO anon, authenticated;
