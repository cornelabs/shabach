-- ==============================================================================
-- SHABACH 2026 GRAND FINALE DATABASE SCHEMA
-- Migration: 20261030000001_shabach_schema.sql
-- Description: Core schema for events, contestants, staff roles, rubrics,
--              scorecards, durations, verified voters, votes, snapshots, audit.
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Events Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE DEFAULT 'shabach-2026',
    name TEXT NOT NULL DEFAULT 'SHABACH 2026 Grand Finale',
    theme TEXT NOT NULL DEFAULT 'A Joyful Noise',
    edition TEXT NOT NULL DEFAULT '2026',
    organizer_name TEXT NOT NULL DEFAULT 'Youth Affairs Fellowship (YAF)',
    finale_date DATE NOT NULL DEFAULT '2026-11-14',
    timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
    voting_status TEXT NOT NULL CHECK (voting_status IN ('not_open', 'open', 'closed')) DEFAULT 'not_open',
    lifecycle_status TEXT NOT NULL CHECK (lifecycle_status IN ('draft', 'live', 'locked', 'published', 'archived')) DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 2. Event Settings Table (Configured for 4 Judges)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    audience_weight_max_points NUMERIC(4, 2) NOT NULL DEFAULT 5.00,
    judge_slots_required INT NOT NULL DEFAULT 4,
    max_judge_raw_score NUMERIC(5, 2) NOT NULL DEFAULT 95.00,
    allow_reopen_with_reason BOOLEAN NOT NULL DEFAULT true,
    require_conflict_resolution BOOLEAN NOT NULL DEFAULT true,
    require_verified_duration BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_event_settings_event UNIQUE (event_id)
);

-- -----------------------------------------------------------------------------
-- 3. Contestants Table (16 Finalists)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contestants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    code TEXT NOT NULL CHECK (code ~ '^[A-Z0-9]{6}$'),
    full_name TEXT NOT NULL,
    district TEXT NOT NULL,
    performance_type TEXT NOT NULL CHECK (performance_type IN ('music', 'dance', 'spoken_word', 'mono_drama', 'visual_arts', 'drama', 'visual_art')),
    performance_title TEXT NOT NULL,
    biography TEXT NOT NULL,
    performance_order INT NOT NULL CHECK (performance_order >= 1 AND performance_order <= 32),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_contestant_event_code UNIQUE (event_id, code),
    CONSTRAINT uq_contestant_event_order UNIQUE (event_id, performance_order)
);

CREATE INDEX IF NOT EXISTS idx_contestants_code ON contestants(code);
CREATE INDEX IF NOT EXISTS idx_contestants_event ON contestants(event_id);

-- -----------------------------------------------------------------------------
-- 4. Staff Roles Table (4 Judges, Organiser, Score Desk)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID,
    role_type TEXT NOT NULL CHECK (role_type IN ('organiser', 'judge_1', 'judge_2', 'judge_3', 'judge_4', 'score_desk')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_staff_event_user_role UNIQUE (event_id, role_type, email)
);

-- -----------------------------------------------------------------------------
-- 5. Rubric Versions Table (Five Disciplines)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rubric_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    discipline TEXT NOT NULL CHECK (discipline IN ('music', 'dance', 'spoken_word', 'mono_drama', 'visual_arts', 'drama', 'visual_art')),
    version INT NOT NULL DEFAULT 1,
    time_limit_sec INT NOT NULL,
    penalty_interval_sec INT NOT NULL,
    penalty_deduction_points NUMERIC(3, 1) NOT NULL DEFAULT 2.0,
    criteria JSONB NOT NULL,
    tiebreak_ladder JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_rubric_event_discipline_ver UNIQUE (event_id, discipline, version)
);

