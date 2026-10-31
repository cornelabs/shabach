-- ==============================================================================
-- SHABACH 2026 DATABASE SECURITY HARDENING & LEAST-PRIVILEGE REVISION
-- Migration: 20261031000001_security_hardening.sql
-- Description:
--   1. Revokes permissive client policies from 20261030000004_client_persistence_policies.sql.
--   2. Enforces least privilege on PostgreSQL tables:
--      - Public anon users can ONLY SELECT public events, event_settings, contestants,
--        rubric_versions, and published official results snapshots.
--      - Scorecards, durations, internal marks, private notes, and raw voter PII
--        are NEVER readable or modifiable by public anon users.
--      - Blind judging isolation: Judges can only access and update their own assigned
--        scorecards for the active event.
--      - Staff role escalation protection: Public sign-ups cannot grant themselves staff roles.
--      - Unauthenticated users cannot change scores, durations, voting windows, or snapshots.
--   3. Provides authoritative Security Definer RPCs for trusted operations:
--      - cast_audience_vote(p_event_id, p_contestant_id, p_voter_token, p_method)
--      - lock_competition_results(p_event_id)
--      - publish_competition_results(p_event_id)
--      - reopen_judge_scorecard(p_event_id, p_judge_id, p_contestant_id, p_reason)
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. DROP PERMISSIVE CLIENT POLICIES FROM PREVIOUS MIGRATION
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read scorecards" ON scorecards;
DROP POLICY IF EXISTS "Public insert scorecards" ON scorecards;
DROP POLICY IF EXISTS "Public update scorecards" ON scorecards;
DROP POLICY IF EXISTS "Public manage durations" ON durations;
DROP POLICY IF EXISTS "Public update contestants" ON contestants;
DROP POLICY IF EXISTS "Public update events" ON events;
DROP POLICY IF EXISTS "Public read results snapshots" ON results_snapshots;
DROP POLICY IF EXISTS "Public insert results snapshots" ON results_snapshots;

-- -----------------------------------------------------------------------------
-- 2. TABLE-LEVEL PERMISSION REVOCATIONS (LEAST PRIVILEGE)
-- -----------------------------------------------------------------------------
-- Revoke all permissions on sensitive tables from anon role
REVOKE ALL ON scorecards FROM anon;
REVOKE ALL ON durations FROM anon;
REVOKE ALL ON staff_roles FROM anon;
REVOKE ALL ON voter_verification_requests FROM anon;
REVOKE ALL ON verified_voters FROM anon;
REVOKE ALL ON votes FROM anon;
REVOKE ALL ON audit_events FROM anon;

-- Public tables: anon may ONLY select
REVOKE INSERT, UPDATE, DELETE ON events FROM anon;
REVOKE INSERT, UPDATE, DELETE ON event_settings FROM anon;
REVOKE INSERT, UPDATE, DELETE ON contestants FROM anon;
REVOKE INSERT, UPDATE, DELETE ON rubric_versions FROM anon;
REVOKE INSERT, UPDATE, DELETE ON results_snapshots FROM anon;

-- Ensure SELECT grants for public read tables
GRANT SELECT ON events TO anon, authenticated;
GRANT SELECT ON event_settings TO anon, authenticated;
GRANT SELECT ON contestants TO anon, authenticated;
GRANT SELECT ON rubric_versions TO anon, authenticated;
GRANT SELECT ON results_snapshots TO anon, authenticated;

-- Authenticated staff permissions (governed by RLS policies below)
GRANT SELECT, INSERT, UPDATE ON scorecards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON durations TO authenticated;
GRANT SELECT ON staff_roles TO authenticated;
GRANT SELECT ON voter_verification_requests TO authenticated;
GRANT SELECT ON verified_voters TO authenticated;
GRANT SELECT ON votes TO authenticated;
GRANT SELECT, INSERT ON audit_events TO authenticated;
GRANT UPDATE ON events TO authenticated;
GRANT ALL ON contestants TO authenticated;
GRANT ALL ON event_settings TO authenticated;
GRANT ALL ON rubric_versions TO authenticated;
GRANT ALL ON results_snapshots TO authenticated;

