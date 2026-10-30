-- ==============================================================================
-- SHABACH 2026 GRAND FINALE ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 20261030000002_rls_policies.sql
-- Description: Strict access controls for public, 4 judges, and organisers.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contestants ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE results_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION auth_is_organiser(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM staff_roles
        WHERE event_id = p_event_id
          AND user_id = auth.uid()
          AND active = true
          AND role_type IN ('organiser', 'score_desk')
    );
$$;

CREATE OR REPLACE FUNCTION auth_is_assigned_judge(p_event_id UUID, p_judge_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM staff_roles
        WHERE event_id = p_event_id
          AND user_id = auth.uid()
          AND active = true
          AND (role_type = p_judge_id OR role_type = replace(p_judge_id, 'judge', 'judge_'))
    );
$$;

-- -----------------------------------------------------------------------------
-- 1. Events Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Public read events"
    ON events FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Organiser manage events"
    ON events FOR ALL
    TO authenticated
    USING (auth_is_organiser(id))
    WITH CHECK (auth_is_organiser(id));

-- -----------------------------------------------------------------------------
-- 2. Event Settings Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Public read event settings"
    ON event_settings FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Organiser manage event settings"
    ON event_settings FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 3. Contestants Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Public read contestants"
    ON contestants FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Organiser manage contestants"
    ON contestants FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 4. Staff Roles Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Organiser read and manage staff roles"
    ON staff_roles FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 5. Rubrics Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Public read rubrics"
    ON rubric_versions FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Organiser manage rubrics"
    ON rubric_versions FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 6. Scorecards Policies (CRITICAL: Blind Judging Isolation for all 4 judges)
-- -----------------------------------------------------------------------------
-- Judges can ONLY select their own assigned scorecards. NEVER read other judges' cards!
CREATE POLICY "Judge read own scorecards"
    ON scorecards FOR SELECT
    TO authenticated
    USING (auth_is_assigned_judge(event_id, judge_id));

-- Judges can update their own scorecard draft/submission
CREATE POLICY "Judge update own scorecards"
    ON scorecards FOR UPDATE
    TO authenticated
    USING (auth_is_assigned_judge(event_id, judge_id))
    WITH CHECK (auth_is_assigned_judge(event_id, judge_id));

-- Organisers have full access to view and reopen/resolve all scorecards
CREATE POLICY "Organiser manage all scorecards"
    ON scorecards FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 7. Durations Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Organiser manage durations"
    ON durations FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 8. Verified Voters & Votes Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Anon create verified voters"
    ON verified_voters FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Anon cast vote"
    ON votes FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Organiser read vote counts"
    ON votes FOR SELECT
    TO authenticated
    USING (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 9. Results Snapshots Policies (Privacy Protected: Public Top-Three only after published)
-- -----------------------------------------------------------------------------
CREATE POLICY "Public read published official snapshots"
    ON results_snapshots FOR SELECT
    TO anon, authenticated
    USING (published = true AND is_official = true);

CREATE POLICY "Organiser manage results snapshots"
    ON results_snapshots FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 10. Audit Events Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Organiser manage audit log"
    ON audit_events FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));
