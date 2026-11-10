import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VoteConfirmationDialog } from "@/components/vote-confirmation-dialog";
import { ContestantCard } from "@/components/contestant-card";
import { SiteHeader } from "@/components/site-header";
import { PublicTopThree } from "@/routes/results";
import { Route as IndexRoute } from "@/routes/index";
import { Route as ContestantsRoute } from "@/routes/contestants.index";
import { Route as ContestantRoute } from "@/routes/contestants.$code";
import { Route as JudgesMeetRoute } from "@/routes/judges.meet";
import { getDataAdapter } from "@/lib/db/adapter";
import { getLastDispatchedOtp } from "@/lib/auth/voter-verification";
import { buildContestants } from "@/lib/demo/seed";
import { JUDGES } from "@/lib/demo/types";
import {
  castVote,
  resetDemo,
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
      onClick,
    }: {
      children: React.ReactNode;
      to: string;
      className?: string;
      onClick?: () => void;
    }) => (
      <a href={to} className={className} onClick={onClick}>
        {children}
      </a>
    ),
    useParams: () => ({ code: "B6F4PT" }),
    useLoaderData: () => ({ code: "B6F4PT" }),
    useMatchRoute: () => () => false,
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

    it("specifically loads B6F4PT (HOPENDHOUSE DANCE) and SB7K2M (Min. Lizzy)", async () => {
      const adapter = getDataAdapter();

      const hopendhouse = await adapter.getContestantByCode("B6F4PT");
      expect(hopendhouse).not.toBeNull();
      expect(hopendhouse?.name).toBe("HOPENDHOUSE DANCE");
      expect(hopendhouse?.district).toBe("Morogbo District");
      expect(hopendhouse?.type).toBe("dance");

      const lizzy = await adapter.getContestantByCode("SB7K2M");
      expect(lizzy).not.toBeNull();
      expect(lizzy?.name).toBe("Min. Lizzy");
      expect(lizzy?.district).toBe("Epe District");
    });

    it("tolerates whitespace and lowercased input during code lookup", async () => {
      const adapter = getDataAdapter();
      const res = await adapter.getContestantByCode("   b6f4pt   ");
      expect(res).not.toBeNull();
      expect(res?.code).toBe("B6F4PT");
      expect(res?.name).toBe("HOPENDHOUSE DANCE");
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
      expect(validResult.contestant.name).toBe("HOPENDHOUSE DANCE");

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

  describe("2. Home Page & Contestants List Page", () => {
    it("renders Home page with 6 navigation cards including Meet the Judges", () => {
      const IndexComp = IndexRoute.options.component!;
      render(<IndexComp />);

      expect(screen.getByText("1. Vote Contestant")).toBeInTheDocument();
      expect(screen.getByText("2. Results")).toBeInTheDocument();
      expect(screen.getByText("3. Judging Panel")).toBeInTheDocument();
      expect(screen.getByText("4. Meet the Judges")).toBeInTheDocument();
      expect(screen.getByText("5. Program details")).toBeInTheDocument();
      expect(screen.getByText("6. Admin")).toBeInTheDocument();
      expect(
        screen.getByText("Meet the 4 Grand Finale adjudicators, their profiles & backgrounds."),
      ).toBeInTheDocument();
    });

    it("renders Contestants page directly displaying all 16 finalists cleanly without search bar or category tabs", () => {
      const ContestantsComp = ContestantsRoute.options.component!;
      render(<ContestantsComp />);

      expect(screen.getByText("Meet the 16 Finalists")).toBeInTheDocument();
      // No search bar or category tabs
      expect(screen.queryByPlaceholderText(/Search contestants/i)).not.toBeInTheDocument();
      expect(screen.queryByText("All Acts")).not.toBeInTheDocument();
      // Finalists are rendered directly
      expect(screen.getByText("Min. Lizzy")).toBeInTheDocument();
      expect(screen.getByText("HOPENDHOUSE DANCE")).toBeInTheDocument();
      expect(screen.getByText("The Painters")).toBeInTheDocument();
    });
  });

  describe("3. Meet the Judges Page (/judges/meet)", () => {
    it("renders all 4 Grand Finale Judges with portraits, roles, and bios", () => {
      const MeetComp = JudgesMeetRoute.options.component!;
      render(<MeetComp />);

      expect(screen.getByText("Meet the 4 Grand Finale Judges")).toBeInTheDocument();

      for (const judge of JUDGES) {
        expect(screen.getByText(judge.name)).toBeInTheDocument();
        expect(screen.getByText(judge.roleTitle)).toBeInTheDocument();
        expect(screen.getByText(judge.bio)).toBeInTheDocument();
      }

      // Link to Judges' Panel
      expect(screen.getByText("Access Judges' Panel")).toBeInTheDocument();
    });
  });

  describe("4. Mobile Header & Hamburger Menu", () => {
    it("renders hamburger toggle button on mobile and toggles navigation dropdown", () => {
      render(<SiteHeader />);

      const menuBtn = screen.getByLabelText("Toggle navigation menu");
      expect(menuBtn).toBeInTheDocument();

      // Initially closed
      expect(screen.queryByRole("navigation", { name: "Mobile Navigation" })).not.toBeInTheDocument();

      // Open menu
      fireEvent.click(menuBtn);
      const mobileNav = screen.getByRole("navigation", { name: "Mobile Navigation" });
      expect(mobileNav).toBeInTheDocument();
      expect(within(mobileNav).getByText("Meet the Judges")).toBeInTheDocument();
      expect(within(mobileNav).getByText("Judges Panel")).toBeInTheDocument();

      // Clicking a mobile nav link toggles it off
      fireEvent.click(within(mobileNav).getByText("Meet the Judges"));
      expect(screen.queryByRole("navigation", { name: "Mobile Navigation" })).not.toBeInTheDocument();
    });
  });

  describe("5. Individual Contestant Profile & Voting Button States", () => {
    it("renders prominent hero and displays 'You voted already' with disabled button after vote cast", () => {
      setVotingStatus("open");
      const spyUseParams = vi.spyOn(ContestantRoute, "useParams").mockReturnValue({
        code: "B6F4PT",
      } as any);
      const ContestantProfileComp = ContestantRoute.options.component!;

      // First render: not voted yet
      const { unmount } = render(<ContestantProfileComp />);
      expect(screen.getAllByText(/Vote for HOPENDHOUSE DANCE/i).length).toBeGreaterThan(0);
      unmount();

      // Simulate vote recorded
      castVote("B6F4PT", "test_voter_1");

      // Re-render
      render(<ContestantProfileComp />);
      const votedButtons = screen.getAllByText("You voted already");
      expect(votedButtons.length).toBeGreaterThan(0);
      expect(votedButtons[0]?.closest("button")).toBeDisabled();
      expect(screen.getAllByText(/Verified Vote Recorded/i).length).toBeGreaterThan(0);

      spyUseParams.mockRestore();
    });
  });

  describe("6. Public Results Privacy", () => {
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
        validVotes: 240,
        audiencePoints: 5.0,
        timePenalty: 0,
        complete: true,
        tieFlags: [],
        finalScore: 95.5,
        rank: 1,
      },
      {
        contestant: {
          id: "c02",
          code: "B6F4PT",
          name: "David Adeleke",
          district: "Morogbo District",
          type: "dance",
          title: "Praise Dance",
          bio: "Bio 2",
          order: 2,
          hue: 210,
        },
        judgeSubtotals: { judge1: 85, judge2: 87, judge3: 86, judge4: 84 },
        judgeCount: 4,
        judgeAverage: 85.5,
        validVotes: 180,
        audiencePoints: 4.5,
        timePenalty: 0,
        complete: true,
        tieFlags: [],
        finalScore: 90.0,
        rank: 2,
      },
      {
        contestant: {
          id: "c03",
          code: "V4Q9TP",
          name: "Faith Johnson",
          district: "Ibeju-Lekki",
          type: "mono_drama",
          title: "The Prodigal",
          bio: "Bio 3",
          order: 3,
          hue: 30,
        },
        judgeSubtotals: { judge1: 82, judge2: 81, judge3: 83, judge4: 80 },
        judgeCount: 4,
        judgeAverage: 81.5,
        validVotes: 150,
        audiencePoints: 4.0,
        timePenalty: 0,
        complete: true,
        tieFlags: [],
        finalScore: 85.5,
        rank: 3,
      },
      {
        contestant: {
          id: "c04",
          code: "NH6R8W",
          name: "Samuel Oladipo",
          district: "Badagry District",
          type: "visual_arts",
          title: "Living Water",
          bio: "Bio 4",
          order: 4,
          hue: 280,
        },
        judgeSubtotals: { judge1: 75, judge2: 74, judge3: 76, judge4: 75 },
        judgeCount: 4,
        judgeAverage: 75.0,
        validVotes: 90,
        audiencePoints: 3.5,
        timePenalty: 0,
        complete: true,
        tieFlags: [],
        finalScore: 78.5,
        rank: 4,
      },
    ];

    it("displays strictly top three acts with category and district, never 4th place", () => {
      render(<PublicTopThree rows={sampleRows} />);

      // Top 3 names must be present
      expect(screen.getByText("Grace Adeyemi")).toBeInTheDocument();
      expect(screen.getByText("David Adeleke")).toBeInTheDocument();
      expect(screen.getByText("Faith Johnson")).toBeInTheDocument();

      // Top 3 placements
      expect(screen.getByText(/1st Place/i)).toBeInTheDocument();
      expect(screen.getByText(/2nd Place/i)).toBeInTheDocument();
      expect(screen.getByText(/3rd Place/i)).toBeInTheDocument();

      // 4th place finalist must strictly NOT appear
      expect(screen.queryByText("Samuel Oladipo")).toBeNull();
      expect(screen.queryByText(/4th Place/i)).toBeNull();
    });

    it("strictly hides internal vote totals, audience points, and raw judge subtotals", () => {
      const { container } = render(<PublicTopThree rows={sampleRows} />);
      const text = container.textContent || "";

      // Internal vote counts (e.g. 240, 180, 150)
      expect(text).not.toMatch(/240\s*votes/i);
      expect(text).not.toMatch(/180\s*votes/i);

      // Raw points breakdown or judge subtotals
      expect(text).not.toMatch(/judge1/i);
      expect(text).not.toMatch(/judge average/i);
      expect(text).not.toMatch(/raw subtotal/i);
    });
  });

  describe("7. Voter Verification Dialog", () => {
    const mockContestant: Contestant = buildContestants().find(
      (c) => c.code.toUpperCase() === "B6F4PT",
    )!;

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

      const otpInput = screen.getByPlaceholderText("123456");
      const code = getLastDispatchedOtp("audience.member@yaf.org") || "123456";
      fireEvent.change(otpInput, { target: { value: code } });

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