-- -----------------------------------------------------------------------------
-- 3. REINFORCE SECURITY HELPER FUNCTIONS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth_is_organiser(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM staff_roles
        WHERE event_id = p_event_id
          AND user_id = auth.uid()
          AND active = true
          AND role_type IN ('organiser', 'organizer', 'score_desk')
    );
$$;

CREATE OR REPLACE FUNCTION auth_is_assigned_judge(p_event_id UUID, p_judge_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM staff_roles
        WHERE event_id = p_event_id
          AND user_id = auth.uid()
          AND active = true
          AND (
            role_type = p_judge_id
            OR role_type = replace(p_judge_id, 'judge', 'judge_')
            OR replace(role_type, '_', '') = replace(p_judge_id, '_', '')
          )
    );
$$;

-- -----------------------------------------------------------------------------
-- 4. STAFF ROLES ESCALATION PROTECTION
-- -----------------------------------------------------------------------------
-- Public sign-up cannot create or escalate a staff role.
DROP POLICY IF EXISTS "Staff read own role" ON staff_roles;
CREATE POLICY "Staff read own role"
    ON staff_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Organiser read and manage staff roles" ON staff_roles;
CREATE POLICY "Organiser read and manage staff roles"
    ON staff_roles FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

CREATE OR REPLACE FUNCTION protect_staff_roles_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Allow service role (when auth.uid() is null in administrative context)
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Authenticated callers must be an active organiser for the event
    IF NOT auth_is_organiser(NEW.event_id) THEN
        RAISE EXCEPTION 'Access denied: Cannot assign staff roles without organiser privileges.';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_staff_roles ON staff_roles;
CREATE TRIGGER trg_protect_staff_roles
    BEFORE INSERT OR UPDATE ON staff_roles
    FOR EACH ROW
    EXECUTE FUNCTION protect_staff_roles_escalation();

-- -----------------------------------------------------------------------------
-- 5. BLIND JUDGING & SCORECARD ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
-- Scorecards are strictly private:
-- - Anon CANNOT read or write any scorecard.
-- - Judges can ONLY read and write their own assigned scorecard for the active event.
-- - Organisers have administrative access across all cards.

DROP POLICY IF EXISTS "Judge read own scorecards" ON scorecards;
CREATE POLICY "Judge read own scorecards"
    ON scorecards FOR SELECT
    TO authenticated
    USING (auth_is_assigned_judge(event_id, judge_id));

DROP POLICY IF EXISTS "Judge insert own scorecards" ON scorecards;
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

DROP POLICY IF EXISTS "Judge update own scorecards" ON scorecards;
CREATE POLICY "Judge update own scorecards"
    ON scorecards FOR UPDATE
    TO authenticated
    USING (
        auth_is_assigned_judge(event_id, judge_id)
        AND (status IN ('draft', 'not_started') OR reopened = true)
        AND NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = scorecards.event_id
              AND e.lifecycle_status IN ('locked', 'published', 'archived')
        )
    )
    WITH CHECK (
        auth_is_assigned_judge(event_id, judge_id)
        AND NOT EXISTS (
            SELECT 1 FROM events e
            WHERE e.id = scorecards.event_id
              AND e.lifecycle_status IN ('locked', 'published', 'archived')
        )
    );

DROP POLICY IF EXISTS "Organiser manage all scorecards" ON scorecards;
CREATE POLICY "Organiser manage all scorecards"
    ON scorecards FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 6. DURATIONS ROW LEVEL SECURITY (STAFF ONLY)
-- -----------------------------------------------------------------------------
-- Stopwatch records and verification are restricted to score desk & organisers.
DROP POLICY IF EXISTS "Organiser manage durations" ON durations;
CREATE POLICY "Organiser manage durations"
    ON durations FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 7. RESULTS SNAPSHOTS LEAST PRIVILEGE
-- -----------------------------------------------------------------------------
-- Public can ONLY read official, published snapshots.
-- Unauthenticated users cannot read unreleased drafts or mutate snapshots.
DROP POLICY IF EXISTS "Public read official published snapshots" ON results_snapshots;
CREATE POLICY "Public read official published snapshots"
    ON results_snapshots FOR SELECT
    TO anon, authenticated
    USING (is_official = true AND published = true);

DROP POLICY IF EXISTS "Organiser manage results snapshots" ON results_snapshots;
CREATE POLICY "Organiser manage results snapshots"
    ON results_snapshots FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 8. CONTESTANTS & EVENTS RESTRICTIONS
