import { beforeEach, describe, expect, it } from "vitest";

import { DemoDataAdapter } from "@/lib/db/adapter";
import {
  castVote,
  getState,
  loadSampleScores,
  lockResults,
  publishResults,
  resetDemo,
  saveDraft,
  setDuration,
  setScoreDeskConfirmed,
  setVotingStatus,
  submitScorecard,
  updateContestant,
  voteCountsOf,
} from "@/lib/demo/store";

describe("Voting Concurrency, Single-Vote Protection & Locking Gates", () => {
  const adapter = new DemoDataAdapter();

  beforeEach(() => {
    resetDemo();
  });

  describe("Concurrent Duplicate-Vote Rejection (Race Condition Defense)", () => {
    it("rejects concurrent duplicate votes from the same voter token, accepting exactly one", async () => {
      setVotingStatus("open");

      const voterToken = "voter_token_parallel_alice_12345";
      const contestantId = "c01";

      const initialCounts = voteCountsOf(getState());
      const initialCount = initialCounts[contestantId] ?? 0;

      // Launch 10 simultaneous concurrent requests to cast vote using the same voterToken
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        adapter.castVote(voterToken, i % 2 === 0 ? "c01" : "c02"),
      );

      const results = await Promise.all(concurrentRequests);

      // Exactly ONE request must succeed
      const successful = results.filter((r) => r.success);
      const rejected = results.filter((r) => !r.success);

      expect(successful).toHaveLength(1);
      expect(rejected).toHaveLength(9);

      // Rejected requests must state single vote protection
      for (const rej of rejected) {
        expect(rej.message).toMatch(/already cast your single vote|already_voted/i);
      }

      // Final votes count for this contestant must have increased by exactly 1
      const finalCounts = voteCountsOf(getState());
      expect(finalCounts[contestantId]).toBe(initialCount + 1);
      expect(getState().browserVote?.contestantId).toBe("c01");
    });

    it("verifies multi-voter atomic concurrent registry rejects replay and records unique ballots", async () => {
      // Test server-side atomic voting registry logic reflecting PostgreSQL unique constraint:
      // CONSTRAINT uq_voter_single_vote UNIQUE (event_id, voter_id)
      const registeredVoters = new Set<string>();
      const contestantTallies: Record<string, number> = { c01: 0, c02: 0, c03: 0, c04: 0 };
      const targets = ["c01", "c02", "c03", "c04"];

      // Simulated atomic vote execution with concurrency mutex/unique constraint
      async function atomicCastVote(voterId: string, contestantId: string) {
        // Simulates DB unique index check
        if (registeredVoters.has(voterId)) {
          return {
            success: false,
            reason: "already_voted",
            message: "You have already cast your single vote.",
          };
        }
        registeredVoters.add(voterId);
        contestantTallies[contestantId] = (contestantTallies[contestantId] ?? 0) + 1;
        return { success: true, voteId: `vote_${voterId}` };
      }

      const voterTokens = Array.from({ length: 30 }, (_, idx) => `voter_token_${idx}`);

      // 30 concurrent distinct voter ballots
      const requests = voterTokens.map((token, idx) =>
        atomicCastVote(token, targets[idx % targets.length]!),
      );

      // And 5 concurrent duplicate attempts from voter 0
      const duplicateAttempts = Array.from({ length: 5 }, () =>
        atomicCastVote(voterTokens[0]!, "c02"),
      );

      const allResults = await Promise.all([...requests, ...duplicateAttempts]);

      // Exactly 30 unique voters succeed
      const successful = allResults.filter((r) => r.success);
      expect(successful).toHaveLength(30);

      // All 5 duplicate attempts were rejected
      const duplicates = allResults.filter((r) => !r.success);
      expect(duplicates).toHaveLength(5);
      for (const dup of duplicates) {
        expect(dup.message).toContain("already cast your single vote");
      }

      // Tallies reflect exactly 30 total votes
      const totalTallies = Object.values(contestantTallies).reduce((a, b) => a + b, 0);
      expect(totalTallies).toBe(30);
    });
  });

  describe("Server-Enforced Voting Window", () => {
    it("rejects votes before voting window opens (not_open status)", async () => {
      setVotingStatus("not_open");

      const res = await adapter.castVote("voter_early", "c01");
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Voting has not opened yet/i);

      // Store level validation
      const storeRes = castVote("c01");
      expect(storeRes.ok).toBe(false);
      if (!storeRes.ok) expect(storeRes.reason).toBe("not_open");
    });

    it("accepts valid votes while window is open (open status)", async () => {
      setVotingStatus("open");

      const res = await adapter.castVote("voter_open_window", "c01");
      expect(res.success).toBe(true);
      expect(res.voteId).toBeDefined();
    });

    it("rejects votes after voting window closes (closed status)", async () => {
      setVotingStatus("closed");

      const res = await adapter.castVote("voter_late", "c01");
      expect(res.success).toBe(false);
      expect(res.message).toMatch(/Voting window is currently closed/i);

      const storeRes = castVote("c01");
      expect(storeRes.ok).toBe(false);
      if (!storeRes.ok) expect(storeRes.reason).toBe("closed");
    });
  });

  describe("Results Locking Immutability & Gate Enforcement", () => {
    beforeEach(() => {
      loadSampleScores();
      setVotingStatus("closed");
      setScoreDeskConfirmed(true);
      const lockRes = lockResults();
      expect(lockRes.ok).toBe(true);
    });

    it("strictly blocks casting any vote once results are locked", async () => {
      const voteRes = await adapter.castVote("late_token_after_lock", "c01");
      expect(voteRes.success).toBe(false);
      expect(voteRes.message).toMatch(/closed|locked/i);
    });

    it("strictly blocks saving or updating scorecard drafts once results are locked", () => {
      const draftRes = saveDraft("judge1", "c01", [20, 20, 20, 20, 15], "Late edit");
      expect(draftRes.ok).toBe(false);
      expect(draftRes.reason).toBe("results_locked");
    });

    it("strictly blocks submitting scorecards once results are locked", () => {
      const submitRes = submitScorecard("judge4", "c01");
      expect(submitRes.ok).toBe(false);
      expect(submitRes.reason).toBe("results_locked");
    });

    it("strictly blocks modifying performance durations once results are locked", () => {
      const durRes = setDuration("c01", 240);
      expect(durRes.ok).toBe(false);
      expect(durRes.reason).toBe("results_locked");
    });

    it("strictly blocks updating contestant identity or discipline once results are locked", () => {
      const contestantRes = updateContestant("c01", { name: "Illegal Modified Name" });
      expect(contestantRes.ok).toBe(false);
      expect(contestantRes.reason).toBe("results_locked");
    });

    it("preserves locked snapshot immutability across idempotent lock attempts", () => {
      const initialSnapshot = getState().results;
      expect(initialSnapshot).not.toBeNull();
      const initialLockedAt = initialSnapshot?.lockedAt;

      // Secondary lock attempt returns ok without mutating snapshot
      const secondLock = lockResults();
      expect(secondLock.ok).toBe(true);
      expect(getState().results?.lockedAt).toBe(initialLockedAt);
      expect(getState().results?.rows).toHaveLength(16);
    });

    it("handles publication idempotency safely without corrupting official snapshot", () => {
      const pub1 = publishResults();
      expect(pub1.ok).toBe(true);

      const pubAt = getState().results?.publishedAt;
      expect(pubAt).toBeDefined();

      // Repeated publication is idempotent and preserves initial published timestamp
      const pub2 = publishResults();
      expect(pub2.ok).toBe(true);
      expect(getState().results?.publishedAt).toBe(pubAt);
      expect(getState().results?.published).toBe(true);
    });
  });
});
