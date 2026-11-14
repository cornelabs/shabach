import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Gavel,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trophy,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { ContestantAvatar } from "@/components/contestant-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JudgeSessionBadge } from "@/components/judge/judge-session-badge";
import { ScorecardEditor } from "@/components/judge/scorecard-editor";
import { useActiveJudgeSession } from "@/components/judge/use-active-judge";
import { useDemoState } from "@/hooks/use-demo";
import {
  grantJudgeAccess,
  isJudgeUnlocked,
  lockJudgeAccess,
  verifyJudgeCode,
} from "@/lib/auth/judge-access";
import { SCORECARD_STATUS_LABEL, typeLabel } from "@/lib/demo/labels";
import { rubricFor } from "@/lib/demo/rubrics";
import { judgeSubtotal } from "@/lib/demo/scoring";
import { getCard, getTop6Contestants, setActiveJudge } from "@/lib/demo/store";
import { JUDGES, type JudgeId, type JudgeProfile } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/judges/round2")({
  head: () => ({
    meta: [
      { title: "Score Page Two — Round 2 Top 6 Championship — SHABACH 2026" },
      {
        name: "description",
        content:
          "Official Score Page Two for SHABACH 2026 Grand Finale. Independent scoring for the Top 6 finalists competing in the championship round.",
      },
    ],
  }),
  component: Round2ScoringPage,
});

