import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ContestantCard } from "@/components/contestant-card";
import { VoteConfirmationDialog } from "@/components/vote-confirmation-dialog";
import { Route as IndexRoute } from "@/routes/index";
import { PublicTopThree, Route as ResultsRoute } from "@/routes/results";
import { Route as ContestantRoute } from "@/routes/contestants.$code";
import { getDataAdapter } from "@/lib/db/adapter";
import { buildContestants } from "@/lib/demo/seed";
import {
  castVote,
  getState,
  loadSampleScores,
  lockResults,
  publishResults,
  resetDemo,
  setScoreDeskConfirmed,
  setVotingStatus,
  voteCountsOf,
} from "@/lib/demo/store";
import type { Contestant, ResultRow } from "@/lib/demo/types";

// Mock router links
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
    useParams: () => ({ code: "B6F4PT" }),
    useLoaderData: () => ({ code: "B6F4PT" }),
  };
});

describe("Phase 7: Public Experience & Profile Journey Browser Simulation", () => {
  const adapter = getDataAdapter();

  beforeEach(() => {
    resetDemo();
    vi.spyOn(ResultsRoute, "useLoaderData").mockReturnValue({ publishedSnapshot: null });
    vi.spyOn(ContestantRoute, "useLoaderData").mockReturnValue({
      code: "B6F4PT",
      contestant: undefined,
    });
  });

  describe("1. Home Page Contestant Search (Name, Code, District)", () => {
    it("interactively filters by contestant name (case-insensitive)", () => {
      const IndexComp = IndexRoute.options.component!;
      render(<IndexComp />);

      const searchInput = screen.getByPlaceholderText(/Search contestants by name or code/i);

      // Search by partial lower-case name
      fireEvent.change(searchInput, { target: { value: "emmanuel" } });
      expect(screen.getByText("Emmanuel Ojo")).toBeInTheDocument();
      expect(screen.getByText("Showing 1 of 16 contestants")).toBeInTheDocument();

      // Clear search
      fireEvent.click(screen.getByLabelText("Clear search"));
      expect(screen.getByText("All 16 finalists in running order")).toBeInTheDocument();
    });

    it("interactively filters by 6-character code with whitespace tolerance", () => {
      const IndexComp = IndexRoute.options.component!;
      render(<IndexComp />);

      const searchInput = screen.getByPlaceholderText(/Search contestants by name or code/i);

      // Search with leading/trailing spaces and lower case
      fireEvent.change(searchInput, { target: { value: "   b6f4pt   " } });
      expect(screen.getByText("Emmanuel Ojo")).toBeInTheDocument();
      expect(screen.getByText("Showing 1 of 16 contestants")).toBeInTheDocument();

      fireEvent.change(searchInput, { target: { value: "SB7K2M" } });
      expect(screen.getByText("Grace Adeyemi")).toBeInTheDocument();
      expect(screen.getByText("Showing 1 of 16 contestants")).toBeInTheDocument();
    });

    it("interactively filters by district name across contestants", () => {
      const IndexComp = IndexRoute.options.component!;
      render(<IndexComp />);

      const searchInput = screen.getByPlaceholderText(/Search contestants by name or code/i);

      // Search by district: "Morogbo" (has 2 acts: Emmanuel Ojo and Morogbo Youth Choir)
      fireEvent.change(searchInput, { target: { value: "Morogbo" } });
      expect(screen.getByText("Emmanuel Ojo")).toBeInTheDocument();
      expect(screen.getByText("Morogbo Youth Choir")).toBeInTheDocument();
      expect(screen.getByText("Showing 2 of 16 contestants")).toBeInTheDocument();
    });

    it("renders clean friendly empty state when no query matches and allows quick reset", () => {
      const IndexComp = IndexRoute.options.component!;
      render(<IndexComp />);

      const searchInput = screen.getByPlaceholderText(/Search contestants by name or code/i);
      fireEvent.change(searchInput, { target: { value: "NoMatchQuery99" } });

      expect(screen.getByText("No contestants match “NoMatchQuery99”")).toBeInTheDocument();
      expect(
        screen.getByText(/We couldn't find any finalists matching your search/i),
      ).toBeInTheDocument();

      const clearBtns = screen.getAllByRole("button", { name: "Clear search" });
      fireEvent.click(clearBtns[0]!);

      expect(screen.getByText("All 16 finalists in running order")).toBeInTheDocument();
      expect(screen.getByText("Grace Adeyemi")).toBeInTheDocument();
    });
  });

  describe("2. Direct Contestant Profile Loading & 404 Handling", () => {
    it("asynchronously loads direct contestant profile /contestants/B6F4PT in fresh context", async () => {
      const contestant = await adapter.getContestantByCode("B6F4PT");
      expect(contestant).not.toBeNull();
      expect(contestant?.name).toBe("Emmanuel Ojo");
      expect(contestant?.district).toBe("Morogbo District");
      expect(contestant?.title).toBe("My Lifter — Saxophone Solo");
      expect(contestant?.order).toBe(3);
    });

    it("resolves all 16 canonical finalist profiles without 404", async () => {
      const canonicalCodes = [
        "SB7K2M",
        "V4Q9TP",
        "NH6R8W",
        "K2M5C7",
        "P9X3JA",
        "T8B4ND",
        "W5H7FE",
        "Y3K9RU",
        "A7W2SM",
        "D4PN6T",
        "M8C3XE",
        "L1Z8RQ",
        "B6F4PT",
        "G9D2KY",
        "H5N8TC",
        "E3QK4V",
      ];

      for (const code of canonicalCodes) {
        const contestant = await adapter.getContestantByCode(code);
        expect(contestant).not.toBeNull();
        expect(contestant?.code).toBe(code);
      }
    });

    it("renders ContestantNotFound with 404 message for invalid code", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const NotFoundComponent: any = ContestantRoute.options.notFoundComponent!;
      render(<NotFoundComponent isNotFound={true} routeId="/contestants/$code" />);

      expect(screen.getByText("404 · Finalist Not Found")).toBeInTheDocument();
      expect(
        screen.getByText(/We couldn't find an official SHABACH 2026 finalist matching this code/i),
      ).toBeInTheDocument();
      expect(screen.getByText("All contestants")).toBeInTheDocument();
    });
  });

  describe("3. Full Voting Lifecycle & Voter Verification Simulation", () => {
    const contestants = buildContestants();
    const emmanuel = contestants.find((c) => c.code === "B6F4PT")!;

    it("enforces voting window: rejects votes when voting is not_open or closed", async () => {
      setVotingStatus("not_open");
      const resNotOpen = await adapter.castVote("voter_alice", emmanuel.id);
      expect(resNotOpen.success).toBe(false);
      expect(resNotOpen.message).toMatch(/not open/i);

      setVotingStatus("closed");
      const resClosed = await adapter.castVote("voter_alice", emmanuel.id);
      expect(resClosed.success).toBe(false);
      expect(resClosed.message).toMatch(/closed/i);
    });

    it("cancelling vote confirmation does not cast vote and preserves zero vote count", () => {
      setVotingStatus("open");
      const initialCounts = voteCountsOf(getState());
      const onVoteCast = vi.fn();
      const onOpenChange = vi.fn();

      render(
        <VoteConfirmationDialog
          open={true}
          onOpenChange={onOpenChange}
          contestant={emmanuel}
          onVoteCast={onVoteCast}
        />,
      );

      // Cancel button is clicked
      const cancelBtn = screen.getByText("Cancel");
      fireEvent.click(cancelBtn);

      expect(onVoteCast).not.toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);

      // Verify no vote recorded in state
      const finalCounts = voteCountsOf(getState());
      expect(finalCounts[emmanuel.id] ?? 0).toBe(initialCounts[emmanuel.id] ?? 0);
    });

    it("executes complete email OTP verification, casts vote, and displays receipt", async () => {
      setVotingStatus("open");
      const onVoteCast = vi.fn();
      const onOpenChange = vi.fn();

      const { rerender } = render(
        <VoteConfirmationDialog
          open={true}
          onOpenChange={onOpenChange}
          contestant={emmanuel}
          onVoteCast={onVoteCast}
        />,
      );

      // Mandatory policy statement present
      expect(
        screen.getByText(
          "Verification enforces one vote per verified email account, not proof of one unique human.",
        ),
      ).toBeInTheDocument();

      // Enter email
      const emailInput = screen.getByPlaceholderText("Enter email to verify vote...");
      fireEvent.change(emailInput, { target: { value: "fellowship.voter@shabach.org" } });

      // Click Send Code
      const sendCodeBtn = screen.getByText("Send Code");
      fireEvent.click(sendCodeBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
      });

      // Quick-fill demo code
      const demoCodeBtn = screen.getByText(/Use demo code/i);
      fireEvent.click(demoCodeBtn);

      // Verify code
      const verifyBtn = screen.getByText("Verify Code");
      fireEvent.click(verifyBtn);

      await waitFor(() => {
        expect(screen.getByText("Verified")).toBeInTheDocument();
      });

      // Confirm vote
      const confirmBtn = screen.getByText("Confirm Vote");
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onVoteCast).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      // Card now displays vote receipt badge
      rerender(<ContestantCard contestant={emmanuel} votingStatus="open" myVote={emmanuel.id} />);

      expect(screen.getByText("✓ Your vote is here")).toBeInTheDocument();
    });

    it("rejects duplicate votes from the same voter identity on subsequent attempt", async () => {
      setVotingStatus("open");
      const voterToken = "voter_token_verified_session_99";

      // 1st vote succeeds
      const firstVote = await adapter.castVote(voterToken, emmanuel.id);
      expect(firstVote.success).toBe(true);

      // 2nd vote fails with duplicate rejection
      const secondVote = await adapter.castVote(voterToken, "c01");
      expect(secondVote.success).toBe(false);
      expect(secondVote.message).toMatch(/already cast your single vote|already voted/i);
    });
  });

  describe("4. Public Results Privacy & Presentation", () => {
    it("renders elegant pending banner when results are not yet officially published", () => {
      resetDemo();
      const ResultsComp = ResultsRoute.options.component!;
      render(<ResultsComp />);

      expect(screen.getByText("Official results are being collated...")).toBeInTheDocument();
      expect(
        screen.getByText(
          /The Grand Finale top three placements will be officially published here/i,
        ),
      ).toBeInTheDocument();

      // No contestant rankings appear while unpublished
      expect(screen.queryByText("1st Place · Winner")).not.toBeInTheDocument();
    });

    it("renders strictly the Top Three placed finalists when officially published", async () => {
      // Simulate official publishing process
      loadSampleScores();
      setVotingStatus("closed");
      setScoreDeskConfirmed(true);
      await lockResults();
      await publishResults();

      const published = await adapter.getPublishedResults();
      expect(published).not.toBeNull();
      expect(published?.published).toBe(true);

      // Render public results table
      render(<PublicTopThree rows={published!.rows} />);

      // Exactly 3 winner placement badges appear
      expect(screen.getByText("1st Place · Winner")).toBeInTheDocument();
      expect(screen.getByText("2nd Place · First Runner-Up")).toBeInTheDocument();
      expect(screen.getByText("3rd Place · Second Runner-Up")).toBeInTheDocument();

      // 4th place and below must NOT be rendered
      expect(screen.queryByText("4th Place")).not.toBeInTheDocument();
      expect(screen.queryByText("5th Place")).not.toBeInTheDocument();

      // Judge individual marks and raw subtotals must NEVER be rendered
      expect(screen.queryByText("Judge 1 Subtotal")).not.toBeInTheDocument();
      expect(screen.queryByText("Audience Points")).not.toBeInTheDocument();
    });
  });
});