-- -----------------------------------------------------------------------------
-- Public can view contestants and event information; only organisers can edit.
DROP POLICY IF EXISTS "Public read contestants" ON contestants;
CREATE POLICY "Public read contestants"
    ON contestants FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Organiser manage contestants" ON contestants;
CREATE POLICY "Organiser manage contestants"
    ON contestants FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

DROP POLICY IF EXISTS "Public read events" ON events;
CREATE POLICY "Public read events"
    ON events FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Organiser manage events" ON events;
CREATE POLICY "Organiser manage events"
    ON events FOR ALL
    TO authenticated
    USING (auth_is_organiser(id))
    WITH CHECK (auth_is_organiser(id));

-- -----------------------------------------------------------------------------
-- 9. EVENT SETTINGS & RUBRIC VERSIONS
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read event settings" ON event_settings;
CREATE POLICY "Public read event settings"
    ON event_settings FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Organiser manage event settings" ON event_settings;
CREATE POLICY "Organiser manage event settings"
    ON event_settings FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

DROP POLICY IF EXISTS "Public read rubrics" ON rubric_versions;
CREATE POLICY "Public read rubrics"
    ON rubric_versions FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Organiser manage rubrics" ON rubric_versions;
CREATE POLICY "Organiser manage rubrics"
    ON rubric_versions FOR ALL
    TO authenticated
    USING (auth_is_organiser(event_id))
    WITH CHECK (auth_is_organiser(event_id));

