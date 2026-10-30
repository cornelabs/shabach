import { describe, expect, it } from "vitest";

import {
  audiencePoints,
  canLock,
  computeMasterRows,
  computeResults,
  judgeSubtotal,
  rankAndAssign,
  timePenalty,
  validateScores,
  verificationGates,
} from "@/lib/demo/scoring";
import { rubricFor } from "@/lib/demo/rubrics";
import {
  castVote,
  checkLockReadiness,
  getState,
  loadSampleScores,
  lockResults,
  publishResults,
  recordTieResolution,
  resetDemo,
  setDuration,
  setVotingStatus,
  updateContestant,
} from "@/lib/demo/store";
import type { Contestant, DurationEntry, ResultRow, Scorecard } from "@/lib/demo/types";

describe("Scoring Engine & Competition Rules", () => {
  it("verifies maximum 95 judge points and 5 audience points produce 100 maximum", () => {
    const musicRubric = rubricFor("music");
    const maxScores = musicRubric.criteria.map((c) => c.max);
    const subtotal = judgeSubtotal(maxScores);
    expect(subtotal).toBe(95);

    const maxAudience = audiencePoints(500, 500);
    expect(maxAudience).toBe(5);

    const combined = subtotal + maxAudience;
    expect(combined).toBe(100);
  });

  it("calculates audience points correctly: 400/200/0 produce 5/2.5/0 with 400 highest", () => {
    expect(audiencePoints(400, 400)).toBe(5);
    expect(audiencePoints(200, 400)).toBe(2.5);
    expect(audiencePoints(0, 400)).toBe(0);
    expect(audiencePoints(100, 400)).toBe(1.25);
  });

  it("handles all-zero votes without division by zero", () => {
    expect(audiencePoints(0, 0)).toBe(0);
    expect(audiencePoints(10, 0)).toBe(0);
  });

  it("calculates overtime penalties at boundaries: 254s, 255s, 270s for 240s disciplines", () => {
    // 240 limit, 15s interval
    expect(timePenalty(240, 240, 15)).toBe(0);
    expect(timePenalty(254, 240, 15)).toBe(0);
    expect(timePenalty(255, 240, 15)).toBe(2);
    expect(timePenalty(269, 240, 15)).toBe(2);
    expect(timePenalty(270, 240, 15)).toBe(4);
  });

  it("calculates overtime penalties for Visual Arts at boundaries: 659s and 660s for 600s limit", () => {
    // 600 limit, 60s interval
    expect(timePenalty(600, 600, 60)).toBe(0);
    expect(timePenalty(659, 600, 60)).toBe(0);
    expect(timePenalty(660, 600, 60)).toBe(2);
    expect(timePenalty(719, 600, 60)).toBe(2);
    expect(timePenalty(720, 600, 60)).toBe(4);
  });

  it("revalidates scorecards and rejects null criteria, extra criteria, and invalid values", () => {
    const rubric = rubricFor("music");
    expect(validateScores([15, 15, 15, 15, 10], rubric).ok).toBe(true);

    // Missing/null criterion
    expect(validateScores([15, null, 15, 15, 10], rubric).ok).toBe(false);

    // Score exceeding maximum (max is 20 for criterion 0)
    expect(validateScores([25, 15, 15, 15, 10], rubric).ok).toBe(false);

    // Negative score
    expect(validateScores([-1, 15, 15, 15, 10], rubric).ok).toBe(false);

    // Non-integer score
    expect(validateScores([15.5, 15, 15, 15, 10], rubric).ok).toBe(false);

    // Extra or missing criteria length
    expect(validateScores([15, 15, 15, 15], rubric).ok).toBe(false);
    expect(validateScores([15, 15, 15, 15, 10, 5], rubric).ok).toBe(false);
  });

  it("requires distinct valid assigned judges and rejects duplicates in computeMasterRows", () => {
    const c1: Contestant = {
      id: "c1",
      code: "TEST01",
      name: "Alice",
      district: "Epe District",
      type: "music",
      title: "Song",
      bio: "Bio",
      order: 1,
      hue: 100,
    };

    // Duplicate judge1 cards, missing judge2 and judge3
    const duplicateCards: Scorecard[] = [
      {
        contestantId: "c1",
        judgeId: "judge1",
        scores: [15, 15, 15, 15, 10],
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "c1",
        judgeId: "judge1",
        scores: [16, 16, 16, 16, 10],
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
    ];

    const rows = computeMasterRows({
      contestants: [c1],
      scorecards: duplicateCards,
      voteCounts: { c1: 100 },
      durations: { c1: { contestantId: "c1", seconds: 200, verified: true } },
    });

    expect(rows[0]?.complete).toBe(false);
    expect(rows[0]?.judgeAverage).toBeNull();
    expect(rows[0]?.finalScore).toBeNull();
  });

  it("applies cross-type spiritual, technical, and creativity tie-breaks and gives distinct ranks", () => {
    // Music contestant
    const cMusic: Contestant = {
      id: "m1",
      code: "MUS001",
      name: "Music Performer",
      district: "Epe District",
      type: "music",
      title: "Praise",
      bio: "Bio",
      order: 1,
      hue: 120,
    };

    // Dance contestant
    const cDance: Contestant = {
      id: "d1",
      code: "DAN001",
      name: "Dance Performer",
      district: "Ijede District",
      type: "dance",
      title: "Choreo",
      bio: "Bio",
      order: 2,
      hue: 200,
    };

    // Both get final score 85.
    // Music rubric: spiritual index is 3, technical (vocal) is 0, creativity is 1.
    // Dance rubric: spiritual index is 3, technical (sync) is 1, creativity (choreo) is 0.
    // Let's give Dance a higher spiritual score (e.g. 18 vs 16)
    const cards: Scorecard[] = [
      // Music cards: spiritual (index 3) = 16
      {
        contestantId: "m1",
        judgeId: "judge1",
        scores: [17, 17, 17, 16, 13], // sum = 80
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "m1",
        judgeId: "judge2",
        scores: [17, 17, 17, 16, 13],
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "m1",
        judgeId: "judge3",
        scores: [17, 17, 17, 16, 13],
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "m1",
        judgeId: "judge4",
        scores: [17, 17, 17, 16, 13],
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      // Dance cards: spiritual (index 3) = 18
      {
        contestantId: "d1",
        judgeId: "judge1",
        scores: [17, 15, 17, 18, 13], // sum = 80
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "d1",
        judgeId: "judge2",
        scores: [17, 15, 17, 18, 13],
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "d1",
        judgeId: "judge3",
        scores: [17, 15, 17, 18, 13],
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "d1",
        judgeId: "judge4",
        scores: [17, 15, 17, 18, 13],
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
    ];

    const results = computeResults({
      contestants: [cMusic, cDance],
      scorecards: cards,
      voteCounts: { m1: 100, d1: 100 },
      durations: {
        m1: { contestantId: "m1", seconds: 200, verified: true },
        d1: { contestantId: "d1", seconds: 200, verified: true },
      },
    });

    // Both have same final score (85)
    expect(results[0]?.finalScore).toBe(results[1]?.finalScore);

    // Dance wins on spiritual tie-break (18 > 16) and gets rank 1, Music gets rank 2
    expect(results[0]?.contestant.id).toBe("d1");
    expect(results[0]?.rank).toBe(1);
    expect(results[1]?.contestant.id).toBe("m1");
    expect(results[1]?.rank).toBe(2);
    expect(results[0]?.tieFlags).toHaveLength(0);
    expect(results[1]?.tieFlags).toHaveLength(0);
  });

  it("flags unresolved ties as 'Judges review required' and blocks locking", () => {
    const c1: Contestant = {
      id: "a1",
      code: "A001",
      name: "Contestant A",
      district: "Epe District",
      type: "music",
      title: "Song A",
      bio: "Bio",
      order: 1,
      hue: 100,
    };
    const c2: Contestant = {
      id: "b1",
      code: "B001",
      name: "Contestant B",
      district: "Badagry District",
      type: "music",
      title: "Song B",
      bio: "Bio",
      order: 2,
      hue: 150,
    };

    // Identical scores across all criteria for both contestants
    const identicalScores = [17, 17, 17, 17, 12];
    const cards: Scorecard[] = [
      {
        contestantId: "a1",
        judgeId: "judge1",
        scores: identicalScores,
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "a1",
        judgeId: "judge2",
        scores: identicalScores,
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "a1",
        judgeId: "judge3",
        scores: identicalScores,
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "a1",
        judgeId: "judge4",
        scores: identicalScores,
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "b1",
        judgeId: "judge1",
        scores: identicalScores,
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "b1",
        judgeId: "judge2",
        scores: identicalScores,
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "b1",
        judgeId: "judge3",
        scores: identicalScores,
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
      {
        contestantId: "b1",
        judgeId: "judge4",
        scores: identicalScores,
        notes: "",
        status: "submitted",
        conflictDeclared: false,
        conflictResolved: false,
        reopened: false,
      },
    ];

    const results = computeResults({
      contestants: [c1, c2],
      scorecards: cards,
      voteCounts: { a1: 100, b1: 100 },
      durations: {
        a1: { contestantId: "a1", seconds: 200, verified: true },
        b1: { contestantId: "b1", seconds: 200, verified: true },
      },
    });

    expect(results[0]?.rank).toBe(1);
    expect(results[1]?.rank).toBe(1);
    expect(results[0]?.tieFlags).toContain("Judges' review required");
    expect(results[1]?.tieFlags).toContain("Judges' review required");

    const gates = verificationGates(
      results,
      cards,
      {
        a1: { contestantId: "a1", seconds: 200, verified: true },
        b1: { contestantId: "b1", seconds: 200, verified: true },
      },
      "closed",
      true,
    );

    expect(gates.noUnresolvedTies).toBe(false);
    expect(canLock(gates)).toBe(false);
  });
});

describe("Store & Mutation Rules", () => {
  it("loadSampleScores is idempotent and produces exactly 64 unique cards and 16 complete contestants", () => {
    resetDemo();

    // Call once
    loadSampleScores();
    let s = getState();
    expect(s.scorecards).toHaveLength(64);

    const rows1 = computeResults({
      contestants: s.contestants,
      scorecards: s.scorecards,
      voteCounts: { c01: 10 },
      durations: s.durations,
    });
    expect(rows1.filter((r) => r.complete)).toHaveLength(16);

    // Call twice
    loadSampleScores();
    s = getState();
    expect(s.scorecards).toHaveLength(64);

    const rows2 = computeResults({
      contestants: s.contestants,
      scorecards: s.scorecards,
      voteCounts: { c01: 10 },
      durations: s.durations,
    });
    expect(rows2.filter((r) => r.complete)).toHaveLength(16);
  });

  it("prevents changing contestant rubric once scores exist", () => {
    resetDemo();
    // c01 has submitted sample scores in seed state
    const result = updateContestant("c01", { type: "dance" });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("rubric_locked_by_scores");

    // Type remains music
    expect(getState().contestants.find((c) => c.id === "c01")?.type).toBe("music");
  });

  it("validates voting conditions and rejects unknown contestant IDs", () => {
    resetDemo();
    setVotingStatus("open");

    // Unknown contestant
    const res1 = castVote("nonexistent-id");
    expect(res1.ok).toBe(false);
    if (!res1.ok) expect(res1.reason).toBe("unknown_contestant");

    // Valid vote
    const res2 = castVote("c01");
    expect(res2.ok).toBe(true);

    // Second vote rejected
    const res3 = castVote("c02");
    expect(res3.ok).toBe(false);
    if (!res3.ok) expect(res3.reason).toBe("already_voted");
  });

  it("validates durations: accepts non-negative integers, rejects negatives or floats", () => {
    resetDemo();
    expect(setDuration("c01", 200).ok).toBe(true);
    expect(setDuration("c01", -10).ok).toBe(false);
    expect(setDuration("c01", 15.5).ok).toBe(false);
    expect(setDuration("c01", null).ok).toBe(true);
  });

  it("makes locking and publication idempotent and preserves snapshots", () => {
    resetDemo();
    loadSampleScores();
    setVotingStatus("closed");
    getState().scoreDeskConfirmed = true;

    const lock1 = lockResults();
    expect(lock1.ok).toBe(true);
    const lockedSnapshot1 = getState().results;
    expect(lockedSnapshot1).not.toBeNull();
    const lockedAt1 = lockedSnapshot1?.lockedAt;

    // Second lock attempt does not overwrite
    const lock2 = lockResults();
    expect(lock2.ok).toBe(true);
    expect(getState().results?.lockedAt).toBe(lockedAt1);

    // Publish
    const pub1 = publishResults();
    expect(pub1.ok).toBe(true);
    const publishedAt1 = getState().results?.publishedAt;
    expect(publishedAt1).toBeDefined();

    // Second publish is idempotent
    const pub2 = publishResults();
    expect(pub2.ok).toBe(true);
    expect(getState().results?.publishedAt).toBe(publishedAt1);
  });
});
