import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/judges")({
  head: () => ({
    meta: [
      { title: "Judges' Workspace — SHABACH 2026" },
      {
        name: "description",
        content: "Independent scoring workspace for SHABACH 2026 Grand Finale judges.",
      },
    ],
  }),
  component: JudgesPage,
});

function JudgesPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-4xl text-forest">Judges' workspace</h1>
        <p className="mt-2 text-sm text-charcoal-muted">
          Select a demo judge to begin scoring. This workspace is under construction.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

