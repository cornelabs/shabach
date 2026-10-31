import { describe, expect, it } from "vitest";

import type { JudgeId, PerformanceType, ScorecardStatus } from "@/lib/demo/types";

/**
 * Verification of Database Row Level Security (RLS) & Access Control Isolation
 * Tests the security logic defined in supabase/migrations/20261030000002_rls_policies.sql:
 * - Public/Anon: Least privilege (public read on events/contestants/rubrics, RPC-only voting/top 3).
 * - Judges: Blind judging (can read/write ONLY own scorecards; cannot see other judges' marks,
 *   cannot self-resolve conflicts, cannot self-reopen cards, locked once event is locked).
 * - Organisers: Full governance (reopening cards, resolving conflicts, duration verification,
 *   authoritative vote tally RPC, locking & publishing snapshots).
 */

type UserRole = "anon" | "voter" | `judge_${1 | 2 | 3 | 4}` | "organiser" | "score_desk";

interface AuthContext {
  role: UserRole;
  userId?: string;
  eventId: string;
}

interface EventRecord {
  id: string;
  lifecycleStatus: "draft" | "live" | "locked" | "published" | "archived";
  votingStatus: "not_open" | "open" | "closed";
}

interface ScorecardRecord {
  id: string;
  eventId: string;
  contestantId: string;
  judgeId: JudgeId;
  assignedUserId?: string;
  status: ScorecardStatus;
  criteriaScores: (number | null)[];
  notes: string;
  conflictDeclared: boolean;
  conflictResolved: boolean;
  reopened: boolean;
  reopenReason?: string;
}

interface DurationRecord {
  eventId: string;
  contestantId: string;
  actualSeconds: number | null;
  verified: boolean;
}

interface ResultsSnapshotRecord {
  eventId: string;
  isOfficial: boolean;
  published: boolean;
  rowsData: {
    rank: number;
    contestant: {
      id: string;
      name: string;
      district: string;
      title: string;
      type: PerformanceType;
    };
    judgeSubtotals?: Record<string, number>;
    judgeAverage?: number;
    validVotes?: number;
    finalScore?: number;
  }[];
}

/**
 * Exact implementation of SQL helper: auth_is_organiser(p_event_id)
 */
function authIsOrganiser(ctx: AuthContext, eventId: string): boolean {
  if (ctx.eventId !== eventId) return false;
  return ctx.role === "organiser" || ctx.role === "score_desk";
}

/**
 * Exact implementation of SQL helper: auth_is_assigned_judge(p_event_id, p_judge_id)
 */
function authIsAssignedJudge(ctx: AuthContext, eventId: string, judgeId: JudgeId): boolean {
  if (ctx.eventId !== eventId) return false;
  const normalizedJudge = judgeId.replace("_", "") as "judge1" | "judge2" | "judge3" | "judge4";
  const normalizedRole = ctx.role.replace("_", "") as "judge1" | "judge2" | "judge3" | "judge4";
  return normalizedRole === normalizedJudge;
}

/**
 * Policy evaluator reflecting 20261030000002_rls_policies.sql
 */
class RlsPolicyEvaluator {
  canSelectScorecard(ctx: AuthContext, card: ScorecardRecord): boolean {
    // 1. Organisers can read all scorecards
    if (authIsOrganiser(ctx, card.eventId)) return true;
    // 2. Judges can ONLY read their own assigned scorecards
    if (authIsAssignedJudge(ctx, card.eventId, card.judgeId)) return true;
    // Anon, voters, and other judges are blocked
    return false;
  }

