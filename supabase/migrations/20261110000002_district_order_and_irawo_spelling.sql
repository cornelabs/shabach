-- ==============================================================================
-- SHABACH 2026 GRAND FINALE DISTRICT REORDERING & IRAWO DISTRICT RENAMING
-- Migration: 20261110000002_district_order_and_irawo_spelling.sql
-- Description:
--   1. Corrects spelling from "Iranwo District" to "Irawo District".
--   2. Reorders contestants so districts start with State Church, followed
--      by districts in alphabetical order:
--        1. State Church
--        2. Badagry District
--        3. Epe District
--        4. Igbogbo District
--        5. Ijede District
--        6. Irawo District
--        7. Magbon District
--        8. Morogbo District
--   3. Sets running performance_order 1 to 16 accordingly.
-- ==============================================================================

DO $$
DECLARE
    v_event_id UUID := '00000000-0000-0000-0000-000000002026'::uuid;
BEGIN
    -- Temporary offset to vacant slots 17..32 to prevent unique constraint conflicts
    UPDATE contestants SET performance_order = performance_order + 16 WHERE event_id = v_event_id;

    -- 1. State Church (1 & 2)
    UPDATE contestants SET
        full_name = 'Favour Chukwudi',
        district = 'State Church',
        performance_type = 'spoken_word',
        performance_title = 'Spoken Word Ministry',
        biography = 'Ministering from State Church in the Spoken Word category.',
        avatar_url = '/contestants/favour-chukwudi.png',
        performance_order = 1,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'H5N8TC';

    UPDATE contestants SET
        full_name = 'Min. Blessing',
        district = 'State Church',
        performance_type = 'music',
        performance_title = 'Music Ministry',
        biography = 'Ministering from State Church in the Music category.',
        avatar_url = '/contestants/min-blessing.png',
        performance_order = 2,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'E3QK4V';

    -- 2. Badagry District (3 & 4)
    UPDATE contestants SET
        full_name = 'Elijah Victor',
        district = 'Badagry District',
        performance_type = 'music',
        performance_title = 'Music Ministry',
        biography = 'Ministering from Badagry District in the Music category.',
        avatar_url = '/contestants/elijah-victor.jpeg',
        performance_order = 3,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'A7W2SM';

    UPDATE contestants SET
        full_name = 'LFC Dynasty',
        district = 'Badagry District',
        performance_type = 'dance',
        performance_title = 'Choreographed Dance Ministry',
        biography = 'Ministering from Badagry District in the Dance category.',
        avatar_url = '/contestants/lfc-dynasty.png',
        performance_order = 4,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'D4PN6T';

    -- 3. Epe District (5 & 6)
    UPDATE contestants SET
        full_name = 'Min. Lizzy',
        district = 'Epe District',
        performance_type = 'music',
        performance_title = 'Vocal & Worship Ministry',
        biography = 'Ministering from Epe District in the Music category.',
        avatar_url = '/contestants/min-lizzy.jpeg',
        performance_order = 5,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'SB7K2M';

    UPDATE contestants SET
        full_name = 'The Painters',
        district = 'Epe District',
        performance_type = 'mono_drama',
        performance_title = 'Dramatic Presentation',
        biography = 'Ministering from Epe District in the Drama category.',
        avatar_url = '/contestants/the-painters.png',
        performance_order = 6,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'V4Q9TP';

    -- 4. Igbogbo District (7 & 8)
    UPDATE contestants SET
        full_name = 'The Preacher',
        district = 'Igbogbo District',
        performance_type = 'music',
        performance_title = 'Choral & Vocal Ministry',
        biography = 'Ministering from Igbogbo District in the Music category.',
        avatar_url = '/contestants/the-preacher.png',
        performance_order = 7,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'W5H7FE';

    UPDATE contestants SET
        full_name = 'The Wise Ones',
        district = 'Igbogbo District',
        performance_type = 'spoken_word',
        performance_title = 'Poetic & Spoken Word Presentation',
        biography = 'Ministering from Igbogbo District in the Spoken Word category.',
        avatar_url = '/contestants/the-wise-ones.png',
        performance_order = 8,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'Y3K9RU';

    -- 5. Ijede District (9 & 10)
    UPDATE contestants SET
        full_name = 'Min. Kehinde Akintola',
        district = 'Ijede District',
        performance_type = 'music',
        performance_title = 'Praise & Worship Ministry',
        biography = 'Ministering from Ijede District in the Music category.',
        avatar_url = '/contestants/min-kehinde-akintola.png',
        performance_order = 9,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'NH6R8W';

    UPDATE contestants SET
        full_name = 'Min. TaegarGee',
        district = 'Ijede District',
        performance_type = 'music',
        performance_title = 'Gospel Music Performance',
        biography = 'Ministering from Ijede District in the Music category.',
        avatar_url = '/contestants/min-taegargee.png',
        performance_order = 10,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'K2M5C7';

    -- 6. Irawo District (11 & 12)
    UPDATE contestants SET
        full_name = 'SUCCESS',
        district = 'Irawo District',
        performance_type = 'music',
        performance_title = 'Gospel Rendition',
        biography = 'Ministering from Irawo District in the Music category.',
        avatar_url = '/contestants/success.png',
        performance_order = 11,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'P9X3JA';

    UPDATE contestants SET
        full_name = 'Victoria',
        district = 'Irawo District',
        performance_type = 'spoken_word',
        performance_title = 'Spoken Word Ministry',
        biography = 'Ministering from Irawo District in the Spoken Word category.',
        avatar_url = '/contestants/victoria.jpeg',
        performance_order = 12,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'T8B4ND';

    -- 7. Magbon District (13 & 14)
    UPDATE contestants SET
        full_name = 'Min. Elizabeth',
        district = 'Magbon District',
        performance_type = 'music',
        performance_title = 'Music Ministry',
        biography = 'Ministering from Magbon District in the Music category.',
        avatar_url = '/contestants/min-elizabeth.jpeg',
        performance_order = 13,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'M8C3XE';

    UPDATE contestants SET
        full_name = 'Spirit, Soul & Body Dancers',
        district = 'Magbon District',
        performance_type = 'dance',
        performance_title = 'Choreographed Dance Ministry',
        biography = 'Ministering from Magbon District in the Dance category.',
        avatar_url = '/contestants/spirit-soul-body-dancers.jpeg',
        performance_order = 14,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'L1Z8RQ';

    -- 8. Morogbo District (15 & 16)
    UPDATE contestants SET
        full_name = 'HOPENDHOUSE DANCE',
        district = 'Morogbo District',
        performance_type = 'dance',
        performance_title = 'Dance Ministry',
        biography = 'Ministering from Morogbo District in the Dance category.',
        avatar_url = '/contestants/hopendhouse-dance.jpeg',
        performance_order = 15,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'B6F4PT';

    UPDATE contestants SET
        full_name = 'The Gideonite Speaks',
        district = 'Morogbo District',
        performance_type = 'spoken_word',
        performance_title = 'Spoken Word Ministry',
        biography = 'Ministering from Morogbo District in the Spoken Word category.',
        avatar_url = '/contestants/the-gideonite-speaks.png',
        performance_order = 16,
        updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'G9D2KY';

    -- Ensure drama rubric has 420 seconds
    UPDATE rubric_versions
    SET time_limit_sec = 420
    WHERE event_id = v_event_id AND discipline = 'mono_drama';
END;
$$;
