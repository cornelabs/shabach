import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Lock,
  RotateCcw,
  ScrollText,
  ShieldAlert,
  Sparkles,
  Trophy,
} from "lucide-react";
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
import { getCard, getTop6Contestants, setActiveJudge } from "@/lib/demo/store";
import { JUDGES, type JudgeId } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/judges/$judgeId")({
  loader: ({ params }) => {
    if (!JUDGES.some((j) => j.id === params.judgeId)) throw notFound();
    return null;
  },
  validateSearch: (search: Record<string, unknown>): { round?: number } => {
    const r = search["round"];
    if (r === 2 || r === "2") return { round: 2 };
    return {};
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
  let search: { round?: number } = {};
  try {
    search = Route.useSearch();
  } catch {
    search = {};
  }
  const currentJudge = JUDGES.find((j) => j.id === judgeId) ?? JUDGES[0]!;
  const activeJudgeId: JudgeId = currentJudge.id;
  const state = useDemoState();
  const [unlocked, setUnlocked] = useState(() => isJudgeUnlocked(activeJudgeId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeRound, setActiveRound] = useState<1 | 2>(() => (search?.round === 2 ? 2 : 1));
  const locked = state.results !== null;

  // Sync active judge context with the store
  useEffect(() => {
    setActiveJudge(activeJudgeId);
  }, [activeJudgeId]);

  // Keep active round synced if search param changes
  useEffect(() => {
    if (search.round === 2) {
      setActiveRound(2);
    }
  }, [search.round]);

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
  const top6 = getTop6Contestants(state);
  const displayedContestants = activeRound === 2 ? top6 : ordered;
  const selected = selectedId ? (state.contestants.find((c) => c.id === selectedId) ?? null) : null;

  const round1SubmittedCount = ordered.filter(
    (c) => getCard(state, activeJudgeId, c.id, 1).status === "submitted",
  ).length;

  const round2SubmittedCount = top6.filter(
    (c) => getCard(state, activeJudgeId, c.id, 2).status === "submitted",
  ).length;

  const currentSubmittedCount = activeRound === 2 ? round2SubmittedCount : round1SubmittedCount;
  const currentTotal = displayedContestants.length;

  function statusBadge(contestantId: string, subtotal: number, roundNum: number) {
    const card = getCard(state, activeJudgeId, contestantId, roundNum);
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest"
        >
          ← All Judge Seats
        </Link>
        <div className="flex items-center gap-2">
          <JudgeSessionBadge currentSeatId={activeJudgeId} showSwitchAction={false} />
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

      {/* Round Selection Tabs: Round 1 (Top 16) vs Score Page Two (Top 6) */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-cream-line pb-4">
        <div className="inline-flex rounded-xl bg-ivory p-1 border border-cream-line shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveRound(1);
              setSelectedId(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
              activeRound === 1
                ? "bg-forest text-ivory shadow-xs"
                : "text-charcoal-muted hover:text-forest",
            )}
          >
            <span>Round 1: Preliminary (16 Acts)</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                activeRound === 1 ? "bg-gold text-forest-deep" : "bg-cream-line text-charcoal",
              )}
            >
              {round1SubmittedCount}/16
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRound(2);
              setSelectedId(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer",
              activeRound === 2
                ? "bg-gold text-forest-deep shadow-xs"
                : "text-charcoal-muted hover:text-gold-deep",
            )}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Score Page Two: Round 2 (Top 6)</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                activeRound === 2 ? "bg-forest text-gold" : "bg-cream-line text-charcoal",
              )}
            >
              {round2SubmittedCount}/{top6.length}
            </span>
          </button>
        </div>

        {activeRound === 2 ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-gold-wash text-forest border border-gold/40 text-xs gap-1.5 font-medium">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Championship Final Stage
            </Badge>
          </div>
        ) : (
          <Link
            to="/judges/round2"
            className="text-xs font-semibold text-gold-deep hover:underline inline-flex items-center gap-1"
          >
            Open dedicated Score Page Two <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Header and Progress Indicator */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-forest/90 text-gold border border-gold/30 text-xs font-semibold">
              {currentJudge.seatTitle}
            </Badge>
            {activeRound === 2 && (
              <Badge className="bg-gold text-forest-deep border-none text-xs font-bold gap-1">
                <Trophy className="h-3 w-3" /> Score Page Two
              </Badge>
            )}
          </div>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl text-forest">
            {currentJudge.name}'s {activeRound === 2 ? "Score Page Two (Round 2)" : "scorecards"}
          </h1>
          <p className="text-sm text-charcoal-muted">
            {currentJudge.label} ·{" "}
            {activeRound === 2
              ? "Top 6 Finalists · Championship Round · scores stay private until submitted"
              : `${ordered.length} contestants · scores stay private until submitted`}
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-cream-line bg-card px-3.5 py-1.5 text-xs font-semibold text-charcoal shadow-sm">
          {activeRound === 2 ? (
            <Trophy className="h-3.5 w-3.5 text-gold" />
          ) : (
            <ScrollText className="h-3.5 w-3.5 text-gold" />
          )}{" "}
          {SCORECARD_STATUS_LABEL.submitted}: {currentSubmittedCount}/{currentTotal}
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
          {activeRound === 2
            ? "Score Page Two: The Top 6 finalists have advanced to the championship round. Select a finalist to score their second round performance across their category rubric out of 95 raw points."
            : "Choose a contestant from the list to open their scorecard. Each act is scored on its own category rubric out of 95 raw points."}
        </p>
        <div className="flex items-center gap-2 font-medium">
          <span className="inline-flex items-center gap-1 text-forest">
            <CheckCircle2 className="h-3.5 w-3.5 text-forest" /> {currentSubmittedCount} Submitted
          </span>
          <span>•</span>
          <span className="text-charcoal-muted">
            {currentTotal - currentSubmittedCount} Pending
          </span>
        </div>
      </div>

      {/* Visual Contestants Grid */}
      <div
        className={cn(
          "mt-6 grid gap-4",
          activeRound === 2
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        )}
      >
        {displayedContestants.map((contestant, idx) => {
          const card = getCard(state, activeJudgeId, contestant.id, activeRound);
          const subtotal = judgeSubtotal(card.scores);
          const isSubmitted = card.status === "submitted" && !card.reopened;
          const isDraft = card.status === "draft";
          const rubric = rubricFor(contestant.type);
          const allocatedMinutes = Math.round(rubric.timeLimitSec / 60);

          return (
            <button
              key={`${contestant.id}-r${activeRound}`}
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
                {/* Header row: Order number or Finalist badge & Status badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  {activeRound === 2 ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-gold/20 px-2 py-0.5 font-mono text-xs font-bold text-forest-deep border border-gold/40">
                      <Trophy className="h-3 w-3 text-gold-deep" /> Top 6 № {idx + 1}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-md bg-forest/10 px-2 py-0.5 font-mono text-xs font-bold text-forest">
                      № {contestant.order}
                    </span>
                  )}
                  <div>{statusBadge(contestant.id, subtotal, activeRound)}</div>
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
                    ? `${activeRound === 2 ? "R2 Score" : "Score"}: ${subtotal}/95`
                    : isDraft
                      ? `Draft: ${subtotal}/95`
                      : activeRound === 2
                        ? "Score Round 2"
                        : "Tap to score"}
                </span>
                <span className="inline-flex items-center gap-1 text-gold group-hover:translate-x-0.5 transition-transform font-medium">
                  {activeRound === 2 ? "Score R2" : "Score"} <ArrowRight className="h-3.5 w-3.5" />
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
              key={`${selected.id}-r${activeRound}`}
              judgeId={activeJudgeId}
              contestantId={selected.id}
              round={activeRound}
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
