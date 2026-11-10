import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, Lock, RotateCcw, ScrollText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { ContestantAvatar } from "@/components/contestant-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { JudgeAccessGate } from "@/components/judge/judge-access-gate";
import { JudgeSessionBadge } from "@/components/judge/judge-session-badge";
import { ScorecardEditor } from "@/components/judge/scorecard-editor";
import { useDemoState } from "@/hooks/use-demo";
import { isJudgeUnlocked, lockJudgeAccess } from "@/lib/auth/judge-access";
import { SCORECARD_STATUS_LABEL, typeLabel } from "@/lib/demo/labels";
import { rubricFor } from "@/lib/demo/rubrics";
import { judgeSubtotal } from "@/lib/demo/scoring";
import { getCard, setActiveJudge } from "@/lib/demo/store";
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
  const [unlocked, setUnlocked] = useState(() => isJudgeUnlocked(activeJudgeId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const locked = state.results !== null;

  // Sync active judge context with the store
  useEffect(() => {
    setActiveJudge(activeJudgeId);
  }, [activeJudgeId]);

  if (!unlocked) {
    return (
      <div className="py-6">
        <div className="mx-auto max-w-md px-4 mb-2">
          <Link
            to="/judges"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest"
          >
            ← View all judge seats
          </Link>
        </div>
        <JudgeAccessGate
          requiredSeatId={activeJudgeId}
          onUnlocked={() => setUnlocked(true)}
        />
      </div>
    );
  }

  const ordered = [...state.contestants].sort((a, b) => a.order - b.order);
  const selected = selectedId ? (state.contestants.find((c) => c.id === selectedId) ?? null) : null;
  const submittedCount = ordered.filter(
    (c) => getCard(state, activeJudgeId, c.id).status === "submitted",
  ).length;

  function statusBadge(contestantId: string, subtotal: number) {
    const card = getCard(state, activeJudgeId, contestantId);
    if (card.conflictDeclared && !card.conflictResolved) {
      return (
        <Badge variant="destructive" className="text-[11px] gap-1">
          <ShieldAlert className="h-3 w-3" /> Conflict declared
        </Badge>
      );
    }
    if (card.status === "submitted" && card.reopened) {
      return (
        <Badge className="bg-gold text-forest-deep hover:bg-gold text-[11px] gap-1">
          <RotateCcw className="h-3 w-3" /> Reopened ({subtotal}/95)
        </Badge>
      );
    }
    if (card.status === "submitted") {
      return (
        <Badge variant="default" className="text-[11px] gap-1 bg-forest text-ivory">
          <CheckCircle2 className="h-3 w-3 text-gold" /> Submitted ({subtotal}/95)
        </Badge>
      );
    }
    if (card.status === "draft") {
      return (
        <Badge variant="secondary" className="text-[11px]">
          Draft ({subtotal}/95)
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[11px] text-charcoal-muted">
        Not started
      </Badge>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/judges"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-muted hover:text-forest"
        >
          ← Judge seats
        </Link>
        <div className="flex items-center gap-2">
          <JudgeSessionBadge currentSeatId={activeJudgeId} showSwitchAction={true} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              lockJudgeAccess();
              setUnlocked(false);
              toast.info(`Seat for ${currentJudge.name} locked.`);
            }}
            className="h-8 border-cream-line text-xs gap-1.5 text-charcoal-muted hover:text-forest"
          >
            <Lock className="h-3 w-3 text-gold" /> Lock Seat
          </Button>
        </div>
      </div>

      {/* Header and Progress Indicator */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-forest/90 text-gold border border-gold/30 text-xs font-semibold">
              {currentJudge.seatTitle}
            </Badge>
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl text-forest">
            {currentJudge.name}'s scorecards
          </h1>
          <p className="text-sm text-charcoal-muted">
            {currentJudge.label} · {ordered.length} contestants · scores stay private until submitted
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-cream-line bg-card px-3.5 py-1.5 text-xs font-semibold text-charcoal shadow-sm">
          <ScrollText className="h-3.5 w-3.5 text-gold" /> {SCORECARD_STATUS_LABEL.submitted}:{" "}
          {submittedCount}/{ordered.length}
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

      {/* Direct Guidance Instructions */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-ivory/80 px-4 py-3 text-xs text-charcoal-muted">
        <p>
          Choose a contestant from the list to open their scorecard. Each act is scored on its own
          category rubric out of 95 raw points.
        </p>
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-flex items-center gap-1 text-forest">
            <CheckCircle2 className="h-3.5 w-3.5 text-forest" /> {submittedCount} Submitted
          </span>
          <span>•</span>
          <span className="text-charcoal-muted">
            {ordered.length - submittedCount} Pending
          </span>
        </div>
      </div>

      {/* 16 Contestants Visual Grid */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ordered.map((contestant) => {
          const card = getCard(state, activeJudgeId, contestant.id);
          const subtotal = judgeSubtotal(card.scores);
          const isSubmitted = card.status === "submitted" && !card.reopened;
          const isDraft = card.status === "draft";
          const rubric = rubricFor(contestant.type);
          const allocatedMinutes = Math.round(rubric.timeLimitSec / 60);

          return (
            <button
              key={contestant.id}
              onClick={() => setSelectedId(contestant.id)}
              type="button"
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-lift cursor-pointer",
                isSubmitted
                  ? "border-forest/40 bg-forest/[0.02]"
                  : isDraft
                    ? "border-gold/40 bg-gold-wash/20"
                    : "border-cream-line hover:border-gold/50",
              )}
            >
              <div>
                {/* Header row: Order number & Status badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center rounded-md bg-forest/10 px-2 py-0.5 font-mono text-xs font-bold text-forest">
                    № {contestant.order}
                  </span>
                  <div>{statusBadge(contestant.id, subtotal)}</div>
                </div>

                {/* Contestant Photo */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-parchment/60 border border-cream-line/80 mb-3">
                  {contestant.avatarUrl ? (
                    <img
                      src={contestant.avatarUrl}
                      alt={contestant.name}
                      loading="lazy"
                      className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <ContestantAvatar
                      name={contestant.name}
                      avatarUrl={null}
                      hue={contestant.hue}
                      size="lg"
                      className="h-full w-full rounded-none"
                    />
                  )}
                </div>

                {/* Contestant Name & Act Details */}
                <h3 className="truncate font-display text-lg text-forest group-hover:text-gold-deep transition-colors">
                  {contestant.name}
                </h3>
                <p className="mt-0.5 truncate text-xs text-charcoal-muted">
                  {contestant.code} · {contestant.district}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] font-medium">
                    {typeLabel(contestant.type)}
                  </Badge>
                  <span className="text-[11px] font-semibold text-forest flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gold" /> {allocatedMinutes} min limit
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-4 pt-3 border-t border-cream-line/60 flex items-center justify-between text-xs">
                <span
                  className={cn(
                    "font-semibold",
                    isSubmitted ? "text-forest" : isDraft ? "text-gold-deep" : "text-charcoal-muted",
                  )}
                >
                  {isSubmitted
                    ? `Score: ${subtotal}/95`
                    : isDraft
                      ? `Draft: ${subtotal}/95`
                      : "Tap to score"}
                </span>
                <span className="inline-flex items-center gap-1 text-gold group-hover:translate-x-0.5 transition-transform font-medium">
                  Score <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Direct Scorecard Editor Dialog (Single-click from grid) */}
      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] overflow-y-auto rounded-2xl bg-card p-2 sm:p-6 border-cream-line">
          {selected && (
            <ScorecardEditor
              key={selected.id}
              judgeId={activeJudgeId}
              contestantId={selected.id}
              onSubmitted={() => {
                setSelectedId(null);
              }}
              onCancel={() => setSelectedId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
