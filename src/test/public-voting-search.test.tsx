import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VoteConfirmationDialog } from "@/components/vote-confirmation-dialog";
import { ContestantCard } from "@/components/contestant-card";
import { PublicTopThree } from "@/routes/results";
import { Route as IndexRoute } from "@/routes/index";
import { Route as ContestantRoute } from "@/routes/contestants.$code";
import { getDataAdapter } from "@/lib/db/adapter";
import { buildContestants } from "@/lib/demo/seed";
import {
  lockResults,
  loadSampleScores,
  publishResults,
  resetDemo,
  setScoreDeskConfirmed,
  setVotingStatus,
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

describe("Agent C: Public Voting, Profile Loading, Search, and Results Privacy", () => {
  beforeEach(() => {
    resetDemo();
  });

  const CANONICAL_16_CODES = [
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

  describe("1. Direct Contestant Profile Loading in Fresh Contexts", () => {
    it("resolves all 16 canonical finalist codes via data provider asynchronously", async () => {
      const adapter = getDataAdapter();
      for (const code of CANONICAL_16_CODES) {
        const contestant = await adapter.getContestantByCode(code);
        expect(contestant).not.toBeNull();
        expect(contestant?.code.toUpperCase()).toBe(code);
        expect(contestant?.name).toBeDefined();
        expect(contestant?.district).toBeDefined();
      }
    });

    it("specifically loads B6F4PT (Emmanuel Ojo) and SB7K2M (Grace Adeyemi)", async () => {
      const adapter = getDataAdapter();

      const emmanuel = await adapter.getContestantByCode("B6F4PT");
      expect(emmanuel).not.toBeNull();
      expect(emmanuel?.name).toBe("Emmanuel Ojo");
      expect(emmanuel?.district).toBe("Morogbo District");
      expect(emmanuel?.type).toBe("music");

      const grace = await adapter.getContestantByCode("SB7K2M");
      expect(grace).not.toBeNull();
      expect(grace?.name).toBe("Grace Adeyemi");
      expect(grace?.district).toBe("Epe District");
    });

    it("tolerates whitespace and lowercased input during code lookup", async () => {
      const adapter = getDataAdapter();
      const res = await adapter.getContestantByCode("   b6f4pt   ");
      expect(res).not.toBeNull();
      expect(res?.code).toBe("B6F4PT");
      expect(res?.name).toBe("Emmanuel Ojo");
    });

    it("returns null for genuine unknown codes to trigger not-found state", async () => {
      const adapter = getDataAdapter();
      const notFound1 = await adapter.getContestantByCode("UNKNOWN99");
      expect(notFound1).toBeNull();

      const notFound2 = await adapter.getContestantByCode("INVALID");
      expect(notFound2).toBeNull();
    });

    it("verifies contestant route loader resolves valid contestant and throws notFound on unknown code", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const loader: any = ContestantRoute.options.loader;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validResult: any = await loader({ params: { code: "B6F4PT" } } as any);
      expect(validResult.code).toBe("B6F4PT");
      expect(validResult.contestant.name).toBe("Emmanuel Ojo");

      // Invalid code should reject/throw
      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loader({ params: { code: "NON_EXISTENT_CODE" } } as any),
      ).rejects.toThrow();
    });

    it("renders ContestantNotFound component with clear 404 messaging", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const NotFoundComp: any = ContestantRoute.options.notFoundComponent!;
      render(<NotFoundComp isNotFound={true} routeId="/contestants/$code" />);
      expect(screen.getByText("404 · Finalist Not Found")).toBeInTheDocument();
      expect(
        screen.getByText(/We couldn't find an official SHABACH 2026 finalist/i),
      ).toBeInTheDocument();
      expect(screen.getByText("All contestants")).toBeInTheDocument();
    });
  });

  describe("2. Home-page Contestant Search Filtering", () => {
    const contestants = buildContestants();

    it("filters contestants by name case-insensitively and whitespace-tolerantly", () => {
      const search = "   adeyemi   ".trim().toLowerCase();
      const matches = contestants.filter(
        (c) => c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search),
      );
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe("Grace Adeyemi");
    });

    it("filters contestants by 6-character code case-insensitively", () => {
      const search = "b6f4pt".trim().toLowerCase();
      const matches = contestants.filter(
        (c) => c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search),
      );
      expect(matches).toHaveLength(1);
      expect(matches[0]?.name).toBe("Emmanuel Ojo");
      expect(matches[0]?.code).toBe("B6F4PT");
    });

    it("returns empty results for non-matching search queries", () => {
      const search = "NonExistentArtist".trim().toLowerCase();
      const matches = contestants.filter(
        (c) => c.name.toLowerCase().includes(search) || c.code.toLowerCase().includes(search),
      );
      expect(matches).toHaveLength(0);
    });

    it("renders Home page search UI and interactively filters contestants with clean empty state", () => {
      const IndexComp = IndexRoute.options.component!;
      render(<IndexComp />);

      const searchInput = screen.getByPlaceholderText(/Search contestants by name or code/i);
      expect(searchInput).toBeInTheDocument();

      // Search for specific name
      fireEvent.change(searchInput, { target: { value: "Adeyemi" } });
      expect(screen.getByText("Grace Adeyemi")).toBeInTheDocument();
      expect(screen.getByText("Showing 1 of 16 contestants")).toBeInTheDocument();

      // Search for non-existent artist
      fireEvent.change(searchInput, { target: { value: "Unknown Act 999" } });
      expect(screen.getByText("No contestants match “Unknown Act 999”")).toBeInTheDocument();
      expect(screen.getByText("Clear search")).toBeInTheDocument();

      // Clicking clear search restores all 16 acts
      fireEvent.click(screen.getByText("Clear search"));
      expect(screen.getByText("All 16 finalists in running order")).toBeInTheDocument();
    });
  });

  describe("3. Public Results Privacy", () => {
    const sampleRows: ResultRow[] = [
      {
        contestant: {
          id: "c01",
          code: "SB7K2M",
          name: "Grace Adeyemi",
          district: "Epe District",
          type: "music",
          title: "Great Are You Lord",
          bio: "Bio 1",
          order: 1,
          hue: 168,
        },
        judgeSubtotals: { judge1: 90, judge2: 91, judge3: 89, judge4: 92 },
        judgeCount: 4,
        judgeAverage: 90.5,
        validVotes: 412,
        audiencePoints: 5,
        timePenalty: 0,
        finalScore: 95.5,
        complete: true,
        tieFlags: [],
        rank: 1,
      },
      {
        contestant: {
          id: "c07",
          code: "W5H7FE",
          name: "Igbogbo Daughters",
          district: "Igbogbo District",
          type: "dance",
          title: "Daughters of Zion",
          bio: "Bio 7",
          order: 2,
          hue: 320,
        },
        judgeSubtotals: { judge1: 88, judge2: 89, judge3: 87, judge4: 90 },
        judgeCount: 4,
        judgeAverage: 88.5,
        validVotes: 301,
        audiencePoints: 3.65,
        timePenalty: 0,
        finalScore: 92.15,
        complete: true,
        tieFlags: [],
        rank: 2,
      },
      {
        contestant: {
          id: "c13",
          code: "B6F4PT",
          name: "Emmanuel Ojo",
          district: "Morogbo District",
          type: "music",
          title: "My Lifter",
          bio: "Bio 13",
          order: 3,
          hue: 210,
        },
        judgeSubtotals: { judge1: 86, judge2: 87, judge3: 85, judge4: 88 },
        judgeCount: 4,
        judgeAverage: 86.5,
        validVotes: 349,
        audiencePoints: 4.24,
        timePenalty: 0,
        finalScore: 90.74,
        complete: true,
        tieFlags: [],
        rank: 3,
      },
      {
        contestant: {
          id: "c03",
          code: "NH6R8W",
          name: "Tobi Odukoya",
          district: "Ijede District",
          type: "spoken_word",
          title: "The Potter's Wheel",
          bio: "Bio 3",
          order: 4,
          hue: 202,
        },
        judgeSubtotals: { judge1: 84, judge2: 85, judge3: 83, judge4: 86 },
        judgeCount: 4,
        judgeAverage: 84.5,
        validVotes: 287,
        audiencePoints: 3.48,
        timePenalty: 0,
        finalScore: 87.98,
        complete: true,
        tieFlags: [],
        rank: 4,
      },
    ];

    it("displays strictly top three acts with category and district, never 4th place", () => {
      render(<PublicTopThree rows={sampleRows} />);

      // Top 3 must appear
      expect(screen.getByText("Grace Adeyemi")).toBeInTheDocument();
      expect(screen.getByText("Epe District")).toBeInTheDocument();
      expect(screen.getByText("Igbogbo Daughters")).toBeInTheDocument();
      expect(screen.getByText("Igbogbo District")).toBeInTheDocument();
      expect(screen.getByText("Emmanuel Ojo")).toBeInTheDocument();
      expect(screen.getByText("Morogbo District")).toBeInTheDocument();

      // Placements
      expect(screen.getByText("1st Place · Winner")).toBeInTheDocument();
      expect(screen.getByText("2nd Place · First Runner-Up")).toBeInTheDocument();
      expect(screen.getByText("3rd Place · Second Runner-Up")).toBeInTheDocument();

      // 4th place must NOT appear
      expect(screen.queryByText("Tobi Odukoya")).not.toBeInTheDocument();
      expect(screen.queryByText("4th Place")).not.toBeInTheDocument();
    });

    it("strictly hides internal vote totals, audience points, and raw judge subtotals", () => {
      const { container } = render(<PublicTopThree rows={sampleRows} />);

      expect(container.textContent).not.toContain("412 valid votes");
      expect(container.textContent).not.toContain("301 valid votes");
      expect(container.textContent).not.toContain("349 valid votes");
      expect(screen.queryByText("Judge 1 Subtotal")).not.toBeInTheDocument();
      expect(screen.queryByText("Audience Points")).not.toBeInTheDocument();
    });
  });

  describe("4. Voter Verification Dialog", () => {
    const mockContestant = buildContestants()[0]!;

    it("includes required wording explaining one vote per verified email account", () => {
      render(
        <VoteConfirmationDialog
          open={true}
          onOpenChange={vi.fn()}
          contestant={mockContestant}
          onVoteCast={vi.fn()}
        />,
      );

      expect(
        screen.getByText(
          "Verification enforces one vote per verified email account, not proof of one unique human.",
        ),
      ).toBeInTheDocument();
    });

    it("executes full verification and casting flow with single vote confirmation", async () => {
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
      fireEvent.change(emailInput, { target: { value: "audience.member@yaf.org" } });

      const sendCodeBtn = screen.getByText("Send Code");
      fireEvent.click(sendCodeBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("123456")).toBeInTheDocument();
      });

      const demoCodeBtn = screen.getByText(/Use demo code/i);
      fireEvent.click(demoCodeBtn);

      const verifyBtn = screen.getByText("Verify Code");
      fireEvent.click(verifyBtn);

      await waitFor(() => {
        expect(screen.getByText("Verified")).toBeInTheDocument();
      });

      const confirmBtn = screen.getByText("Confirm Vote");
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onVoteCast).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
