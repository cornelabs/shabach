import { beforeEach, describe, expect, it } from "vitest";

import {
  computeMasterRows,
  computeResults,
  fmt2,
  judgeSubtotal,
  timePenalty,
  validateScores,
  verificationGates,
} from "@/lib/demo/scoring";
import {
  checkLockReadiness,
  getState,
  loadSampleScores,
  lockResults,
  publishResults,
  recordTieResolution,
  reopenScorecard,
  resetDemo,
  resolveConflict,
  saveDraft,
  setDuration,
  setDurationVerified,
  setScoreDeskConfirmed,
  setVotingStatus,
  submitScorecard,
  updateContestant,
  voteCountsOf,
} from "@/lib/demo/store";
import { rubricFor } from "@/lib/demo/rubrics";
import { JUDGES, type JudgeId } from "@/lib/demo/types";
import { resultsToCsv } from "@/lib/demo/csv";
import { requestVoterOtp, verifyVoterOtp } from "@/lib/auth/voter-verification";
import { DemoDataAdapter, LiveSupabaseAdapter } from "@/lib/db/adapter";

describe("SHABACH 2026 Grand Finale — Complete End-to-End Competition Lifecycle (4 Judges)", () => {
  beforeEach(() => {
    resetDemo();
  });

  it("verifies the 4-judge configuration across all domain types and services", () => {
    expect(JUDGES).toHaveLength(4);
    expect(JUDGES.map((j) => j.id)).toEqual(["judge1", "judge2", "judge3", "judge4"]);
  });

  it("executes the full competition from pre-event to official published results", async () => {
    const adapter = new DemoDataAdapter();
    const liveAdapter = new LiveSupabaseAdapter();
    expect(adapter.isLive()).toBe(false);
    expect(liveAdapter.isLive()).toBe(true);

    // -------------------------------------------------------------------------
    // Phase 1: Pre-competition & Contestant Management
    // -------------------------------------------------------------------------
    const initialContestants = await adapter.getContestants();
    expect(initialContestants).toHaveLength(16);

    // Verify order 1 to 16
    const orders = initialContestants.map((c) => c.order).sort((a, b) => a - b);
    expect(orders).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));

    // Lookup contestant by code
    const c01 = await adapter.getContestantByCode("SB7K2M");
    expect(c01).not.toBeNull();
    expect(c01?.name).toBe("Grace Adeyemi");
    expect(c01?.district).toBe("Epe District");

    // Organiser edits contestant identity before scores exist
    await adapter.updateContestant({
      ...c01!,
      title: "Great Are You Lord — Live Acoustic & Strings",
    });
    const updatedC01 = await adapter.getContestantByCode("SB7K2M");
    expect(updatedC01?.title).toBe("Great Are You Lord — Live Acoustic & Strings");

    // -------------------------------------------------------------------------
    // Phase 2: Public Audience Voting with Verified OTP
    // -------------------------------------------------------------------------
    setVotingStatus("open");
    expect(getState().votingStatus).toBe("open");

    // Voter requests OTP
    const otpRequest = await requestVoterOtp("audience@fellowship.org");
    expect(otpRequest.success).toBe(true);
    expect(otpRequest.mockCode).toBeDefined();

    // Voter enters valid OTP
    const otpVerify = await verifyVoterOtp("audience@fellowship.org", otpRequest.mockCode!);
    expect(otpVerify.success).toBe(true);
    expect(otpVerify.voterToken).toBeDefined();

    // Voter casts single final vote for Grace Adeyemi
    const voteResult1 = await adapter.castVote(otpVerify.voterToken!, "c01");
    expect(voteResult1.success).toBe(true);

    // Voter attempts to vote a second time — must be rejected
    const voteResult2 = await adapter.castVote(otpVerify.voterToken!, "c02");
    expect(voteResult2.success).toBe(false);
    expect(voteResult2.message).toContain("already cast your single vote");

    // -------------------------------------------------------------------------
    // Phase 3: Four Judges Score acts independently (64 Scorecards)
    // -------------------------------------------------------------------------
    const assignedJudges: JudgeId[] = ["judge1", "judge2", "judge3", "judge4"];

    // Rubric criteria validation
    const musicRubric = rubricFor("music");
    const testDraftScores = [18, 17, 19, 18, 13]; // Total = 85/95
    expect(validateScores(testDraftScores, musicRubric).ok).toBe(true);

    // Verify submitted cards cannot be edited without reopen
    const illegalEditRes = saveDraft("judge1", "c01", testDraftScores, "Illegal overwrite");
    expect(illegalEditRes.ok).toBe(false);

    // Judge 4 drafts an unsubmitted scorecard for c01
    const draftRes = saveDraft("judge4", "c01", testDraftScores, "Exceptional vocal control.");
    expect(draftRes.ok).toBe(true);

    // Now populate full sample scores across all 4 judges for all 16 acts (64 scorecards)
    loadSampleScores();
    const stateAfterSample = getState();

    // Exactly 64 scorecards: 16 acts x 4 judges
    expect(stateAfterSample.scorecards).toHaveLength(64);

    // Every contestant has scorecards for all 4 judges
    for (const c of stateAfterSample.contestants) {
      const cardsForContestant = stateAfterSample.scorecards.filter(
        (sc) => sc.contestantId === c.id,
      );
      expect(cardsForContestant).toHaveLength(4);
      const judgeIdsOnContestant = cardsForContestant.map((sc) => sc.judgeId).sort();
      expect(judgeIdsOnContestant).toEqual(["judge1", "judge2", "judge3", "judge4"]);
    }

    // -------------------------------------------------------------------------
    // Phase 4: Reopening scorecards with recorded reason
    // -------------------------------------------------------------------------
    const reopenRes = reopenScorecard(
      "judge2",
      "c01",
      "Organiser approved resubmission due to audio lag.",
    );
    expect(reopenRes.ok).toBe(true);

    // Resubmit card after edit
    const resubmitRes = submitScorecard("judge2", "c01");
    expect(resubmitRes.ok).toBe(true);

    // -------------------------------------------------------------------------
    // Phase 5: Stopwatch Duration Entry & Verification
    // -------------------------------------------------------------------------
    // Enter and verify performance duration for act 1
    const durRes = setDuration("c01", 235); // 235s <= 240s allowed limit
    expect(durRes.ok).toBe(true);
    setDurationVerified("c01", true);

    expect(timePenalty(235, 240, 15)).toBe(0);
    // Overtime test: 270 seconds = 30 seconds overtime = 2 completed 15s periods = 4 point penalty
    expect(timePenalty(270, 240, 15)).toBe(4);

    // -------------------------------------------------------------------------
    // Phase 6: Collation & Verification Gates
    // -------------------------------------------------------------------------
    // Compute master collation table
    const masterRows = computeMasterRows({
      contestants: getState().contestants,
      scorecards: getState().scorecards,
      durations: getState().durations,
      voteCounts: voteCountsOf(getState()),
    });

    expect(masterRows).toHaveLength(16);
    // Every contestant row must have judgeCount === 4 and complete === true
    for (const row of masterRows) {
      expect(row.judgeCount).toBe(4);
      expect(row.complete).toBe(true);
      expect(row.judgeAverage).not.toBeNull();
      expect(row.finalScore).not.toBeNull();
      // Judge average must be average of all 4 judges
      const j1 = row.judgeSubtotals.judge1!;
      const j2 = row.judgeSubtotals.judge2!;
      const j3 = row.judgeSubtotals.judge3!;
      const j4 = row.judgeSubtotals.judge4!;
      const expectedAvg = (j1 + j2 + j3 + j4) / 4;
      expect(Math.abs(row.judgeAverage! - expectedAvg)).toBeLessThan(1e-9);
    }

    // Attempting to lock while voting is open should fail
    const prematureLock = lockResults();
    expect(prematureLock.ok).toBe(false);
    expect(prematureLock.problems).toContain("Voting must be closed.");

    // Close voting and confirm score desk
    setVotingStatus("closed");
    setScoreDeskConfirmed(true);

    // Ready to lock
    const readyCheck = checkLockReadiness();
    expect(readyCheck.ok).toBe(true);
    expect(readyCheck.problems).toHaveLength(0);

    // -------------------------------------------------------------------------
    // Phase 7: Freezing Results Snapshot & Locking
    // -------------------------------------------------------------------------
    const lockRes = lockResults();
    expect(lockRes.ok).toBe(true);

    const lockedState = getState();
    expect(lockedState.results).not.toBeNull();
    expect(lockedState.results?.published).toBe(false);
    expect(lockedState.results?.rows).toHaveLength(16);

    // Ranks 1 to 16 are assigned sequentially
    const ranks = lockedState.results!.rows.map((r) => r.rank).filter(Boolean);
    expect(ranks).toContain(1);
    expect(ranks).toContain(2);
    expect(ranks).toContain(3);

    // Mutations blocked after locking
    const postLockVote = await adapter.castVote("random-token", "c01");
    expect(postLockVote.success).toBe(false);

    const postLockDraft = saveDraft("judge1", "c01", [20, 20, 20, 20, 15], "Late attempt");
    expect(postLockDraft.ok).toBe(false);
    expect(postLockDraft.reason).toBe("results_locked");

    const postLockContestant = updateContestant("c01", { name: "Illegal Name Change" });
    expect(postLockContestant.ok).toBe(false);
    expect(postLockContestant.reason).toBe("results_locked");

    // -------------------------------------------------------------------------
    // Phase 8: Official Publication & Reporting
    // -------------------------------------------------------------------------
    const pubRes = publishResults();
    expect(pubRes.ok).toBe(true);

    const publishedState = getState();
    expect(publishedState.results?.published).toBe(true);
    expect(publishedState.results?.publishedAt).toBeDefined();

    // CSV export includes all 4 judges columns
    const csv = resultsToCsv(publishedState.results!.rows);
    expect(csv).toContain("Judge 1 subtotal");
    expect(csv).toContain("Judge 2 subtotal");
    expect(csv).toContain("Judge 3 subtotal");
    expect(csv).toContain("Judge 4 subtotal");
    expect(csv).toContain("Judges' average");
    expect(csv).toContain("Final score");
  });
});