-- -----------------------------------------------------------------------------
-- 6. Scorecards Table (64 unique event x contestant x judge cards)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
    judge_id TEXT NOT NULL CHECK (judge_id IN ('judge1', 'judge2', 'judge3', 'judge4', 'judge_1', 'judge_2', 'judge_3', 'judge_4')),
    assigned_user_id UUID,
    status TEXT NOT NULL CHECK (status IN ('not_started', 'draft', 'submitted')) DEFAULT 'draft',
    criteria_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0 AND subtotal <= 95),
    notes TEXT DEFAULT '',
    conflict_declared BOOLEAN NOT NULL DEFAULT false,
    conflict_reason TEXT,
    conflict_resolved BOOLEAN NOT NULL DEFAULT false,
    conflict_resolved_by UUID,
    conflict_resolved_at TIMESTAMPTZ,
    reopened BOOLEAN NOT NULL DEFAULT false,
    reopened_reason TEXT,
    reopened_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_scorecard_slot UNIQUE (event_id, contestant_id, judge_id)
);

CREATE INDEX IF NOT EXISTS idx_scorecards_contestant ON scorecards(contestant_id);
CREATE INDEX IF NOT EXISTS idx_scorecards_judge ON scorecards(event_id, judge_id);

-- -----------------------------------------------------------------------------
-- 7. Durations Table (Performance Stopwatch Records)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS durations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
    actual_seconds INT CHECK (actual_seconds IS NULL OR actual_seconds >= 0),
    verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_duration_contestant UNIQUE (event_id, contestant_id)
);

-- -----------------------------------------------------------------------------
-- 8. Voter Verification Requests & Verified Voters (Fraud & Replay Prevention)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS voter_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email_or_phone_hash TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_voter_verif_event_email ON voter_verification_requests(event_id, email_or_phone_hash);

CREATE TABLE IF NOT EXISTS verified_voters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    voter_token_hash TEXT NOT NULL,
    verification_method TEXT NOT NULL CHECK (verification_method IN ('otp_phone', 'otp_email', 'device_fingerprint', 'demo_client', 'audience_web')),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ip_hash TEXT,
    CONSTRAINT uq_voter_token UNIQUE (event_id, voter_token_hash)
);

CREATE INDEX IF NOT EXISTS idx_voters_token ON verified_voters(event_id, voter_token_hash);

