import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Send,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDemoState } from "@/hooks/use-demo";
import { SCORECARD_STATUS_LABEL, typeLabel, formatSeconds, formatLagos } from "@/lib/demo/labels";
import {
  declareConflict,
  getCard,
  resetJudgeScorecard,
  saveDraft,
  submitScorecard,
} from "@/lib/demo/store";
import { fmt2, judgeSubtotal, validateScores } from "@/lib/demo/scoring";
import { rubricFor, MAX_JUDGE_SUBTOTAL } from "@/lib/demo/rubrics";
import type { JudgeId } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type SubmitStatus = "idle" | "submitting" | "submitted" | "error";

/**
 * One judge's scorecard for one contestant.
 *
 * Local state holds active inputs:
 * - When saving draft, writes current inputs to the store.
 * - When confirming submission, passes the EXACT reviewed inputs (scores and notes)
 *   to submitScorecard so no unsaved modifications disappear.
 * - If submission fails, preserves the judge's work and displays retry actions.
 * - Respects submitted locks until an organiser reopens the card with a recorded reason.
 */
export function ScorecardEditor({
  judgeId,
  contestantId,
}: {
  judgeId: JudgeId;
  contestantId: string;
}) {
  const state = useDemoState();
  const card = getCard(state, judgeId, contestantId);
  const contestant = state.contestants.find((c) => c.id === contestantId);
  const rubric = useMemo(() => rubricFor(contestant?.type ?? "music"), [contestant?.type]);

  const [scores, setScores] = useState<(number | null)[]>(card.scores);
  const [notes, setNotes] = useState(card.notes);
  const [confirming, setConfirming] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Draft and submission status indicators
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(card.updatedAt ?? null);

  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Synchronize local state when the store card is modified externally
  // (e.g. reopened by the organiser or updated after reset)
  const prevCardUpdatedRef = useRef(card.updatedAt);
  const prevCardStatusRef = useRef(card.status);
  const prevCardReopenedRef = useRef(card.reopened);

  useEffect(() => {
    const statusChanged = card.status !== prevCardStatusRef.current;
    const reopenedChanged = card.reopened !== prevCardReopenedRef.current;
    const externalUpdate = card.updatedAt !== prevCardUpdatedRef.current;

    if (statusChanged || reopenedChanged || externalUpdate) {
      prevCardStatusRef.current = card.status;
      prevCardReopenedRef.current = card.reopened;
      prevCardUpdatedRef.current = card.updatedAt;

      // Only reseed if we are not in the middle of active dirty editing, or if status/reopen shifted
      if (statusChanged || reopenedChanged) {
        setScores(card.scores);
        setNotes(card.notes);
        setLastSavedAt(card.updatedAt ?? null);
        setConfirming(false);
        setErrors([]);
        setSubmitError(null);
        setSaveError(null);
      }
    }
  }, [card.status, card.reopened, card.updatedAt, card.scores, card.notes]);

  // Check if current component state differs from last saved state
  const isDirty = useMemo(() => {
    if (notes !== card.notes) return true;
    if (scores.length !== card.scores.length) return true;
    return scores.some((val, idx) => val !== card.scores[idx]);
  }, [scores, notes, card.scores, card.notes]);

  if (!contestant) return null;

  const resultsLocked = state.results !== null;
  const submitted = card.status === "submitted" && !card.reopened;
  const conflictBlocks = card.conflictDeclared && !card.conflictResolved;
  const readOnly = submitted || resultsLocked || conflictBlocks;
  const subtotal = judgeSubtotal(scores);
  const timeLimit = formatSeconds(rubric.timeLimitSec);

  function setScore(index: number, value: number | null) {
    setErrors([]);
    setSubmitError(null);
    setSaveError(null);
    if (saveStatus === "saved") setSaveStatus("idle");
    setScores((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function clampScore(index: number, raw: string) {
    const criterion = rubric.criteria[index];
    if (!criterion) return;
    if (raw.trim() === "") {
      setScore(index, null);
      return;
    }
    const parsed = Math.round(Number(raw));
    if (Number.isNaN(parsed)) {
      setScore(index, null);
      return;
    }
    setScore(index, Math.min(criterion.max, Math.max(0, parsed)));
  }

  function step(index: number, delta: number) {
    const criterion = rubric.criteria[index];
    if (!criterion) return;
    const current = scores[index];
    const base =
      current === null || current === undefined ? (delta > 0 ? 0 : criterion.max) : current;
    setScore(index, Math.min(criterion.max, Math.max(0, base + delta)));
  }

  function handleNotesChange(value: string) {
    setNotes(value);
    setSubmitError(null);
    setSaveError(null);
    if (saveStatus === "saved") setSaveStatus("idle");
  }

  async function handleSave() {
    if (resultsLocked) {
      toast.error("Can't save — results are locked.");
      setSaveStatus("error");
      setSaveError("Results are locked by the organiser.");
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);

    try {
      const result = saveDraft(judgeId, contestantId, scores, notes);
      if (result.ok) {
        setSaveStatus("saved");
        const nowIso = new Date().toISOString();
        setLastSavedAt(nowIso);
        toast.success("Draft saved.", { description: "Come back any time before submission." });
      } else {
        setSaveStatus("error");
        const msg =
          result.reason === "results_locked"
            ? "Results are locked — cannot save draft."
            : "Failed to save draft. Please retry.";
        setSaveError(msg);
        toast.error(msg);
      }
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Unexpected save error.");
      toast.error("Failed to save draft.");
    }
  }

  function startSubmit() {
    setSubmitError(null);
    const validation = validateScores(scores, rubric);
    if (!validation.ok) {
      setErrors(validation.errors);
      setConfirming(false);
      return;
    }
    setErrors([]);
    setConfirming(true);
  }

  async function confirmSubmit() {
    setSubmitStatus("submitting");
    setSubmitError(null);

    try {
      // Pass the EXACT reviewed scores and notes directly so any unsaved modifications
      // made after or without saving draft are accurately submitted
      const result = submitScorecard(judgeId, contestantId, scores, notes);

      if (result.ok) {
        setSubmitStatus("submitted");
        setConfirming(false);
        setSaveStatus("idle");
        toast.success("Scorecard submitted.", {
          description: "Submitted cards are locked until an organiser reopens them.",
        });
      } else {
        setSubmitStatus("error");
        if (result.reason === "incomplete" && result.errors) {
          setErrors(result.errors);
          setSubmitError("Scorecard is incomplete. Please ensure all criteria are scored.");
          setConfirming(false);
        } else if (result.reason === "results_locked") {
          const msg = "Results are locked — nothing can be submitted.";
          setSubmitError(msg);
          toast.error(msg);
          setConfirming(false);
        } else if (result.reason === "unresolved_conflict") {
          const msg =
            "A conflict of interest has been declared. It must be resolved by the organiser before submission.";
          setSubmitError(msg);
          toast.error(msg);
          setConfirming(false);
        } else if (result.reason === "already_submitted") {
          const msg = "This scorecard was already submitted and is currently locked.";
          setSubmitError(msg);
          toast.error(msg);
          setConfirming(false);
        } else {
          setSubmitError(
            "Submission could not be completed. Your inputs are preserved — please retry.",
          );
        }
      }
    } catch (err) {
      setSubmitStatus("error");
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Unexpected error during submission. Your work is preserved.",
      );
    }
  }

  function handleConflict(checked: boolean | string) {
    const isDeclared = Boolean(checked);
    declareConflict(judgeId, contestantId, isDeclared);
    if (isDeclared) {
      toast.warning("Conflict of interest declared.", {
        description: "The organiser must review it before this scorecard can count.",
      });
    } else {
      toast.info("Conflict of interest declaration cleared.");
    }
  }

  function handleReset() {
    resetJudgeScorecard(judgeId, contestantId);
    setScores(rubric.criteria.map(() => null));
    setNotes("");
    setErrors([]);
    setConfirming(false);
    setSaveStatus("idle");
    setSubmitStatus("idle");
    setSaveError(null);
    setSubmitError(null);
    toast.info("Scorecard cleared.");
  }

  return (
    <div className="rounded-2xl border border-cream-line bg-card shadow-card">
      {/* Header */}
      <div className="border-b border-cream-line p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              № {contestant.order} · {typeLabel(contestant.type)} rubric
            </p>
            <h2 className="mt-1 font-display text-2xl text-forest">{contestant.name}</h2>
            <p className="text-sm text-charcoal-muted">“{contestant.title}”</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 text-right">
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <Badge
                variant={
                  card.status === "submitted" && !card.reopened
                    ? "default"
                    : card.status === "draft"
                      ? "secondary"
                      : card.reopened
                        ? "outline"
                        : "outline"
                }
                className={cn(card.reopened && "border-gold/60 bg-gold-wash text-forest")}
              >
                {card.reopened ? "Reopened by organiser" : SCORECARD_STATUS_LABEL[card.status]}
              </Badge>

              {/* Dirty / Saving / Saved status indicators */}
              {!readOnly && (
                <>
                  {saveStatus === "saving" && (
                    <span className="inline-flex items-center gap-1 text-xs text-charcoal-muted">
                      <Loader2 className="h-3 w-3 animate-spin text-gold" />
                      Saving…
                    </span>
                  )}
                  {saveStatus === "saved" && !isDirty && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-forest">
                      <CheckCircle2 className="h-3 w-3 text-forest" />
                      Saved
                    </span>
                  )}
                  {isDirty && saveStatus !== "saving" && (
                    <span className="inline-flex items-center gap-1 text-xs text-charcoal-muted">
                      <span className="h-2 w-2 rounded-full bg-gold" />
                      Unsaved edits
                    </span>
                  )}
                </>
              )}
            </div>

            {lastSavedAt && (
              <p className="text-xs text-charcoal-muted">Last updated {formatLagos(lastSavedAt)}</p>
            )}
          </div>
        </div>

        {/* Reopened Banner */}
        {card.reopened && (
          <div className="mt-4 rounded-lg border border-gold/40 bg-gold-wash p-3.5 text-sm text-charcoal">
            <div className="flex items-start gap-2">
              <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
              <div>
                <p className="font-semibold text-forest">Scorecard reopened by the organiser</p>
                <p className="mt-0.5 text-xs text-charcoal-muted">
                  {card.reopenReason
                    ? `Reason: ${card.reopenReason}`
                    : "You may edit and resubmit your scores."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Locked Card Banner */}
        {submitted && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-forest/20 bg-forest/5 p-3 text-sm text-forest">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
            <div>
              <p className="font-semibold">Scorecard is locked</p>
              <p className="text-xs text-charcoal-muted">
                Official submission verified. If you need to make changes, request the organiser to
                reopen it.
              </p>
            </div>
          </div>
        )}

        {/* Conflict Notice */}
        {conflictBlocks && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-charcoal">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Conflict of interest declared</p>
              <p className="text-xs text-charcoal-muted">
                The organiser must review and resolve this declaration before this scorecard can be
                counted.
              </p>
            </div>
          </div>
        )}

        {/* Draft Save Error Banner with Retry */}
        {saveError && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleSave()}
              className="h-7 text-xs"
            >
              Retry save
            </Button>
          </div>
        )}

        {/* Submission Error Banner with Retry */}
        {submitError && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void confirmSubmit()}
              className="h-7 text-xs"
              disabled={submitStatus === "submitting"}
            >
              {submitStatus === "submitting" ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Retrying…
                </>
              ) : (
                "Retry submission"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Criteria */}
      <div className="space-y-4 p-6">
        {rubric.criteria.map((criterion, index) => (
          <div
            key={criterion.key}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-cream-line bg-ivory/60 p-4"
          >
            <div className="min-w-[220px] flex-1">
              <p className="text-sm font-semibold text-charcoal">{criterion.name}</p>
              <p className="mt-0.5 text-xs text-charcoal-muted">{criterion.guidance}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={readOnly}
                onClick={() => step(index, -1)}
                aria-label={`Decrease ${criterion.name}`}
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <input
                inputMode="numeric"
                className="h-8 w-14 rounded-md border border-input bg-card text-center text-sm font-semibold text-charcoal disabled:opacity-50"
                value={scores[index] ?? ""}
                placeholder="—"
                disabled={readOnly}
                onChange={(e) => clampScore(index, e.target.value)}
                aria-label={`${criterion.name} score, out of ${criterion.max}`}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={readOnly}
                onClick={() => step(index, 1)}
                aria-label={`Increase ${criterion.name}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-10 text-right text-xs font-semibold text-charcoal-muted">
                /{criterion.max}
              </span>
            </div>
          </div>
        ))}

        {/* Subtotal Card */}
        <div className="flex items-center justify-between rounded-xl bg-forest px-5 py-4 text-ivory">
          <span className="text-sm font-semibold uppercase tracking-widest text-gold-soft">
            Raw subtotal
          </span>
          <span className="font-display text-2xl">
            {subtotal}
            <span className="text-sm text-ivory/60"> / {MAX_JUDGE_SUBTOTAL}</span>
          </span>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="judge-notes" className="text-sm font-semibold text-charcoal">
            Judge's notes
          </Label>
          <Textarea
            id="judge-notes"
            className="mt-2 min-h-[90px]"
            placeholder="Optional observations for the score desk…"
            value={notes}
            disabled={readOnly}
            onChange={(e) => handleNotesChange(e.target.value)}
          />
        </div>

        {/* Conflict Checkbox */}
        <div className="flex items-start gap-3 rounded-xl border border-cream-line p-4">
          <Checkbox
            id="conflict"
            checked={card.conflictDeclared}
            disabled={submitted || resultsLocked}
            onCheckedChange={(checked) => handleConflict(checked)}
          />
          <div>
            <Label htmlFor="conflict" className="text-sm font-semibold text-charcoal">
              I declare a conflict of interest
            </Label>
            <p className="text-xs text-charcoal-muted">
              Tick this if you have a personal, pastoral, or direct coaching relationship with this
              act. Declared conflicts are flagged for organiser review before final collation.
            </p>
          </div>
        </div>

        {/* Incomplete Validation Errors */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Please complete all criteria before submitting:
            </p>
            <ul className="mt-2 list-inside list-disc text-xs text-charcoal">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Confirmation Banner */}
        {confirming && (
          <div className="rounded-xl border border-forest/30 bg-forest/5 p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-forest">
              <CheckCircle2 className="h-4 w-4" /> Review before submitting
            </p>
            <div className="mt-2 rounded-lg bg-card p-3 border border-cream-line">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-charcoal-muted">Raw subtotal:</span>
                <span className="font-display text-lg text-forest">
                  {subtotal} / {MAX_JUDGE_SUBTOTAL} ({fmt2((subtotal / MAX_JUDGE_SUBTOTAL) * 100)}%)
                </span>
              </div>
              {notes.trim() && (
                <p className="mt-2 border-t border-cream-line pt-2 text-xs italic text-charcoal-muted">
                  “{notes.trim()}”
                </p>
              )}
            </div>
            <p className="mt-2 text-xs text-charcoal-muted">
              Submission locks this scorecard. Submitted values are submitted exactly as shown
              above.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => void confirmSubmit()}
                disabled={submitStatus === "submitting"}
              >
                {submitStatus === "submitting" ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" /> Confirm submission
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={submitStatus === "submitting"}
              >
                Go back
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {!readOnly && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 border-t border-cream-line p-6",
            resultsLocked && "opacity-60",
          )}
        >
          <Button
            variant="outline"
            onClick={() => void handleSave()}
            disabled={resultsLocked || saveStatus === "saving"}
          >
            {saveStatus === "saving" ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" /> Save draft
              </>
            )}
          </Button>

          <Button
            onClick={startSubmit}
            disabled={
              resultsLocked || confirming || submitStatus === "submitting" || conflictBlocks
            }
          >
            <Send className="mr-1.5 h-4 w-4" /> Review & submit
          </Button>

          <Button
            variant="ghost"
            className="ml-auto text-charcoal-muted hover:text-destructive"
            onClick={handleReset}
            disabled={resultsLocked || submitStatus === "submitting"}
          >
            Clear card
          </Button>

          <p className="w-full text-xs text-charcoal-muted">
            Time limit for this category: {timeLimit} · submitted scorecards are locked until the
            organiser reopens them.
          </p>
        </div>
      )}
    </div>
  );
}
