import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import {
  AlertCircle,
  AlertTriangle,
  BadgeAlert,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Flame,
  Gavel,
  Lock,
  Printer,
  RefreshCw,
  RotateCcw,
  Scale,
  Send,
  Share2,
  ShieldCheck,
  Timer,
  Trash2,
  Users,
  Vote,
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useDemoState } from "@/hooks/use-demo";
import { resultsToCsv } from "@/lib/demo/csv";
import {
  ACTIVITY_LABEL,
  FINALE_DATE_LABEL,
  formatLagos,
  formatSeconds,
  parseDuration,
  typeLabel,
  VOTING_STATUS_LABEL,
} from "@/lib/demo/labels";
import { rubricFor } from "@/lib/demo/rubrics";
import { computeResults, fmt2, timePenalty, verificationGates } from "@/lib/demo/scoring";
import {
  checkLockReadiness,
  loadSampleScores,
  lockResults,
  publishResults,
  recordTieResolution,
  reopenScorecard,
  resetDemo,
  resolveConflict,
  setDuration,
  setDurationVerified,
  setScoreDeskConfirmed,
  setVotingStatus,
  updateContestant,
  voteCountsOf,
} from "@/lib/demo/store";
import type {
  Contestant,
  JudgeId,
  PerformanceType,
  ResultRow,
  VotingStatus,
} from "@/lib/demo/types";
import { DISTRICTS, JUDGES, PERFORMANCE_TYPES } from "@/lib/demo/types";

export const Route = createFileRoute("/organiser")({
  head: () => ({
    meta: [
      { title: "Organiser Score Desk & Administration — SHABACH 2026" },
      {
        name: "description",
        content: "Official administrative dashboard for the SHABACH 2026 Grand Finale score desk.",
      },
    ],
  }),
  component: OrganiserDashboard,
});

