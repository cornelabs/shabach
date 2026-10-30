import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, ShieldCheck, UserCheck } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useDemoState } from "@/hooks/use-demo";
import { JUDGES } from "@/lib/demo/types";

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
  component: JudgesHome,
});

function JudgesHome() {
  const navigate = useNavigate();
  const state = useDemoState();
  const locked = state.results !== null;

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="font-display text-4xl text-forest">Judges' workspace</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal-muted">
          Each judge scores independently — nobody sees another judge's scores. Pick your seat to
          open your scorecards. In this demo the seats are sample judges; a production build would
          replace them with real staff sign-in.
        </p>

        {locked && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-wash p-4">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <p className="text-sm text-charcoal">
              Results are locked — all scorecards are read-only. The organiser can reopen a
              scorecard with a recorded reason.
            </p>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {JUDGES.map((judge) => (
            <button
              key={judge.id}
              onClick={() =>
                void navigate({ to: "/judges/$judgeId", params: { judgeId: judge.id } })
              }
              className="group rounded-2xl border border-cream-line bg-card p-6 text-left shadow-card transition-shadow hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest font-display text-lg text-ivory">
                  {judge.name.replace("Judge ", "")}
                </span>
                <ArrowRight className="h-5 w-5 text-gold transition-transform group-hover:translate-x-1" />
              </div>
              <h2 className="mt-4 font-display text-xl text-forest">{judge.name}</h2>
              <p className="text-sm text-charcoal-muted">{judge.label}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-charcoal-muted">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-forest-soft" /> Independent scoring
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-forest-soft" /> Conflict declaration
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
