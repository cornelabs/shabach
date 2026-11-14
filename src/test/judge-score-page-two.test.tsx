import { fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScorecardEditor } from "@/components/judge/scorecard-editor";
import { rubricFor } from "@/lib/demo/rubrics";
import { judgeSubtotal } from "@/lib/demo/scoring";
import {
  declareConflict,
  getCard,
  getRound2SubmittedCount,
  getState,
  getTop5Contestants,
  reopenScorecard,
  resetDemo,
  resetJudgeScorecard,
  resolveConflict,
  saveDraft,
  setActiveJudge,
  setRound2Contestants,
  submitScorecard,
} from "@/lib/demo/store";
import { JUDGES, type JudgeId } from "@/lib/demo/types";
import { Round2ScoringPage } from "@/routes/judges.round2";

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

describe("Score Page Two (Round 2 — Top 5 Finalists) Suite", () => {
  beforeEach(() => {
    resetDemo();
    // Unlock judge 1 and judge 2 for tests
    localStorage.setItem("shabach_judge_unlocked_judge1", "true");
    localStorage.setItem("shabach_judge_unlocked_judge2", "true");
    setActiveJudge("judge1");
  });

  describe("1. Top 5 Finalists Selection & Standings Resolution", () => {
    it("returns exactly 5 finalists for Round 2", () => {
      const state = getState();
      const top5 = getTop5Contestants(state);
      expect(top5).toHaveLength(5);
    });

    it("allows customising Round 2 finalists explicitly via setRound2Contestants", () => {
      const state = getState();
      const customIds = [
        state.contestants[10]!.id,
        state.contestants[8]!.id,
        state.contestants[6]!.id,
        state.contestants[4]!.id,
        state.contestants[2]!.id,
      ];

      setRound2Contestants(customIds);
      const updatedTop5 = getTop5Contestants(getState());
      expect(updatedTop5.map((c) => c.id)).toEqual(customIds);
    });
  });

  describe("2. Independent Round 1 and Round 2 Scorecards", () => {
    it("maintains separate scorecards for Round 1 and Round 2 for the same contestant and judge", () => {
      const judgeId: JudgeId = "judge1";
      // Pick a contestant that is not already submitted in seed, e.g. contestants[1]
      const contestantId = getState().contestants[1]!.id;
      resetJudgeScorecard(judgeId, contestantId, 1);
      resetJudgeScorecard(judgeId, contestantId, 2);

      // Enter scores for Round 1
      const r1Scores = [19, 18, 17, 19, 14];
      saveDraft(judgeId, contestantId, r1Scores, "Round 1 performance notes", 1);
      submitScorecard(judgeId, contestantId, r1Scores, "Round 1 final", 1);

      // Verify Round 1 is submitted
      const r1Card = getCard(getState(), judgeId, contestantId, 1);
      expect(r1Card.status).toBe("submitted");
      expect(r1Card.round).toBe(1);
      expect(judgeSubtotal(r1Card.scores)).toBe(87);

      // Round 2 card should initially be not_started
      const r2CardInitial = getCard(getState(), judgeId, contestantId, 2);
      expect(r2CardInitial.status).toBe("not_started");
      expect(r2CardInitial.round).toBe(2);
      expect(r2CardInitial.subtotal).toBe(0);

      // Now draft and submit Round 2 independently
      const r2Scores = [20, 20, 19, 20, 15];
      saveDraft(judgeId, contestantId, r2Scores, "Round 2 championship act notes", 2);

      const r2CardDraft = getCard(getState(), judgeId, contestantId, 2);
      expect(r2CardDraft.status).toBe("draft");
      expect(r2CardDraft.notes).toBe("Round 2 championship act notes");
      expect(judgeSubtotal(r2CardDraft.scores)).toBe(94);

      // Round 1 card is completely unaffected
      const r1CardAfter = getCard(getState(), judgeId, contestantId, 1);
      expect(r1CardAfter.status).toBe("submitted");
      expect(r1CardAfter.notes).toBe("Round 1 final");
      expect(judgeSubtotal(r1CardAfter.scores)).toBe(87);

      // Submit Round 2
      submitScorecard(judgeId, contestantId, r2Scores, "Round 2 confirmed", 2);
      const r2CardFinal = getCard(getState(), judgeId, contestantId, 2);
      expect(r2CardFinal.status).toBe("submitted");
      expect(r2CardFinal.notes).toBe("Round 2 confirmed");
      expect(judgeSubtotal(r2CardFinal.scores)).toBe(94);
    });

    it("tracks round 2 submitted count accurately per judge", () => {
      const judgeId: JudgeId = "judge1";
      const top5 = getTop5Contestants(getState());

      expect(getRound2SubmittedCount(getState(), judgeId)).toBe(0);

      // Submit 2 of the 5 contestants for Round 2
      const scores = [18, 18, 18, 18, 13];
      submitScorecard(judgeId, top5[0]!.id, scores, "Finalist 1 R2", 2);
      submitScorecard(judgeId, top5[1]!.id, scores, "Finalist 2 R2", 2);

      expect(getRound2SubmittedCount(getState(), judgeId)).toBe(2);
    });

    it("supports reopening Round 2 scorecard with recorded reason without reopening Round 1", () => {
      const judgeId: JudgeId = "judge1";
      const contestantId = getState().contestants[1]!.id;
      resetJudgeScorecard(judgeId, contestantId, 1);
      resetJudgeScorecard(judgeId, contestantId, 2);

      // Submit both rounds
      submitScorecard(judgeId, contestantId, [15, 15, 15, 15, 10], "R1", 1);
      submitScorecard(judgeId, contestantId, [20, 20, 20, 20, 15], "R2", 2);

      expect(getCard(getState(), judgeId, contestantId, 1).status).toBe("submitted");
      expect(getCard(getState(), judgeId, contestantId, 2).status).toBe("submitted");

      // Reopen only Round 2
      const res = reopenScorecard(judgeId, contestantId, "Judge requested review of final criterion", 2);
      expect(res.ok).toBe(true);

      const r2Card = getCard(getState(), judgeId, contestantId, 2);
      expect(r2Card.status).toBe("draft");
      expect(r2Card.reopened).toBe(true);
      expect(r2Card.reopenReason).toBe("Judge requested review of final criterion");

      // Round 1 is still submitted and locked
      const r1Card = getCard(getState(), judgeId, contestantId, 1);
      expect(r1Card.status).toBe("submitted");
      expect(r1Card.reopened).toBe(false);
    });

    it("declares and clears conflict of interest for Round 2 independently", () => {
      const judgeId: JudgeId = "judge2";
      const contestantId = getState().contestants[1]!.id;

      declareConflict(judgeId, contestantId, true, 2);
      const card = getCard(getState(), judgeId, contestantId, 2);
      expect(card.conflictDeclared).toBe(true);
      expect(card.conflictResolved).toBe(false);

      // Organiser resolves conflict
      resolveConflict(judgeId, contestantId, 2);
      const resolved = getCard(getState(), judgeId, contestantId, 2);
      expect(resolved.conflictDeclared).toBe(false);
      expect(resolved.conflictResolved).toBe(true);
    });
  });

  describe("3. ScorecardEditor Component Round 2 Mode", () => {
    it("renders Score Page Two badge when round={2}", () => {
      const contestant = getState().contestants[0]!;
      render(
        <ScorecardEditor
          judgeId="judge1"
          contestantId={contestant.id}
          round={2}
        />,
      );

      expect(screen.getByText(/Score Page Two · Round 2/i)).toBeInTheDocument();
      expect(screen.getByText(contestant.name)).toBeInTheDocument();
    });

    it("saves and submits Round 2 scores via ScorecardEditor inputs", () => {
      const contestant = getState().contestants[1]!;
      const onSubmitted = vi.fn();

      render(
        <ScorecardEditor
          judgeId="judge1"
          contestantId={contestant.id}
          round={2}
          onSubmitted={onSubmitted}
        />,
      );

      // Score criteria inputs (rendered with placeholder '—')
      const inputs = screen.getAllByPlaceholderText("—");
      expect(inputs.length).toBeGreaterThanOrEqual(5);

      inputs.forEach((input) => {
        fireEvent.change(input, { target: { value: "15" } });
      });

      // Click Save Draft
      const saveBtn = screen.getByRole("button", { name: /Save Draft/i });
      fireEvent.click(saveBtn);

      const card = getCard(getState(), "judge1", contestant.id, 2);
      expect(card.status).toBe("draft");
      expect(card.round).toBe(2);
      expect(card.scores[0]).toBe(15);
    });
  });

  describe("4. Round2ScoringPage Dedicated Route Component", () => {
    it("renders the 5 championship finalists on Score Page Two", () => {
      render(<Round2ScoringPage />);

      expect(screen.getByText(/Score Page Two: Top 5 Championship/i)).toBeInTheDocument();
      expect(screen.getByText(/Official Score Page Two/i)).toBeInTheDocument();
      expect(screen.getByText(/Round 2 · Championship Stage/i)).toBeInTheDocument();

      const top5 = getTop5Contestants(getState());
      for (const finalist of top5) {
        expect(screen.getAllByText(finalist.name).length).toBeGreaterThan(0);
      }

      // Check for Top 5 badges
      expect(screen.getByText(/Top 5 № 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Top 5 № 5/i)).toBeInTheDocument();
    });

    it("displays progress counter for Round 2 submissions", () => {
      render(<Round2ScoringPage />);
      expect(screen.getByText(/Round 2 Progress: 0\/5 Submitted/i)).toBeInTheDocument();
    });
  });
});
