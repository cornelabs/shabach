-- ==============================================================================
-- SHABACH 2026 DATABASE TEST SUITE: RLS & ACCESS CONTROL ISOLATION
-- File: supabase/tests/01_rls_isolation.test.sql
-- Description: Tests blind scoring isolation, trigger invariants, and
--              public projection security against unauthorized data exposure.
-- ==============================================================================

BEGIN;

-- Create transaction-isolated testing harness
CREATE TEMP TABLE test_assertions (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    passed BOOLEAN NOT NULL,
    details TEXT
);

DO $$
DECLARE
    v_event_id UUID := '00000000-0000-0000-0000-000000002026';
    v_contestant_id UUID;
    v_judge1_user UUID := gen_random_uuid();
    v_judge2_user UUID := gen_random_uuid();
    v_org_user UUID := gen_random_uuid();
    v_anon_user UUID := gen_random_uuid();
    v_card RECORD;
    v_err_msg TEXT;
BEGIN
    -- 1. Setup mock staff roles
    INSERT INTO staff_roles (event_id, user_id, role_type, full_name, email)
    VALUES
        (v_event_id, v_judge1_user, 'judge_1', 'Judge One Test', 'j1@test.shabach.org'),
        (v_event_id, v_judge2_user, 'judge_2', 'Judge Two Test', 'j2@test.shabach.org'),
        (v_event_id, v_org_user, 'organiser', 'Lead Organiser', 'org@test.shabach.org');

    SELECT id INTO v_contestant_id FROM contestants WHERE event_id = v_event_id AND code = 'SB7K2M';

    -- -------------------------------------------------------------------------
    -- Test 1: Helper functions correctly identify roles
    -- -------------------------------------------------------------------------
    -- Authenticate as judge 1
    PERFORM set_config('request.jwt.claim.sub', v_judge1_user::text, true);
    PERFORM set_config('role', 'authenticated', true);

    IF auth_is_assigned_judge(v_event_id, 'judge1') AND NOT auth_is_assigned_judge(v_event_id, 'judge2') THEN
        INSERT INTO test_assertions (description, passed) VALUES ('auth_is_assigned_judge isolates judge1 from judge2', true);
    ELSE
        INSERT INTO test_assertions (description, passed, details) VALUES ('auth_is_assigned_judge failed', false, 'judge1 could not be isolated');
    END IF;

    -- Authenticate as organiser
    PERFORM set_config('request.jwt.claim.sub', v_org_user::text, true);
    IF auth_is_organiser(v_event_id) THEN
        INSERT INTO test_assertions (description, passed) VALUES ('auth_is_organiser identifies organiser role', true);
    ELSE
        INSERT INTO test_assertions (description, passed, details) VALUES ('auth_is_organiser failed', false, 'organiser role check failed');
    END IF;

    -- -------------------------------------------------------------------------
    -- Test 2: Blind Judge Isolation - Judge 1 cannot update Judge 2 scorecard
    -- -------------------------------------------------------------------------
    PERFORM set_config('request.jwt.claim.sub', v_judge1_user::text, true);
    
    BEGIN
        UPDATE scorecards
        SET notes = 'Illegal edit by judge 1'
        WHERE event_id = v_event_id AND contestant_id = v_contestant_id AND judge_id = 'judge2';
        
        -- In RLS, update on unreachable row updates 0 rows
        IF NOT FOUND THEN
            INSERT INTO test_assertions (description, passed) VALUES ('Blind judging: Judge 1 cannot affect Judge 2 scorecard', true);
        ELSE
            INSERT INTO test_assertions (description, passed, details) VALUES ('Blind judging breached', false, 'Judge 1 modified Judge 2 card');
        END IF;
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO test_assertions (description, passed) VALUES ('Blind judging: Judge 1 blocked from modifying Judge 2 scorecard', true);
    END;

    -- -------------------------------------------------------------------------
    -- Test 3: Trigger check_judge_scorecard_update prevents self-reopen
    -- -------------------------------------------------------------------------
    PERFORM set_config('request.jwt.claim.sub', v_judge1_user::text, true);

    BEGIN
        UPDATE scorecards
        SET reopened = true
        WHERE event_id = v_event_id AND contestant_id = v_contestant_id AND judge_id = 'judge1' AND reopened = false;

        INSERT INTO test_assertions (description, passed, details) VALUES ('Self-reopen trigger failed', false, 'Judge self-reopened without organiser');
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT;
        IF v_err_msg ILIKE '%Only organisers can reopen%' THEN
            INSERT INTO test_assertions (description, passed) VALUES ('Trigger correctly blocks judge from self-reopening scorecard', true);
        ELSE
            INSERT INTO test_assertions (description, passed, details) VALUES ('Unexpected error on self-reopen', false, v_err_msg);
        END IF;
    END;

    -- -------------------------------------------------------------------------
    -- Test 4: Trigger check_judge_scorecard_update prevents self-resolving conflicts
    -- -------------------------------------------------------------------------
    PERFORM set_config('request.jwt.claim.sub', v_judge1_user::text, true);

    BEGIN
        UPDATE scorecards
        SET conflict_resolved = true
        WHERE event_id = v_event_id AND contestant_id = v_contestant_id AND judge_id = 'judge1' AND conflict_resolved = false;

        INSERT INTO test_assertions (description, passed, details) VALUES ('Conflict trigger failed', false, 'Judge self-resolved conflict');
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_err_msg = MESSAGE_TEXT;
        IF v_err_msg ILIKE '%Only organisers can resolve%' THEN
            INSERT INTO test_assertions (description, passed) VALUES ('Trigger correctly blocks judge from self-resolving conflict of interest', true);
        ELSE
            INSERT INTO test_assertions (description, passed, details) VALUES ('Unexpected error on conflict resolution', false, v_err_msg);
        END IF;
    END;

    -- -------------------------------------------------------------------------
    -- Test 5: get_public_top_three returns empty array when results unpublished
    -- -------------------------------------------------------------------------
    PERFORM set_config('role', 'anon', true);

    -- Ensure no published official snapshot
    UPDATE results_snapshots SET published = false WHERE event_id = v_event_id;

    IF NOT EXISTS (SELECT 1 FROM get_public_top_three(v_event_id)) THEN
        INSERT INTO test_assertions (description, passed) VALUES ('Public privacy: Unpublished results return 0 rows to anon', true);
    ELSE
        INSERT INTO test_assertions (description, passed, details) VALUES ('Public privacy leak', false, 'Unpublished results were returned to anon');
    END IF;

END $$;

-- Output test results
SELECT id, description, passed, COALESCE(details, 'OK') AS status FROM test_assertions;

-- Fail transaction if any assertion failed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM test_assertions WHERE passed = false) THEN
        RAISE EXCEPTION 'One or more database tests failed!';
    END IF;
END $$;

ROLLBACK;
