-- 20261114000004_direct_email_voting.sql
-- Enables seamless direct email voting without OTP codes
-- Voters enter their email address, which is tracked and validated to enforce 1 vote per voter.

CREATE OR REPLACE FUNCTION cast_email_vote(
    p_event_id UUID,
    p_contestant_id UUID,
    p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_email TEXT;
    v_email_hash TEXT;
    v_voting_status TEXT;
    v_voter_id UUID;
    v_vote_id UUID;
BEGIN
    v_clean_email := lower(trim(p_email));
    IF v_clean_email IS NULL OR v_clean_email = '' OR v_clean_email NOT LIKE '%@%.%' THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'invalid_email');
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

    -- 3. Calculate consistent deterministic voter identifier from email
    v_email_hash := 'email_' || encode(sha256((v_clean_email || ':shabach2026')::bytea), 'hex');

    -- 4. Get or insert into verified_voters
    INSERT INTO verified_voters (event_id, voter_token_hash, verification_method)
    VALUES (p_event_id, v_email_hash, 'audience_web')
    ON CONFLICT (event_id, voter_token_hash) DO NOTHING;

    SELECT id INTO v_voter_id
    FROM verified_voters
    WHERE event_id = p_event_id AND voter_token_hash = v_email_hash;

    -- 5. Check if this voter has already cast a vote
    IF EXISTS (SELECT 1 FROM votes WHERE event_id = p_event_id AND voter_id = v_voter_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'already_voted');
    END IF;

    -- 6. Insert single vote atomically
    BEGIN
        INSERT INTO votes (event_id, voter_id, contestant_id)
        VALUES (p_event_id, v_voter_id, p_contestant_id)
        RETURNING id INTO v_vote_id;
    EXCEPTION WHEN unique_violation THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'already_voted');
    END;

    RETURN jsonb_build_object('ok', true, 'vote_id', v_vote_id, 'voter_token', v_email_hash);
END;
$$;

GRANT EXECUTE ON FUNCTION cast_email_vote(UUID, UUID, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION cast_audience_vote(
    p_event_id UUID,
    p_contestant_id UUID,
    p_voter_token TEXT DEFAULT NULL,
    p_method TEXT DEFAULT 'audience_web',
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
BEGIN
    v_token := COALESCE(p_voter_token, p_voter_hash);
    IF v_token IS NULL OR trim(v_token) = '' THEN
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

    -- 3. Get or register voter record in verified_voters
    SELECT id INTO v_voter_id FROM verified_voters
    WHERE event_id = p_event_id AND voter_token_hash = v_token;

    IF v_voter_id IS NULL THEN
        INSERT INTO verified_voters (event_id, voter_token_hash, verification_method)
        VALUES (p_event_id, v_token, COALESCE(p_method, 'audience_web'))
        ON CONFLICT (event_id, voter_token_hash) DO NOTHING;

        SELECT id INTO v_voter_id FROM verified_voters
        WHERE event_id = p_event_id AND voter_token_hash = v_token;
    END IF;

    IF v_voter_id IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'unverified_voter');
    END IF;

    -- 4. Check for existing vote
    IF EXISTS (SELECT 1 FROM votes WHERE event_id = p_event_id AND voter_id = v_voter_id) THEN
        RETURN jsonb_build_object('ok', false, 'reason', 'already_voted');
    END IF;

    -- 5. Record single vote atomically
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
