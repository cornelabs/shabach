import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Minus, Plus, Save, Send } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDemoState } from "@/hooks/use-demo";
import {
  SCORECARD_STATUS_LABEL,
  typeLabel,
  formatSeconds,
  formatLagos,
} from "@/lib/demo/labels";
import {
  declareConflict,
  getCard,
  judgeSubtotal,
  resetJudgeScorecard,
  saveDraft,
  submitScorecard,
} from "@/lib/demo/store";
import { fmt2, validateScores } from "@/lib/demo/scoring";
import { rubricFor } from "@/lib/demo/rubrics";
import type { JudgeId } from "@/lib/demo/types";
import { MAX_JUDGE_SUBTOTAL } from "@/lib/demo/rubrics";
import { cn } from "@/lib/utils";

/**
 * One judge's scorecard for one contestant. Local state is seeded from the
 * shared demo store and written back on save/submit; remounting on
 * contestantId change re-seeds it (the parent passes a key).
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
  const rubric = useMemo(
    () => rubricFor(contestant?.type ?? "music"),
    [contestant?.type],
  );

  const [scores, setScores] = useState<(number | null)[]>(card.scores);
  const [notes, setNotes] = useState(card.notes);
  const [confirming, setConfirming] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  if (!contestant) return null;

  const resultsLocked = state.results !== null;
  const submitted = card.status === "submitted" && !card.reopened;
  const conflictBlocks = card.conflictDeclared && !card.conflictResolved;
  const readOnly = submitted || resultsLocked || conflictBlocks;
  const subtotal = judgeSubtotal(scores);
  const timeLimit = formatSeconds(rubric.timeLimitSec);

  function setScore(index: number, value: number | null) {
    setErrors([]);
    setScores((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function clampScore(index: number, raw: string) {
    if (raw.trim() === "") {
      setScore(index, null);
      return;
    }
    const parsed = Math.round(Number(raw));
    if (Number.isNaN(parsed)) {
      setScore(index, null);
      return;
    }
    setScore(index, Math.min(rubric.criteria[index].max, Math.max(0, parsed)));
  }

  function step(index: number, delta: number) {
    const current = scores[index];
    const base = current === null ? (delta > 0 ? 0 : rubric.criteria[index].max) : current;
    setScore(index, Math.min(rubric.criteria[index].max, Math.max(0, base + delta)));
  }

  function handleSave() {
    const result = saveDraft(judgeId, contestantId, scores, notes);
    if (result.ok) {
      toast.success("Draft saved.", { description: "Come back any time before submission." });
    } else {
      toast.error("Can't save — results are locked.");
    }
  }

  function startSubmit() {
    const validation = validateScores(scores, rubric);
    if (!validation.ok) {
      setErrors(validation.errors);
      setConfirming(false);
      return;
    }
    setErrors([]);
    setConfirming(true);
  }

  function confirmSubmit() {
    const result = submitScorecard(judgeId, contestantId);
    if (result.ok) {
      setConfirming(false);
      toast.success("Scorecard submitted.", {
        description: "Submitted cards can only be edited after an organiser reopen.",
      });
    } else if (result.reason === "incomplete" && result.errors) {
      setErrors(result.errors);
      setConfirming(false);
    } else if (result.reason === "results_locked") {
      toast.error("Results are locked — nothing can be submitted.");
      setConfirming(false);
    }
  }

  function handleConflict(checked: boolean | string) {
    declareConflict(judgeId, contestantId, Boolean(checked));
    if (checked) {
      toast.warning("Conflict of interest declared.", {
        description: "The organiser must review it before this scorecard can count.",
      });
    }
  }

  function handleReset() {
    resetJudgeScorecard(judgeId, contestantId);
    setScores(rubric.criteria.map(() => null));
    setNotes("");
    setErrors([]);
    setConfirming(false);
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
          <div className="text-right">
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
            >
              {card.reopened ? "Reopened by organiser" : SCORECARD_STATUS_LABEL[card.status]}
            </Badge>
            {card.updatedAt && (
              <p className="mt-1 text-xs text-charcoal-muted">Saved {formatLagos(card.updatedAt)}</p>
            )}
          </div>
        </div>

        {card.reopened && card.reopenReason && (
          <div className="mt-4 rounded-lg border border-gold/40 bg-gold-wash p-3 text-sm text-charcoal">
            <span className="font-semibold">Reopened by the organiser:</span> {card.reopenReason}
          </div>
        )}
        {conflictBlocks && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-charcoal">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            Conflict of interest declared — the organiser must review and resolve it before this
            scorecard can be used.
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

        <div className="flex items-center justify-between rounded-xl bg-forest px-5 py-4 text-ivory">
          <span className="text-sm font-semibold uppercase tracking-widest text-gold-soft">
            Raw subtotal
          </span>
          <span className="font-display text-2xl">
            {subtotal}
            <span className="text-sm text-ivory/60"> / {MAX_JUDGE_SUBTOTAL}</span>
          </span>
        </div>

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
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-cream-line p-4">
          <Checkbox
            id="conflict"
            checked={card.conflictDeclared}
            disabled={readOnly || resultsLocked}
            onCheckedChange={(checked) => handleConflict(checked)}
          />
          <div>
            <Label htmlFor="conflict" className="text-sm font-semibold text-charcoal">
              I declare a conflict of interest
            </Label>
            <p className="text-xs text-charcoal-muted">
              Tick this if you have a personal or pastoral relationship with this act. The organiser
              reviews declared conflicts before collation.
            </p>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" /> Fix before submitting
            </p>
            <ul className="mt-2 list-inside list-disc text-xs text-charcoal">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {confirming && (
          <div className="rounded-xl border border-forest/30 bg-forest/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-forest">
              <CheckCircle2 className="h-4 w-4" /> Review before submitting
            </p>
            <p className="mt-1 text-xs text-charcoal-muted">
              Subtotal {subtotal} / {MAX_JUDGE_SUBTOTAL} ({fmt2((subtotal / MAX_JUDGE_SUBTOTAL) * 100)}%
              of raw points). Submission is final — only the organiser can reopen it, with a recorded
              reason.
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={confirmSubmit}>
                <Send className="h-3.5 w-3.5" /> Confirm submission
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirming(false)}>
                Go back
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-2 border-t border-cream-line p-6",
            resultsLocked && "opacity-60",
          )}
        >
          <Button variant="outline" onClick={handleSave} disabled={resultsLocked}>
            <Save className="h-4 w-4" /> Save draft
          </Button>
          <Button onClick={startSubmit} disabled={resultsLocked || confirming}>
            <Send className="h-4 w-4" /> Review & submit
          </Button>
          <Button
            variant="ghost"
            className="ml-auto text-charcoal-muted"
            onClick={handleReset}
            disabled={resultsLocked}
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
