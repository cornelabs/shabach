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
ALTER TABLE voter_verification_requests ENABLE ROW LEVEL SECURITY;
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

-- Judges can insert their own assigned scorecards (draft cards only, cannot self-resolve conflicts or self-reopen)
CREATE POLICY "Judge insert own scorecards"
    ON scorecards FOR INSERT
    TO authenticated
    WITH CHECK (
        auth_is_assigned_judge(event_id, judge_id)
        AND NOT conflict_resolved
        AND NOT reopened
        AND NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = scorecards.event_id
              AND e.lifecycle_status IN ('locked', 'published', 'archived')
        )
    );

-- Judges can update their own scorecard draft/submission
-- Only permits updating if currently a draft or explicitly reopened by an organiser,
-- and competition results are not locked.
CREATE POLICY "Judge update own scorecards"
    ON scorecards FOR UPDATE
    TO authenticated
    USING (
        auth_is_assigned_judge(event_id, judge_id)
        AND (status = 'draft' OR reopened = true)
        AND NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = scorecards.event_id
              AND e.lifecycle_status IN ('locked', 'published', 'archived')
        )
    )
    WITH CHECK (
        auth_is_assigned_judge(event_id, judge_id)
        AND NOT conflict_resolved
        AND NOT (reopened AND status != 'submitted')
        AND NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = scorecards.event_id
              AND e.lifecycle_status IN ('locked', 'published', 'archived')
        )
    );

-- Organisers have full access to view, provision, reopen, and resolve all scorecards
CREATE POLICY "Organiser manage all scorecards"
    ON scorecards FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- Server-side Trigger: Enforce Submission Locks & Organiser-Only Workflow
CREATE OR REPLACE FUNCTION check_judge_scorecard_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_lifecycle TEXT;
BEGIN
    -- Organisers and score desk officers have full management rights
    IF auth_is_organiser(NEW.event_id) THEN
        RETURN NEW;
    END IF;

    -- Results cannot be modified once locked
    SELECT lifecycle_status INTO v_lifecycle FROM events WHERE id = NEW.event_id;
    IF v_lifecycle IN ('locked', 'published', 'archived') THEN
        RAISE EXCEPTION 'Cannot modify scorecards: competition results are locked.';
    END IF;

    -- If scorecard was previously submitted, judge cannot edit unless reopened by organiser
    IF OLD.status = 'submitted' AND NEW.status != 'submitted' THEN
        RAISE EXCEPTION 'Cannot un-submit scorecard directly. An organiser must reopen it.';
    END IF;

    IF OLD.status = 'submitted' AND NOT OLD.reopened THEN
        RAISE EXCEPTION 'Scorecard has been submitted and is locked for judging. Contact organiser to reopen.';
    END IF;

    -- Judges cannot resolve their own conflicts
    IF NEW.conflict_resolved AND NOT OLD.conflict_resolved THEN
        RAISE EXCEPTION 'Only organisers can resolve declared conflicts of interest.';
    END IF;

    -- Judges cannot reopen a card (only organisers can transition reopened from false to true)
    IF NEW.reopened AND NOT OLD.reopened THEN
        RAISE EXCEPTION 'Only organisers can reopen submitted scorecards.';
    END IF;

    -- Reset reopened flag when reopened card is resubmitted by judge
    IF OLD.reopened AND NEW.status = 'submitted' THEN
        NEW.reopened := false;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scorecard_judge_lock ON scorecards;
CREATE TRIGGER trg_scorecard_judge_lock
    BEFORE UPDATE ON scorecards
    FOR EACH ROW
    EXECUTE FUNCTION check_judge_scorecard_update();

-- -----------------------------------------------------------------------------
-- 7. Durations Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Organiser manage durations"
    ON durations FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 8. Verified Voters & Votes Policies (Fraud Prevention: No direct anon insert)
-- -----------------------------------------------------------------------------
-- Verification tokens and votes are recorded strictly through security definer
-- RPCs (verify_and_cast_vote / cast_audience_vote) to enforce OTP and single-vote rules.
CREATE POLICY "Organiser read verified voters"
    ON verified_voters FOR SELECT
    TO authenticated
    USING (auth_is_organiser(event_id));

CREATE POLICY "Organiser read vote counts"
    ON votes FOR SELECT
    TO authenticated
    USING (auth_is_organiser(event_id));

CREATE POLICY "Organiser read verification requests"
    ON voter_verification_requests FOR SELECT
    TO authenticated
    USING (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 8b. Authoritative Aggregated Vote Counts (Restricted to Organisers)
-- -----------------------------------------------------------------------------
-- Provides aggregated contestant vote tallies in a single query, bypassing client
-- row-limit caps (e.g. 1000 rows) and preventing unannounced counts from leaking to anon/judges.
CREATE OR REPLACE FUNCTION get_event_vote_counts(p_event_id UUID)
RETURNS TABLE (
    contestant_id UUID,
    vote_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    IF NOT auth_is_organiser(p_event_id) THEN
        RAISE EXCEPTION 'Access denied: Vote counts are restricted to organisers.';
    END IF;

    RETURN QUERY
    SELECT v.contestant_id, COUNT(*)::BIGINT AS vote_count
    FROM votes v
    WHERE v.event_id = p_event_id
    GROUP BY v.contestant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_event_vote_counts(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 9. Results Snapshots Policies (Internal Staff Only - Strict Privacy Protection)
-- -----------------------------------------------------------------------------
-- Full snapshots (including internal scores, judge marks, vote totals, and 4th-16th ranks)
-- are accessible exclusively to authenticated staff and organisers.
CREATE POLICY "Organiser manage results snapshots"
    ON results_snapshots FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 10. Public Projection: Secure Top-Three Winners Function
-- -----------------------------------------------------------------------------
-- Exposes ONLY public identity and rank for 1st, 2nd, and 3rd place winners after publication.
-- Raw marks, judge subtotals, audience points, and lower placements are never exposed to anon.
CREATE OR REPLACE FUNCTION get_public_top_three(p_event_id UUID)
RETURNS TABLE (
    rank INT,
    contestant_id TEXT,
    full_name TEXT,
    district TEXT,
    performance_title TEXT,
    performance_type TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM results_snapshots
        WHERE event_id = p_event_id AND is_official = true AND published = true
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        (elem->>'rank')::int AS rank,
        (elem->'contestant'->>'id')::text AS contestant_id,
        (elem->'contestant'->>'name')::text AS full_name,
        (elem->'contestant'->>'district')::text AS district,
        (elem->'contestant'->>'title')::text AS performance_title,
        (elem->'contestant'->>'type')::text AS performance_type,
        (elem->'contestant'->>'avatarUrl')::text AS avatar_url
    FROM results_snapshots s,
         jsonb_array_elements(COALESCE(s.rows_data->'rows', s.rows_data)) elem
    WHERE s.event_id = p_event_id
      AND s.is_official = true
      AND s.published = true
      AND (elem->>'rank')::int <= 3
    ORDER BY (elem->>'rank')::int ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_top_three(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION request_voter_otp(UUID, TEXT, TEXT, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_and_cast_vote(UUID, UUID, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cast_audience_vote(UUID, UUID, TEXT, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 11. Audit Events Policies
-- -----------------------------------------------------------------------------
CREATE POLICY "Organiser manage audit log"
    ON audit_events FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

