import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { DemoDataAdapter, LiveSupabaseAdapter } from "@/lib/db/adapter";
import { resetDemo } from "@/lib/demo/store";
import { Route as ContestantDetailRoute } from "@/routes/contestants.$code";

// Mock TanStack Router Link, useParams, and useMatchRoute
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

describe("Contestant Direct Profile Resolution & Link Loading", () => {
  const adapter = new DemoDataAdapter();
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  beforeEach(() => {
    resetDemo();
    vi.spyOn(LiveSupabaseAdapter.prototype, "isLive").mockReturnValue(false);
  });

  describe("Route Matching", () => {
    it("matches direct links for known contestant codes", () => {
      const matchSB7K2M = router.matchRoutes("/contestants/SB7K2M");
      expect(matchSB7K2M.at(-1)?.routeId).not.toBe(rootRouteId);
      expect(matchSB7K2M.some((m) => m.routeId === "/contestants/$code")).toBe(true);
      expect(matchSB7K2M.find((m) => m.routeId === "/contestants/$code")?.params).toHaveProperty(
        "code",
        "SB7K2M",
      );

      const matchB6F4PT = router.matchRoutes("/contestants/B6F4PT");
      expect(matchB6F4PT.at(-1)?.routeId).not.toBe(rootRouteId);
      expect(matchB6F4PT.some((m) => m.routeId === "/contestants/$code")).toBe(true);
      expect(matchB6F4PT.find((m) => m.routeId === "/contestants/$code")?.params).toHaveProperty(
        "code",
        "B6F4PT",
      );
    });
  });

  describe("Adapter Direct Code Resolution", () => {
    it("resolves SB7K2M directly to Grace Adeyemi with accurate attributes", async () => {
      const contestant = await adapter.getContestantByCode("SB7K2M");
      expect(contestant).not.toBeNull();
      expect(contestant?.id).toBe("c01");
      expect(contestant?.code).toBe("SB7K2M");
      expect(contestant?.name).toBe("Grace Adeyemi");
      expect(contestant?.district).toBe("Epe District");
      expect(contestant?.type).toBe("music");
      expect(contestant?.title).toBe("Great Are You Lord — Acoustic Rendition");
      expect(contestant?.order).toBe(1);
    });

    it("resolves B6F4PT directly to Emmanuel Ojo with accurate attributes", async () => {
      const contestant = await adapter.getContestantByCode("B6F4PT");
      expect(contestant).not.toBeNull();
      expect(contestant?.id).toBe("c13");
      expect(contestant?.code).toBe("B6F4PT");
      expect(contestant?.name).toBe("Emmanuel Ojo");
      expect(contestant?.district).toBe("Morogbo District");
      expect(contestant?.type).toBe("music");
      expect(contestant?.title).toBe("My Lifter — Saxophone Solo");
    });

    it("resolves codes in a case-insensitive manner (e.g. sb7k2m and b6f4pt)", async () => {
      const lowerSB = await adapter.getContestantByCode("sb7k2m");
      expect(lowerSB).not.toBeNull();
      expect(lowerSB?.name).toBe("Grace Adeyemi");

      const lowerB6 = await adapter.getContestantByCode("b6f4pt");
      expect(lowerB6).not.toBeNull();
      expect(lowerB6?.name).toBe("Emmanuel Ojo");
    });

    it("fails gracefully and returns null for unknown or non-existent codes", async () => {
      const unknown1 = await adapter.getContestantByCode("NONEXIST");
      expect(unknown1).toBeNull();

      const unknown2 = await adapter.getContestantByCode("XXXXXX");
      expect(unknown2).toBeNull();

      const empty = await adapter.getContestantByCode("");
      expect(empty).toBeNull();
    });
  });

  describe("Route Loader Validation & Error Handling", () => {
    it("loader successfully returns code and contestant for valid profiles", async () => {
      const loader = ContestantDetailRoute.options.loader;
      expect(loader).toBeDefined();

      if (loader) {
        const resSB = (await (
          loader as unknown as (ctx: { params: { code: string } }) => Promise<{
            code: string;
            contestant: { name: string; code: string };
          }>
        )({
          params: { code: "SB7K2M" },
        })) as { code: string; contestant: { name: string; code: string } };

        expect(resSB.code).toBe("SB7K2M");
        expect(resSB.contestant.name).toBe("Grace Adeyemi");

        const resB6 = (await (
          loader as unknown as (ctx: { params: { code: string } }) => Promise<{
            code: string;
            contestant: { name: string; code: string };
          }>
        )({
          params: { code: "b6f4pt" },
        })) as { code: string; contestant: { name: string; code: string } };

        expect(resB6.code).toBe("B6F4PT");
        expect(resB6.contestant.name).toBe("Emmanuel Ojo");
      }
    });

    it("loader throws notFound() for invalid or unknown contestant codes", async () => {
      const loader = ContestantDetailRoute.options.loader;
      expect(loader).toBeDefined();

      if (loader) {
        await expect(
          async () =>
            await (loader as unknown as (ctx: { params: { code: string } }) => Promise<unknown>)({
              params: { code: "INVALID" },
            }),
        ).rejects.toThrow();

        await expect(
          async () =>
            await (loader as unknown as (ctx: { params: { code: string } }) => Promise<unknown>)({
              params: { code: "000000" },
            }),
        ).rejects.toThrow();
      }
    });
  });

  describe("Component Rendering", () => {
    it("renders Grace Adeyemi profile when navigated to /contestants/SB7K2M", async () => {
      const contestant = (await adapter.getContestantByCode("SB7K2M"))!;
      const spyUseLoaderData = vi.spyOn(ContestantDetailRoute, "useLoaderData").mockReturnValue({
        code: "SB7K2M",
        contestant,
      });

      const Component = ContestantDetailRoute.options.component!;
      render(<Component />);

      // Contestant name & identity
      expect(screen.getByRole("heading", { name: "Grace Adeyemi" })).toBeInTheDocument();
      expect(screen.getByText(/Running order № 1 · SB7K2M/i)).toBeInTheDocument();
      expect(screen.getByText("Epe District")).toBeInTheDocument();
      expect(screen.getByText("“Great Are You Lord — Acoustic Rendition”")).toBeInTheDocument();

      // Rubric section
      expect(screen.getByText("How Grace Adeyemi will be scored")).toBeInTheDocument();
      expect(screen.getByText(/Music rubric — five criteria, 95 raw points/i)).toBeInTheDocument();

      // Public voting & sharing panels
      expect(screen.getByRole("heading", { name: "Public vote" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Share this profile" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Copy Code" })).toBeInTheDocument();

      spyUseLoaderData.mockRestore();
    });

    it("renders Emmanuel Ojo profile when navigated to /contestants/B6F4PT", async () => {
      const contestant = (await adapter.getContestantByCode("B6F4PT"))!;
      const spyUseLoaderData = vi.spyOn(ContestantDetailRoute, "useLoaderData").mockReturnValue({
        code: "B6F4PT",
        contestant,
      });

      const Component = ContestantDetailRoute.options.component!;
      render(<Component />);

      expect(screen.getByRole("heading", { name: "Emmanuel Ojo" })).toBeInTheDocument();
      expect(screen.getByText(/Running order № 3 · B6F4PT/i)).toBeInTheDocument();
      expect(screen.getByText("Morogbo District")).toBeInTheDocument();
      expect(screen.getByText("“My Lifter — Saxophone Solo”")).toBeInTheDocument();
      expect(screen.getByText("How Emmanuel Ojo will be scored")).toBeInTheDocument();

      spyUseLoaderData.mockRestore();
    });
  });
});
