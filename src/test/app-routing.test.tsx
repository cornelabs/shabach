import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

describe("App routing", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

  it("matches a page for / instead of falling back to not found", () => {
    const matches = router.matchRoutes("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/")).toBe(true);
  });

  it("matches the judge workspace at /judges", () => {
    const matches = router.matchRoutes("/judges");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/judges")).toBe(true);
  });

  it("matches judge workspace seat child routes at /judges/$judgeId", () => {
    const matches = router.matchRoutes("/judges/judge1");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/judges/$judgeId")).toBe(true);
  });

  it("matches the organiser workspace at /organiser", () => {
    const matches = router.matchRoutes("/organiser");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/organiser")).toBe(true);
  });

  it("matches the demo launcher at /demo", () => {
    const matches = router.matchRoutes("/demo");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/demo")).toBe(true);
  });

  it("matches the public results page at /results", () => {
    const matches = router.matchRoutes("/results");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/results")).toBe(true);
  });

  it("matches the canonical contestant route /contestants/$code", () => {
    const matches = router.matchRoutes("/contestants/SHB-01");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matches.some((m) => m.routeId === "/contestants/$code")).toBe(true);

    const matchesB6F4PT = router.matchRoutes("/contestants/B6F4PT");
    expect(matchesB6F4PT.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matchesB6F4PT.some((m) => m.routeId === "/contestants/$code")).toBe(true);

    const matchesSB7K2M = router.matchRoutes("/contestants/SB7K2M");
    expect(matchesSB7K2M.at(-1)?.routeId).not.toBe(rootRouteId);
    expect(matchesSB7K2M.some((m) => m.routeId === "/contestants/$code")).toBe(true);
  });

  it("matches redirect aliases /judge and /admin", () => {
    const judgeMatches = router.matchRoutes("/judge");
    expect(judgeMatches.some((m) => m.routeId === "/judge")).toBe(true);

    const adminMatches = router.matchRoutes("/admin");
    expect(adminMatches.some((m) => m.routeId === "/admin")).toBe(true);
  });
});
