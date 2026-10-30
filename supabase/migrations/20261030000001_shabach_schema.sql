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
    verification_method TEXT NOT NULL CHECK (verification_method IN ('otp_phone', 'otp_email', 'device_fingerprint', 'demo_client')),
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
    p_method TEXT DEFAULT 'otp_phone'
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
        -- Allow demo client or verified token fallback
        IF p_method = 'demo_client' THEN
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

