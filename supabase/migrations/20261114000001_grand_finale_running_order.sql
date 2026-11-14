-- ==============================================================================
-- SHABACH 2026 GRAND FINALE OFFICIAL STAGE RUNNING ORDER
-- Migration: 20261114000001_grand_finale_running_order.sql
-- Description:
--   Updates the running order (performance_order 1 to 16) for the Grand Finale:
--     1. State church Music (Min. Blessing - E3QK4V)
--     2. State church Spoken words (Favour Chukwudi - H5N8TC)
--     3. Morogbo Spoken words (The Gideonite Speaks - G9D2KY)
--     4. Badagry Music (Elijah Victor - A7W2SM)
--     5. Igbogbo Spoken words (The Wise Ones - Y3K9RU)
--     6. Morogbo Dance (HOPENDHOUSE DANCE - B6F4PT)
--     7. Badagry Dance (LFC Dynasty - D4PN6T)
--     8. Magbon Music (Min. Elizabeth - M8C3XE)
--     9. Igbogbo Music (The Preacher - W5H7FE)
--     10. Irawo Spoken Words (Victoria - T8B4ND)
--     11. Epe Drama (The Painters - V4Q9TP)
--     12. Epe Music (Min. Lizzy - SB7K2M)
--     13. Irawo Music (SUCCESS - P9X3JA)
--     14. Ijede Music (Min. Kehinde Akintola - NH6R8W)
--     15. Magbon Dance (Spirit, Soul & Body Dancers - L1Z8RQ)
--     16. Ijede Music (Min. TaegarGee - K2M5C7)
-- ==============================================================================

DO $$
DECLARE
    v_event_id UUID := '00000000-0000-0000-0000-000000002026'::uuid;
BEGIN
    -- Temporary offset to vacant slots 17..32 to prevent unique constraint conflicts
    UPDATE contestants SET performance_order = performance_order + 16 WHERE event_id = v_event_id;

    -- 1. State church Music: Min. Blessing (E3QK4V)
    UPDATE contestants SET performance_order = 1, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'E3QK4V';

    -- 2. State church Spoken words: Favour Chukwudi (H5N8TC)
    UPDATE contestants SET performance_order = 2, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'H5N8TC';

    -- 3. Morogbo Spoken words: The Gideonite Speaks (G9D2KY)
    UPDATE contestants SET performance_order = 3, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'G9D2KY';

    -- 4. Badagry Music: Elijah Victor (A7W2SM)
    UPDATE contestants SET performance_order = 4, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'A7W2SM';

    -- 5. Igbogbo Spoken words: The Wise Ones (Y3K9RU)
    UPDATE contestants SET performance_order = 5, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'Y3K9RU';

    -- 6. Morogbo Dance: HOPENDHOUSE DANCE (B6F4PT)
    UPDATE contestants SET performance_order = 6, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'B6F4PT';

    -- 7. Badagry Dance: LFC Dynasty (D4PN6T)
    UPDATE contestants SET performance_order = 7, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'D4PN6T';

    -- 8. Magbon Music: Min. Elizabeth (M8C3XE)
    UPDATE contestants SET performance_order = 8, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'M8C3XE';

    -- 9. Igbogbo Music: The Preacher (W5H7FE)
    UPDATE contestants SET performance_order = 9, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'W5H7FE';

    -- 10. Irawo Spoken Words: Victoria (T8B4ND)
    UPDATE contestants SET performance_order = 10, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'T8B4ND';

    -- 11. Epe Drama: The Painters (V4Q9TP)
    UPDATE contestants SET performance_order = 11, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'V4Q9TP';

    -- 12. Epe Music: Min. Lizzy (SB7K2M)
    UPDATE contestants SET performance_order = 12, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'SB7K2M';

    -- 13. Irawo Music: SUCCESS (P9X3JA)
    UPDATE contestants SET performance_order = 13, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'P9X3JA';

    -- 14. Ijede Music: Min. Kehinde Akintola (NH6R8W)
    UPDATE contestants SET performance_order = 14, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'NH6R8W';

    -- 15. Magbon Dance: Spirit, Soul & Body Dancers (L1Z8RQ)
    UPDATE contestants SET performance_order = 15, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'L1Z8RQ';

    -- 16. Ijede Music: Min. TaegarGee (K2M5C7)
    UPDATE contestants SET performance_order = 16, updated_at = timezone('utc'::text, now())
    WHERE event_id = v_event_id AND code = 'K2M5C7';

END $$;