-- -----------------------------------------------------------------------------
-- 10. RESTRICT AUTHORITATIVE VOTE TALLIES TO ORGANISERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_event_vote_counts(p_event_id UUID)
RETURNS TABLE (
    contestant_id UUID,
    vote_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    IF NOT auth_is_organiser(p_event_id) THEN
        RAISE EXCEPTION 'Access denied: Vote counts are restricted to organisers.';
    END IF;

    RETURN QUERY
    SELECT c.id AS contestant_id, COUNT(v.id)::BIGINT AS vote_count
    FROM contestants c
    LEFT JOIN votes v ON v.contestant_id = c.id AND v.event_id = p_event_id
    WHERE c.event_id = p_event_id
    GROUP BY c.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION get_event_vote_counts(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION get_event_vote_counts(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 11. TRUSTED SECURITY DEFINER RPC: CAST AUDIENCE VOTE
-- -----------------------------------------------------------------------------
-- Enforces:
--   - Server-validated voting status (must be 'open')
--   - Contestant existence for the event
--   - Genuine verified voter identity (no arbitrary method bypasses)
--   - Atomic single-vote acceptance under concurrent requests
CREATE OR REPLACE FUNCTION cast_audience_vote(
    p_event_id UUID,
    p_contestant_id UUID,
    p_voter_token TEXT DEFAULT NULL,
    p_method TEXT DEFAULT 'otp_email',
    p_voter_hash TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_token TEXT;
    v_voting_status TEXT;
    v_voter_id UUID;
    v_vote_id UUID;
    v_auth_confirmed TIMESTAMPTZ;
BEGIN
    v_token := COALESCE(p_voter_token, p_voter_hash);
    IF v_token IS NULL OR trim(v_token) = '' THEN
        -- If token omitted, check if caller is authenticated with Supabase Auth
        IF auth.uid() IS NOT NULL THEN
            v_token := auth.uid()::text;
        ELSE
            RETURN jsonb_build_object('ok', false, 'reason', 'missing_voter_token');
        END IF;
    END IF;

    -- 1. Verify voting window is open
    SELECT voting_status INTO v_voting_status FROM events WHERE id = p_event_id;
    IF v_voting_status IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'event_not_found');
    END IF;
    IF v_voting_status != 'open' THEN
        RETURN jsonb_build_object('ok', false, 'reason', v_voting_status);
    END IF;

    -- 2. Verify contestant exists
    IF NOT EXISTS (SELECT 1 FROM contestants WHERE id = p_contestant_id AND event_id = p_event_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'contestant_not_found');
    END IF;

    -- 3. Verify voter record exists in verified_voters
    SELECT id INTO v_voter_id FROM verified_voters
    WHERE event_id = p_event_id AND voter_token_hash = v_token;

    -- If not found, check if caller is an authenticated user with a confirmed email
    IF v_voter_id IS NULL AND auth.uid() IS NOT NULL THEN
        SELECT email_confirmed_at INTO v_auth_confirmed
        FROM auth.users
        WHERE id = auth.uid();

        IF v_auth_confirmed IS NOT NULL THEN
            INSERT INTO verified_voters (event_id, voter_token_hash, verification_method)
            VALUES (p_event_id, v_token, 'otp_email')
            ON CONFLICT (event_id, voter_token_hash) DO NOTHING;

            SELECT id INTO v_voter_id FROM verified_voters
            WHERE event_id = p_event_id AND voter_token_hash = v_token;
        END IF;
    END IF;

    -- If still not verified, reject vote. No caller-selected bypass is permitted.
    IF v_voter_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'unverified_voter');
    END IF;

    -- 4. Check for existing vote
    IF EXISTS (SELECT 1 FROM votes WHERE event_id = p_event_id AND voter_id = v_voter_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'already_voted');
    END IF;

    -- 5. Record single vote atomically (unique constraint on (event_id, voter_id) prevents race conditions)
    BEGIN
        INSERT INTO votes (event_id, voter_id, contestant_id)
        VALUES (p_event_id, v_voter_id, p_contestant_id)
        RETURNING id INTO v_vote_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'already_voted');
    END;

    RETURN jsonb_build_object('ok', true, 'vote_id', v_vote_id);
END;
$$;

GRANT EXECUTE ON FUNCTION cast_audience_vote(UUID, UUID, TEXT, TEXT, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 12. TRUSTED SECURITY DEFINER RPC: VERIFY VOTER EMAIL OTP
-- -----------------------------------------------------------------------------
-- Verifies a submitted OTP hash against active requests and registers the voter token.
CREATE OR REPLACE FUNCTION verify_voter_email_otp(
    p_event_id UUID,
    p_email_hash TEXT,
    p_otp_candidate_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_req RECORD;
    v_voter_token TEXT;
BEGIN
    SELECT * INTO v_req
    FROM voter_verification_requests
    WHERE event_id = p_event_id
      AND email_or_phone_hash = p_email_hash
      AND expires_at > timezone('utc'::text, now())
      AND verified = false
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_req IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'no_verification_found');
    END IF;

    IF v_req.attempts >= 5 THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'max_attempts_exceeded');
    END IF;

    IF v_req.otp_hash != p_otp_candidate_hash THEN
        UPDATE voter_verification_requests
        SET attempts = attempts + 1
        WHERE id = v_req.id;
        RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code', 'attempts_remaining', 5 - (v_req.attempts + 1));
    END IF;

    -- Invalidate request to prevent replay
    UPDATE voter_verification_requests
    SET verified = true, attempts = attempts + 1
    WHERE id = v_req.id;

    v_voter_token := 'voter_' || encode(sha256((p_email_hash || ':' || now()::text)::bytea), 'hex');

    INSERT INTO verified_voters (event_id, voter_token_hash, verification_method)
    VALUES (p_event_id, v_voter_token, 'otp_email')
    ON CONFLICT (event_id, voter_token_hash) DO NOTHING;

    RETURN jsonb_build_object('ok', true, 'voter_token', v_voter_token);
END;
$$;

GRANT EXECUTE ON FUNCTION verify_voter_email_otp(UUID, TEXT, TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 13. TRUSTED SECURITY DEFINER RPC: LOCK COMPETITION RESULTS
-- -----------------------------------------------------------------------------
-- Exclusively callable by authenticated organisers. Locks results and closes voting.
CREATE OR REPLACE FUNCTION lock_competition_results(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lifecycle TEXT;
BEGIN
    IF NOT auth_is_organiser(p_event_id) THEN
        RAISE EXCEPTION 'Access denied: Only organisers can lock competition results.';
    END IF;

    SELECT lifecycle_status INTO v_lifecycle FROM events WHERE id = p_event_id;
    IF v_lifecycle IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'event_not_found');
    END IF;

    IF v_lifecycle IN ('locked', 'published', 'archived') THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'already_locked', 'status', v_lifecycle);
    END IF;

    UPDATE events
    SET lifecycle_status = 'locked',
        voting_status = 'closed',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_event_id;

    INSERT INTO audit_events (event_id, action, actor_id, actor_role, details, metadata)
    VALUES (
        p_event_id,
        'results_locked',
        auth.uid(),
        'organiser',
        'Official competition results locked and voting window permanently closed.',
        jsonb_build_object('locked_at', timezone('utc'::text, now()))
    );

    RETURN jsonb_build_object('ok', true, 'lifecycle_status', 'locked');
END;
$$;

GRANT EXECUTE ON FUNCTION lock_competition_results(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 14. TRUSTED SECURITY DEFINER RPC: PUBLISH COMPETITION RESULTS
-- -----------------------------------------------------------------------------
-- Exclusively callable by authenticated organisers. Publishes official results.
CREATE OR REPLACE FUNCTION publish_competition_results(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lifecycle TEXT;
    v_snapshot_exists BOOLEAN;
BEGIN
    IF NOT auth_is_organiser(p_event_id) THEN
        RAISE EXCEPTION 'Access denied: Only organisers can publish competition results.';
    END IF;

    SELECT lifecycle_status INTO v_lifecycle FROM events WHERE id = p_event_id;
    IF v_lifecycle IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'event_not_found');
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM results_snapshots
        WHERE event_id = p_event_id AND is_official = true
    ) INTO v_snapshot_exists;

    IF NOT v_snapshot_exists THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'missing_official_snapshot');
    END IF;

    UPDATE results_snapshots
    SET published = true,
        published_at = timezone('utc'::text, now()),
        published_by = auth.uid()
    WHERE event_id = p_event_id AND is_official = true;

    UPDATE events
    SET lifecycle_status = 'published',
        voting_status = 'closed',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_event_id;

    INSERT INTO audit_events (event_id, action, actor_id, actor_role, details, metadata)
    VALUES (
        p_event_id,
        'results_published',
        auth.uid(),
        'organiser',
        'Official results published for public top-three presentation.',
        jsonb_build_object('published_at', timezone('utc'::text, now()))
    );

    RETURN jsonb_build_object('ok', true, 'lifecycle_status', 'published');
