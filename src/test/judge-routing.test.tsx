import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { render, screen, fireEvent } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { resetDemo } from "@/lib/demo/store";
import { JUDGES } from "@/lib/demo/types";
import { Route as JudgesRoute } from "@/routes/judges";
import { Route as JudgesIndexRoute } from "@/routes/judges.index";
import { Route as JudgeDetailRoute } from "@/routes/judges.$judgeId";

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

describe("Judge Routing & Workspace Navigation", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  beforeEach(() => {
    resetDemo();
  });

  describe("Route Matching", () => {
    it("matches the judge seat selector at /judges", () => {
      const matches = router.matchRoutes("/judges");
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
      expect(matches.some((m) => m.routeId === "/judges")).toBe(true);
    });

    it("matches child routes for all 4 judge seats at /judges/$judgeId", () => {
      const judgeSeats = ["judge1", "judge2", "judge3", "judge4"];

      for (const seat of judgeSeats) {
        const matches = router.matchRoutes(`/judges/${seat}`);
        expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
        expect(matches.some((m) => m.routeId === "/judges/$judgeId")).toBe(true);

        const targetMatch = matches.find((m) => m.routeId === "/judges/$judgeId");
        expect(targetMatch?.params).toHaveProperty("judgeId", seat);
      }
    });

    it("matches the legacy redirect route /judge", () => {
      const matches = router.matchRoutes("/judge");
      expect(matches.some((m) => m.routeId === "/judge")).toBe(true);
    });
  });

  describe("Judge Route Loader Validation", () => {
    it("accepts valid judge IDs in Route.loader", () => {
      const loader = JudgeDetailRoute.options.loader;
      expect(loader).toBeDefined();

      if (loader) {
        // All 4 configured judges should succeed without throwing
        for (const judge of JUDGES) {
          const res = (loader as unknown as (ctx: { params: { judgeId: string } }) => unknown)({
            params: { judgeId: judge.id },
          });
          expect(res).toBeNull();
        }
      }
    });

    it("throws notFound() when an invalid judgeId is requested", () => {
      const loader = JudgeDetailRoute.options.loader;
      expect(loader).toBeDefined();

      if (loader) {
        expect(() =>
          (loader as unknown as (ctx: { params: { judgeId: string } }) => unknown)({
            params: { judgeId: "judge99" },
          }),
        ).toThrow();

        expect(() =>
          (loader as unknown as (ctx: { params: { judgeId: string } }) => unknown)({
            params: { judgeId: "unknown-seat" },
          }),
        ).toThrow();
      }
    });
  });

  describe("Component Rendering", () => {
    it("renders the /judges picker with all 4 judge seats", () => {
      const JudgesComponent = JudgesIndexRoute.options.component!;
      render(<JudgesComponent />);

      // Main header & description
      expect(screen.getByRole("heading", { name: "Judges' workspace" })).toBeInTheDocument();
      expect(
        screen.getByText(/Each judge scores independently — nobody sees another judge's scores/i),
      ).toBeInTheDocument();

      // All 4 judge cards must be rendered
      for (const judge of JUDGES) {
        expect(screen.getByText(judge.name)).toBeInTheDocument();
      }
      expect(screen.getAllByText("Sample judge (demo)")).toHaveLength(4);

      // Security and integrity indicators
      expect(screen.getAllByText("Independent scoring")).toHaveLength(4);
      expect(screen.getAllByText("Conflict declaration")).toHaveLength(4);
    });

    it("renders the /judges/$judgeId workspace with contestant list and scorecard editor", () => {
      // Mock useParams to return judge1
      const spyUseParams = vi.spyOn(JudgeDetailRoute, "useParams").mockReturnValue({
        judgeId: "judge1",
      });

      const WorkspaceComponent = JudgeDetailRoute.options.component!;
      render(<WorkspaceComponent />);

      // Header matches current judge
      expect(screen.getByRole("heading", { name: "Judge 1's scorecards" })).toBeInTheDocument();
      expect(
        screen.getByText(
          /Sample judge \(demo\) · 16 contestants · scores stay private until submitted/,
        ),
      ).toBeInTheDocument();

      // Back navigation link to judge seats
      expect(screen.getByText("← Judge seats")).toBeInTheDocument();

      // Sidebar contains 16 contestants
      expect(screen.getByText("№ 1")).toBeInTheDocument();
      expect(screen.getByText("Grace Adeyemi")).toBeInTheDocument();
      expect(screen.getByText("Epe Praise Crew")).toBeInTheDocument();

      // Initially shows guidance placeholder to pick a contestant
      expect(
        screen.getByText(/Choose a contestant from the list to open their scorecard/i),
      ).toBeInTheDocument();

      // Clicking a contestant in the sidebar opens their scorecard editor
      const contestantButton = screen.getByText("Grace Adeyemi").closest("button");
      expect(contestantButton).not.toBeNull();
      fireEvent.click(contestantButton!);

      // Scorecard editor opens for Grace Adeyemi
      expect(screen.getByText("“Great Are You Lord — Acoustic Rendition”")).toBeInTheDocument();
      expect(screen.getByText(/Music rubric/i)).toBeInTheDocument();
      expect(screen.getByText("Raw subtotal")).toBeInTheDocument();

      spyUseParams.mockRestore();
    });

    it("renders judge2 workspace properly with distinct identity", () => {
      const spyUseParams = vi.spyOn(JudgeDetailRoute, "useParams").mockReturnValue({
        judgeId: "judge2",
      });

      const WorkspaceComponent = JudgeDetailRoute.options.component!;
      render(<WorkspaceComponent />);

      expect(screen.getByRole("heading", { name: "Judge 2's scorecards" })).toBeInTheDocument();
      expect(
        screen.getByText(
          /Sample judge \(demo\) · 16 contestants · scores stay private until submitted/,
        ),
      ).toBeInTheDocument();

      spyUseParams.mockRestore();
    });
  });
});
