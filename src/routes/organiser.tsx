import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/organiser")({
  head: () => ({
    meta: [
      { title: "Organiser Dashboard — SHABACH 2026" },
      {
        name: "description",
        content:
          "Administration dashboard for SHABACH 2026 — contestant management, score collation, verification and results publication.",
      },
    ],
  }),
  component: OrganiserPage,
});

function OrganiserPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-4xl text-forest">Organiser dashboard</h1>
        <p className="mt-2 text-sm text-charcoal-muted">
          Administration workspace for the score desk. Under construction.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
