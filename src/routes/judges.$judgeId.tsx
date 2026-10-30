import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, ScrollText } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { ScorecardEditor } from "@/components/judge/scorecard-editor";
import { useDemoState } from "@/hooks/use-demo";
import { SCORECARD_STATUS_LABEL, typeLabel } from "@/lib/demo/labels";
import { getCard } from "@/lib/demo/store";
import { JUDGES, type JudgeId } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/judges/$judgeId")({
  loader: ({ params }) => {
    if (!JUDGES.some((j) => j.id === params.judgeId)) throw notFound();
    return null;
  },
  head: () => ({
    meta: [
      { title: "Scorecards — Judges' Workspace — SHABACH 2026" },
      {
        name: "description",
        content:
          "Score every Grand Finale act on the category rubric — SHABACH 2026 judges' workspace.",
      },
    ],
  }),
  component: JudgeWorkspace,
});

function JudgeWorkspace() {
  const { judgeId } = Route.useParams();
  const currentJudge = JUDGES.find((j) => j.id === judgeId) ?? JUDGES[0]!;
  const activeJudgeId: JudgeId = currentJudge.id;
  const state = useDemoState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locked = state.results !== null;

  const ordered = [...state.contestants].sort((a, b) => a.order - b.order);
  const selected = selectedId ? (state.contestants.find((c) => c.id === selectedId) ?? null) : null;

  function statusBadge(contestantId: string) {
    const card = getCard(state, activeJudgeId, contestantId);
    if (card.conflictDeclared && !card.conflictResolved) {
      return <Badge variant="destructive">Conflict declared</Badge>;
    }
    if (card.status === "submitted" && card.reopened) {
      return <Badge className="bg-gold text-forest-deep hover:bg-gold">Reopened</Badge>;
    }
    if (card.status === "submitted") return <Badge variant="default">Submitted</Badge>;
    if (card.status === "draft") return <Badge variant="secondary">Draft</Badge>;
    return <Badge variant="outline">Not started</Badge>;
  }

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/judges" className="text-sm font-semibold text-charcoal-muted hover:text-forest">
          ← Judge seats
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-forest">{currentJudge.name}'s scorecards</h1>
            <p className="text-sm text-charcoal-muted">
              {currentJudge.label} · {ordered.length} contestants · scores stay private until
              submitted
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cream-line bg-card px-3 py-1 text-xs font-semibold text-charcoal">
            <ScrollText className="h-3.5 w-3.5 text-gold" /> {SCORECARD_STATUS_LABEL.submitted}:{" "}
            {
              ordered.filter((c) => getCard(state, activeJudgeId, c.id).status === "submitted")
                .length
            }
            /{ordered.length}
          </span>
        </div>

        {locked && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-wash p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <p className="text-sm text-charcoal">
              Results are locked — scorecards are read-only until the organiser reopens one.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-2xl border border-cream-line bg-card p-2 shadow-card lg:max-h-[70vh] lg:overflow-y-auto">
            {ordered.map((contestant) => (
              <button
                key={contestant.id}
                onClick={() => setSelectedId(contestant.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  selectedId === contestant.id ? "bg-forest text-ivory" : "hover:bg-parchment",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-xs",
                    selectedId === contestant.id ? "text-gold-soft" : "text-charcoal-muted",
                  )}
                >
                  № {contestant.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{contestant.name}</span>
                  <span
                    className={cn(
                      "block text-xs",
                      selectedId === contestant.id ? "text-ivory/70" : "text-charcoal-muted",
                    )}
                  >
                    {typeLabel(contestant.type)}
                  </span>
                </span>
                {statusBadge(contestant.id)}
              </button>
            ))}
          </aside>

          <div>
            {selected ? (
              <ScorecardEditor
                key={selected.id}
                judgeId={activeJudgeId}
                contestantId={selected.id}
              />
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-cream-line bg-card p-8 text-center">
                <p className="max-w-sm text-sm text-charcoal-muted">
                  Choose a contestant from the list to open their scorecard. Each act is scored on
                  its own category rubric out of 95 raw points.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
