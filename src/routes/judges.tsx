import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import {
  AlertTriangle,
  BadgeAlert,
  CheckCircle2,
  ChevronRight,
  Gavel,
  Lock,
  RotateCcw,
  Save,
  Send,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Monogram } from "@/components/monogram";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useDemoState } from "@/hooks/use-demo";
import { formatLagos, formatSeconds, typeLabel } from "@/lib/demo/labels";
import { rubricFor } from "@/lib/demo/rubrics";
import {
  declareConflict,
  getCard,
  resetJudgeScorecard,
  saveDraft,
  setActiveJudge,
  submitScorecard,
  subtotalOf,
} from "@/lib/demo/store";
import type { Contestant, JudgeId, Scorecard } from "@/lib/demo/types";
import { JUDGES } from "@/lib/demo/types";

export const Route = createFileRoute("/judges")({
  head: () => ({
    meta: [
      { title: "Judges' Scoring Workspace — SHABACH 2026" },
      {
        name: "description",
        content: "Official independent scoring workspace for SHABACH 2026 Grand Finale judges.",
      },
    ],
  }),
  component: JudgesWorkspace,
});

function JudgesWorkspace() {
  const state = useDemoState();
  const currentJudgeId: JudgeId = state.activeJudge ?? "judge1";
  const activeJudgeInfo = JUDGES.find((j) => j.id === currentJudgeId) ?? JUDGES[0];

  const sortedContestants = React.useMemo(() => {
    return [...state.contestants].sort((a, b) => a.order - b.order);
  }, [state.contestants]);

  const [selectedContestantId, setSelectedContestantId] = React.useState<string>(
    sortedContestants[0]?.id ?? "c01",
  );

  const selectedContestant =
    state.contestants.find((c) => c.id === selectedContestantId) ?? sortedContestants[0];

  // Submission progress for current judge only
  const submittedCount = React.useMemo(() => {
    return sortedContestants.filter((c) => {
      const card = state.scorecards.find(
        (sc) => sc.judgeId === currentJudgeId && sc.contestantId === c.id,
      );
      return card?.status === "submitted" && !card.reopened && !card.conflictDeclared;
    }).length;
  }, [sortedContestants, state.scorecards, currentJudgeId]);

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Workspace Banner & Judge Switcher */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-cream-line bg-card p-6 shadow-card sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-gold">
                <Gavel className="h-4 w-4" />
              </span>
              <h1 className="font-display text-2xl text-forest">Judges' Workspace</h1>
              <Badge variant="outline" className="border-gold/50 bg-gold-wash text-forest text-xs">
                Demo simulation
              </Badge>
            </div>
            <p className="mt-1 text-sm text-charcoal-muted">
              Scoring as <strong className="text-forest">{activeJudgeInfo?.name}</strong>.
              Scorecards are confidential and independent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-charcoal-muted">Switch sample judge:</span>
            {JUDGES.map((j) => (
              <Button
                key={j.id}
                size="sm"
                variant={j.id === currentJudgeId ? "default" : "outline"}
                onClick={() => setActiveJudge(j.id)}
                className={
                  j.id === currentJudgeId
                    ? "bg-forest text-ivory hover:bg-forest-deep"
                    : "border-cream-line text-xs"
                }
              >
                <UserCheck className="mr-1.5 h-3.5 w-3.5" /> {j.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 rounded-xl border border-cream-line bg-card p-4 shadow-card">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-forest">Your Judging Progress</span>
            <span className="text-charcoal-muted">
              {submittedCount} of {sortedContestants.length} submitted
            </span>
          </div>
          <Progress
            value={(submittedCount / sortedContestants.length) * 100}
            className="mt-2 h-2.5 bg-parchment"
          />
        </div>

        {/* 2-Column Responsive Layout: Contestant List & Scorecard */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          {/* Left Column: Running Order List */}
          <div className="space-y-2">
            <div className="rounded-xl border border-cream-line bg-parchment px-4 py-3">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-forest">
                Contestants · Running Order
              </h3>
            </div>
            <div className="max-h-[750px] overflow-y-auto space-y-1.5 pr-1">
              {sortedContestants.map((c) => {
                const card = getCard(state, currentJudgeId, c.id);
                const isSelected = c.id === selectedContestant?.id;
                const isSubmitted =
                  card.status === "submitted" && !card.reopened && !card.conflictDeclared;
                const isConflict = card.conflictDeclared && !card.conflictResolved;
                const isReopened = card.reopened;
                const isDraft = card.status === "draft";

                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedContestantId(c.id)}
                    className={`w-full text-left rounded-xl p-3 border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? "border-forest bg-forest/5 shadow-card"
                        : "border-cream-line bg-card hover:bg-ivory/80"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-parchment text-xs font-bold text-forest">
                        {c.order}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-charcoal">{c.name}</p>
                        <p className="truncate text-xs text-charcoal-muted">
                          {typeLabel(c.type)} · {c.district}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isConflict ? (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Conflict
                        </Badge>
                      ) : isSubmitted ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-forest-soft">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Done
                        </span>
                      ) : isReopened ? (
                        <Badge
                          variant="outline"
                          className="border-amber-500 bg-amber-50 text-[10px] text-amber-700"
                        >
                          Reopened
                        </Badge>
                      ) : isDraft ? (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Draft
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-charcoal-muted">—</span>
                      )}
                      <ChevronRight className="h-4 w-4 text-charcoal-muted/50" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Scorecard */}
          {selectedContestant && (
            <ScorecardPanel
              contestant={selectedContestant}
              judgeId={currentJudgeId}
              judgeName={activeJudgeInfo?.name ?? "Judge"}
            />
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ScorecardPanel({
  contestant,
  judgeId,
  judgeName,
}: {
  contestant: Contestant;
  judgeId: JudgeId;
  judgeName: string;
}) {
  const state = useDemoState();
  const rubric = rubricFor(contestant.type);
  const card = getCard(state, judgeId, contestant.id);

  const [scores, setScores] = React.useState<(number | null)[]>(card.scores);
  const [notes, setNotes] = React.useState<string>(card.notes);
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving" | "idle">("idle");
  const [confirmSubmitOpen, setConfirmSubmitOpen] = React.useState(false);

  // Synchronize state when contestant or judge changes
  React.useEffect(() => {
    setScores(card.scores);
    setNotes(card.notes);
    setSaveStatus("idle");
  }, [card.contestantId, card.judgeId, card.updatedAt, card.scores, card.notes]);

  const isLocked = state.results !== null;
  const isSubmitted = card.status === "submitted" && !card.reopened && !card.conflictDeclared;
  const isConflict = card.conflictDeclared && !card.conflictResolved;
  const isReopened = card.reopened;

  const subtotal = subtotalOf(scores);

  // Autosave draft debounce
  const autosaveTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerAutosave = (newScores: (number | null)[], newNotes: string) => {
    if (isSubmitted || isConflict || isLocked) return;
    setSaveStatus("saving");
    if (autosaveTimeout.current) clearTimeout(autosaveTimeout.current);
    autosaveTimeout.current = setTimeout(() => {
      saveDraft(judgeId, contestant.id, newScores, newNotes);
      setSaveStatus("saved");
    }, 450);
  };

  const handleScoreChange = (index: number, valStr: string) => {
    if (isSubmitted || isConflict || isLocked) return;
    const criterion = rubric.criteria[index];
    const newScores = [...scores];

    if (valStr.trim() === "") {
      newScores[index] = null;
    } else {
      const parsed = Number(valStr);
      if (
        !Number.isNaN(parsed) &&
        Number.isInteger(parsed) &&
        parsed >= 0 &&
        criterion &&
        parsed <= criterion.max
      ) {
        newScores[index] = parsed;
      } else {
        // Reject invalid inputs immediately
        return;
      }
    }

    setScores(newScores);
    triggerAutosave(newScores, notes);
  };

  const handleNotesChange = (text: string) => {
    if (isSubmitted || isConflict || isLocked) return;
    setNotes(text);
    triggerAutosave(scores, text);
  };

  const handleConflictToggle = () => {
    const nextState = !card.conflictDeclared;
    declareConflict(judgeId, contestant.id, nextState);
    if (nextState) {
      toast.warning("Conflict of interest declared", {
        description: "This scorecard is recused until reviewed and determined by the score desk.",
      });
    } else {
      toast.info("Conflict declaration withdrawn.");
    }
  };

  const handleResetCard = () => {
    resetJudgeScorecard(judgeId, contestant.id);
    setScores(rubric.criteria.map(() => null));
    setNotes("");
    toast.info("Scorecard draft reset to blank.");
  };

  const allCriteriaScored = scores.every((s) => typeof s === "number");

  const handleSubmit = () => {
    const res = submitScorecard(judgeId, contestant.id);
    if (res.ok) {
      toast.success(`Scorecard submitted for ${contestant.name}!`, {
        description: "Your official marks have been locked into the collation desk.",
      });
      setConfirmSubmitOpen(false);
    } else {
      toast.error("Submission failed", {
        description: res.errors?.join(", ") ?? "Please ensure all criteria are scored correctly.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Contestant Header Summary */}
      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-center gap-4">
            <Monogram name={contestant.name} hue={contestant.hue} size="lg" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Performance Order № {contestant.order} · Code {contestant.code}
              </p>
              <h2 className="mt-1 font-display text-3xl text-forest">{contestant.name}</h2>
              <p className="text-sm font-semibold text-charcoal italic">“{contestant.title}”</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="secondary">{typeLabel(contestant.type)}</Badge>
                <Badge variant="outline">{contestant.district}</Badge>
                <Badge variant="outline">Limit: {formatSeconds(rubric.timeLimitSec)}</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Button
              variant={card.conflictDeclared ? "destructive" : "outline"}
              size="sm"
              disabled={isSubmitted || isLocked}
              onClick={handleConflictToggle}
              className="text-xs border-cream-line"
            >
              <BadgeAlert className="mr-1.5 h-3.5 w-3.5" />
              {card.conflictDeclared ? "Conflict Declared" : "Declare Conflict"}
            </Button>
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-xs text-charcoal-muted">
                <Save className="h-3 w-3 animate-pulse text-gold" /> Saving draft...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs font-medium text-forest-soft">✓ Saved</span>
            )}
          </div>
        </div>

        {/* Reopened Banner */}
        {isReopened && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-semibold">Scorecard Reopened by Organiser:</strong>
              <p className="mt-0.5">{card.reopenReason || "Reason not specified."}</p>
              <p className="mt-1 text-[11px] text-amber-700">
                You can revise and resubmit your marks below.
              </p>
            </div>
          </div>
        )}

        {/* Submitted Banner */}
        {isSubmitted && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-forest-soft/30 bg-forest/5 p-4 text-xs text-forest">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-forest-soft" />
              <span>
                <strong>Scorecard Submitted:</strong> Your official scores are locked. To request
                changes, contact the score desk.
              </span>
            </div>
            <Lock className="h-4 w-4 text-forest-soft" />
          </div>
        )}

        {/* Conflict Banner */}
        {isConflict && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Conflict of interest declared:</strong> You are recused from scoring this
              contestant. This entry is excluded from the final tally until resolved by the score
              desk.
            </span>
          </div>
        )}
      </div>

      {/* Rubric Criteria Cards */}
      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <div className="flex items-center justify-between border-b border-cream-line pb-4">
          <div>
            <h3 className="font-display text-xl text-forest">
              {typeLabel(contestant.type)} Rubric
            </h3>
            <p className="mt-0.5 text-xs text-charcoal-muted">
              Enter whole numbers from 0 up to each criterion's maximum points.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider text-charcoal-muted font-semibold">
              Raw Subtotal
            </span>
            <p className="font-display text-3xl text-forest">
              {subtotal} <span className="text-sm font-sans text-charcoal-muted">/ 95</span>
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {rubric.criteria.map((c, index) => {
            const val = scores[index];
            const isInvalid = typeof val === "number" && (val < 0 || val > c.max);

            return (
              <div
                key={c.key}
                className="flex flex-col justify-between gap-3 rounded-xl border border-cream-line bg-ivory p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-forest">{c.name}</h4>
                    <span className="rounded bg-parchment px-2 py-0.5 text-xs font-bold text-forest">
                      Max {c.max}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-charcoal-muted leading-relaxed">{c.guidance}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    max={c.max}
                    step={1}
                    value={val ?? ""}
                    disabled={isSubmitted || isConflict || isLocked}
                    onChange={(e) => handleScoreChange(index, e.target.value)}
                    placeholder="—"
                    className={`w-20 text-center font-display text-lg font-bold bg-card border-cream-line ${
                      isInvalid ? "border-destructive text-destructive" : "text-forest"
                    }`}
                  />
                  <span className="text-xs font-semibold text-charcoal-muted">/ {c.max}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Optional Notes */}
        <div className="mt-6 border-t border-cream-line pt-4">
          <label className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
            Confidential Notes & Feedback (Optional)
          </label>
          <Textarea
            value={notes}
            disabled={isSubmitted || isConflict || isLocked}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Optional comments for official review..."
            className="mt-2 border-cream-line bg-ivory text-sm text-charcoal placeholder:text-charcoal-muted/60"
            rows={3}
          />
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-cream-line pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={isSubmitted || isConflict || isLocked}
            onClick={handleResetCard}
            className="border-cream-line text-xs"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Draft
          </Button>

          {!isSubmitted && (
            <Button
              onClick={() => setConfirmSubmitOpen(true)}
              disabled={!allCriteriaScored || isConflict || isLocked}
              className="bg-forest text-ivory hover:bg-forest-deep"
            >
              <Send className="mr-1.5 h-4 w-4" /> Review & Submit Scorecard
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog Before Final Submit */}
      <AlertDialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <AlertDialogContent className="border-cream-line bg-card sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl text-forest">
              Submit Scorecard
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-charcoal-muted">
              You are about to submit official scores for{" "}
              <strong className="text-forest">{contestant.name}</strong> as{" "}
              <strong className="text-forest">{judgeName}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-xl border border-cream-line bg-ivory p-4 space-y-2">
            <div className="flex justify-between text-xs text-charcoal-muted">
              <span>Performance:</span>
              <span className="font-semibold text-charcoal">“{contestant.title}”</span>
            </div>
            <div className="flex justify-between text-xs text-charcoal-muted">
              <span>Category / Rubric:</span>
              <span className="font-semibold text-charcoal">{typeLabel(contestant.type)}</span>
            </div>
            <div className="border-t border-cream-line pt-2 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-forest">Final Raw Subtotal:</span>
              <span className="font-display text-2xl text-forest">
                {subtotal} <span className="text-xs font-normal text-charcoal-muted">/ 95</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-charcoal-muted">
            Once submitted, your scorecard becomes read-only and cannot be edited without an
            explicit reopening request by the score desk.
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-cream-line">Cancel</AlertDialogCancel>
            <Button onClick={handleSubmit} className="bg-forest text-ivory hover:bg-forest-deep">
              Confirm Submission
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
