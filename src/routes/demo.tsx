import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo Launcher — SHABACH 2026" },
      {
        name: "description",
        content:
          "Enter the SHABACH 2026 demo as a public visitor, Judge 1, Judge 2, Judge 3, or organiser.",
      },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-4xl text-forest">Demo launcher</h1>
        <p className="mt-2 text-sm text-charcoal-muted">
          Choose a demo role to explore the SHABACH 2026 platform. Under construction.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

