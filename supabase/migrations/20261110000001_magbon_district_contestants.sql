-- ==============================================================================
-- SHABACH 2026 GRAND FINALE MAGBON DISTRICT FINALISTS
-- Migration: 20261110000001_magbon_district_contestants.sql
-- Description:
--   Updates the Magbon District finalist entries (c11 / M8C3XE and c12 / L1Z8RQ)
--   with official finalists Min. Elizabeth (Music) and Spirit, Soul & Body Dancers (Dance)
--   and their official photos.
-- ==============================================================================

DO $$
DECLARE
    v_event_id UUID := '00000000-0000-0000-0000-000000002026'::uuid;
BEGIN
    -- Magbon District - Min. Elizabeth (Music)
    UPDATE contestants SET
        full_name = 'Min. Elizabeth',
        performance_type = 'music',
        performance_title = 'Music Ministry',
        biography = 'Ministering from Magbon District in the Music category.',
        avatar_url = '/contestants/min-elizabeth.jpeg',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'M8C3XE';

    -- Magbon District - Spirit, Soul & Body Dancers (Dance)
    UPDATE contestants SET
        full_name = 'Spirit, Soul & Body Dancers',
        performance_type = 'dance',
        performance_title = 'Choreographed Dance Ministry',
        biography = 'Ministering from Magbon District in the Dance category.',
        avatar_url = '/contestants/spirit-soul-body-dancers.jpeg',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'L1Z8RQ';

END;
$$;
