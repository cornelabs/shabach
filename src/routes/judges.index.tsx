import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Gavel,
  KeyRound,
  Lock,
  ShieldCheck,
  Unlock,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

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
import { useActiveJudgeSession } from "@/components/judge/use-active-judge";
import { useDemoState } from "@/hooks/use-demo";
import {
  grantJudgeAccess,
  isJudgeUnlocked,
  verifyJudgeCode,
} from "@/lib/auth/judge-access";
import { getCard, setActiveJudge } from "@/lib/demo/store";
import { JUDGES, type JudgeId, type JudgeProfile } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/judges/")({
  head: () => ({
    meta: [
      { title: "Judges' Workspace — SHABACH 2026" },
      {
        name: "description",
        content:
          "Official Judges' Panel for SHABACH 2026 Grand Finale. Four independent scoring seats.",
      },
    ],
  }),
  component: JudgesHome,
});

function JudgesHome() {
  const navigate = useNavigate();
  const state = useDemoState();
  const { staffSession, activeJudgeId } = useActiveJudgeSession();
  const locked = state.results !== null;

  // Selected judge for access code modal
  const [authModalJudge, setAuthModalJudge] = React.useState<JudgeProfile | null>(null);
  const [accessCodeInput, setAccessCodeInput] = React.useState("");
  const [showCode, setShowCode] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [verifying, setVerifying] = React.useState(false);

  // Re-render trigger when access state changes
  const [accessNonce, setAccessNonce] = React.useState(0);

  function selectSeat(judgeId: JudgeId) {
    setActiveJudge(judgeId);
    void navigate({ to: "/judges/$judgeId", params: { judgeId } });
  }

  function handleJudgeCardClick(judge: JudgeProfile) {
    const isUnlocked = isJudgeUnlocked(judge.id);
    const isStaffAssigned = staffSession?.assignedSeat === judge.id;

    if (isUnlocked || isStaffAssigned) {
      selectSeat(judge.id);
      return;
    }

    // Open seat-specific authentication modal
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
        toast.error("Access denied", { description: result.message });
        setVerifying(false);
        return;
      }

      // Check seat match
      if (result.seatId !== "all" && result.seatId !== authModalJudge.id) {
        const errorMsg = `This code is for a different seat. Please enter the passcode for ${authModalJudge.name}.`;
        setAuthError(errorMsg);
        toast.error("Seat mismatch", { description: errorMsg });
        setVerifying(false);
        return;
      }

      // Grant access and navigate straight to judge workspace
      const grantedSeat = result.seatId || authModalJudge.id;
      grantJudgeAccess(grantedSeat);
      setAccessNonce((n) => n + 1);
      toast.success("Seat unlocked", {
        description: `Welcome, ${authModalJudge.name}. Scoring desk is ready.`,
      });

      const targetJudgeId = authModalJudge.id;
      setAuthModalJudge(null);
      selectSeat(targetJudgeId);
    } catch {
      setAuthError("Verification failed. Please retry.");
    } finally {
      setVerifying(false);
    }
  }

  const activeJudge = JUDGES.find((j) => j.id === activeJudgeId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-forest sm:text-4xl">Judges' workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal-muted">
            Each judge scores independently — nobody sees another judge's scores. Pick your seat to
            open your scorecards. Select your official profile below to authenticate and enter your
            confidential scoring desk.
          </p>
        </div>

        {/* Active Session Quick Jump */}
        {activeJudge && (
          <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-gold">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                Active Session
              </p>
              <p className="font-display text-base text-forest">{activeJudge.name}</p>
            </div>
            <Button size="sm" onClick={() => selectSeat(activeJudge.id)} className="ml-2 gap-1.5">
              Resume <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {locked && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-wash p-4">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-sm text-charcoal">
            Results are locked — all scorecards are read-only. The organiser can reopen a scorecard
            with a recorded reason.
          </p>
        </div>
      )}

      {staffSession && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-forest/20 bg-forest/5 p-4 text-sm text-forest">
          <ShieldCheck className="h-5 w-5 shrink-0 text-forest" />
          <p>
            Signed in as staff:{" "}
            <span className="font-semibold">
              {staffSession.displayName || staffSession.fullName}
            </span>{" "}
            ({staffSession.email})
            {staffSession.assignedSeat && (
              <span className="ml-1 text-xs font-semibold text-gold-deep">
                — Assigned seat: {JUDGES.find((j) => j.id === staffSession.assignedSeat)?.name}
              </span>
            )}
          </p>
        </div>
      )}

      {/* 4 Official Judges Cards Grid */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" key={accessNonce}>
        {JUDGES.map((judge) => {
          const isUnlocked = isJudgeUnlocked(judge.id);
          const isCurrentActive = activeJudgeId === judge.id;
          const isStaffAssigned = staffSession?.assignedSeat === judge.id;
          const submittedCount = state.contestants.filter(
            (c) => getCard(state, judge.id, c.id).status === "submitted",
          ).length;
          const totalCount = state.contestants.length;
          const isCompleted = totalCount > 0 && submittedCount === totalCount;

          return (
            <div
              key={judge.id}
              className={cn(
                "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card text-left shadow-card transition-all hover:-translate-y-1 hover:shadow-lift cursor-pointer",
                isCurrentActive
                  ? "border-forest/60 ring-2 ring-forest/30"
                  : isUnlocked
                    ? "border-gold/50"
                    : "border-cream-line",
              )}
              onClick={() => handleJudgeCardClick(judge)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleJudgeCardClick(judge);
                }
              }}
            >
              <div>
                {/* Official Photo */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-forest/5 border-b border-cream-line/80">
                  <img
                    src={judge.avatarUrl}
                    alt={judge.name}
                    loading="lazy"
                    className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      // Fallback if image path error
                      const target = e.currentTarget;
                      target.style.display = "none";
                    }}
                  />

                  {/* Seat Title Badge */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <Badge className="bg-forest/90 backdrop-blur-xs text-gold border border-gold/30 text-xs font-semibold shadow-xs">
                      {judge.seatTitle}
                    </Badge>
                  </div>

                  {/* Lock / Unlock State Pill */}
                  <div className="absolute top-3 right-3">
                    {isUnlocked ? (
                      <Badge className="bg-forest text-ivory border-0 text-[11px] gap-1 shadow-xs">
                        <Unlock className="h-3 w-3 text-gold" /> Unlocked
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="bg-card/90 backdrop-blur-xs text-charcoal-muted text-[11px] gap-1 shadow-xs"
                      >
                        <Lock className="h-3 w-3 text-gold" /> PIN Required
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Judge Info */}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-xl text-forest group-hover:text-gold-deep transition-colors">
                      {judge.name}
                    </h2>
                    <ArrowRight className="h-4 w-4 text-gold shrink-0 transition-transform group-hover:translate-x-1" />
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-charcoal-muted">
                    {judge.label}
                  </p>

                  {/* Progress Counter */}
                  <div className="mt-4 rounded-xl bg-ivory/70 p-2.5 border border-cream-line/70">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-charcoal-muted">Scorecards</span>
                      <span
                        className={cn(
                          "font-semibold inline-flex items-center gap-1",
                          isCompleted ? "text-forest" : "text-charcoal",
                        )}
                      >
                        {isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-forest" />}
                        {submittedCount}/{totalCount} submitted
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-cream-line">
                      <div
                        className={cn(
                          "h-full transition-all duration-300",
                          isCompleted ? "bg-forest" : "bg-gold",
                        )}
                        style={{
                          width: `${totalCount > 0 ? (submittedCount / totalCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {isCurrentActive && (
                      <Badge variant="secondary" className="text-[10px] font-semibold text-forest">
                        Active Desk
                      </Badge>
                    )}
                    {isStaffAssigned && (
                      <Badge
                        variant="outline"
                        className="border-gold/60 text-gold-deep text-[10px]"
                      >
                        Assigned to You
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="border-t border-cream-line/60 bg-parchment/40 px-5 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 text-[11px] text-charcoal-muted">
                    <ShieldCheck className="h-3.5 w-3.5 text-forest-soft" /> Independent scoring
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-charcoal-muted">
                    <UserCheck className="h-3.5 w-3.5 text-forest-soft" /> Conflict declaration
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seat Authentication Modal */}
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
        <DialogContent className="max-w-md rounded-2xl bg-card p-6 shadow-card border-cream-line">
          {authModalJudge && (
            <div>
              <DialogHeader className="text-left">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-gold/40 shadow-xs shrink-0">
                    <img
                      src={authModalJudge.avatarUrl}
                      alt={authModalJudge.name}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-gold-deep">
                      <Lock className="h-3 w-3" /> {authModalJudge.seatTitle}
                    </div>
                    <DialogTitle className="font-display text-xl text-forest">
                      {authModalJudge.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-charcoal-muted line-clamp-1">
                      {authModalJudge.label}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleVerifySeatCode} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="seat-code" className="text-xs font-semibold text-forest">
                    Enter Seat PIN or Access Code
                  </Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-charcoal-muted">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <Input
                      id="seat-code"
                      type={showCode ? "text" : "password"}
                      value={accessCodeInput}
                      onChange={(e) => {
                        setAccessCodeInput(e.target.value);
                        setAuthError(null);
                      }}
                      autoFocus
                      disabled={verifying}
                      className="pl-9 pr-10 text-sm font-mono tracking-wider bg-ivory border-cream-line"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCode(!showCode)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-charcoal-muted hover:text-forest"
                      aria-label={showCode ? "Hide code" : "Show code"}
                    >
                      {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {authError && <p className="text-xs font-medium text-destructive">{authError}</p>}

                <div className="rounded-xl border border-cream-line/80 bg-ivory p-3 text-xs text-charcoal-muted">
                  <p className="font-medium text-forest">Appointed judge credentials:</p>
                  <p className="mt-0.5">
                    Enter your assigned 4-digit seat PIN, seat passcode, or Panel Master Code to
                    open this scoring desk.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAuthModalJudge(null)}
                    disabled={verifying}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!accessCodeInput.trim() || verifying}
                    className="bg-forest text-ivory hover:bg-forest-deep gap-1.5"
                  >
                    Unlock & Open Desk <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
