-- ==============================================================================
-- SHABACH 2026 GRAND FINALE ROW LEVEL SECURITY (RLS) POLICIES
-- Migration: 20261029000002_rls_policies.sql
-- Description: Strict access controls for public, judges, and organisers.
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

-- -----------------------------------------------------------------------------
-- Helper Functions for Role Checking
-- -----------------------------------------------------------------------------
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
          AND role_type = p_judge_id
    );
$$;

-- -----------------------------------------------------------------------------
-- 1. Events Policies
-- -----------------------------------------------------------------------------
-- Public can view event details
CREATE POLICY "Public read events"
    ON events FOR SELECT
    TO anon, authenticated
    USING (true);

-- Only organisers can modify events
CREATE POLICY "Organiser modify events"
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

CREATE POLICY "Organiser modify event settings"
    ON event_settings FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 3. Contestants Policies
-- -----------------------------------------------------------------------------
-- Public can view contestants
CREATE POLICY "Public read contestants"
    ON contestants FOR SELECT
    TO anon, authenticated
    USING (true);

-- Only organisers can create, update, or remove contestants
CREATE POLICY "Organiser modify contestants"
    ON contestants FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 4. Staff Roles Policies
-- -----------------------------------------------------------------------------
-- Organisers can view all staff roles
CREATE POLICY "Organiser view staff roles"
    ON staff_roles FOR SELECT
    TO authenticated
    USING (auth_is_organiser(event_id) OR user_id = auth.uid());

-- Organisers can manage staff roles
CREATE POLICY "Organiser manage staff roles"
    ON staff_roles FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 5. Rubric Versions Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Public read rubric versions"
    ON rubric_versions FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Organiser manage rubrics"
    ON rubric_versions FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 6. Scorecards Policies (CRITICAL: Blind Judging Isolation)
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
-- Only organisers and score desk can view or modify durations
CREATE POLICY "Organiser manage durations"
    ON durations FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 8. Verified Voters Policies
-- -----------------------------------------------------------------------------
-- Voters can view their own verification record
CREATE POLICY "Voter view own record"
    ON verified_voters FOR SELECT
    TO authenticated
    USING (email = (auth.jwt() ->> 'email'));

-- Organisers can view verified voters for audit
CREATE POLICY "Organiser view voters"
    ON verified_voters FOR SELECT
    TO authenticated
    USING (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 9. Votes Policies
-- -----------------------------------------------------------------------------
-- Raw votes are kept private. Voters cast votes through secure SECURITY DEFINER RPC.
-- Organisers can query vote counts or records
CREATE POLICY "Organiser read votes"
    ON votes FOR SELECT
    TO authenticated
    USING (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 10. Results Snapshots Policies
-- -----------------------------------------------------------------------------
-- Public can view snapshot data ONLY when published
CREATE POLICY "Public read published snapshot"
    ON results_snapshots FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

-- Organisers can view and manage snapshots at any time
CREATE POLICY "Organiser manage results snapshot"
    ON results_snapshots FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 11. Audit Events Policies
-- -----------------------------------------------------------------------------
-- Organisers can inspect audit trail
CREATE POLICY "Organiser read audit log"
    ON audit_events FOR SELECT
    TO authenticated
    USING (auth_is_organiser(event_id));