export function Round2ScoringPage() {
  const navigate = useNavigate();
  const state = useDemoState();
  const { staffSession, activeJudgeId: sessionJudgeId } = useActiveJudgeSession();
  const locked = state.results !== null;

  // Determine current active judge: preference to stored active, then session, then first unlocked
  const [selectedJudgeId, setSelectedJudgeId] = React.useState<JudgeId>(() => {
    if (state.activeJudge && isJudgeUnlocked(state.activeJudge)) return state.activeJudge;
    if (sessionJudgeId && isJudgeUnlocked(sessionJudgeId)) return sessionJudgeId;
    const unlocked = JUDGES.find((j) => isJudgeUnlocked(j.id));
    return unlocked ? unlocked.id : "judge1";
  });

  const isCurrentUnlocked = isJudgeUnlocked(selectedJudgeId);
  const currentJudge = JUDGES.find((j) => j.id === selectedJudgeId) ?? JUDGES[0]!;

  // Auth modal state for unlocking seats
  const [authModalJudge, setAuthModalJudge] = React.useState<JudgeProfile | null>(null);
  const [accessCodeInput, setAccessCodeInput] = React.useState("");
  const [showCode, setShowCode] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);
  const [accessNonce, setAccessNonce] = React.useState(0);

  // Contestant scorecard dialog state
  const [selectedContestantId, setSelectedContestantId] = React.useState<string | null>(null);

  // Synchronize store active judge
  React.useEffect(() => {
    if (isCurrentUnlocked) {
      setActiveJudge(selectedJudgeId);
    }
  }, [selectedJudgeId, isCurrentUnlocked]);

  const top6 = getTop6Contestants(state);
  const selectedContestant = selectedContestantId
    ? (top6.find((c) => c.id === selectedContestantId) ?? null)
    : null;

  const round2SubmittedCount = top6.filter(
    (c) => getCard(state, selectedJudgeId, c.id, 2).status === "submitted",
  ).length;

  function handleSeatClick(judge: JudgeProfile) {
    if (isJudgeUnlocked(judge.id)) {
      setSelectedJudgeId(judge.id);
      setActiveJudge(judge.id);
      return;
    }
    setAuthModalJudge(judge);
    setAccessCodeInput("");
    setAuthError(null);
    setShowCode(false);
  }

  function handleVerifySeatCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!authModalJudge) return;

    setAuthError(null);
    setVerifying(true);

    try {
      const result = verifyJudgeCode(accessCodeInput, authModalJudge.id);
      if (!result.valid) {
        setAuthError(result.message || "Invalid access code or seat PIN.");
        setVerifying(false);
        return;
      }

      grantJudgeAccess(authModalJudge.id);
      setActiveJudge(authModalJudge.id);
      setSelectedJudgeId(authModalJudge.id);
      setAccessNonce((n) => n + 1);
      setAuthModalJudge(null);
      setAccessCodeInput("");
      toast.success(`Seat unlocked: ${authModalJudge.name}`, {
        description: `Ready to score Round 2 Top 6 Finalists on Score Page Two.`,
      });
    } catch {
      setAuthError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  function statusBadge(contestantId: string, subtotal: number) {
    const card = getCard(state, selectedJudgeId, contestantId, 2);
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
      {/* Top Breadcrumb & Seat Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/judges"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Judges Lobby
        </Link>
        <div className="flex items-center gap-2">
          {isCurrentUnlocked && (
            <>
              <JudgeSessionBadge currentSeatId={selectedJudgeId} showSwitchAction={false} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  lockJudgeAccess();
                  setAccessNonce((n) => n + 1);
                  toast.info(`Seat for ${currentJudge.name} locked.`);
                }}
                className="h-8 border-cream-line text-xs gap-1.5 text-charcoal-muted hover:text-forest"
              >
                <Lock className="h-3 w-3 text-gold" /> Lock Seat
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hero Banner for Score Page Two */}
      <div className="mt-4 rounded-3xl border border-gold/40 bg-gradient-to-br from-forest-deep via-forest to-forest p-6 sm:p-8 text-ivory shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-gold text-forest-deep border-none text-xs font-bold gap-1 shadow-sm">
                <Trophy className="h-3.5 w-3.5 text-forest-deep" /> Official Score Page Two
              </Badge>
              <Badge variant="outline" className="border-gold/50 text-gold-soft text-xs font-mono">
                Round 2 · Championship Stage
              </Badge>
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-4xl text-ivory tracking-tight">
              Score Page Two: Top 6 Championship
            </h1>
            <p className="mt-2 text-sm sm:text-base text-ivory/80 leading-relaxed">
              Independent scoring desk for the 6 finalists who advanced to Round 2. Each act is
              evaluated across their discipline rubric out of 95 raw points to determine the SHABACH
              2026 winners.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-forest-deep/80 px-4 py-2 text-xs font-semibold text-gold shadow-sm">
              <Trophy className="h-4 w-4 text-gold" />
              Round 2 Progress: {round2SubmittedCount}/{top6.length} Submitted
            </span>
            <Link
              to="/judges/$judgeId"
              params={{ judgeId: selectedJudgeId }}
              className="text-xs text-gold-soft hover:underline inline-flex items-center gap-1 font-medium"
            >
              Switch to Round 1 (Top 16 Acts) <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Judge Seat Selector Tabs */}
      <div className="mt-8 rounded-2xl border border-cream-line bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-line pb-3">
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-gold" />
            <span className="text-xs font-bold uppercase tracking-wider text-forest">
              Judge Scoring Seat
            </span>
          </div>
          <span className="text-xs text-charcoal-muted">
            Click any seat to switch scoring desk
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {JUDGES.map((judge) => {
            const isUnlocked = isJudgeUnlocked(judge.id);
            const isSelected = selectedJudgeId === judge.id;
            const submitted = top6.filter(
              (c) => getCard(state, judge.id, c.id, 2).status === "submitted",
            ).length;

            return (
              <button
                key={judge.id}
                type="button"
                onClick={() => handleSeatClick(judge)}
                className={cn(
                  "relative flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer",
                  isSelected
                    ? "border-forest bg-forest text-ivory shadow-md"
                    : isUnlocked
                      ? "border-gold/40 bg-gold-wash/30 text-charcoal hover:border-gold"
                      : "border-cream-line bg-ivory/60 text-charcoal-muted hover:border-cream-line/80",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold uppercase",
                      isSelected ? "text-gold" : "text-charcoal-muted",
                    )}
                  >
                    Seat {judge.id.replace("judge", "")}
                  </span>
                  {isUnlocked ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5 text-[10px] font-semibold",
                        isSelected ? "text-gold-soft" : "text-forest",
                      )}
                    >
                      <UserCheck className="h-3 w-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-charcoal-muted">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    "mt-1 font-display text-sm font-semibold truncate",
                    isSelected ? "text-ivory" : "text-forest",
                  )}
                >
                  {judge.name}
                </p>

                <div
                  className={cn(
                    "mt-2 flex items-center justify-between text-[11px]",
                    isSelected ? "text-ivory/80" : "text-charcoal-muted",
                  )}
                >
                  <span>Round 2 Cards:</span>
                  <span className="font-semibold">{submitted}/5</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Body: Check if Seat is Unlocked */}
      {!isCurrentUnlocked ? (
        <div className="mt-8 rounded-3xl border border-dashed border-gold/60 bg-gold-wash/30 p-8 text-center max-w-xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-gold shadow-md">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-display text-2xl text-forest">
            Unlock {currentJudge.name}'s Seat
          </h2>
          <p className="mt-2 text-sm text-charcoal-muted">
            Enter the seat PIN or event access code to unlock {currentJudge.seatTitle} and score the
            Top 6 Round 2 acts.
          </p>
          <Button
            onClick={() => handleSeatClick(currentJudge)}
            className="mt-5 bg-forest text-ivory hover:bg-forest-deep gap-2 px-6"
          >
            <KeyRound className="h-4 w-4 text-gold" />
            <span>Unlock Seat to Score</span>
          </Button>
        </div>
      ) : (
        <>
          {locked && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-wash p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              <p className="text-sm text-charcoal">
                Results are locked — scorecards are read-only until the organiser reopens one.
              </p>
            </div>
          )}

          {/* Direct Guidance Instructions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cream-line bg-ivory/80 px-4 py-3 text-xs text-charcoal-muted">
            <p>
              Tap any finalist below to open their official <strong>Round 2 Scorecard</strong>.
              Scores stay strictly confidential and autosave as drafts until you verify and submit.
            </p>
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-flex items-center gap-1 text-forest">
                <CheckCircle2 className="h-3.5 w-3.5 text-forest" /> {round2SubmittedCount} Submitted
              </span>
              <span>•</span>
              <span className="text-charcoal-muted">{top6.length - round2SubmittedCount} Pending</span>
            </div>
          </div>

          {/* Top 6 Contestants Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {top6.map((contestant, idx) => {
              const card = getCard(state, selectedJudgeId, contestant.id, 2);
              const subtotal = judgeSubtotal(card.scores);
              const isSubmitted = card.status === "submitted" && !card.reopened;
              const isDraft = card.status === "draft";
              const rubric = rubricFor(contestant.type);
              const allocatedMinutes = Math.round(rubric.timeLimitSec / 60);

              return (
                <button
                  key={`${contestant.id}-round2`}
                  onClick={() => setSelectedContestantId(contestant.id)}
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
                    {/* Header row: Top 6 Rank & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-gold/20 px-2 py-0.5 font-mono text-xs font-bold text-forest-deep border border-gold/40">
                        <Trophy className="h-3 w-3 text-gold-deep" /> Top 6 № {idx + 1}
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
                        isSubmitted
                          ? "text-forest"
                          : isDraft
                            ? "text-gold-deep"
                            : "text-charcoal-muted",
                      )}
                    >
                      {isSubmitted
                        ? `R2: ${subtotal}/95`
                        : isDraft
                          ? `Draft: ${subtotal}/95`
                          : "Score Round 2"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-gold group-hover:translate-x-0.5 transition-transform font-medium">
                      Score <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Round 2 Scorecard Editor Dialog */}
      <Dialog
        open={selectedContestantId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedContestantId(null);
        }}
      >
        <DialogContent className="max-w-3xl w-[95vw] max-h-[92vh] overflow-y-auto rounded-2xl bg-card p-2 sm:p-6 border-cream-line">
          {selectedContestant && (
            <ScorecardEditor
              key={`${selectedContestant.id}-r2`}
              judgeId={selectedJudgeId}
              contestantId={selectedContestant.id}
              round={2}
              onSubmitted={() => {
                setSelectedContestantId(null);
              }}
              onCancel={() => setSelectedContestantId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Seat Unlock Verification Dialog */}
      <Dialog
        open={authModalJudge !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAuthModalJudge(null);
            setAccessCodeInput("");
            setAuthError(null);
          }
        }}
      >
        <DialogContent className="max-w-md bg-card border-cream-line">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-forest text-gold">
              <KeyRound className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center font-display text-2xl text-forest">
              Unlock {authModalJudge?.name}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-charcoal-muted">
              {authModalJudge?.seatTitle} · Official Score Page Two Entry
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifySeatCode} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="round2-judge-pin" className="text-xs font-semibold text-charcoal">
                Seat Access PIN or Event Code
              </Label>
              <div className="relative mt-1">
                <Input
                  id="round2-judge-pin"
                  type={showCode ? "text" : "password"}
                  placeholder="Enter seat PIN or access code"
                  value={accessCodeInput}
                  onChange={(e) => {
                    setAccessCodeInput(e.target.value);
                    setAuthError(null);
                  }}
                  className="pr-10 bg-ivory font-mono text-sm border-cream-line"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-charcoal"
                >
                  {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-charcoal-muted">
                Demo seat codes: <code className="font-mono text-gold-deep">1234</code>,{" "}
                <code className="font-mono text-gold-deep">4321</code>,{" "}
                <code className="font-mono text-gold-deep">8888</code>,{" "}
                <code className="font-mono text-gold-deep">5555</code>
              </p>
            </div>

            {authError && (
              <div className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAuthModalJudge(null)}
                className="flex-1 border-cream-line"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={verifying || !accessCodeInput.trim()}
                className="flex-1 bg-forest text-ivory hover:bg-forest-deep"
              >
                {verifying ? "Verifying..." : "Unlock Seat"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}