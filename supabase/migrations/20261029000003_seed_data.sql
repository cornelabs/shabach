-- ==============================================================================
-- SHABACH 2026 GRAND FINALE SEED DATA
-- Migration: 20261029000003_seed_data.sql
-- Description: Canonical event, rubrics, 16 finalists, and initial staff roles.
-- ==============================================================================

DO $$
DECLARE
    v_event_id UUID := '00000000-0000-0000-0000-000000002026'::uuid;
    c1 UUID; c2 UUID; c3 UUID; c4 UUID; c5 UUID; c6 UUID; c7 UUID; c8 UUID;
    c9 UUID; c10 UUID; c11 UUID; c12 UUID; c13 UUID; c14 UUID; c15 UUID; c16 UUID;
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

    -- 2. Insert Event Settings
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
        3,
        95.00,
        true,
        true,
        true
    ) ON CONFLICT (event_id) DO NOTHING;

    -- 3. Insert Rubrics
    INSERT INTO rubric_versions (
        event_id,
        discipline,
        version,
        title,
        criteria,
        spiritual_criterion_id,
        technical_criterion_id,
        creativity_criterion_id
    ) VALUES
    (
        v_event_id,
        'music',
        1,
        'Music & Vocal Performance Rubric',
        '[
            {"id": "spiritual_depth", "name": "Spiritual Impact & Biblical Fidelity", "maxScore": 20, "description": "Theological depth, reverence, and spiritual resonance."},
            {"id": "vocal_technique", "name": "Vocal Technique & Pitch Accuracy", "maxScore": 20, "description": "Intonation, breath support, pitch control, and range."},
            {"id": "creativity_arr", "name": "Artistic Originality & Arrangement", "maxScore": 20, "description": "Dynamic contrast, creative vocal/instrumental arrangement."},
            {"id": "stage_presence", "name": "Stage Presence & Delivery", "maxScore": 20, "description": "Poise, confidence, connection, and visual presentation."},
            {"id": "audience_impact", "name": "Audience Engagement & Impact", "maxScore": 15, "description": "Audience reception, congregational engagement, and impact."}
        ]'::jsonb,
        'spiritual_depth',
        'vocal_technique',
        'creativity_arr'
    ),
    (
        v_event_id,
        'dance',
        1,
        'Dance & Movement Rubric',
        '[
            {"id": "spiritual_msg", "name": "Thematic Clarity & Spiritual Message", "maxScore": 20, "description": "Clarity of gospel message conveyed through movement."},
            {"id": "choreography", "name": "Technical Execution & Sync", "maxScore": 20, "description": "Precision, timing, group or individual body control."},
            {"id": "originality", "name": "Choreographic Originality", "maxScore": 20, "description": "Innovative motifs, dynamic transitions, and spatial awareness."},
            {"id": "costume_prop", "name": "Costume, Modesty & Expression", "maxScore": 20, "description": "Facial expressions, liturgical costume appropriateness."},
            {"id": "audience_impact", "name": "Audience Engagement & Impact", "maxScore": 15, "description": "Power to move, inspire, and stir the assembly."}
        ]'::jsonb,
        'spiritual_msg',
        'choreography',
        'originality'
    ),
    (
        v_event_id,
        'spoken_word',
        1,
        'Spoken Word & Poetry Rubric',
        '[
            {"id": "theological_sub", "name": "Theological Substance & Scriptural Depth", "maxScore": 20, "description": "Scriptural fidelity, doctrinal soundness, spiritual weight."},
            {"id": "diction_vocal", "name": "Enunciation, Voice & Pacing", "maxScore": 20, "description": "Diction, dynamic range, tempo control, and clarity."},
            {"id": "wordplay_craft", "name": "Poetic Craft & Metaphorical Ingenuity", "maxScore": 20, "description": "Rhythm, rhyme scheme, metaphors, and freshness."},
            {"id": "emotional_truth", "name": "Conviction & Emotional Resonance", "maxScore": 20, "description": "Authentic delivery and command of message."},
            {"id": "audience_impact", "name": "Audience Engagement & Impact", "maxScore": 15, "description": "Engagement with the audience and inspirational delivery."}
        ]'::jsonb,
        'theological_sub',
        'diction_vocal',
        'wordplay_craft'
    ),
    (
        v_event_id,
        'drama',
        1,
        'Drama & Theatrical Delivery Rubric',
        '[
            {"id": "gospel_allegory", "name": "Biblical Truth & Narrative Substance", "maxScore": 20, "description": "Strength of Christian message and moral clarity."},
            {"id": "character_depth", "name": "Characterization & Voice Acting", "maxScore": 20, "description": "Believability, vocal inflection, physicalization."},
            {"id": "dramatic_arc", "name": "Script Structure & Dramatic Pacing", "maxScore": 20, "description": "Tension building, resolution, and creative storytelling."},
            {"id": "blocking_presence", "name": "Stage Craft & Space Utilization", "maxScore": 20, "description": "Use of stage, movement economy, and timing."},
            {"id": "audience_impact", "name": "Audience Engagement & Impact", "maxScore": 15, "description": "Capacity to touch hearts, evoke reflection, and inspire."}
        ]'::jsonb,
        'gospel_allegory',
        'character_depth',
        'dramatic_arc'
    ),
    (
        v_event_id,
        'visual_art',
        1,
        'Visual & Studio Arts Rubric',
        '[
            {"id": "sacred_symbolism", "name": "Sacred Symbolism & Divine Reflection", "maxScore": 20, "description": "Spiritual meaning, biblical symbolism, reverent theme."},
            {"id": "craftsmanship", "name": "Medium Mastery & Composition", "maxScore": 20, "description": "Brushwork, balance, color theory, light handling."},
            {"id": "aesthetic_concept", "name": "Originality of Concept", "maxScore": 20, "description": "Unique perspective on scriptural themes."},
            {"id": "live_presentation", "name": "Process & Finished Presentation", "maxScore": 20, "description": "Execution within time limits, clean presentation."},
            {"id": "audience_impact", "name": "Audience Engagement & Impact", "maxScore": 15, "description": "Visual awe, evocative impact, and spiritual uplift."}
        ]'::jsonb,
        'sacred_symbolism',
        'craftsmanship',
        'aesthetic_concept'
    ) ON CONFLICT (event_id, discipline, version) DO NOTHING;

    -- 4. Insert 16 Finalists
    INSERT INTO contestants (
        event_id, code, full_name, district, performance_type, performance_order,
        performance_title, biography, rubric_discipline
    ) VALUES
    (v_event_id, 'SHB-01', 'Praise Adebayo', 'Lagos Central', 'music', 1, 'Ancient of Days (Vocal Solo)', 'Chorister and youth worship leader from Lagos Central, dedicated to Christ-centered hymns.', 'music'),
    (v_event_id, 'SHB-02', 'David Okon', 'Lagos Central', 'spoken_word', 2, 'The Great Exchange', 'Passionate poet bringing scriptural narratives to life through vivid imagery.', 'spoken_word'),
    (v_event_id, 'SHB-03', 'Grace Eke', 'Ikeja', 'dance', 3, 'Winds of Awakening', 'Liturgical dancer exploring spiritual breakthrough and praise in contemporary movement.', 'dance'),
    (v_event_id, 'SHB-04', 'Emmanuel Bello', 'Ikeja', 'drama', 4, 'The Potter’s Vessel', 'Solo dramatic presentation on surrender, brokenness, and redemption.', 'drama'),
    (v_event_id, 'SHB-05', 'Joy Nwosu', 'Surulere', 'music', 5, 'Grace Found Me (Medley)', 'Gospel vocalist blending high praise with heartfelt worship from Surulere.', 'music'),
    (v_event_id, 'SHB-06', 'Daniel Taiwo', 'Surulere', 'visual_art', 6, 'Golgotha at Dusk', 'Fine artist performing speed painting to illustrate Christ’s sacrifice.', 'visual_art'),
    (v_event_id, 'SHB-07', 'Sarah Alabi', 'Lekki', 'dance', 7, 'River of Life', 'Choreographed prophetic dance depicting revival flowing from the altar.', 'dance'),
    (v_event_id, 'SHB-08', 'Samuel Eze', 'Lekki', 'music', 8, 'Hallelujah Song (Acoustic)', 'Acoustic guitarist and songwriter with an intimate worship style.', 'music'),
    (v_event_id, 'SHB-09', 'Esther Adeleke', 'Yaba', 'spoken_word', 9, 'Arise and Shine', 'Spoken word artist calling the youth generation to bold Christian witness.', 'spoken_word'),
    (v_event_id, 'SHB-10', 'Victor Oladipo', 'Yaba', 'drama', 10, 'The Mirror of Truth', 'Theatrical piece exploring identity, grace, and spiritual awakening.', 'drama'),
    (v_event_id, 'SHB-11', 'Mercy Johnson', 'Ikorodu', 'music', 11, 'Song of Deliverance', 'Gospel singer and choir leader with a soul-stirring vocal range.', 'music'),
    (v_event_id, 'SHB-12', 'Joseph Danjuma', 'Ikorodu', 'dance', 12, 'Chains Broken', 'Dynamic urban gospel movement celebrating freedom in Jesus.', 'dance'),
    (v_event_id, 'SHB-13', 'Faith Peters', 'Badagry', 'visual_art', 13, 'Alpha & Omega Inscribed', 'Live calligrapher and mixed-media illustrator presenting sacred scripture.', 'visual_art'),
    (v_event_id, 'SHB-14', 'Joshua Amadi', 'Badagry', 'spoken_word', 14, 'Valley of Dry Bones', 'Powerful poetic recitation of Ezekiel 37 with spoken rhythm.', 'spoken_word'),
    (v_event_id, 'SHB-15', 'Hannah Balogun', 'Epe', 'music', 15, 'Oba Nla (The Great King)', 'Traditional gospel and praise in Yoruba celebrating divine sovereignty.', 'music'),
    (v_event_id, 'SHB-16', 'Caleb Ogundipe', 'Epe', 'drama', 16, 'The Father’s House', 'Deeply moving portrayal of reconciliation and the unconditional love of God.', 'drama')
    ON CONFLICT (event_id, code) DO NOTHING;

    -- 5. Seed Staff Roles
    INSERT INTO staff_roles (event_id, role_type, full_name, email, active)
    VALUES
    (v_event_id, 'organiser', 'Lead Administrator', 'organiser@shabach.org', true),
    (v_event_id, 'judge_1', 'Judge Panelist 1', 'judge1@shabach.org', true),
    (v_event_id, 'judge_2', 'Judge Panelist 2', 'judge2@shabach.org', true),
    (v_event_id, 'judge_3', 'Judge Panelist 3', 'judge3@shabach.org', true),
    (v_event_id, 'score_desk', 'Collation Officer', 'desk@shabach.org', true)
    ON CONFLICT (event_id, role_type) DO NOTHING;

END $$;