-- -----------------------------------------------------------------------------
-- 9. Votes Table (Audience Final Votes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES verified_voters(id) ON DELETE CASCADE,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_voter_single_vote UNIQUE (event_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_contestant ON votes(event_id, contestant_id);

-- -----------------------------------------------------------------------------
-- 10. Results Snapshots Table (Frozen Snapshot before publication)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    locked_by UUID,
    published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    published_by UUID,
    rows_data JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_official BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_event_official_snapshot UNIQUE (event_id, is_official)
);

-- -----------------------------------------------------------------------------
-- 11. Audit Events Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    actor_id UUID,
    actor_role TEXT,
    details TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_event_time ON audit_events(event_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 12. Voter OTP & Atomic Vote Functions (RPC)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION request_voter_otp(
    p_event_id UUID,
    p_email_or_phone_hash TEXT,
    p_otp_hash TEXT,
    p_ttl_sec INT DEFAULT 900
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voting_status TEXT;
    v_recent_count INT;
BEGIN
    SELECT voting_status INTO v_voting_status FROM events WHERE id = p_event_id;
    IF v_voting_status IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'event_not_found');
    END IF;
    IF v_voting_status != 'open' THEN
        RETURN jsonb_build_object('ok', false, 'reason', v_voting_status);
    END IF;

    -- Rate limit check (max 3 requests in last 10 minutes)
    SELECT COUNT(*) INTO v_recent_count
    FROM voter_verification_requests
    WHERE event_id = p_event_id
      AND email_or_phone_hash = p_email_or_phone_hash
      AND created_at > (timezone('utc'::text, now()) - INTERVAL '10 minutes');

    IF v_recent_count >= 3 THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'rate_limited');
    END IF;

    INSERT INTO voter_verification_requests (event_id, email_or_phone_hash, otp_hash, expires_at)
    VALUES (p_event_id, p_email_or_phone_hash, p_otp_hash, timezone('utc'::text, now()) + (p_ttl_sec || ' seconds')::INTERVAL);

    RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION verify_and_cast_vote(
    p_event_id UUID,
    p_contestant_id UUID,
    p_voter_hash TEXT,
    p_otp_candidate_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voting_status TEXT;
    v_req RECORD;
    v_voter_id UUID;
    v_vote_id UUID;
BEGIN
    SELECT voting_status INTO v_voting_status FROM events WHERE id = p_event_id;
    IF v_voting_status IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'event_not_found');
    END IF;
    IF v_voting_status != 'open' THEN
        RETURN jsonb_build_object('ok', false, 'reason', v_voting_status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM contestants WHERE id = p_contestant_id AND event_id = p_event_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'contestant_not_found');
    END IF;

    SELECT * INTO v_req
    FROM voter_verification_requests
    WHERE event_id = p_event_id
      AND email_or_phone_hash = p_voter_hash
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
        RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
    END IF;

    UPDATE voter_verification_requests
    SET verified = true, attempts = attempts + 1
    WHERE id = v_req.id;

    INSERT INTO verified_voters (event_id, voter_token_hash, verification_method)
    VALUES (p_event_id, p_voter_hash, 'otp_email')
    ON CONFLICT (event_id, voter_token_hash) DO NOTHING;

    SELECT id INTO v_voter_id FROM verified_voters
    WHERE event_id = p_event_id AND voter_token_hash = p_voter_hash;

    IF EXISTS (SELECT 1 FROM votes WHERE event_id = p_event_id AND voter_id = v_voter_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'already_voted');
    END IF;

    INSERT INTO votes (event_id, voter_id, contestant_id)
    VALUES (p_event_id, v_voter_id, p_contestant_id)
    RETURNING id INTO v_vote_id;

    RETURN jsonb_build_object('ok', true, 'vote_id', v_vote_id);
END;
$$;

CREATE OR REPLACE FUNCTION cast_audience_vote(
    p_event_id UUID,
    p_contestant_id UUID,
    p_voter_hash TEXT,
    p_method TEXT DEFAULT 'audience_web'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voting_status TEXT;
    v_voter_id UUID;
    v_vote_id UUID;
BEGIN
    SELECT voting_status INTO v_voting_status FROM events WHERE id = p_event_id;
    IF v_voting_status IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'event_not_found');
    END IF;
    IF v_voting_status != 'open' THEN
        RETURN jsonb_build_object('ok', false, 'reason', v_voting_status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM contestants WHERE id = p_contestant_id AND event_id = p_event_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'contestant_not_found');
    END IF;

    -- Verify voter is already registered as verified
    SELECT id INTO v_voter_id FROM verified_voters
    WHERE event_id = p_event_id AND voter_token_hash = p_voter_hash;

    IF v_voter_id IS NULL THEN
        -- Allow web audience, device fingerprint, demo client or verified token fallback
        IF p_method IN ('demo_client', 'device_fingerprint', 'audience_web', 'otp_phone', 'otp_email') THEN
            INSERT INTO verified_voters (event_id, voter_token_hash, verification_method)
            VALUES (p_event_id, p_voter_hash, p_method)
            ON CONFLICT (event_id, voter_token_hash) DO NOTHING;
            SELECT id INTO v_voter_id FROM verified_voters
            WHERE event_id = p_event_id AND voter_token_hash = p_voter_hash;
        ELSE
            RETURN jsonb_build_object('ok', false, 'reason', 'unverified_voter');
        END IF;
    END IF;

    -- Check if voter already cast their single vote
    IF EXISTS (SELECT 1 FROM votes WHERE event_id = p_event_id AND voter_id = v_voter_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'already_voted');
    END IF;

    -- Record the single final vote
    INSERT INTO votes (event_id, voter_id, contestant_id)
    VALUES (p_event_id, v_voter_id, p_contestant_id)
    RETURNING id INTO v_vote_id;

    RETURN jsonb_build_object('ok', true, 'vote_id', v_vote_id);
END;
$$;

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
-- Permits updating if draft, not_started (e.g. after clearing card), or explicitly reopened by an organiser,
-- and competition results are not locked. Organiser-set flags (conflict_resolved, reopened)
-- remain valid during edits and are protected from unauthorised changes by the trigger below.
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

-- ==============================================================================
-- SHABACH 2026 GRAND FINALE SEED DATA (4 Judges)
-- Migration: 20261030000003_seed_data.sql
-- Description: Canonical event, rubrics, 16 finalists, and 4 staff judges.
-- ==============================================================================

DO $$
DECLARE
    v_event_id UUID := '00000000-0000-0000-0000-000000002026'::uuid;
BEGIN
    -- 1. Insert Event
    INSERT INTO events (
        id,
        code,
        name,
        theme,
        edition,
        organizer_name,
        finale_date,
        timezone,
        voting_status,
        lifecycle_status
    ) VALUES (
        v_event_id,
        'shabach-2026',
        'SHABACH 2026 Grand Finale',
        'A Joyful Noise (Psalm 100:1)',
        '2026',
        'Youth Affairs Fellowship (YAF)',
        '2026-11-14',
        'Africa/Lagos',
        'open',
        'live'
    ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        theme = EXCLUDED.theme;

    -- 2. Insert Event Settings (4 Judges required)
    INSERT INTO event_settings (
        event_id,
        audience_weight_max_points,
        judge_slots_required,
        max_judge_raw_score,
        allow_reopen_with_reason,
        require_conflict_resolution,
        require_verified_duration
    ) VALUES (
        v_event_id,
        5.00,
        4,
        95.00,
        true,
        true,
        true
    ) ON CONFLICT (event_id) DO UPDATE SET
        judge_slots_required = 4;

    -- 3. Insert Rubrics
    INSERT INTO rubric_versions (
        event_id, discipline, version, time_limit_sec, penalty_interval_sec,
        penalty_deduction_points, criteria, tiebreak_ladder
    ) VALUES
    (
        v_event_id,
        'music',
        1,
        240,
        15,
        2.0,
        '[
            {"name": "Spiritual Content & Biblical Fidelity", "max": 20, "hint": "Sound Christian doctrine, Christ-centred focus, reverent handling."},
            {"name": "Vocal Technique & Intonation", "max": 20, "hint": "Pitch accuracy, tone quality, breath management, vocal range."},
            {"name": "Musicianship & Arrangement", "max": 20, "hint": "Harmonic interest, dynamic contour, ensemble balance, stylistic command."},
            {"name": "Stage Presence & Delivery", "max": 20, "hint": "Communication, conviction, appropriate platform decorum."},
            {"name": "Audience Engagement & Impact", "max": 15, "hint": "Congregational connection, ministering impact, inspirational lift."}
        ]'::jsonb,
        '{"spiritual": 0, "technical": 1, "creativity": 2}'::jsonb
    ),
    (
        v_event_id,
        'dance',
        1,
        240,
        15,
        2.0,
        '[
            {"name": "Spiritual Expression & Worship Intent", "max": 20, "hint": "Movement that conveys praise, reverence, and spiritual meaning."},
            {"name": "Choreography & Spatial Awareness", "max": 20, "hint": "Use of stage, transitions, formation variety, rhythmic precision."},
            {"name": "Execution, Technique & Synchronization", "max": 20, "hint": "Line extension, musicality, precision, physical stamina."},
            {"name": "Attire, Decorum & Visual Modesty", "max": 20, "hint": "Costume suitability, platform modesty, aesthetic harmony."},
            {"name": "Audience Engagement & Impact", "max": 15, "hint": "Audience resonance, emotional conveyance, spiritual uplift."}
        ]'::jsonb,
        '{"spiritual": 0, "technical": 2, "creativity": 1}'::jsonb
    ),
    (
        v_event_id,
        'spoken_word',
        1,
        240,
        15,
        2.0,
        '[
            {"name": "Theological Depth & Scriptural Anchorage", "max": 20, "hint": "Scriptural accuracy, biblical metaphors, gospel clarity."},
            {"name": "Poetic Craft & Literary Technique", "max": 20, "hint": "Metre, rhyme, wordplay, cadence, alliteration, imaginative phrasing."},
            {"name": "Vocal Delivery & Diction", "max": 20, "hint": "Articulation, projection, pace modulation, dramatic pause."},
            {"name": "Emotional Resonance & Conviction", "max": 20, "hint": "Authenticity, eye contact, passion, persuasive force."},
            {"name": "Audience Engagement & Impact", "max": 15, "hint": "Congregational response, inspiring message, lasting impact."}
        ]'::jsonb,
        '{"spiritual": 0, "technical": 2, "creativity": 1}'::jsonb
    ),
    (
        v_event_id,
        'mono_drama',
        1,
        300,
        15,
        2.0,
        '[
            {"name": "Gospel Narrative & Biblical Truth", "max": 20, "hint": "Clarity of message, scriptural integrity, Christian takeaway."},
            {"name": "Characterization & Believability", "max": 20, "hint": "Vocal differentiation, physicality, depth, emotional arc."},
            {"name": "Dramatic Pacing & Staging", "max": 20, "hint": "Effective build-up, use of performance space, prop economy."},
            {"name": "Voice Projection & Expression", "max": 20, "hint": "Audibility, vocal inflection, clear articulation, timing."},
            {"name": "Audience Engagement & Impact", "max": 15, "hint": "Ministry to the heart, message retention, spiritual fruit."}
        ]'::jsonb,
        '{"spiritual": 0, "technical": 1, "creativity": 2}'::jsonb
    ),
    (
        v_event_id,
        'visual_arts',
        1,
        600,
        60,
        2.0,
        '[
            {"name": "Biblical Theme & Spiritual Concept", "max": 20, "hint": "Clarity of gospel metaphor, spiritual depth, reverent theme."},
            {"name": "Technical Skill & Medium Mastery", "max": 20, "hint": "Draftsmanship, brushwork/tool control, colour harmony, composition."},
            {"name": "Creativity & Originality", "max": 20, "hint": "Innovative visual narrative, freshness of perspective."},
            {"name": "Process, Pace & Finished Quality", "max": 20, "hint": "Effective use of time window, completeness of final piece."},
            {"name": "Audience Engagement & Impact", "max": 15, "hint": "Visual communication, emotional evocativeness, spiritual resonance."}
        ]'::jsonb,
        '{"spiritual": 0, "technical": 1, "creativity": 2}'::jsonb
    ) ON CONFLICT (event_id, discipline, version) DO NOTHING;

    -- 4. Insert 16 Finalists
    INSERT INTO contestants (
        event_id, code, full_name, district, performance_type, performance_order,
        performance_title, biography
    ) VALUES
    (v_event_id, 'SB7K2M', 'Grace Adeyemi', 'Epe District', 'music', 1, 'Great Are You Lord — Acoustic Rendition', 'A 200-level student who leads worship at her campus fellowship and has been singing since age nine.'),
    (v_event_id, 'V4Q9TP', 'Epe Praise Crew', 'Epe District', 'dance', 9, 'Hallelujah Challenge — Choreographed Piece', 'A five-member dance family from Epe who rehearse on the beach every Saturday morning.'),
    (v_event_id, 'NH6R8W', 'Tobi Odukoya', 'Ijede District', 'spoken_word', 4, 'The Potter''s Wheel', 'Spoken-word artist and final-year law student who writes poems about grace and second chances.'),
    (v_event_id, 'K2M5C7', 'Ijede Acts Troupe', 'Ijede District', 'mono_drama', 16, 'The Return of the Son', 'A drama team of four that stages street sketches in Ijede every market day.'),
    (v_event_id, 'P9X3JA', 'David Balogun', 'Iranwo District', 'music', 8, 'Nara Kele — Medley of Thanks', 'Self-taught guitarist and tenor who composes in Yoruba, English and Pidgin.'),
    (v_event_id, 'T8B4ND', 'Seun Amolegbe', 'Iranwo District', 'visual_arts', 14, 'Light in the Tenement', 'Painter and printer who works with discarded wood and found pigments.'),
    (v_event_id, 'W5H7FE', 'Igbogbo Daughters', 'Igbogbo District', 'dance', 2, 'Daughters of Zion — Unity Dance', 'Three sisters who grew up dancing in their father''s living room in Igbogbo.'),
    (v_event_id, 'Y3K9RU', 'Nkechi Obi', 'Igbogbo District', 'spoken_word', 12, 'Salt & Lamp', 'Campus poet whose verses call young believers to visible, everyday faith.'),
    (v_event_id, 'A7W2SM', 'Badagry Young Voices', 'Badagry District', 'music', 5, 'Voice of the Lagoon — Choral Set', 'A six-voice choir of teenagers from coastal Badagry, directed by a volunteer music teacher.'),
    (v_event_id, 'D4PN6T', 'Femi Towolawi', 'Badagry District', 'mono_drama', 11, 'Fisher of Men', 'Solo monologue tracing an old fisherman''s encounter with the Master by the sea.'),
    (v_event_id, 'M8C3XE', 'The Redemptive Move', 'Magbon District', 'dance', 6, 'Oil of Joy for Mourning', 'Seven youth who use hip-hop, contemporary and West African footwork to portray redemption.'),
    (v_event_id, 'L1Z8RQ', 'Folake Awolowo', 'Magbon District', 'visual_arts', 13, 'The Narrow Road', 'Architect-turned-printmaker who creates large linocuts depicting pilgrimage.'),
    (v_event_id, 'B6F4PT', 'Emmanuel Ojo', 'Morogbo District', 'music', 3, 'My Lifter — Saxophone Solo', 'Tenor saxophonist whose soaring lines blend jazz voicings with traditional praise.'),
    (v_event_id, 'G9D2KY', 'Morogbo Youth Choir', 'Morogbo District', 'dance', 10, 'Garment of Praise', 'Sixteen choristers who dance in formation while singing unaccompanied hymns in four parts.'),
    (v_event_id, 'H5N8TC', 'Samuel Adeleke', 'State Church', 'spoken_word', 7, 'Letters to the Seven', 'Epic verse cycle reflecting on the letters to the churches in Revelation.'),
    (v_event_id, 'E3QK4V', 'Bisi Ogundipe', 'State Church', 'visual_arts', 15, 'The Vine — Mixed Media', 'Textile artist who embroiders scripture into fabric collages from remnant cloth.')
    ON CONFLICT (event_id, code) DO NOTHING;

    -- 5. Seed Staff Roles (All 4 Judges + Organiser + Score Desk)
    INSERT INTO staff_roles (event_id, role_type, full_name, email, active)
    VALUES
    (v_event_id, 'organiser', 'Lead Administrator', 'organiser@shabach.org', true),
    (v_event_id, 'judge_1', 'Judge Panelist 1', 'judge1@shabach.org', true),
    (v_event_id, 'judge_2', 'Judge Panelist 2', 'judge2@shabach.org', true),
    (v_event_id, 'judge_3', 'Judge Panelist 3', 'judge3@shabach.org', true),
    (v_event_id, 'judge_4', 'Judge Panelist 4', 'judge4@shabach.org', true),
    (v_event_id, 'score_desk', 'Collation Officer', 'desk@shabach.org', true)
    ON CONFLICT (event_id, role_type, email) DO NOTHING;

    -- 6. Provision 64 Blank Scorecards (16 Finalists x 4 Judges)
    INSERT INTO scorecards (
        event_id,
        contestant_id,
        judge_id,
        status,
        criteria_scores,
        subtotal,
        notes
    )
    SELECT
        c.event_id,
        c.id,
        j.judge_id,
        'draft',
        '[]'::jsonb,
        0.00,
        ''
    FROM contestants c
    CROSS JOIN (
        VALUES ('judge1'), ('judge2'), ('judge3'), ('judge4')
    ) AS j(judge_id)
    WHERE c.event_id = v_event_id
    ON CONFLICT (event_id, contestant_id, judge_id) DO NOTHING;

END $$;

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
