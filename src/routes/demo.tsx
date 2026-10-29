import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import * as React from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Gavel,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { toast } from "sonner";

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
import { useDemoState } from "@/hooks/use-demo";
import { FINALE_DATE_LABEL, VOTING_STATUS_LABEL } from "@/lib/demo/labels";
import { loadSampleScores, resetDemo, setActiveJudge } from "@/lib/demo/store";
import type { JudgeId } from "@/lib/demo/types";
import { JUDGES } from "@/lib/demo/types";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo Launcher & Role Switcher — SHABACH 2026" },
      {
        name: "description",
        content:
          "Launch and evaluate the SHABACH 2026 competition platform across public, judge, and organiser roles.",
      },
    ],
  }),
  component: DemoLauncherPage,
});

function DemoLauncherPage() {
  const state = useDemoState();
  const router = useRouter();
  const [resetDialogOpen, setResetDialogOpen] = React.useState(false);

  const handleSelectJudge = (judgeId: JudgeId) => {
    setActiveJudge(judgeId);
    toast.success(`Active judge switched to ${judgeId.toUpperCase()}`);
    router.navigate({ to: "/judges" });
  };

  const handleLoadSamples = () => {
    loadSampleScores();
    toast.success("Complete sample scores loaded!", {
      description: "All 48 scorecards submitted and durations verified. Demo data only.",
    });
  };

  const handleReset = () => {
    resetDemo();
    setResetDialogOpen(false);
    toast.info("Demo restored to seed state.");
  };

  const submittedCount = state.scorecards.filter(
    (s) => s.status === "submitted" && !s.reopened && !s.conflictDeclared,
  ).length;

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        {/* Header Hero */}
        <div className="text-center sm:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Interactive Demonstration Environment
          </p>
          <h1 className="mt-4 font-display text-4xl text-forest sm:text-5xl">
            SHABACH 2026 Demo Launcher
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal-muted sm:text-base">
            Experience the competition platform from every stakeholder vantage point. All roles,
            votes, scores, and collation gates are simulated in your browser's local sandbox.
          </p>
        </div>

        {/* Current State Status Bar */}
        <div className="mt-8 grid gap-3 rounded-2xl border border-cream-line bg-card p-5 shadow-card sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Vote className="h-5 w-5 text-forest" />
            <div>
              <p className="text-xs text-charcoal-muted">Public Voting Status</p>
              <p className="text-sm font-semibold text-forest">
                {VOTING_STATUS_LABEL[state.votingStatus]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Gavel className="h-5 w-5 text-gold" />
            <div>
              <p className="text-xs text-charcoal-muted">Scorecard Submissions</p>
              <p className="text-sm font-semibold text-forest">{submittedCount} / 48 Complete</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-forest" />
            <div>
              <p className="text-xs text-charcoal-muted">Collation / Results</p>
              <p className="text-sm font-semibold text-forest">
                {state.results?.published
                  ? "Published"
                  : state.results
                    ? "Locked (Ready to Publish)"
                    : "In Progress"}
              </p>
            </div>
          </div>
        </div>

        {/* Role Cards Grid */}
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Public Role */}
          <div className="flex flex-col justify-between rounded-2xl border border-cream-line bg-card p-6 shadow-card">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest/10 text-forest">
                  <Users className="h-5 w-5" />
                </span>
                <Badge variant="outline" className="border-cream-line text-xs">
                  Public Role
                </Badge>
              </div>
              <h3 className="mt-4 font-display text-xl text-forest">Public Audience</h3>
              <p className="mt-2 text-xs leading-relaxed text-charcoal-muted">
                Explore the 16 finalists in performance order, search by code or name, scan QR
                codes, and confirm your single public vote.
              </p>
            </div>

            <div className="mt-6 space-y-2 border-t border-cream-line pt-4">
              <Link to="/">
                <Button className="w-full bg-forest text-ivory hover:bg-forest-deep text-xs font-semibold">
                  Enter Public Voting <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
              <Link to="/results">
                <Button variant="outline" className="w-full border-cream-line text-xs">
                  View Public Top-Three <Trophy className="ml-1.5 h-3.5 w-3.5 text-gold" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Judges 1, 2, 3 */}
          {JUDGES.map((judge) => {
            const judgeSubmitted = state.scorecards.filter(
              (sc) =>
                sc.judgeId === judge.id &&
                sc.status === "submitted" &&
                !sc.reopened &&
                !sc.conflictDeclared,
            ).length;

            return (
              <div
                key={judge.id}
                className="flex flex-col justify-between rounded-2xl border border-cream-line bg-card p-6 shadow-card"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold">
                      <Gavel className="h-5 w-5" />
                    </span>
                    <Badge variant="outline" className="border-cream-line text-xs">
                      {judgeSubmitted} / 16 Done
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-display text-xl text-forest">{judge.name}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-charcoal-muted">
                    Tablet interface for scoring contestants on discipline-specific rubrics out of
                    95. Autosaves drafts, protects privacy, and requires explicit submission review.
                  </p>
                </div>

                <div className="mt-6 border-t border-cream-line pt-4">
                  <Button
                    onClick={() => handleSelectJudge(judge.id)}
                    className="w-full bg-forest text-ivory hover:bg-forest-deep text-xs font-semibold"
                  >
                    Open as {judge.name} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Organiser Role */}
          <div className="flex flex-col justify-between rounded-2xl border border-gold/40 bg-gradient-to-b from-gold-wash/50 to-card p-6 shadow-card md:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-gold">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <Badge className="bg-forest text-ivory text-xs">Admin / Score Desk</Badge>
              </div>
              <h3 className="mt-4 font-display text-xl text-forest">Score Desk Organiser</h3>
              <p className="mt-2 text-xs leading-relaxed text-charcoal-muted">
                Admin dashboard across 4 sections: manage contestants, oversee all 48 scorecards,
                verify stopwatch durations, resolve ties, freeze snapshots, and export CSV.
              </p>
            </div>

            <div className="mt-6 border-t border-cream-line pt-4">
              <Link to="/organiser">
                <Button className="w-full bg-forest text-ivory hover:bg-forest-deep text-xs font-semibold">
                  Open Organiser Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Evaluation Helpers Section */}
        <div className="mt-12 rounded-2xl border border-cream-line bg-parchment p-6 shadow-card sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-display text-xl text-forest">Reviewer Convenience Helpers</h3>
              <p className="mt-1 text-xs text-charcoal-muted">
                Fast-track verification workflows or reset back to initial seed data.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSamples}
                className="border-cream-line bg-card text-xs"
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-forest" /> Load Complete Sample Scores
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetDialogOpen(true)}
                className="border-destructive/30 bg-card text-xs text-destructive hover:bg-destructive/10"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Demo
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-cream-line pt-6 text-xs text-charcoal-muted sm:grid-cols-3">
            <div>
              <strong className="block text-forest">1. Isolated Storage:</strong>
              Demo state is kept entirely in your browser's local memory. No production data is
              altered.
            </div>
            <div>
              <strong className="block text-forest">2. Cross-Tab Sync:</strong>
              Opening the judge workspace in one tab and the organiser in another will update in
              realtime via storage events.
            </div>
            <div>
              <strong className="block text-forest">3. Strict Gate Enforcements:</strong>
              Results cannot be published until voting is closed, all cards are submitted, and score
              desk confirms collation.
            </div>
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <AlertDialogContent className="border-cream-line bg-card sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-2xl text-forest">
                Reset Demo to Seed State?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-charcoal-muted">
                This will clear all newly entered scores, votes, and durations, returning to the
                original 16 contestants and sample seed cards.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-cream-line">Cancel</AlertDialogCancel>
              <Button variant="destructive" onClick={handleReset}>
                Confirm Reset
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
      <SiteFooter />
    </div>
  );
}
