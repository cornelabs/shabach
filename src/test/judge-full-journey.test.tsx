import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScorecardEditor } from "@/components/judge/scorecard-editor";
import { rubricFor, RUBRICS } from "@/lib/demo/rubrics";
import { judgeSubtotal, validateScores } from "@/lib/demo/scoring";
import {
  declareConflict,
  getCard,
  getState,
  reopenScorecard,
  resetDemo,
  resolveConflict,
  saveDraft,
  setActiveJudge,
  submitScorecard,
} from "@/lib/demo/store";
import { JUDGES, type JudgeId, type PerformanceType } from "@/lib/demo/types";
import { routeTree } from "@/routeTree.gen";
import { Route as JudgeDetailRoute } from "@/routes/judges.$judgeId";
import { Route as JudgesIndexRoute } from "@/routes/judges.index";

// Mock TanStack Router Link & navigation in rendering tests
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({
      children,
      to,
      className,
    }: {
      children: React.ReactNode;
      to: string;
      className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
    useNavigate: () => vi.fn(),
    useMatchRoute: () => () => false,
  };
});

describe("Phase 7: Full-Platform Judge Journey & Scoring Verification", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  beforeEach(() => {
    resetDemo();
  });

  describe("1. All Four Judge Seats Routing & Identity (/judges/$judgeId)", () => {
    it("routes and resolves all 4 judge seats independently", () => {
      const seats: JudgeId[] = ["judge1", "judge2", "judge3", "judge4"];

      for (const seat of seats) {
        const matches = router.matchRoutes(`/judges/${seat}`);
        expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
        expect(matches.some((m) => m.routeId === "/judges/$judgeId")).toBe(true);

        const targetMatch = matches.find((m) => m.routeId === "/judges/$judgeId");
        expect(targetMatch?.params).toHaveProperty("judgeId", seat);
      }
    });

    it("renders workspace correctly for every judge seat with distinct headers and badge", () => {
      const seats: JudgeId[] = ["judge1", "judge2", "judge3", "judge4"];

      for (const seat of seats) {
        const judgeConfig = JUDGES.find((j) => j.id === seat)!;
        const spyUseParams = vi.spyOn(JudgeDetailRoute, "useParams").mockReturnValue({
          judgeId: seat,
        });

        const WorkspaceComponent = JudgeDetailRoute.options.component!;
        const { unmount } = render(<WorkspaceComponent />);

        // Header displays this judge's name
        expect(
          screen.getByRole("heading", { name: `${judgeConfig.name}'s scorecards` }),
        ).toBeInTheDocument();

        // Active session badge reflects this judge seat
        expect(screen.getByText(`Active Seat: ${judgeConfig.name}`)).toBeInTheDocument();

        // Back link to seats is present
        expect(screen.getByText("← Judge seats")).toBeInTheDocument();

        // Contestant list is populated
        expect(screen.getByText("Grace Adeyemi")).toBeInTheDocument();

        spyUseParams.mockRestore();
        unmount();
      }
    });
  });

  describe("2. Complete 64 Scorecard Matrix (4 Judges x 16 Acts)", () => {
    it("manages independent scorecards for all 64 judge-contestant pairs", () => {
      const state = getState();
      expect(state.contestants).toHaveLength(16);
      expect(JUDGES).toHaveLength(4);

      // Verify each judge has access to a unique card for every contestant
      const judgeSeats: JudgeId[] = ["judge1", "judge2", "judge3", "judge4"];
      let totalAssignedCards = 0;

      for (const judgeId of judgeSeats) {
        for (const contestant of state.contestants) {
          const card = getCard(getState(), judgeId, contestant.id);
          expect(card).toBeDefined();
          expect(card.judgeId).toBe(judgeId);
          expect(card.contestantId).toBe(contestant.id);
          totalAssignedCards++;
        }
      }

      expect(totalAssignedCards).toBe(64);
    });

    it("populates and independently tracks all 64 scorecards through draft and submission", () => {
      const contestants = getState().contestants;

      // Judge 4 has clean unsubmitted cards for all 16 acts
      for (const contestant of contestants) {
        const rubric = rubricFor(contestant.type);
        const validScores = rubric.criteria.map((c) => Math.min(c.max, 16));
        const res = submitScorecard(
          "judge4",
          contestant.id,
          validScores,
          "Judge 4 comprehensive review",
        );
        expect(res.ok).toBe(true);
      }

      // Judge 2 saves drafts for acts
      for (const contestant of contestants) {
        const card = getCard(getState(), "judge2", contestant.id);
        if (card.status !== "submitted") {
          const rubric = rubricFor(contestant.type);
          const draftScores = rubric.criteria.map((c) => Math.min(c.max, 14));
          const res = saveDraft("judge2", contestant.id, draftScores, "Judge 2 early draft");
          expect(res.ok).toBe(true);
        }
      }

      const updatedState = getState();

      // Verify Judge 4 cards are all submitted
      const judge4Cards = contestants.map((c) => getCard(updatedState, "judge4", c.id));
      expect(judge4Cards.every((c) => c.status === "submitted")).toBe(true);
      expect(judge4Cards.every((c) => c.notes === "Judge 4 comprehensive review")).toBe(true);

      // Verify all 4 judges each have 16 distinct cards (total 64)
      const judgeSeats: JudgeId[] = ["judge1", "judge2", "judge3", "judge4"];
      for (const jId of judgeSeats) {
        const cards = contestants.map((c) => getCard(updatedState, jId, c.id));
        expect(cards).toHaveLength(16);
      }
    });
  });

  describe("3. All 5 Performance Rubrics Verification", () => {
    const rubricTypes: PerformanceType[] = [
      "music",
      "dance",
      "spoken_word",
      "mono_drama",
      "visual_arts",
    ];

    it("verifies all 5 rubrics enforce 5 criteria summing to 95 raw points", () => {
      for (const type of rubricTypes) {
        const rubric = RUBRICS[type];
        expect(rubric).toBeDefined();
        expect(rubric.criteria).toHaveLength(5);

        // First 4 criteria have max 20, last criterion (audience impact) has max 15
        const firstFour = rubric.criteria.slice(0, 4);
        expect(firstFour.every((c) => c.max === 20)).toBe(true);
        expect(rubric.criteria[4]?.max).toBe(15);

        const totalMax = rubric.criteria.reduce((sum, c) => sum + c.max, 0);
        expect(totalMax).toBe(95);

        // Each criterion has non-empty guidance
        expect(rubric.criteria.every((c) => c.guidance.trim().length > 0)).toBe(true);

        // Has tiebreak indices defined
        expect(rubric.tiebreak).toBeDefined();
        expect(rubric.timeLimitSec).toBeGreaterThan(0);
      }
    });

    it("accurately scores acts across all 5 rubrics with boundary validation", () => {
      for (const type of rubricTypes) {
        const rubric = RUBRICS[type];

        // Valid maximum score (95)
        const perfectScores = rubric.criteria.map((c) => c.max);
        const perfectSubtotal = judgeSubtotal(perfectScores);
        expect(perfectSubtotal).toBe(95);
        expect(validateScores(perfectScores, rubric).ok).toBe(true);

        // Valid partial score
        const midScores = rubric.criteria.map((c) => Math.floor(c.max / 2));
        expect(validateScores(midScores, rubric).ok).toBe(true);

        // Invalid score (missing one value)
        const incompleteScores = [18, 17, null, 16, 12];
        const valIncomplete = validateScores(incompleteScores, rubric);
        expect(valIncomplete.ok).toBe(false);

        // Invalid score (exceeding criterion max)
        const excessiveScores = [25, 20, 20, 20, 15]; // Criterion 1 max is 20
        const valExcessive = validateScores(excessiveScores, rubric);
        expect(valExcessive.ok).toBe(false);
      }
    });
  });

  describe("4. Draft Saving & Unsaved Score Submit Flow", () => {
    it("submits modified scores directly without saving draft first, storing exact reviewed values", () => {
      const contestantId = "c05"; // Music act
      const judgeId: JudgeId = "judge2";

      // 1. Initial draft saved
      saveDraft(judgeId, contestantId, [12, 12, 12, 12, 8], "Initial rough draft");
      const draftCard = getCard(getState(), judgeId, contestantId);
      expect(draftCard.status).toBe("draft");
      expect(draftCard.subtotal).toBe(56);

      // 2. Direct review & submission with updated scores
      const reviewedScores = [18, 19, 17, 18, 14]; // Subtotal = 86
      const reviewedNotes = "Outstanding final acoustic delivery.";

      const res = submitScorecard(judgeId, contestantId, reviewedScores, reviewedNotes);
      expect(res.ok).toBe(true);

      // 3. Store holds exact reviewed values
      const submittedCard = getCard(getState(), judgeId, contestantId);
      expect(submittedCard.status).toBe("submitted");
      expect(submittedCard.scores).toEqual(reviewedScores);
      expect(submittedCard.subtotal).toBe(86);
      expect(submittedCard.notes).toBe(reviewedNotes);
    });

    it("UI: enters scores, edits without saving draft, and confirms submission", () => {
      const contestantId = "c01"; // Music act
      const judgeId: JudgeId = "judge4"; // Fresh, un-submitted seat

      render(<ScorecardEditor judgeId={judgeId} contestantId={contestantId} />);

      const inputs = screen.getAllByRole("textbox", { name: /score, out of/i });
      expect(inputs).toHaveLength(5);

      const targetScores = ["18", "19", "17", "18", "13"];
      inputs.forEach((input, idx) => {
        fireEvent.change(input, { target: { value: targetScores[idx] } });
      });

      const notesField = screen.getByPlaceholderText(/Optional observations for the score desk/i);
      fireEvent.change(notesField, { target: { value: "Choreography was tightly synchronized" } });

      // Subtotal displays 85
      expect(screen.getByText("85")).toBeInTheDocument();

      // Click "Review & submit" directly
      const reviewButton = screen.getByRole("button", { name: /Review & submit/i });
      fireEvent.click(reviewButton);

      // Review confirmation banner is displayed
      expect(screen.getByText("Review before submitting")).toBeInTheDocument();

      // Click "Confirm submission"
      const confirmButton = screen.getByRole("button", { name: /Confirm submission/i });
      fireEvent.click(confirmButton);

      // Scorecard submitted and locked
      const card = getCard(getState(), judgeId, contestantId);
      expect(card.status).toBe("submitted");
      expect(card.scores).toEqual([18, 19, 17, 18, 13]);
      expect(card.subtotal).toBe(85);
      expect(card.notes).toBe("Choreography was tightly synchronized");

      // Actions are now locked
      expect(screen.queryByRole("button", { name: /Review & submit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Save draft/i })).not.toBeInTheDocument();
    });
  });

  describe("5. Conflict of Interest Declaration & Resolution Flow", () => {
    it("blocks submission when conflict is declared, then permits submission once resolved", () => {
      const contestantId = "c03";
      const judgeId: JudgeId = "judge4";

      // Save valid draft scores
      saveDraft(judgeId, contestantId, [17, 17, 17, 17, 13], "Valid draft");

      // Declare conflict of interest
      declareConflict(judgeId, contestantId, true);
      const conflictedCard = getCard(getState(), judgeId, contestantId);
      expect(conflictedCard.conflictDeclared).toBe(true);
      expect(conflictedCard.conflictResolved).toBe(false);

      // Attempt to submit should fail with unresolved_conflict
      const submitAttempt = submitScorecard(judgeId, contestantId, [17, 17, 17, 17, 13]);
      expect(submitAttempt.ok).toBe(false);
      expect(submitAttempt.reason).toBe("unresolved_conflict");

      // Organiser resolves the conflict
      resolveConflict(judgeId, contestantId);
      const resolvedCard = getCard(getState(), judgeId, contestantId);
      expect(resolvedCard.conflictResolved).toBe(true);

      // Submission now succeeds
      const resAfterResolution = submitScorecard(
        judgeId,
        contestantId,
        [17, 17, 17, 17, 13],
        "Post-resolution submission",
      );
      expect(resAfterResolution.ok).toBe(true);
      expect(getCard(getState(), judgeId, contestantId).status).toBe("submitted");
    });
  });

  describe("6. Score Reopening with Recorded Reason", () => {
    it("locks submitted card, allows organiser reopen with reason, and supports re-submission", () => {
      const contestantId = "c04";
      const judgeId: JudgeId = "judge1";

      // 1. Initial submission
      submitScorecard(judgeId, contestantId, [15, 15, 15, 15, 10], "Initial performance score");
      expect(getCard(getState(), judgeId, contestantId).status).toBe("submitted");

      // Submitting again while locked is rejected
      expect(submitScorecard(judgeId, contestantId).ok).toBe(false);

      // 2. Organiser reopens card with explicit reason
      const reopenReason = "Technical audio microphone drop in verse 1 — rehearing allowed";
      reopenScorecard(judgeId, contestantId, reopenReason);

      const reopenedCard = getCard(getState(), judgeId, contestantId);
      expect(reopenedCard.reopened).toBe(true);
      expect(reopenedCard.reopenReason).toBe(reopenReason);

      // 3. Judge reviews and resubmits updated score
      const correctedScores = [18, 18, 18, 17, 13]; // Subtotal = 84
      const resubmitRes = submitScorecard(
        judgeId,
        contestantId,
        correctedScores,
        "Corrected score after rehearing",
      );
      expect(resubmitRes.ok).toBe(true);

      const finalCard = getCard(getState(), judgeId, contestantId);
      expect(finalCard.status).toBe("submitted");
      expect(finalCard.reopened).toBe(false); // Cleared
      expect(finalCard.scores).toEqual(correctedScores);
      expect(finalCard.subtotal).toBe(84);
      expect(finalCard.notes).toBe("Corrected score after rehearing");
    });
  });
});
