-- ==============================================================================
-- SHABACH 2026 GRAND FINALE REAL CONTESTANTS & RUBRIC TIMINGS
-- Migration: 20261105000001_real_contestants_and_rubrics.sql
-- Description:
--   1. Updates Drama (mono_drama) time limit to 7 minutes (420 seconds).
--   2. Updates the 16 contestant slots with the official finalists, category
--      assignments, and avatar picture paths from the district auditions.
--   3. Maintains placeholders for Magbon District pending Saturday's audition.
-- ==============================================================================

DO $$
DECLARE
    v_event_id UUID := '00000000-0000-0000-0000-000000002026'::uuid;
BEGIN
    -- 1. Update Drama Rubric duration: 7 minutes (420 seconds)
    UPDATE rubric_versions
    SET time_limit_sec = 420
    WHERE event_id = v_event_id AND discipline = 'mono_drama';

    -- 2. Update Official Finalists (14 confirmed acts + 2 Magbon placeholders)
    -- Epe District
    UPDATE contestants SET
        full_name = 'Min. Lizzy',
        name = 'Min. Lizzy',
        performance_type = 'music',
        performance_title = 'Vocal & Worship Ministry',
        biography = 'Ministering from Epe District in the Music category.',
        avatar_url = '/contestants/min-lizzy.jpeg',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'SB7K2M';

    UPDATE contestants SET
        full_name = 'The Painters',
        name = 'The Painters',
        performance_type = 'mono_drama',
        performance_title = 'Dramatic Presentation',
        biography = 'Ministering from Epe District in the Drama category.',
        avatar_url = '/contestants/the-painters.png',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'V4Q9TP';

    -- Igbogbo District
    UPDATE contestants SET
        full_name = 'The Preacher',
        name = 'The Preacher',
        performance_type = 'music',
        performance_title = 'Choral & Vocal Ministry',
        biography = 'Ministering from Igbogbo District in the Music category.',
        avatar_url = '/contestants/the-preacher.png',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'W5H7FE';

    UPDATE contestants SET
        full_name = 'The Wise Ones',
        name = 'The Wise Ones',
        performance_type = 'spoken_word',
        performance_title = 'Poetic & Spoken Word Presentation',
        biography = 'Ministering from Igbogbo District in the Spoken Word category.',
        avatar_url = '/contestants/the-wise-ones.png',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'Y3K9RU';

    -- Morogbo District
    UPDATE contestants SET
        full_name = 'HOPENDHOUSE DANCE',
        name = 'HOPENDHOUSE DANCE',
        performance_type = 'dance',
        performance_title = 'Dance Ministry',
        biography = 'Ministering from Morogbo District in the Dance category.',
        avatar_url = '/contestants/hopendhouse-dance.jpeg',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'B6F4PT';

    UPDATE contestants SET
        full_name = 'The Gideonite Speaks',
        name = 'The Gideonite Speaks',
        performance_type = 'spoken_word',
        performance_title = 'Spoken Word Ministry',
        biography = 'Ministering from Morogbo District in the Spoken Word category.',
        avatar_url = '/contestants/the-gideonite-speaks.png',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'G9D2KY';

    -- Ijede District
    UPDATE contestants SET
        full_name = 'Min. Kehinde Akintola',
        name = 'Min. Kehinde Akintola',
        performance_type = 'music',
        performance_title = 'Worship Rendition',
        biography = 'Ministering from Ijede District in the Music category.',
        avatar_url = '/contestants/min-kehinde-akintola.jpeg',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'NH6R8W';

    UPDATE contestants SET
        full_name = 'Min. TaegarGee',
        name = 'Min. TaegarGee',
        performance_type = 'music',
        performance_title = 'Praise Rendition',
        biography = 'Ministering from Ijede District in the Music category.',
        avatar_url = '/contestants/min-taegargee.png',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'K2M5C7';

    -- Badagry District
    UPDATE contestants SET
        full_name = 'Elijah Victor',
        name = 'Elijah Victor',
        performance_type = 'music',
        performance_title = 'Music Ministry',
        biography = 'Ministering from Badagry District in the Music category.',
        avatar_url = '/contestants/elijah-victor.jpeg',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'A7W2SM';

    UPDATE contestants SET
        full_name = 'LFC Dynasty',
        name = 'LFC Dynasty',
        performance_type = 'dance',
        performance_title = 'Choreographed Dance Ministry',
        biography = 'Ministering from Badagry District in the Dance category.',
        avatar_url = '/contestants/lfc-dynasty.png',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'D4PN6T';

    -- Magbon District (Audition Saturday)
    UPDATE contestants SET
        full_name = 'Magbon Finalist 1 (Auditions Saturday)',
        name = 'Magbon Finalist 1 (Auditions Saturday)',
        performance_type = 'dance',
        performance_title = 'Auditions Saturday',
        biography = 'Magbon District Auditions taking place Saturday.',
        avatar_url = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'M8C3XE';

    UPDATE contestants SET
        full_name = 'Magbon Finalist 2 (Auditions Saturday)',
        name = 'Magbon Finalist 2 (Auditions Saturday)',
        performance_type = 'visual_arts',
        performance_title = 'Auditions Saturday',
        biography = 'Magbon District Auditions taking place Saturday.',
        avatar_url = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'L1Z8RQ';

    -- State Church
    UPDATE contestants SET
        full_name = 'Favour Chukwudi',
        name = 'Favour Chukwudi',
        performance_type = 'spoken_word',
        performance_title = 'Spoken Word Ministry',
        biography = 'Ministering from State Church in the Spoken Word category.',
        avatar_url = '/contestants/favour-chukwudi.png',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'H5N8TC';

    UPDATE contestants SET
        full_name = 'Min. Blessing',
        name = 'Min. Blessing',
        performance_type = 'music',
        performance_title = 'Music Ministry',
        biography = 'Ministering from State Church in the Music category.',
        avatar_url = '/contestants/min-blessing.png',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'E3QK4V';

    -- Iranwo District
    UPDATE contestants SET
        full_name = 'SUCCESS',
        name = 'SUCCESS',
        performance_type = 'music',
        performance_title = 'Gospel Rendition',
        biography = 'Ministering from Iranwo District in the Music category.',
        avatar_url = '/contestants/success.png',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'P9X3JA';

    UPDATE contestants SET
        full_name = 'Victoria',
        name = 'Victoria',
        performance_type = 'spoken_word',
        performance_title = 'Spoken Word Ministry',
        biography = 'Ministering from Iranwo District in the Spoken Word category.',
        avatar_url = '/contestants/victoria.jpeg',
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'T8B4ND';

END;
$$;
