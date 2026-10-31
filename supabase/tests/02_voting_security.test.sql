-- ==============================================================================
-- SHABACH 2026 DATABASE TEST SUITE: VOTING SECURITY & SINGLE-VOTE INVARIANTS
-- File: supabase/tests/02_voting_security.test.sql
-- Description: Tests single-vote constraint enforcement, window gating,
--              and OTP rate-limiting.
-- ==============================================================================

BEGIN;

CREATE TEMP TABLE test_assertions (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    passed BOOLEAN NOT NULL,
    details TEXT
);

DO $$
DECLARE
    v_event_id UUID := '00000000-0000-0000-0000-000000002026';
    v_contestant1_id UUID;
    v_contestant2_id UUID;
    v_voter_id UUID;
    v_otp_result JSONB;
BEGIN
    SELECT id INTO v_contestant1_id FROM contestants WHERE event_id = v_event_id AND code = 'SB7K2M';
    SELECT id INTO v_contestant2_id FROM contestants WHERE event_id = v_event_id AND code = 'B6F4PT';

    -- -------------------------------------------------------------------------
    -- Test 1: Single-Vote Constraint (uq_voter_single_vote)
    -- -------------------------------------------------------------------------
    -- Create verified voter
    INSERT INTO verified_voters (event_id, voter_token_hash, verification_method)
    VALUES (v_event_id, 'hash_test_voter_123', 'otp_email')
    RETURNING id INTO v_voter_id;

    -- First vote succeeds
    INSERT INTO votes (event_id, voter_id, contestant_id)
    VALUES (v_event_id, v_voter_id, v_contestant1_id);

    INSERT INTO test_assertions (description, passed)
    VALUES ('Single-vote protection: First ballot records successfully', true);

    -- Second vote by the SAME voter MUST fail due to unique constraint uq_voter_single_vote
    BEGIN
        INSERT INTO votes (event_id, voter_id, contestant_id)
        VALUES (v_event_id, v_voter_id, v_contestant2_id);

        INSERT INTO test_assertions (description, passed, details)
        VALUES ('Single-vote protection breached', false, 'Voter cast two distinct ballots');
    EXCEPTION WHEN unique_violation THEN
        INSERT INTO test_assertions (description, passed)
        VALUES ('Single-vote protection: Duplicate ballot rejected by uq_voter_single_vote constraint', true);
    END;

    -- -------------------------------------------------------------------------
    -- Test 2: Rate Limiting on request_voter_otp RPC
    -- -------------------------------------------------------------------------
    -- Set event voting to open
    UPDATE events SET voting_status = 'open' WHERE id = v_event_id;

    -- Request 1
    v_otp_result := request_voter_otp(v_event_id, 'rate_limit_test_user@shabach.org', 'otp_hash_1');
    IF (v_otp_result->>'ok')::boolean = true THEN
        INSERT INTO test_assertions (description, passed) VALUES ('OTP Request 1 succeeds', true);
    END IF;

    -- Request 2
    v_otp_result := request_voter_otp(v_event_id, 'rate_limit_test_user@shabach.org', 'otp_hash_2');
    IF (v_otp_result->>'ok')::boolean = true THEN
        INSERT INTO test_assertions (description, passed) VALUES ('OTP Request 2 succeeds', true);
    END IF;

    -- Request 3
    v_otp_result := request_voter_otp(v_event_id, 'rate_limit_test_user@shabach.org', 'otp_hash_3');
    IF (v_otp_result->>'ok')::boolean = true THEN
        INSERT INTO test_assertions (description, passed) VALUES ('OTP Request 3 succeeds', true);
    END IF;

    -- Request 4 within 10 minutes MUST be rate-limited
    v_otp_result := request_voter_otp(v_event_id, 'rate_limit_test_user@shabach.org', 'otp_hash_4');
    IF (v_otp_result->>'ok')::boolean = false AND v_otp_result->>'reason' = 'rate_limited' THEN
        INSERT INTO test_assertions (description, passed) VALUES ('OTP rate limit: 4th request in 10-minute window blocked', true);
    ELSE
        INSERT INTO test_assertions (description, passed, details) VALUES ('Rate limit failed', false, v_otp_result::text);
    END IF;

    -- -------------------------------------------------------------------------
    -- Test 3: Voting Window Gate: Closed voting blocks OTP requests
    -- -------------------------------------------------------------------------
    UPDATE events SET voting_status = 'closed' WHERE id = v_event_id;

    v_otp_result := request_voter_otp(v_event_id, 'new_user@shabach.org', 'otp_hash_new');
    IF (v_otp_result->>'ok')::boolean = false AND v_otp_result->>'reason' = 'closed' THEN
        INSERT INTO test_assertions (description, passed) VALUES ('Window gate: Closed voting blocks new OTP requests', true);
    ELSE
        INSERT INTO test_assertions (description, passed, details) VALUES ('Closed window gate failed', false, v_otp_result::text);
    END IF;

END $$;

SELECT id, description, passed, COALESCE(details, 'OK') AS status FROM test_assertions;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM test_assertions WHERE passed = false) THEN
        RAISE EXCEPTION 'One or more voting security tests failed!';
    END IF;
END $$;

ROLLBACK;
