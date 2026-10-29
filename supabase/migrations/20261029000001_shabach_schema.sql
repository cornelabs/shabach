-- ==============================================================================
-- SHABACH 2026 GRAND FINALE DATABASE SCHEMA
-- Migration: 20261029000001_shabach_schema.sql
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
-- 2. Event Settings Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    audience_weight_max_points NUMERIC(4, 2) NOT NULL DEFAULT 5.00,
    judge_slots_required INT NOT NULL DEFAULT 3,
    max_judge_raw_score NUMERIC(5, 2) NOT NULL DEFAULT 95.00,
    allow_reopen_with_reason BOOLEAN NOT NULL DEFAULT true,
    require_conflict_resolution BOOLEAN NOT NULL DEFAULT true,
    require_verified_duration BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_event_settings_event UNIQUE (event_id)
);

-- -----------------------------------------------------------------------------
-- 3. Contestants Table (16 Grand Finale Finalists)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contestants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    code TEXT NOT NULL, -- e.g. "SHB-01" to "SHB-16"
    full_name TEXT NOT NULL,
    district TEXT NOT NULL,
    performance_type TEXT NOT NULL CHECK (
        performance_type IN ('music', 'dance', 'spoken_word', 'drama', 'visual_art')
    ),
    performance_order INT NOT NULL,
    performance_title TEXT NOT NULL,
    biography TEXT NOT NULL DEFAULT '',
    photo_url TEXT,
    rubric_discipline TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_contestant_event_code UNIQUE (event_id, code),
    CONSTRAINT uq_contestant_event_order UNIQUE (event_id, performance_order),
    CONSTRAINT chk_performance_order_positive CHECK (performance_order > 0)
);

CREATE INDEX IF NOT EXISTS idx_contestants_event ON contestants(event_id);
CREATE INDEX IF NOT EXISTS idx_contestants_order ON contestants(event_id, performance_order);

-- -----------------------------------------------------------------------------
-- 4. Staff Roles & Judge Assignments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID, -- References auth.users(id) in live Supabase environment
    role_type TEXT NOT NULL CHECK (role_type IN ('organiser', 'judge_1', 'judge_2', 'judge_3', 'score_desk')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_staff_event_role UNIQUE (event_id, role_type),
    CONSTRAINT uq_staff_event_email UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_staff_roles_lookup ON staff_roles(event_id, user_id, active);

-- -----------------------------------------------------------------------------
-- 5. Rubric Versions Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rubric_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    discipline TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    criteria JSONB NOT NULL,
    spiritual_criterion_id TEXT NOT NULL,
    technical_criterion_id TEXT NOT NULL,
    creativity_criterion_id TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_rubric_event_discipline_ver UNIQUE (event_id, discipline, version)
);

-- -----------------------------------------------------------------------------
-- 6. Scorecards Table (48 unique event x contestant x judge cards)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
    judge_id TEXT NOT NULL CHECK (judge_id IN ('judge_1', 'judge_2', 'judge_3')),
    assigned_user_id UUID,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted')) DEFAULT 'draft',
    criteria_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    subtotal NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0 AND subtotal <= 95),
    notes TEXT DEFAULT '',
    conflict_declared BOOLEAN NOT NULL DEFAULT false,
    conflict_reason TEXT,
    conflict_resolved BOOLEAN NOT NULL DEFAULT false,
    conflict_resolution_notes TEXT,
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
    duration_seconds INT NOT NULL CHECK (duration_seconds >= 0),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_duration_contestant UNIQUE (event_id, contestant_id)
);

-- -----------------------------------------------------------------------------
-- 8. Verified Voters Table (Email OTP verified identity)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS verified_voters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    phone TEXT,
    otp_hash TEXT,
    otp_expires_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_verified_voters_event_email UNIQUE (event_id, email)
);

CREATE INDEX IF NOT EXISTS idx_voters_email ON verified_voters(event_id, email);

-- -----------------------------------------------------------------------------
-- 9. Votes Table (Audience Vote Casts - One Final Vote Per Verified Voter)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES verified_voters(id) ON DELETE CASCADE,
    contestant_id UUID NOT NULL REFERENCES contestants(id) ON DELETE CASCADE,
    cast_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_one_vote_per_voter UNIQUE (event_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_contestant ON votes(event_id, contestant_id);

-- -----------------------------------------------------------------------------
-- 10. Results Snapshots Table (Frozen Master Results & Publication)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS results_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    locked_by UUID,
    snapshot_data JSONB NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    published_by UUID,
    tie_resolutions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_snapshot_event UNIQUE (event_id)
);

-- -----------------------------------------------------------------------------
-- 11. Audit Events Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    actor_id UUID,
    actor_role TEXT NOT NULL DEFAULT 'system',
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_event ON audit_events(event_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 12. Atomic Vote Casting Function
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cast_audience_vote(
    p_event_id UUID,
    p_voter_id UUID,
    p_contestant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_voting_status TEXT;
    v_contestant_exists BOOLEAN;
    v_voter_verified BOOLEAN;
    v_already_voted BOOLEAN;
    v_vote_id UUID;
BEGIN
    -- 1. Check event voting status
    SELECT voting_status INTO v_voting_status
    FROM events
    WHERE id = p_event_id;

    IF v_voting_status IS NULL THEN
        RAISE EXCEPTION 'Event not found.';
    END IF;

    IF v_voting_status <> 'open' THEN
        RAISE EXCEPTION 'Voting window is currently closed.';
    END IF;

    -- 2. Validate contestant belongs to event
    SELECT EXISTS (
        SELECT 1 FROM contestants
        WHERE id = p_contestant_id AND event_id = p_event_id
    ) INTO v_contestant_exists;

    IF NOT v_contestant_exists THEN
        RAISE EXCEPTION 'Invalid contestant for this event.';
    END IF;

    -- 3. Verify voter eligibility
    SELECT (verified_at IS NOT NULL) INTO v_voter_verified
    FROM verified_voters
    WHERE id = p_voter_id AND event_id = p_event_id;

    IF v_voter_verified IS NULL OR NOT v_voter_verified THEN
        RAISE EXCEPTION 'Voter is not verified for this event.';
    END IF;

    -- 4. Check for duplicate vote atomically
    SELECT EXISTS (
        SELECT 1 FROM votes
        WHERE event_id = p_event_id AND voter_id = p_voter_id
    ) INTO v_already_voted;

    IF v_already_voted THEN
        RAISE EXCEPTION 'A vote has already been cast for this verified voter.';
    END IF;

    -- 5. Insert vote
    INSERT INTO votes (event_id, voter_id, contestant_id, cast_at)
    VALUES (p_event_id, p_voter_id, p_contestant_id, timezone('utc'::text, now()))
    RETURNING id INTO v_vote_id;

    -- 6. Log audit event
    INSERT INTO audit_events (
        event_id,
        actor_id,
        actor_role,
        action,
        target_type,
        target_id,
        details
    ) VALUES (
        p_event_id,
        p_voter_id,
        'voter',
        'cast_vote',
        'contestants',
        p_contestant_id::text,
        jsonb_build_object('vote_id', v_vote_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'vote_id', v_vote_id,
        'message', 'Vote successfully recorded.'
    );
END;
$$;