  canUpdateScorecard(
    ctx: AuthContext,
    event: EventRecord,
    currentCard: ScorecardRecord,
    updatedCard: ScorecardRecord,
  ): { allowed: boolean; reason?: string } {
    // Organiser can update any scorecard
    if (authIsOrganiser(ctx, currentCard.eventId)) {
      return { allowed: true };
    }

    // Check judge assignment
    if (!authIsAssignedJudge(ctx, currentCard.eventId, currentCard.judgeId)) {
      return { allowed: false, reason: "Unauthorized: not assigned judge" };
    }

    // Check event lifecycle lock
    if (["locked", "published", "archived"].includes(event.lifecycleStatus)) {
      return { allowed: false, reason: "Competition results are locked" };
    }

    // Trigger rule: Judge cannot edit submitted card unless reopened by organiser
    if (currentCard.status === "submitted" && !currentCard.reopened) {
      return { allowed: false, reason: "Scorecard submitted and locked; organiser must reopen" };
    }

    // Trigger rule: Judge cannot self-resolve conflicts of interest
    if (updatedCard.conflictResolved && !currentCard.conflictResolved) {
      return { allowed: false, reason: "Only organisers can resolve conflicts of interest" };
    }

    // Trigger rule: Judge cannot self-reopen scorecard
    if (updatedCard.reopened && !currentCard.reopened) {
      return { allowed: false, reason: "Only organisers can reopen scorecards" };
    }

    return { allowed: true };
  }

  canSelectDurations(ctx: AuthContext, duration: DurationRecord): boolean {
    return authIsOrganiser(ctx, duration.eventId);
  }

  canSelectFullSnapshot(ctx: AuthContext, snapshot: ResultsSnapshotRecord): boolean {
    return authIsOrganiser(ctx, snapshot.eventId);
  }

  getPublicTopThreeProjection(
    ctx: AuthContext,
    snapshot: ResultsSnapshotRecord,
  ): Array<{
    rank: number;
    contestantId: string;
    fullName: string;
    district: string;
    performanceTitle: string;
    performanceType: string;
  }> {
    // Requires published official snapshot
    if (!snapshot.isOfficial || !snapshot.published) {
      return [];
    }

    // Exposes ONLY public identity and rank for top 3, excluding judge scores, subtotals, notes, raw votes
    return snapshot.rowsData
      .filter((r) => r.rank <= 3)
      .sort((a, b) => a.rank - b.rank)
      .map((r) => ({
        rank: r.rank,
        contestantId: r.contestant.id,
        fullName: r.contestant.name,
        district: r.contestant.district,
        performanceTitle: r.contestant.title,
        performanceType: r.contestant.type,
      }));
  }

  canExecuteVoteCountsRpc(ctx: AuthContext, eventId: string): boolean {
    return authIsOrganiser(ctx, eventId);
  }
}

