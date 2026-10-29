import { beforeEach, describe, expect, it } from "vitest";

import {
  checkLockReadiness,
  declareConflict,
  getState,
  loadSampleScores,
  lockResults,
  publishResults,
  recordTieResolution,
  reopenScorecard,
  resetDemo,
  resolveConflict,
  setDuration,
  setScoreDeskConfirmed,
  setVotingStatus,
  updateContestant,
} from "@/lib/demo/store";

describe("Organiser Workspace Operations & Collation Gates", () => {
  beforeEach(() => {
    resetDemo();
  });

  it("validates duration inputs: rejects negative, NaN, and fractional values", () => {
    const resNeg = setDuration("c01", -5);
    expect(resNeg.ok).toBe(false);
    expect(resNeg.reason).toBe("invalid_duration");

    const resFrac = setDuration("c01", 120.5);
    expect(resFrac.ok).toBe(false);
    expect(resFrac.reason).toBe("invalid_duration");

    const resNan = setDuration("c01", NaN);
    expect(resNan.ok).toBe(false);
    expect(resNan.reason).toBe("invalid_duration");

    const resValid = setDuration("c01", 230);
    expect(resValid.ok).toBe(true);
    expect(getState().durations["c01"]?.seconds).toBe(230);
  });

  it("reopens a submitted scorecard with a recorded reason, reverting status to draft", () => {
    loadSampleScores();

    const initialCard = getState().scorecards.find(
      (s) => s.contestantId === "c01" && s.judgeId === "judge1",
    );
    expect(initialCard?.status).toBe("submitted");
    expect(initialCard?.reopened).toBe(false);

    const reopenReason = "Clerical error on criterion 2";
    reopenScorecard("judge1", "c01", reopenReason);

    const updatedCard = getState().scorecards.find(
      (s) => s.contestantId === "c01" && s.judgeId === "judge1",
    );
    expect(updatedCard?.status).toBe("draft");
    expect(updatedCard?.reopened).toBe(true);
    expect(updatedCard?.reopenReason).toBe(reopenReason);

    // Verify activity logged
    const latestActivity = getState().activity[0];
    expect(latestActivity?.kind).toBe("scorecard_reopened");
    expect(latestActivity?.detail).toContain(reopenReason);
  });

  it("handles conflict of interest declaration and resolution with recorded determination", () => {
    declareConflict("judge2", "c02", true);

    const conflictedCard = getState().scorecards.find(
      (s) => s.contestantId === "c02" && s.judgeId === "judge2",
    );
    expect(conflictedCard?.conflictDeclared).toBe(true);
    expect(conflictedCard?.conflictResolved).toBe(false);

    resolveConflict("judge2", "c02");

    const resolvedCard = getState().scorecards.find(
      (s) => s.contestantId === "c02" && s.judgeId === "judge2",
    );
    expect(resolvedCard?.conflictResolved).toBe(true);

    const activity = getState().activity[0];
    expect(activity?.kind).toBe("conflict_resolved");
  });

  it("records collective judges' tie resolution and breaks tie deterministically", () => {
    const tieRes = recordTieResolution(
      "c01",
      "c02",
      "c01",
      "Collective judges decided superior vocal modulation",
    );
    expect(tieRes.ok).toBe(true);

    const state = getState();
    expect(state.tieResolutions).toHaveLength(1);
    expect(state.tieResolutions[0]?.winnerId).toBe("c01");
    expect(state.tieResolutions[0]?.reason).toBe(
      "Collective judges decided superior vocal modulation",
    );
  });

  it("blocks locking when voting is open or requirements are incomplete", () => {
    // Fresh state without sample scores
    setVotingStatus("open");
    const check1 = checkLockReadiness();
    expect(check1.ok).toBe(false);
    expect(check1.problems).toContain("Voting must be closed.");

    // Close voting, but still missing scores, durations, and score desk confirmation
    setVotingStatus("closed");
    const check2 = checkLockReadiness();
    expect(check2.ok).toBe(false);
    expect(check2.problems).toContain("Every contestant needs three valid submitted scorecards.");
    expect(check2.problems).toContain("The score desk must confirm the collation.");
  });

  it("allows locking when all 6 gates are satisfied, and performs idempotent locking", () => {
    loadSampleScores();
    setVotingStatus("closed");
    setScoreDeskConfirmed(true);

    const check = checkLockReadiness();
    expect(check.ok).toBe(true);
    expect(check.problems).toHaveLength(0);

    const lockResult1 = lockResults();
    expect(lockResult1.ok).toBe(true);

    const snapshot = getState().results;
    expect(snapshot).not.toBeNull();
    expect(snapshot?.lockedAt).toBeDefined();
    expect(snapshot?.published).toBe(false);
    expect(snapshot?.rows).toHaveLength(16);

    const originalLockedAt = snapshot?.lockedAt;

    // Idempotent locking: calling lockResults() again should not change original snapshot
    const lockResult2 = lockResults();
    expect(lockResult2.ok).toBe(true);
    expect(getState().results?.lockedAt).toBe(originalLockedAt);
  });

  it("publishes locked results idempotently without resetting snapshot data", () => {
    loadSampleScores();
    setVotingStatus("closed");
    setScoreDeskConfirmed(true);
    lockResults();

    const pubRes1 = publishResults();
    expect(pubRes1.ok).toBe(true);

    const publishedResults = getState().results;
    expect(publishedResults?.published).toBe(true);
    expect(publishedResults?.publishedAt).toBeDefined();

    const originalPublishedAt = publishedResults?.publishedAt;

    // Secondary publish is idempotent
    const pubRes2 = publishResults();
    expect(pubRes2.ok).toBe(true);
    expect(getState().results?.publishedAt).toBe(originalPublishedAt);
  });

  it("guards contestant rubric/type change after scores exist", () => {
    loadSampleScores();

    // Contestant c01 already has 3 submitted scorecards
    const updateRes = updateContestant("c01", {
      type: "dance",
    });

    expect(updateRes.ok).toBe(false);
    expect(updateRes.reason).toBe("rubric_locked_by_scores");
  });
});
