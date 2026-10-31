import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/judges")({
  head: () => ({
    meta: [
      { title: "Judges' Workspace — SHABACH 2026" },
      {
        name: "description",
        content:
          "Independent judge scoring for SHABACH 2026 — five-criterion rubrics per category, private drafts, conflict-of-interest declarations and verified submissions.",
      },
      { property: "og:title", content: "Judges' Workspace — SHABACH 2026" },
      {
        property: "og:description",
        content:
          "Independent judge scoring for SHABACH 2026 — rubrics, private drafts and verified submissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JudgesLayout,
});

function JudgesLayout() {
  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <Outlet />
      <SiteFooter />
    </div>
  );
}