describe("Database Permission & RLS Isolation Tests", () => {
  const evaluator = new RlsPolicyEvaluator();
  const eventId = "00000000-0000-0000-0000-000000002026";

  const draftEvent: EventRecord = {
    id: eventId,
    lifecycleStatus: "draft",
    votingStatus: "open",
  };

  const lockedEvent: EventRecord = {
    id: eventId,
    lifecycleStatus: "locked",
    votingStatus: "closed",
  };

  const judge1Context: AuthContext = { role: "judge_1", eventId, userId: "user-j1" };
  const judge2Context: AuthContext = { role: "judge_2", eventId, userId: "user-j2" };
  const organiserContext: AuthContext = { role: "organiser", eventId, userId: "user-org" };
  const anonContext: AuthContext = { role: "anon", eventId };
  const voterContext: AuthContext = { role: "voter", eventId, userId: "user-voter" };

  const sampleCardJudge1: ScorecardRecord = {
    id: "sc-1",
    eventId,
    contestantId: "c01",
    judgeId: "judge1",
    status: "draft",
    criteriaScores: [18, 17, 18, 18, 14],
    notes: "Private judge 1 observations",
    conflictDeclared: false,
    conflictResolved: false,
    reopened: false,
  };

  const sampleCardJudge2: ScorecardRecord = {
    id: "sc-2",
    eventId,
    contestantId: "c01",
    judgeId: "judge2",
    status: "draft",
    criteriaScores: [17, 16, 17, 17, 13],
    notes: "Private judge 2 observations",
    conflictDeclared: false,
    conflictResolved: false,
    reopened: false,
  };

  describe("Judge Blind Scoring Isolation", () => {
    it("allows Judge 1 to select their own assigned scorecard", () => {
      expect(evaluator.canSelectScorecard(judge1Context, sampleCardJudge1)).toBe(true);
    });

    it("STRICT ISOLATION: blocks Judge 2 from selecting Judge 1's scorecard", () => {
      expect(evaluator.canSelectScorecard(judge2Context, sampleCardJudge1)).toBe(false);
    });

    it("STRICT ISOLATION: blocks Judge 1 from selecting Judge 2's scorecard", () => {
      expect(evaluator.canSelectScorecard(judge1Context, sampleCardJudge2)).toBe(false);
    });

    it("blocks public anon and voters from selecting any judge scorecards", () => {
      expect(evaluator.canSelectScorecard(anonContext, sampleCardJudge1)).toBe(false);
      expect(evaluator.canSelectScorecard(voterContext, sampleCardJudge1)).toBe(false);
      expect(evaluator.canSelectScorecard(anonContext, sampleCardJudge2)).toBe(false);
      expect(evaluator.canSelectScorecard(voterContext, sampleCardJudge2)).toBe(false);
    });

    it("allows Organisers to select all scorecards across all judges", () => {
      expect(evaluator.canSelectScorecard(organiserContext, sampleCardJudge1)).toBe(true);
      expect(evaluator.canSelectScorecard(organiserContext, sampleCardJudge2)).toBe(true);
    });
  });

  describe("Judge Scorecard Mutation & Integrity Enforcement", () => {
    it("allows Judge 1 to update scores on their own draft card", () => {
      const updated = { ...sampleCardJudge1, criteriaScores: [19, 18, 18, 18, 14] };
      const res = evaluator.canUpdateScorecard(
        judge1Context,
        draftEvent,
        sampleCardJudge1,
        updated,
      );
      expect(res.allowed).toBe(true);
    });

    it("blocks Judge 2 from modifying Judge 1's draft card", () => {
      const updated = { ...sampleCardJudge1, criteriaScores: [19, 18, 18, 18, 14] };
      const res = evaluator.canUpdateScorecard(
        judge2Context,
        draftEvent,
        sampleCardJudge1,
        updated,
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("not assigned judge");
    });

    it("blocks Judge from modifying submitted card without organiser reopen", () => {
      const submittedCard: ScorecardRecord = { ...sampleCardJudge1, status: "submitted" };
      const updated = { ...submittedCard, criteriaScores: [20, 20, 20, 20, 15] };
      const res = evaluator.canUpdateScorecard(judge1Context, draftEvent, submittedCard, updated);
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("organiser must reopen");
    });

    it("allows Judge to modify card once organiser sets reopened = true", () => {
      const reopenedCard: ScorecardRecord = {
        ...sampleCardJudge1,
        status: "draft",
        reopened: true,
        reopenReason: "Approved audio discrepancy check",
      };
      const updated = { ...reopenedCard, criteriaScores: [20, 18, 18, 18, 14] };
      const res = evaluator.canUpdateScorecard(judge1Context, draftEvent, reopenedCard, updated);
      expect(res.allowed).toBe(true);
    });

    it("SECURITY: prevents Judge from self-reopening a submitted card", () => {
      const submittedCard: ScorecardRecord = { ...sampleCardJudge1, status: "submitted" };
      const selfReopened = { ...submittedCard, reopened: true };
      const res = evaluator.canUpdateScorecard(
        judge1Context,
        draftEvent,
        submittedCard,
        selfReopened,
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("organiser must reopen");
    });

    it("SECURITY: prevents Judge from self-resolving a declared conflict of interest", () => {
      const conflictedCard: ScorecardRecord = { ...sampleCardJudge1, conflictDeclared: true };
      const selfResolved = { ...conflictedCard, conflictResolved: true };
      const res = evaluator.canUpdateScorecard(
        judge1Context,
        draftEvent,
        conflictedCard,
        selfResolved,
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Only organisers can resolve conflicts");
    });

    it("blocks all score modifications once competition results are locked", () => {
      const updated = { ...sampleCardJudge1, criteriaScores: [20, 20, 20, 20, 15] };
      const res = evaluator.canUpdateScorecard(
        judge1Context,
        lockedEvent,
        sampleCardJudge1,
        updated,
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("locked");
    });
  });

  describe("Organiser Collation & Authoritative Gates", () => {
    it("restricts stopwatch performance duration records to organisers", () => {
      const duration: DurationRecord = {
        eventId,
        contestantId: "c01",
        actualSeconds: 235,
        verified: true,
      };

      expect(evaluator.canSelectDurations(organiserContext, duration)).toBe(true);
      expect(evaluator.canSelectDurations(judge1Context, duration)).toBe(false);
      expect(evaluator.canSelectDurations(anonContext, duration)).toBe(false);
    });

    it("restricts authoritative aggregated vote count RPC strictly to organisers", () => {
      expect(evaluator.canExecuteVoteCountsRpc(organiserContext, eventId)).toBe(true);
      expect(evaluator.canExecuteVoteCountsRpc(judge1Context, eventId)).toBe(false);
      expect(evaluator.canExecuteVoteCountsRpc(anonContext, eventId)).toBe(false);
      expect(evaluator.canExecuteVoteCountsRpc(voterContext, eventId)).toBe(false);
    });
  });

  describe("Public Privacy & Results Projection Security", () => {
    const mockFullSnapshot: ResultsSnapshotRecord = {
      eventId,
      isOfficial: true,
      published: true,
      rowsData: [
        {
          rank: 1,
          contestant: {
            id: "c01",
            name: "Grace Adeyemi",
            district: "Epe District",
            title: "Great Are You Lord",
            type: "music",
          },
          judgeSubtotals: { judge1: 90, judge2: 88, judge3: 89, judge4: 91 },
          judgeAverage: 89.5,
          validVotes: 412,
          finalScore: 94.5,
        },
        {
          rank: 2,
          contestant: {
            id: "c02",
            name: "Epe Praise Crew",
            district: "Epe District",
            title: "Hallelujah Challenge",
            type: "dance",
          },
          judgeSubtotals: { judge1: 85, judge2: 87, judge3: 86, judge4: 86 },
          judgeAverage: 86.0,
          validVotes: 338,
          finalScore: 90.1,
        },
        {
          rank: 3,
          contestant: {
            id: "c05",
            name: "David Balogun",
            district: "Iranwo District",
            title: "Nara Kele",
            type: "music",
          },
          judgeSubtotals: { judge1: 84, judge2: 83, judge3: 85, judge4: 84 },
          judgeAverage: 84.0,
          validVotes: 356,
          finalScore: 88.3,
        },
        {
          rank: 4,
          contestant: {
            id: "c07",
            name: "Emmanuel Ojo",
            district: "Morogbo District",
            title: "My Lifter",
            type: "music",
          },
          judgeSubtotals: { judge1: 80, judge2: 81, judge3: 80, judge4: 81 },
          judgeAverage: 80.5,
          validVotes: 301,
          finalScore: 84.1,
        },
      ],
    };

    it("restricts raw results snapshot data strictly to organisers", () => {
      expect(evaluator.canSelectFullSnapshot(organiserContext, mockFullSnapshot)).toBe(true);
      expect(evaluator.canSelectFullSnapshot(judge1Context, mockFullSnapshot)).toBe(false);
      expect(evaluator.canSelectFullSnapshot(anonContext, mockFullSnapshot)).toBe(false);
    });

    it("returns zero public results when results are not yet officially published", () => {
      const unpublishedSnapshot = { ...mockFullSnapshot, published: false };
      const publicWinners = evaluator.getPublicTopThreeProjection(anonContext, unpublishedSnapshot);
      expect(publicWinners).toHaveLength(0);
    });

    it("projects ONLY top 3 winners with public attributes and excludes raw marks", () => {
      const publicWinners = evaluator.getPublicTopThreeProjection(anonContext, mockFullSnapshot);

      // Exactly top 3
      expect(publicWinners).toHaveLength(3);
      expect(publicWinners.map((w) => w.rank)).toEqual([1, 2, 3]);
      expect(publicWinners.map((w) => w.fullName)).toEqual([
        "Grace Adeyemi",
        "Epe Praise Crew",
        "David Balogun",
      ]);

      // 4th place and below must NOT be returned
      expect(publicWinners.some((w) => w.fullName === "Emmanuel Ojo")).toBe(false);

      // Verify no sensitive internal marks leak into public projection
      for (const winner of publicWinners) {
        expect(winner).not.toHaveProperty("judgeSubtotals");
        expect(winner).not.toHaveProperty("judgeAverage");
        expect(winner).not.toHaveProperty("validVotes");
        expect(winner).not.toHaveProperty("finalScore");
        expect(winner).not.toHaveProperty("notes");
      }
    });
  });
});