function downloadCsv(csvContent: string, filename = "shabach-2026-master-results.csv") {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function OrganiserDashboard() {
  const state = useDemoState();
  const [activeTab, setActiveTab] = React.useState("overview");

  // Collate results live
  const masterRows = React.useMemo(() => {
    if (state.results) return state.results.rows;
    return computeResults({
      contestants: state.contestants,
      scorecards: state.scorecards,
      voteCounts: voteCountsOf(state),
      durations: state.durations,
      tieResolutions: state.tieResolutions,
    });
  }, [state]);

  const gates = React.useMemo(() => {
    return verificationGates(
      masterRows,
      state.scorecards,
      state.durations,
      state.votingStatus,
      state.scoreDeskConfirmed,
    );
  }, [masterRows, state]);

  // Overall total votes
  const totalVotes = React.useMemo(() => {
    const counts = voteCountsOf(state);
    return Object.values(counts).reduce((a, b) => a + b, 0);
  }, [state]);

  // Submitted scorecards count out of 64
  const submittedCardsCount = React.useMemo(() => {
    return state.scorecards.filter(
      (s) => s.status === "submitted" && !s.reopened && !s.conflictDeclared,
    ).length;
  }, [state.scorecards]);

  const isLocked = state.results !== null;
  const isPublished = Boolean(state.results?.published);

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Workspace Title & Live Status */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-cream-line bg-card p-6 shadow-card sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-gold">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <h1 className="font-display text-2xl text-forest">Organiser Dashboard</h1>
              <Badge variant="outline" className="border-gold/50 bg-gold-wash text-forest text-xs">
                Score Desk
              </Badge>
            </div>
            <p className="mt-1 text-sm text-charcoal-muted">
              Grand Finale administration · {FINALE_DATE_LABEL} · Africa/Lagos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cream-line bg-ivory px-3 py-1 text-xs font-semibold text-charcoal">
              {VOTING_STATUS_LABEL[state.votingStatus]}
            </span>
            {isPublished ? (
              <Badge className="bg-forest text-ivory text-xs">Published</Badge>
            ) : isLocked ? (
              <Badge className="bg-gold text-forest-deep text-xs font-bold">Locked (Frozen)</Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                In Progress
              </Badge>
            )}
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 rounded-xl border border-cream-line bg-parchment p-1">
              <TabsTrigger
                value="overview"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-forest data-[state=active]:shadow-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="contestants"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-forest data-[state=active]:shadow-sm"
              >
                Contestants ({state.contestants.length})
              </TabsTrigger>
              <TabsTrigger
                value="scoring"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-forest data-[state=active]:shadow-sm"
              >
                Scoring & Durations
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-forest data-[state=active]:shadow-sm"
              >
                Master Results & Verification
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview">
              <OverviewTab
                totalVotes={totalVotes}
                submittedCardsCount={submittedCardsCount}
                isLocked={isLocked}
                isPublished={isPublished}
                onGoToTab={setActiveTab}
              />
            </TabsContent>

            {/* TAB 2: CONTESTANTS */}
            <TabsContent value="contestants">
              <ContestantsTab isLocked={isLocked} />
            </TabsContent>

            {/* TAB 3: SCORING & DURATIONS */}
            <TabsContent value="scoring">
              <ScoringTab isLocked={isLocked} />
            </TabsContent>

            {/* TAB 4: RESULTS & VERIFICATION */}
            <TabsContent value="results">
              <ResultsTab
                masterRows={masterRows}
                gates={gates}
                isLocked={isLocked}
                isPublished={isPublished}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 1: OVERVIEW
// ---------------------------------------------------------------------------

function OverviewTab({
  totalVotes,
  submittedCardsCount,
  isLocked,
  isPublished,
  onGoToTab,
}: {
  totalVotes: number;
  submittedCardsCount: number;
  isLocked: boolean;
  isPublished: boolean;
  onGoToTab: (tab: string) => void;
}) {
  const state = useDemoState();
  const [resetConfirmOpen, setResetConfirmOpen] = React.useState(false);

  const handleVotingChange = (status: VotingStatus) => {
    if (isLocked) {
      toast.error("Results are locked. Voting window cannot be reopened.");
      return;
    }
    setVotingStatus(status);
    toast.success(`Voting status changed to: ${VOTING_STATUS_LABEL[status]}`);
  };

  const handleLoadSamples = () => {
    if (isLocked) {
      toast.error("Results are locked.");
      return;
    }
    loadSampleScores();
    toast.success("Complete sample scores loaded!", {
      description: "All 64 scorecards submitted and durations verified. Demo data only.",
    });
  };

  const handleResetConfirmed = () => {
    resetDemo();
    setResetConfirmOpen(false);
    toast.info("Demo state reset to original seed state.");
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-cream-line bg-card p-5 shadow-card">
          <div className="flex items-center justify-between text-xs text-charcoal-muted">
            <span>Total Audience Votes</span>
            <Vote className="h-4 w-4 text-forest" />
          </div>
          <p className="mt-2 font-display text-3xl text-forest">{totalVotes.toLocaleString()}</p>
          <p className="mt-1 text-xs text-charcoal-muted">
            Simulated demo votes across 16 finalists
          </p>
        </div>

        <div className="rounded-2xl border border-cream-line bg-card p-5 shadow-card">
          <div className="flex items-center justify-between text-xs text-charcoal-muted">
            <span>Submitted Scorecards</span>
            <Gavel className="h-4 w-4 text-gold" />
          </div>
          <p className="mt-2 font-display text-3xl text-forest">
            {submittedCardsCount}{" "}
            <span className="text-base font-sans text-charcoal-muted">/ 64</span>
          </p>
          <p className="mt-1 text-xs text-charcoal-muted">4 judges × 16 contestants = 64 total</p>
        </div>

        <div className="rounded-2xl border border-cream-line bg-card p-5 shadow-card">
          <div className="flex items-center justify-between text-xs text-charcoal-muted">
            <span>Voting Window</span>
            <Clock className="h-4 w-4 text-forest" />
          </div>
          <p className="mt-2 font-display text-xl text-forest capitalize">
            {state.votingStatus.replace("_", " ")}
          </p>
          <p className="mt-1 text-xs text-charcoal-muted">Controlled by score desk</p>
        </div>

        <div className="rounded-2xl border border-cream-line bg-card p-5 shadow-card">
          <div className="flex items-center justify-between text-xs text-charcoal-muted">
            <span>Collation Status</span>
            <ShieldCheck className="h-4 w-4 text-gold" />
          </div>
          <p className="mt-2 font-display text-xl text-forest">
            {isPublished ? "Published" : isLocked ? "Locked" : "Open Collation"}
          </p>
          <p className="mt-1 text-xs text-charcoal-muted">
            {isPublished
              ? "Live on public results"
              : isLocked
                ? "Snapshot frozen"
                : "Awaiting gates"}
          </p>
        </div>
      </div>

      {/* Voting Window Controls & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
          <h3 className="font-display text-lg text-forest flex items-center gap-2">
            <Vote className="h-5 w-5 text-forest" /> Voting Window Controls
          </h3>
          <p className="mt-1 text-xs text-charcoal-muted">
            Public voting opens when all 16 performances conclude and closes before score collation.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={state.votingStatus === "open" ? "default" : "outline"}
              disabled={isLocked || state.votingStatus === "open"}
              onClick={() => handleVotingChange("open")}
              className={
                state.votingStatus === "open"
                  ? "bg-forest text-ivory hover:bg-forest-deep"
                  : "border-cream-line"
              }
            >
              Open Voting Window
            </Button>
            <Button
              size="sm"
              variant={state.votingStatus === "closed" ? "default" : "outline"}
              disabled={isLocked || state.votingStatus === "closed"}
              onClick={() => handleVotingChange("closed")}
              className={
                state.votingStatus === "closed"
                  ? "bg-forest text-ivory hover:bg-forest-deep"
                  : "border-cream-line"
              }
            >
              Close Voting Window
            </Button>
            <Button
              size="sm"
              variant={state.votingStatus === "not_open" ? "default" : "outline"}
              disabled={isLocked || state.votingStatus === "not_open"}
              onClick={() => handleVotingChange("not_open")}
              className="border-cream-line text-xs"
            >
              Set Not Open
            </Button>
          </div>
        </div>

        {/* Demo Controls */}
        <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
          <h3 className="font-display text-lg text-forest flex items-center gap-2">
            <Flame className="h-5 w-5 text-gold" /> Demo Simulation Controls
          </h3>
          <p className="mt-1 text-xs text-charcoal-muted">
            Administrative helpers for reviewing collation and verification workflows without typing
            64 cards.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isLocked}
              onClick={handleLoadSamples}
              className="border-cream-line text-xs"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-forest" /> Load Complete Sample Scores
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setResetConfirmOpen(true)}
              className="border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset Demo Data
            </Button>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <h3 className="font-display text-lg text-forest">Recent Event Activity</h3>
        <p className="mt-0.5 text-xs text-charcoal-muted">
          Recorded audit trail of status changes, reopening actions, and collation gates.
        </p>

        <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2.5">
          {state.activity.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-cream-line bg-ivory p-3 text-xs"
            >
              <div>
                <p className="font-semibold text-forest">{ACTIVITY_LABEL[ev.kind] ?? ev.kind}</p>
                <p className="mt-0.5 text-charcoal-muted">{ev.detail}</p>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-charcoal-muted">
                {formatLagos(ev.at)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent className="border-cream-line bg-card sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl text-forest">
              Reset Demo State?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-charcoal-muted">
              This will restore all 16 contestants, scores, votes, and durations to the baseline
              demo seed state. Any entered scores will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-cream-line">Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleResetConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirm Reset
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 2: CONTESTANTS
// ---------------------------------------------------------------------------

function ContestantsTab({ isLocked }: { isLocked: boolean }) {
  const state = useDemoState();
  const sorted = React.useMemo(() => {
    return [...state.contestants].sort((a, b) => a.order - b.order);
  }, [state.contestants]);

  const [editingContestant, setEditingContestant] = React.useState<Contestant | null>(null);

  const handleCopyLink = async (code: string) => {
    const fullUrl = `${window.location.origin}/contestants/${code}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Profile link copied!", { description: fullUrl });
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Share code ${code} copied!`);
    } catch {
      toast.error("Failed to copy code.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl text-forest">Finalist Contestants (16)</h2>
          <p className="text-xs text-charcoal-muted">
            Two finalists from each of the eight districts. Stable codes and running order.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-line bg-card shadow-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-cream-line bg-parchment text-left text-xs uppercase tracking-wide text-charcoal-muted">
              <th className="px-4 py-3">№</th>
              <th className="px-4 py-3">Contestant</th>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3">Category / Rubric</th>
              <th className="px-4 py-3">Share Code</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id} className="border-b border-cream-line last:border-0 hover:bg-ivory/60">
                <td className="px-4 py-3 font-semibold text-charcoal">{c.order}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Monogram name={c.name} hue={c.hue} size="sm" />
                    <div>
                      <p className="font-semibold text-forest">{c.name}</p>
                      <p className="text-xs text-charcoal-muted">“{c.title}”</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-charcoal-muted">{c.district}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="text-xs">
                    {typeLabel(c.type)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs font-bold text-forest bg-parchment px-2 py-0.5 rounded">
                    {c.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(c.code)}
                      title="Copy code"
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3.5 w-3.5 text-charcoal-muted" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(c.code)}
                      title="Copy link"
                      className="h-8 w-8 p-0"
                    >
                      <Share2 className="h-3.5 w-3.5 text-charcoal-muted" />
                    </Button>
                    <Link to="/contestants/$code" params={{ code: c.code }} target="_blank">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View profile"
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-charcoal-muted" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLocked}
                      onClick={() => setEditingContestant(c)}
                      className="border-cream-line text-xs"
                    >
                      <Edit3 className="mr-1 h-3 w-3" /> Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingContestant && (
        <EditContestantDialog
          contestant={editingContestant}
          open={Boolean(editingContestant)}
          onOpenChange={(open) => !open && setEditingContestant(null)}
        />
      )}
    </div>
  );
}

function EditContestantDialog({
  contestant,
  open,
  onOpenChange,
}: {
  contestant: Contestant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const state = useDemoState();
  const [name, setName] = React.useState(contestant.name);
  const [title, setTitle] = React.useState(contestant.title);
  const [district, setDistrict] = React.useState(contestant.district);
  const [bio, setBio] = React.useState(contestant.bio);
  const [type, setType] = React.useState<PerformanceType>(contestant.type);
  const [order, setOrder] = React.useState(contestant.order);

  // Check if scores already exist for this contestant
  const hasScores = React.useMemo(() => {
    return state.scorecards.some(
      (sc) =>
        sc.contestantId === contestant.id &&
        (sc.status === "submitted" || sc.scores.some((s) => s !== null)),
    );
  }, [state.scorecards, contestant.id]);

  const handleSave = () => {
    if (!name.trim() || !title.trim()) {
      toast.error("Name and performance title cannot be empty.");
      return;
    }

    const res = updateContestant(contestant.id, {
      name: name.trim(),
      title: title.trim(),
      district,
      bio: bio.trim(),
      type,
      order,
    });

    if (res.ok) {
      toast.success(`Contestant ${name} updated successfully.`);
      onOpenChange(false);
    } else {
      if (res.reason === "rubric_locked_by_scores") {
        toast.error("Category / Rubric cannot be changed", {
          description: "Scores have already been submitted or drafted for this contestant.",
        });
      } else {
        toast.error("Failed to update contestant.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-cream-line bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-forest">Edit Contestant</DialogTitle>
          <DialogDescription className="text-xs text-charcoal-muted">
            Share code <span className="font-mono font-bold text-forest">{contestant.code}</span>{" "}
            remains permanent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-charcoal">Contestant Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 border-cream-line bg-ivory text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-charcoal">
                Performance Order (1-16)
              </Label>
              <Input
                type="number"
                min={1}
                max={16}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="mt-1 border-cream-line bg-ivory text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-charcoal">District</Label>
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="mt-1 border-cream-line bg-ivory text-sm">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-charcoal">Performance Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 border-cream-line bg-ivory text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-charcoal">Category / Rubric</Label>
              {hasScores && (
                <span className="text-[11px] font-semibold text-amber-700">
                  Locked (scores exist)
                </span>
              )}
            </div>
            <Select
              disabled={hasScores}
              value={type}
              onValueChange={(val) => setType(val as PerformanceType)}
            >
              <SelectTrigger className="mt-1 border-cream-line bg-ivory text-sm disabled:opacity-60">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {PERFORMANCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {typeLabel(t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-charcoal">Biography</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1 border-cream-line bg-ivory text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-cream-line">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} className="bg-forest text-ivory hover:bg-forest-deep">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// TAB 3: SCORING & DURATIONS
// ---------------------------------------------------------------------------

function ScoringTab({ isLocked }: { isLocked: boolean }) {
  const state = useDemoState();
  const sorted = React.useMemo(() => {
    return [...state.contestants].sort((a, b) => a.order - b.order);
  }, [state.contestants]);

  const [reopenTarget, setReopenTarget] = React.useState<{
    judgeId: JudgeId;
    contestantId: string;
    contestantName: string;
  } | null>(null);

  const [reopenReason, setReopenReason] = React.useState("");

  const handleReopenSubmit = () => {
    if (!reopenTarget || !reopenReason.trim()) {
      toast.error("A non-empty reason is required to reopen a scorecard.");
      return;
    }
    const res = reopenScorecard(
      reopenTarget.judgeId,
      reopenTarget.contestantId,
      reopenReason.trim(),
    );
    if (res.ok) {
      toast.success(`Scorecard reopened for ${reopenTarget.contestantName}`);
      setReopenTarget(null);
      setReopenReason("");
    } else {
      toast.error("Failed to reopen scorecard.");
    }
  };

  const handleResolveConflict = (judgeId: JudgeId, contestantId: string, name: string) => {
    resolveConflict(judgeId, contestantId);
    toast.success(`Conflict resolved for ${judgeId} on ${name}`, {
      description: "Card has been set to draft and excluded until resubmitted.",
    });
  };

  const handleDurationChange = (contestantId: string, valStr: string) => {
    if (isLocked) return;
    if (valStr.trim() === "") {
      setDuration(contestantId, null);
      return;
    }
    const sec = parseDuration(valStr);
    if (sec !== null && sec >= 0) {
      setDuration(contestantId, sec);
    }
  };

  const handleVerifyAllDurations = () => {
    if (isLocked) return;
    for (const c of sorted) {
      const entry = state.durations[c.id];
      if (entry && entry.seconds !== null) {
        setDurationVerified(c.id, true);
      }
    }
    toast.success("All entered durations marked verified.");
  };

  return (
    <div className="space-y-8">
      {/* 3 Judges Progress Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {JUDGES.map((judge) => {
          const submitted = sorted.filter((c) => {
            const card = state.scorecards.find(
              (sc) => sc.judgeId === judge.id && sc.contestantId === c.id,
            );
            return card?.status === "submitted" && !card.reopened && !card.conflictDeclared;
          }).length;

          return (
            <div
              key={judge.id}
              className="rounded-2xl border border-cream-line bg-card p-5 shadow-card"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-forest">{judge.name}</span>
                <Badge variant="outline" className="text-xs">
                  {submitted} / 16
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-charcoal-muted">
                <span>Progress:</span>
                <span className="font-semibold text-forest">
                  {Math.round((submitted / 16) * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 64-Scorecard Matrix */}
      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-line pb-4">
          <div>
            <h3 className="font-display text-xl text-forest">64 Judge Scorecards Matrix</h3>
            <p className="text-xs text-charcoal-muted">
              Inspect status, raw marks, conflicts, and reopen cards with recorded reasons.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-cream-line bg-parchment text-left text-xs uppercase tracking-wide text-charcoal-muted">
                <th className="px-4 py-3">Contestant</th>
                {JUDGES.map((j) => (
                  <th key={j.id} className="px-4 py-3 text-center">
                    {j.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-cream-line last:border-0 hover:bg-ivory/60"
                >
                  <td className="px-4 py-3 font-semibold text-forest">
                    {c.order}. {c.name}
                    <span className="block text-xs font-normal text-charcoal-muted">
                      {typeLabel(c.type)}
                    </span>
                  </td>

                  {JUDGES.map((j) => {
                    const card = state.scorecards.find(
                      (sc) => sc.judgeId === j.id && sc.contestantId === c.id,
                    );
                    const isSub =
                      card?.status === "submitted" && !card.reopened && !card.conflictDeclared;
                    const isConf = card?.conflictDeclared && !card.conflictResolved;
                    const isReo = card?.reopened;
                    const subtotal = card
                      ? card.scores.reduce((a, b) => (a ?? 0) + (b ?? 0), 0)
                      : null;

                    return (
                      <td key={j.id} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {isConf ? (
                            <div className="flex items-center gap-1">
                              <Badge variant="destructive" className="text-[10px]">
                                Conflict
                              </Badge>
                              {!isLocked && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResolveConflict(j.id, c.id, c.name)}
                                  className="h-6 text-[10px] px-1 text-forest hover:bg-forest/10"
                                >
                                  Resolve
                                </Button>
                              )}
                            </div>
                          ) : isSub ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-display font-semibold text-forest">
                                {subtotal}
                              </span>
                              <span className="text-[11px] text-charcoal-muted">/95</span>
                              {!isLocked && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setReopenTarget({
                                      judgeId: j.id,
                                      contestantId: c.id,
                                      contestantName: c.name,
                                    })
                                  }
                                  title="Reopen scorecard"
                                  className="h-6 w-6 p-0 text-charcoal-muted hover:text-amber-700"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : isReo ? (
                            <Badge
                              variant="outline"
                              className="border-amber-400 bg-amber-50 text-[10px] text-amber-800"
                            >
                              Reopened
                            </Badge>
                          ) : card?.status === "draft" ? (
                            <span className="text-xs text-charcoal-muted">Draft</span>
                          ) : (
                            <span className="text-xs text-charcoal-muted/60">—</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Durations & Time Deductions Desk */}
      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-line pb-4">
          <div>
            <h3 className="font-display text-xl text-forest">Performance Durations Desk</h3>
            <p className="text-xs text-charcoal-muted">
              Enter stopwatch times (seconds or mm:ss). Overtime deductions are applied strictly.
            </p>
          </div>
          {!isLocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleVerifyAllDurations}
              className="border-cream-line text-xs"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-forest" /> Verify All Entered
            </Button>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-cream-line bg-parchment text-left text-xs uppercase tracking-wide text-charcoal-muted">
                <th className="px-4 py-3">Contestant</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Allowed Time</th>
                <th className="px-4 py-3 text-center">Actual Duration (mm:ss)</th>
                <th className="px-4 py-3 text-center">Overtime Penalty</th>
                <th className="px-4 py-3 text-center">Verified</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const rubric = rubricFor(c.type);
                const entry = state.durations[c.id];
                const seconds = entry?.seconds ?? null;
                const penalty =
                  seconds !== null
                    ? timePenalty(seconds, rubric.timeLimitSec, rubric.penaltyIntervalSec)
                    : 0;

                return (
                  <tr
                    key={c.id}
                    className="border-b border-cream-line last:border-0 hover:bg-ivory/60"
                  >
                    <td className="px-4 py-3 font-semibold text-forest">
                      {c.order}. {c.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal-muted">{typeLabel(c.type)}</td>
                    <td className="px-4 py-3 text-center text-xs font-mono">
                      {formatSeconds(rubric.timeLimitSec)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="text"
                        disabled={isLocked}
                        defaultValue={seconds !== null ? formatSeconds(seconds) : ""}
                        onBlur={(e) => handleDurationChange(c.id, e.target.value)}
                        placeholder="e.g. 3:45"
                        className="mx-auto w-24 text-center font-mono text-xs border-cream-line bg-ivory"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {penalty > 0 ? (
                        <span className="font-semibold text-destructive">−{penalty} pts</span>
                      ) : (
                        <span className="text-xs text-charcoal-muted">0 pts</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        disabled={isLocked || seconds === null}
                        checked={entry?.verified ?? false}
                        onChange={(e) => setDurationVerified(c.id, e.target.checked)}
                        className="h-4 w-4 rounded border-cream-line text-forest focus:ring-forest cursor-pointer"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reopen Modal */}
      {reopenTarget && (
        <Dialog open={Boolean(reopenTarget)} onOpenChange={() => setReopenTarget(null)}>
          <DialogContent className="border-cream-line bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl text-forest">
                Reopen Scorecard
              </DialogTitle>
              <DialogDescription className="text-xs text-charcoal-muted">
                Reopening {reopenTarget.judgeId}'s scorecard for{" "}
                <strong className="text-forest">{reopenTarget.contestantName}</strong>.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <Label className="text-xs font-semibold text-charcoal">
                Required Reason for Reopening
              </Label>
              <Textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. Typo in vocal score verified with Chief Judge..."
                rows={3}
                className="mt-1.5 border-cream-line bg-ivory text-sm"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReopenTarget(null)}
                className="border-cream-line"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReopenSubmit}
                disabled={!reopenReason.trim()}
                className="bg-forest text-ivory hover:bg-forest-deep"
              >
                Confirm Reopen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TAB 4: RESULTS & VERIFICATION
// ---------------------------------------------------------------------------

function ResultsTab({
  masterRows,
  gates,
  isLocked,
  isPublished,
}: {
  masterRows: ResultRow[];
  gates: ReturnType<typeof verificationGates>;
  isLocked: boolean;
  isPublished: boolean;
}) {
  const state = useDemoState();

  // Find unresolved ties (flagged with "Judges' review required")
  const tiedPairs = React.useMemo(() => {
    const list: [ResultRow, ResultRow][] = [];
    const flagged = masterRows.filter((r) => r.tieFlags.includes("Judges' review required"));
    for (let i = 0; i < flagged.length; i++) {
      for (let j = i + 1; j < flagged.length; j++) {
        const a = flagged[i];
        const b = flagged[j];
        if (a && b && a.finalScore === b.finalScore) {
          list.push([a, b]);
        }
      }
    }
    return list;
  }, [masterRows]);

  const [tieSelectedWinner, setTieSelectedWinner] = React.useState<Record<string, string>>({});
  const [tieReason, setTieReason] = React.useState<Record<string, string>>({});

  const handleRecordTie = (c1Id: string, c2Id: string) => {
    const key = `${c1Id}:${c2Id}`;
    const winnerId = tieSelectedWinner[key];
    const reason = tieReason[key];

    if (!winnerId) {
      toast.error("Please select a winner between the two contestants.");
      return;
    }
    if (!reason || !reason.trim()) {
      toast.error("Please record the collective judges' decision reason.");
      return;
    }

    const res = recordTieResolution(c1Id, c2Id, winnerId, reason.trim());
    if (res.ok) {
      toast.success("Collective judges' tie decision recorded!");
    } else {
      toast.error("Failed to record tie decision.");
    }
  };

  const handleLockResults = () => {
    const res = lockResults();
    if (res.ok) {
      toast.success("Results officially collated and locked!", {
        description: "A frozen snapshot was created. Ready for official publication.",
      });
    } else {
      toast.error("Cannot lock results", {
        description: res.problems.join(", "),
      });
    }
  };

  const handlePublishResults = () => {
    const res = publishResults();
    if (res.ok) {
      toast.success("Results officially published!", {
        description: "The top three winners are now live on the public results page.",
      });
    } else {
      toast.error("Failed to publish results.");
    }
  };

  const canAttemptLock =
    !isLocked &&
    gates.allComplete &&
    gates.allDurationsVerified &&
    gates.noUnresolvedConflicts &&
    gates.noUnresolvedTies &&
    gates.votingClosed &&
    gates.scoreDeskConfirmed;

  return (
    <div className="space-y-8">
      {/* Verification Gate Checklist Card */}
      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <h3 className="font-display text-xl text-forest">Verification Checklist</h3>
        <p className="mt-0.5 text-xs text-charcoal-muted">
          All six gates must clear before results can be officially locked.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-2 rounded-xl border border-cream-line bg-ivory p-3">
            {gates.votingClosed ? (
              <CheckCircle2 className="h-5 w-5 text-forest-soft shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <div className="text-xs">
              <strong className="block text-forest">1. Voting Closed</strong>
              <span className="text-charcoal-muted">
                {gates.votingClosed ? "Voting is closed" : "Voting is still open"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cream-line bg-ivory p-3">
            {gates.allComplete ? (
              <CheckCircle2 className="h-5 w-5 text-forest-soft shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <div className="text-xs">
              <strong className="block text-forest">2. All 64 Scorecards Valid</strong>
              <span className="text-charcoal-muted">
                {gates.allComplete ? "4 valid cards per act" : "Scorecards missing/incomplete"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cream-line bg-ivory p-3">
            {gates.allDurationsVerified ? (
              <CheckCircle2 className="h-5 w-5 text-forest-soft shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <div className="text-xs">
              <strong className="block text-forest">3. All Durations Verified</strong>
              <span className="text-charcoal-muted">
                {gates.allDurationsVerified ? "16 durations verified" : "Unverified durations"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cream-line bg-ivory p-3">
            {gates.noUnresolvedConflicts ? (
              <CheckCircle2 className="h-5 w-5 text-forest-soft shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <div className="text-xs">
              <strong className="block text-forest">4. No Conflicts</strong>
              <span className="text-charcoal-muted">
                {gates.noUnresolvedConflicts ? "All conflicts clear" : "Unresolved conflicts exist"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cream-line bg-ivory p-3">
            {gates.noUnresolvedTies ? (
              <CheckCircle2 className="h-5 w-5 text-forest-soft shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <div className="text-xs">
              <strong className="block text-forest">5. No Unresolved Ties</strong>
              <span className="text-charcoal-muted">
                {gates.noUnresolvedTies ? "All ties resolved" : "Ties require review"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-cream-line bg-ivory p-3">
            {gates.scoreDeskConfirmed ? (
              <CheckCircle2 className="h-5 w-5 text-forest-soft shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-charcoal-muted shrink-0" />
            )}
            <div className="text-xs flex items-center justify-between w-full">
              <div>
                <strong className="block text-forest">6. Score Desk Confirmation</strong>
                <span className="text-charcoal-muted">Manual verification check</span>
              </div>
              {!isLocked && (
                <input
                  type="checkbox"
                  checked={state.scoreDeskConfirmed}
                  onChange={(e) => setScoreDeskConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-cream-line text-forest focus:ring-forest cursor-pointer"
                />
              )}
            </div>
          </div>
        </div>

        {/* Lock & Publish Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-cream-line pt-4">
          <div className="flex items-center gap-2">
            {!isLocked ? (
              <Button
                onClick={handleLockResults}
                disabled={!canAttemptLock}
                className="bg-forest text-ivory hover:bg-forest-deep"
              >
                <Lock className="mr-1.5 h-4 w-4" /> Lock Results & Freeze Snapshot
              </Button>
            ) : (
              <Badge className="bg-forest text-ivory px-3 py-1.5 text-xs font-semibold">
                ✓ Results Locked ({formatLagos(state.results?.lockedAt ?? "")})
              </Badge>
            )}

            {isLocked && !isPublished && (
              <Button
                onClick={handlePublishResults}
                className="bg-gold text-forest-deep hover:bg-gold-soft font-semibold"
              >
                <Send className="mr-1.5 h-4 w-4" /> Publish Results to Public
              </Button>
            )}

            {isPublished && (
              <Badge className="bg-forest-soft text-ivory px-3 py-1.5 text-xs font-semibold">
                ✓ Public Results Published
              </Badge>
            )}
          </div>

          {/* CSV & Print Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadCsv(resultsToCsv(masterRows))}
              className="border-cream-line text-xs"
            >
              <Download className="mr-1.5 h-3.5 w-3.5 text-forest" /> Export Master CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="border-cream-line text-xs"
            >
              <Printer className="mr-1.5 h-3.5 w-3.5 text-forest" /> Print Master Sheet
            </Button>
          </div>
        </div>
      </div>

      {/* Tie Resolution Section (Visible if ties require review) */}
      {tiedPairs.length > 0 && !isLocked && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/50 p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-amber-700" />
            <h3 className="font-display text-xl text-forest">Collective Judges' Tie Resolution</h3>
          </div>
          <p className="mt-1 text-xs text-charcoal-muted">
            The criterion ladder could not resolve the following tie. The organiser must record the
            collective judges' decision and reason.
          </p>

          <div className="mt-4 space-y-4">
            {tiedPairs.map(([a, b]) => {
              const key = `${a.contestant.id}:${b.contestant.id}`;
              const selected = tieSelectedWinner[key];
              const reason = tieReason[key] ?? "";

              return (
                <div key={key} className="rounded-xl border border-amber-200 bg-card p-4">
                  <p className="font-semibold text-sm text-forest">
                    Tie between {a.contestant.name} ({a.contestant.district}) and{" "}
                    {b.contestant.name} ({b.contestant.district}) — Equal Final Score:{" "}
                    {fmt2(a.finalScore)}
                  </p>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs font-semibold text-charcoal">
                        Choose Winner (Collective Ruling)
                      </Label>
                      <Select
                        value={selected || ""}
                        onValueChange={(val) =>
                          setTieSelectedWinner({ ...tieSelectedWinner, [key]: val })
                        }
                      >
                        <SelectTrigger className="mt-1 border-cream-line bg-ivory text-sm">
                          <SelectValue placeholder="Select winning contestant" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={a.contestant.id}>{a.contestant.name}</SelectItem>
                          <SelectItem value={b.contestant.id}>{b.contestant.name}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-charcoal">
                        Judges' Recorded Reason
                      </Label>
                      <Input
                        value={reason}
                        onChange={(e) => setTieReason({ ...tieReason, [key]: e.target.value })}
                        placeholder="e.g. Unanimous panel decision based on vocal dynamics..."
                        className="mt-1 border-cream-line bg-ivory text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleRecordTie(a.contestant.id, b.contestant.id)}
                      className="bg-forest text-ivory hover:bg-forest-deep text-xs"
                    >
                      Record Collective Ruling
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Internal Master Results Table */}
      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card print:border-none print:p-0 print:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-line pb-4 print:border-b-2">
          <div>
            <h3 className="font-display text-xl text-forest">Official Master Results Collation</h3>
            <p className="text-xs text-charcoal-muted">
              Confidential score desk sheet with full judge subtotals, audience points, and time
              deductions.
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-cream-line bg-parchment text-left text-xs uppercase tracking-wide text-charcoal-muted">
                <th className="px-3 py-3 text-center">Rank</th>
                <th className="px-4 py-3">Contestant</th>
                <th className="px-3 py-3 text-center">J1 (/95)</th>
                <th className="px-3 py-3 text-center">J2 (/95)</th>
                <th className="px-3 py-3 text-center">J3 (/95)</th>
                <th className="px-3 py-3 text-center">J4 (/95)</th>
                <th className="px-3 py-3 text-center">Judge Avg</th>
                <th className="px-3 py-3 text-center">Audience Votes</th>
                <th className="px-3 py-3 text-center">Audience Pts (/5)</th>
                <th className="px-3 py-3 text-center">Penalty</th>
                <th className="px-4 py-3 text-right">Final (/100)</th>
              </tr>
            </thead>
            <tbody>
              {masterRows.map((r) => (
                <tr
                  key={r.contestant.id}
                  className="border-b border-cream-line last:border-0 hover:bg-ivory/60"
                >
                  <td className="px-3 py-3 text-center">
                    {r.rank ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-forest text-xs font-bold text-ivory">
                        {r.rank}
                      </span>
                    ) : (
                      <span className="text-charcoal-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-forest">{r.contestant.name}</p>
                    <p className="text-xs text-charcoal-muted">
                      {typeLabel(r.contestant.type)} · {r.contestant.district}
                    </p>
                    {r.tieFlags.length > 0 && (
                      <span className="mt-0.5 inline-block text-[11px] font-semibold text-amber-700">
                        {r.tieFlags.join(" · ")}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-mono">
                    {r.judgeSubtotals.judge1 ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-mono">
                    {r.judgeSubtotals.judge2 ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-mono">
                    {r.judgeSubtotals.judge3 ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-mono">
                    {r.judgeSubtotals.judge4 ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-mono font-semibold">
                    {fmt2(r.judgeAverage)}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-mono text-charcoal-muted">
                    {r.validVotes.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-mono font-medium text-forest-soft">
                    +{fmt2(r.audiencePoints)}
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-mono">
                    {r.timePenalty > 0 ? (
                      <span className="font-semibold text-destructive">−{r.timePenalty}</span>
                    ) : (
                      <span className="text-charcoal-muted">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-display text-base font-bold text-forest">
                    {fmt2(r.finalScore)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
