import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Lock, ShieldCheck, UserCheck, Gavel, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useActiveJudgeSession } from "@/components/judge/use-active-judge";
import { useDemoState } from "@/hooks/use-demo";
import { getCard, setActiveJudge } from "@/lib/demo/store";
import { JUDGES, type JudgeId } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/judges/")({
  component: JudgesHome,
});

function JudgesHome() {
  const navigate = useNavigate();
  const state = useDemoState();
  const { staffSession, activeJudgeId } = useActiveJudgeSession();
  const locked = state.results !== null;

  function selectSeat(judgeId: JudgeId) {
    setActiveJudge(judgeId);
    void navigate({ to: "/judges/$judgeId", params: { judgeId } });
  }

  const activeJudge = JUDGES.find((j) => j.id === activeJudgeId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-forest">Judges' workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal-muted">
            Each judge scores independently — nobody sees another judge's scores. Pick your seat to
            open your scorecards. In this demo the seats are sample judges; a production build
            connects them with real staff sign-in and verified assignments.
          </p>
        </div>

        {/* Active Session Quick Jump */}
        {activeJudge && (
          <div className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-card p-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-gold">
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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {JUDGES.map((judge) => {
          const isCurrentActive = activeJudgeId === judge.id;
          const isStaffAssigned = staffSession?.assignedSeat === judge.id;
          const submittedCount = state.contestants.filter(
            (c) => getCard(state, judge.id, c.id).status === "submitted",
          ).length;
          const totalCount = state.contestants.length;
          const isCompleted = totalCount > 0 && submittedCount === totalCount;

          return (
            <button
              key={judge.id}
              onClick={() => selectSeat(judge.id)}
              className={cn(
                "group relative rounded-2xl border bg-card p-6 text-left shadow-card transition-all hover:shadow-lift hover:-translate-y-0.5",
                isCurrentActive ? "border-forest/50 ring-2 ring-forest/20" : "border-cream-line",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-forest font-display text-lg text-ivory">
                  {judge.name.replace("Judge ", "")}
                </span>
                <div className="flex items-center gap-1.5">
                  {isCurrentActive && (
                    <Badge variant="secondary" className="text-[11px] font-semibold text-forest">
                      Active
                    </Badge>
                  )}
                  {isStaffAssigned && (
                    <Badge variant="outline" className="border-gold/60 text-gold-deep text-[11px]">
                      Assigned
                    </Badge>
                  )}
                  <ArrowRight className="h-5 w-5 text-gold transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              <h2 className="mt-4 font-display text-xl text-forest">{judge.name}</h2>
              <p className="text-sm text-charcoal-muted">{judge.label}</p>

              {/* Progress counter */}
              <div className="mt-4 flex items-center justify-between border-t border-cream-line/60 pt-3 text-xs">
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

              <div className="mt-3 flex items-center gap-3 text-xs text-charcoal-muted">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-forest-soft" /> Independent scoring
                </span>
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-forest-soft" /> Conflict declaration
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
