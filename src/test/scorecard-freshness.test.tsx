import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ScorecardEditor } from "@/components/judge/scorecard-editor";
import {
  getCard,
  getState,
  reopenScorecard,
  resetDemo,
  saveDraft,
  submitScorecard,
} from "@/lib/demo/store";
import { judgeSubtotal } from "@/lib/demo/scoring";
import { rubricFor } from "@/lib/demo/rubrics";

describe("Scorecard Submission Freshness & Direct Review Submission", () => {
  beforeEach(() => {
    resetDemo();
  });

  describe("Store Level: submitScorecard with reviewed scores parameter", () => {
    it("submits modified scores directly without saving draft first, storing exact reviewed scores", () => {
      // Use contestant c04 who has an unsubmitted card for judge1
      const contestantId = "c04";
      const judgeId = "judge1";

      // Stage 1: Card initially saved with low draft scores
      const initialDraftScores = [10, 10, 10, 10, 5]; // Subtotal = 45
      const saveRes = saveDraft(
        judgeId,
        contestantId,
        initialDraftScores,
        "Initial early impression",
      );
      expect(saveRes.ok).toBe(true);

      const cardBefore = getCard(getState(), judgeId, contestantId);
      expect(cardBefore.status).toBe("draft");
      expect(cardBefore.scores).toEqual(initialDraftScores);
      expect(judgeSubtotal(cardBefore.scores)).toBe(45);

      // Stage 2: Judge performs final review and submits fresh updated scores
      // WITHOUT calling saveDraft first
      const reviewedScores = [19, 18, 17, 18, 14]; // Subtotal = 86
      const reviewedNotes = "Live review: exceptional vocal modulation and spirit.";

      const submitRes = submitScorecard(judgeId, contestantId, reviewedScores, reviewedNotes);
      expect(submitRes.ok).toBe(true);

      // Stage 3: Verify the submitted scorecard contains the EXACT reviewed scores,
      // proving zero stale data remains from the previous draft
      const submittedCard = getCard(getState(), judgeId, contestantId);
      expect(submittedCard.status).toBe("submitted");
      expect(submittedCard.scores).toEqual(reviewedScores);
      expect(judgeSubtotal(submittedCard.scores)).toBe(86);
      expect(submittedCard.notes).toBe(reviewedNotes);
      expect(submittedCard.updatedAt).toBeDefined();
    });

    it("rejects submission if reviewed scores are incomplete, retaining previous valid state", () => {
      const contestantId = "c02";
      const judgeId = "judge2";

      saveDraft(judgeId, contestantId, [15, 15, 15, 15, 10], "Valid draft");

      // Incomplete scores (missing 3rd criterion)
      const incompleteScores = [19, 18, null, 18, 14];
      const result = submitScorecard(judgeId, contestantId, incompleteScores);

      expect(result.ok).toBe(false);
      expect(result.reason).toBe("incomplete");
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);

      // Card remains in draft status with original scores preserved
      const card = getCard(getState(), judgeId, contestantId);
      expect(card.status).toBe("draft");
      expect(card.scores).toEqual([15, 15, 15, 15, 10]);
    });

    it("re-evaluates and submits fresh scores after organiser scorecard reopen", () => {
      const contestantId = "c01";
      const judgeId = "judge3";

      // Submit initial score
      saveDraft(judgeId, contestantId, [16, 16, 16, 16, 12], "");
      submitScorecard(judgeId, contestantId);

      expect(getCard(getState(), judgeId, contestantId).status).toBe("submitted");

      // Organiser reopens card
      reopenScorecard(judgeId, contestantId, "Correcting vocal score post audio check");
      expect(getCard(getState(), judgeId, contestantId).reopened).toBe(true);

      // Judge reviews and submits modified scores directly
      const updatedReviewedScores = [20, 18, 18, 18, 14]; // Subtotal = 88
      const res = submitScorecard(
        judgeId,
        contestantId,
        updatedReviewedScores,
        "Updated after audio review",
      );

      expect(res.ok).toBe(true);
      const finalCard = getCard(getState(), judgeId, contestantId);
      expect(finalCard.status).toBe("submitted");
      expect(finalCard.reopened).toBe(false); // Reopened flag clears on resubmission
      expect(finalCard.scores).toEqual(updatedReviewedScores);
      expect(judgeSubtotal(finalCard.scores)).toBe(88);
      expect(finalCard.notes).toBe("Updated after audio review");
    });
  });

  describe("UI Component Level: ScorecardEditor direct review & submission", () => {
    it("submits the currently entered scores without clicking 'Save draft' first", () => {
      const contestantId = "c01";
      const judgeId = "judge4";

      // Ensure fresh un-submitted card
      const initialCard = getCard(getState(), judgeId, contestantId);
      expect(initialCard.status).not.toBe("submitted");

      render(<ScorecardEditor judgeId={judgeId} contestantId={contestantId} />);

      // Fill in all 5 criteria inputs
      const rubric = rubricFor("music");
      const inputs = screen.getAllByRole("textbox", { name: /score, out of/i });
      expect(inputs).toHaveLength(5);

      const targetScores = ["19", "18", "17", "18", "14"];
      inputs.forEach((input, idx) => {
        fireEvent.change(input, { target: { value: targetScores[idx] } });
      });

      // Update notes
      const notesArea = screen.getByPlaceholderText(/Optional observations for the score desk/i);
      fireEvent.change(notesArea, {
        target: { value: "Live direct evaluation without manual draft save" },
      });

      // Subtotal should display 86
      expect(screen.getByText("86")).toBeInTheDocument();

      // Click "Review & submit" directly (WITHOUT clicking "Save draft")
      const reviewButton = screen.getByRole("button", { name: /Review & submit/i });
      fireEvent.click(reviewButton);

      // Confirmation panel appears
      expect(screen.getByText(/Review before submitting/i)).toBeInTheDocument();

      // Click "Confirm submission"
      const confirmButton = screen.getByRole("button", { name: /Confirm submission/i });
      fireEvent.click(confirmButton);

      // Store now holds the submitted card with exact reviewed scores
      const storeCard = getCard(getState(), judgeId, contestantId);
      expect(storeCard.status).toBe("submitted");
      expect(storeCard.scores).toEqual([19, 18, 17, 18, 14]);
      expect(storeCard.subtotal).toBe(86);
      expect(storeCard.notes).toBe("Live direct evaluation without manual draft save");

      // Scorecard is now submitted & locked for the judge
      expect(screen.queryByRole("button", { name: /Review & submit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Save draft/i })).not.toBeInTheDocument();
    });
  });
});