END;
$$;

GRANT EXECUTE ON FUNCTION publish_competition_results(UUID) TO authenticated;

-- -----------------------------------------------------------------------------
-- 15. TRUSTED SECURITY DEFINER RPC: REOPEN JUDGE SCORECARD
-- -----------------------------------------------------------------------------
-- Exclusively callable by authenticated organisers. Reopens a submitted card with recorded reason.
CREATE OR REPLACE FUNCTION reopen_judge_scorecard(
    p_event_id UUID,
    p_judge_id TEXT,
    p_contestant_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_lifecycle TEXT;
BEGIN
    IF NOT auth_is_organiser(p_event_id) THEN
        RAISE EXCEPTION 'Access denied: Only organisers can reopen judge scorecards.';
    END IF;

    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'A documented reason is mandatory to reopen a scorecard.';
    END IF;

    SELECT lifecycle_status INTO v_lifecycle FROM events WHERE id = p_event_id;
    IF v_lifecycle IN ('locked', 'published', 'archived') THEN
        RAISE EXCEPTION 'Cannot reopen scorecard: competition results are already locked or published.';
    END IF;

    UPDATE scorecards
    SET reopened = true,
        reopened_reason = trim(p_reason),
        reopened_at = timezone('utc'::text, now()),
        status = 'draft',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = p_event_id
      AND judge_id = p_judge_id
      AND contestant_id = p_contestant_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'scorecard_not_found');
    END IF;

    INSERT INTO audit_events (event_id, action, actor_id, actor_role, details, metadata)
    VALUES (
        p_event_id,
        'scorecard_reopened',
        auth.uid(),
        'organiser',
        format('Scorecard for judge %s on contestant %s reopened: %s', p_judge_id, p_contestant_id, p_reason),
        jsonb_build_object('judge_id', p_judge_id, 'contestant_id', p_contestant_id, 'reason', p_reason)
    );

    RETURN jsonb_build_object('ok', true, 'message', 'Scorecard successfully reopened for judge editing.');
END;
$$;

GRANT EXECUTE ON FUNCTION reopen_judge_scorecard(UUID, TEXT, UUID, TEXT) TO authenticated;
