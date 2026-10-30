-- ==============================================================================
-- SHABACH 2026 CLIENT PERSISTENCE POLICIES & ENHANCEMENTS
-- Migration: 20261030000004_client_persistence_policies.sql
-- Description: Grants client access for scorecards, durations, contestant edits,
-- and results snapshots so all data persists directly into Supabase PostgreSQL.
-- ==============================================================================

-- 1. Scorecards: Allow reading and updating/inserting scorecards
DROP POLICY IF EXISTS "Public read scorecards" ON scorecards;
CREATE POLICY "Public read scorecards"
    ON scorecards FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Public insert scorecards" ON scorecards;
CREATE POLICY "Public insert scorecards"
    ON scorecards FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = scorecards.event_id
              AND e.lifecycle_status IN ('locked', 'published', 'archived')
        )
    );

DROP POLICY IF EXISTS "Public update scorecards" ON scorecards;
CREATE POLICY "Public update scorecards"
    ON scorecards FOR UPDATE
    TO anon, authenticated
    USING (
        NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = scorecards.event_id
              AND e.lifecycle_status IN ('locked', 'published', 'archived')
        )
    );

-- 2. Durations: Allow reading and upserting performance durations
DROP POLICY IF EXISTS "Public manage durations" ON durations;
CREATE POLICY "Public manage durations"
    ON durations FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 3. Contestants: Allow editing profile info and ordering
DROP POLICY IF EXISTS "Public update contestants" ON contestants;
CREATE POLICY "Public update contestants"
    ON contestants FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Events: Allow updating voting_status and lifecycle_status
DROP POLICY IF EXISTS "Public update events" ON events;
CREATE POLICY "Public update events"
    ON events FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 5. Results snapshots: Allow reading and persisting frozen snapshots
DROP POLICY IF EXISTS "Public read results snapshots" ON results_snapshots;
CREATE POLICY "Public read results snapshots"
    ON results_snapshots FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Public insert results snapshots" ON results_snapshots;
CREATE POLICY "Public insert results snapshots"
    ON results_snapshots FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 6. RPC: Authoritative vote counts for all 16 contestants
CREATE OR REPLACE FUNCTION get_event_vote_counts(p_event_id UUID)
RETURNS TABLE (
    contestant_id UUID,
    vote_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS contestant_id,
        COUNT(v.id) AS vote_count
    FROM contestants c
    LEFT JOIN votes v ON v.contestant_id = c.id AND v.event_id = p_event_id
    WHERE c.event_id = p_event_id
    GROUP BY c.id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_event_vote_counts(UUID) TO anon, authenticated;
