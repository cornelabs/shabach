import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VoteConfirmationDialog } from "@/components/vote-confirmation-dialog";
import { castVote, resetDemo, setVotingStatus } from "@/lib/demo/store";

describe("Public Voting Flow & Confirmation", () => {
  beforeEach(() => {
    resetDemo();
  });

  const mockContestant = {
    id: "c01",
    code: "SHB-01",
    name: "Praise Adebayo",
    district: "Lagos Central",
    type: "music" as const,
    title: "Ancient of Days",
    bio: "Test bio",
    order: 1,
    hue: 24,
  };

  it("renders contestant details and one-final-vote rule in the confirmation dialog", () => {
    render(
      <VoteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        contestant={mockContestant}
        onVoteCast={vi.fn()}
      />,
    );

    expect(screen.getByText("Confirm your vote")).toBeInTheDocument();
    expect(screen.getByText("Praise Adebayo")).toBeInTheDocument();
    expect(screen.getByText("SHB-01")).toBeInTheDocument();
    expect(screen.getByText("Lagos Central")).toBeInTheDocument();
    expect(screen.getByText(/One-vote rule/i)).toBeInTheDocument();
    expect(screen.getByText(/Once cast, your vote cannot be cancelled/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Verification enforces one vote per verified email account, not proof of one unique human.",
      ),
    ).toBeInTheDocument();
  });

  it("handles full email OTP verification flow within the confirmation dialog", async () => {
    setVotingStatus("open");
    const onVoteCast = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <VoteConfirmationDialog
        open={true}
        onOpenChange={onOpenChange}
        contestant={mockContestant}
        onVoteCast={onVoteCast}
      />,
    );

    const emailInput = screen.getByPlaceholderText("Enter email to verify vote...");
    fireEvent.change(emailInput, { target: { value: "voter1@test.com" } });

    const sendCodeButton = screen.getByText("Send Code");
    fireEvent.click(sendCodeButton);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
    });

    // In demo mode, a button with demo code is shown
    const useCodeButton = screen.getByText(/Use demo code/i);
    expect(useCodeButton).toBeInTheDocument();
    fireEvent.click(useCodeButton);

    const verifyButton = screen.getByText("Verify Code");
    fireEvent.click(verifyButton);

    await waitFor(() => {
      expect(screen.getByText("Verified")).toBeInTheDocument();
    });

    const confirmButton = screen.getByText("Confirm Vote");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(onVoteCast).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("calls onCancel and does not cast vote when cancelled", () => {
    const onVoteCast = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <VoteConfirmationDialog
        open={true}
        onOpenChange={onOpenChange}
        contestant={mockContestant}
        onVoteCast={onVoteCast}
      />,
    );

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(onVoteCast).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onVoteCast when user clicks Confirm Vote in open voting state", async () => {
    setVotingStatus("open");
    const onVoteCast = vi.fn();

    render(
      <VoteConfirmationDialog
        open={true}
        onOpenChange={vi.fn()}
        contestant={mockContestant}
        onVoteCast={onVoteCast}
      />,
    );

    const confirmButton = screen.getByText("Confirm Vote");
    fireEvent.click(confirmButton);

    await waitFor(
      () => {
        expect(onVoteCast).toHaveBeenCalledTimes(1);
      },
      { timeout: 1000 },
    );
  });

  it("enforces voting window: rejects vote when voting is not open", () => {
    setVotingStatus("not_open");
    const resultNotOpen = castVote("c01");
    expect(resultNotOpen.ok).toBe(false);
    if (!resultNotOpen.ok) {
      expect(resultNotOpen.reason).toBe("not_open");
    }

    setVotingStatus("closed");
    const resultClosed = castVote("c01");
    expect(resultClosed.ok).toBe(false);
    if (!resultClosed.ok) {
      expect(resultClosed.reason).toBe("closed");
    }
  });

  it("allows exactly one vote per browser when open, then rejects subsequent votes", () => {
    setVotingStatus("open");

    const firstVote = castVote("c01");
    expect(firstVote.ok).toBe(true);

    const secondVote = castVote("c02");
    expect(secondVote.ok).toBe(false);
    if (!secondVote.ok) {
      expect(secondVote.reason).toBe("already_voted");
    }
  });

  it("rejects votes for unknown contestant IDs", () => {
    setVotingStatus("open");
    const invalidVote = castVote("unknown-id-999");
    expect(invalidVote.ok).toBe(false);
    if (!invalidVote.ok) {
      expect(invalidVote.reason).toBe("unknown_contestant");
    }
  });
});
