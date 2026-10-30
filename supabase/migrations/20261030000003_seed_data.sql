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

END $$;
