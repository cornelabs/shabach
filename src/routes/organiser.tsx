import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  FlaskConical,
  Gavel,
  Hourglass,
  Lock,
  Pencil,
  RotateCcw,
  ScrollText,
  Timer,
  Trophy,
  Undo2,
  Users,
  Vote,
  XCircle,
} from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Monogram } from "@/components/monogram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useDemoState } from "@/hooks/use-demo";
import { downloadCsvFile, resultsToCsv } from "@/lib/demo/csv";
import {
  ACTIVITY_LABEL,
  DISTRICTS_ORDER,
  TIMEZONE_LABEL,
  formatLagos,
  formatSeconds,
  parseDuration,
  typeLabel,
} from "@/lib/demo/labels";
import {
  computeResults,
  fmt2,
  isValidSubmitted,
  timePenalty,
  verificationGates,
} from "@/lib/demo/scoring";
import {
  loadSampleScores,
  lockResults,
  publishResults,
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
import { DISTRICTS, JUDGES, PERFORMANCE_TYPES } from "@/lib/demo/types";
import type { Contestant, JudgeId } from "@/lib/demo/types";

export const Route = createFileRoute("/organiser")({
  head: () => ({
    meta: [
      { title: "Organiser Dashboard — SHABACH 2026" },
      {
        name: "description",
        content:
          "Organiser dashboard for SHABACH 2026 — voting windows, durations, conflicts of interest, verification gates, collation, locking and publishing results.",
      },
      { property: "og:title", content: "Organiser Dashboard — SHABACH 2026" },
      {
        property: "og:description",
        content:
          "Voting windows, durations, conflicts, verification gates, collation and publication for SHABACH 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrganiserPage,
});

const GATE_LABELS: { key: string; label: string }[] = [
  { key: "votingClosed", label: "Voting is closed" },
  { key: "allComplete", label: "All 48 scorecards submitted and valid" },
  { key: "allDurationsVerified", label: "Every duration entered and verified" },
  { key: "noUnresolvedConflicts", label: "No unresolved conflicts of interest" },
  { key: "scoreDeskConfirmed", label: "Score desk confirmed the collation" },
] as const;

function GatesChecklist({
  gates,
}: {
  gates: ReturnType<typeof verificationGates>;
}) {
  return (
    <ul className="space-y-2">
      {GATE_LABELS.map(({ key, label }) => {
        const ok = gates[key as keyof typeof gates];
        return (
          <li key={key} className="flex items-center gap-2 text-sm">
            {ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-forest-soft" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
            )}
            <span className={ok ? "text-charcoal" : "font-semibold text-charcoal"}>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-cream-line bg-card p-5 shadow-card">
      <Icon className="h-5 w-5 text-gold" />
      <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-charcoal-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-2xl text-forest">{value}</p>
      {sub && <p className="text-xs text-charcoal-muted">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contestants tab
// ---------------------------------------------------------------------------

function EditContestantDialog({ contestant, locked }: { contestant: Contestant; locked: boolean }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: contestant.name,
    district: contestant.district,
    type: contestant.type,
    title: contestant.title,
    bio: contestant.bio,
    order: String(contestant.order),
  });

  function save() {
    const order = Number(form.order);
    if (!form.name.trim() || Number.isNaN(order) || order < 1 || order > 99) {
      toast.error("Enter a name and a running order between 1 and 99.");
      return;
    }
    updateContestant(contestant.id, {
      name: form.name.trim(),
      district: form.district,
      type: form.type,
      title: form.title.trim(),
      bio: form.bio.trim(),
      order,
    });
    toast.success(`Updated ${form.name.trim()} (demo).`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !locked && setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={locked}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-forest">
            Edit {contestant.name}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>District</Label>
              <Select value={form.district} onValueChange={(v) => setForm({ ...form, district: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DISTRICTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as Contestant["type"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERFORMANCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{typeLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-title">Performance title</Label>
            <Input
              id="edit-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="edit-bio">Short bio</Label>
            <Textarea
              id="edit-bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div className="grid max-w-[160px] gap-1.5">
            <Label htmlFor="edit-order">Running order (1–99)</Label>
            <Input
              id="edit-order"
              inputMode="numeric"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ContestantsTab({ locked }: { locked: boolean }) {
  const state = useDemoState();
  const ordered = [...state.contestants].sort((a, b) => a.order - b.order);
  return (
    <div className="rounded-2xl border border-cream-line bg-card shadow-card">
      <p className="border-b border-cream-line p-4 text-sm text-charcoal-muted">
        Contestant details are demo data. Changing an act's category switches it to that category's
        rubric, so judges' criteria change with it.
      </p>
      <ul>
        {ordered.map((contestant) => (
          <li
            key={contestant.id}
            className="flex flex-wrap items-center gap-3 border-b border-cream-line p-4 last:border-0"
          >
            <Monogram name={contestant.name} hue={contestant.hue} size="sm" />
            <div className="min-w-[200px] flex-1">
              <p className="text-sm font-semibold text-charcoal">
                № {contestant.order} · {contestant.name}
              </p>
              <p className="text-xs text-charcoal-muted">
                {contestant.code} · {contestant.district}
              </p>
            </div>
            <Badge variant="secondary">{typeLabel(contestant.type)}</Badge>
            <p className="max-w-[280px] flex-1 truncate text-xs text-charcoal-muted">
              {contestant.title}
            </p>
            <EditContestantDialog contestant={contestant} locked={locked} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Voting tab
// ---------------------------------------------------------------------------

function VotingTab({ locked }: { locked: boolean }) {
  const state = useDemoState();
  const counts = voteCountsOf(state);
  const ordered = [...state.contestants].sort((a, b) => a.order - b.order);
  const totalVotes = Object.values(counts).reduce((sum, n) => sum + n, 0);

  function change(next: "open" | "closed") {
    setVotingStatus(next);
    toast.success(next === "open" ? "Voting window opened (demo)." : "Voting window closed (demo).");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-forest">Voting window</h3>
            <p className="mt-1 max-w-lg text-sm text-charcoal-muted">
              Only one window runs across the whole competition: open once, close once, and (before
              results are locked) reopen if needed. Every change is recorded in the activity log.
            </p>
          </div>
          <Badge variant={state.votingStatus === "open" ? "default" : "secondary"}>
            {state.votingStatus === "open" ? "Open" : state.votingStatus === "closed" ? "Closed" : "Not open yet"}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {state.votingStatus !== "open" && (
            <Button onClick={() => change("open")} disabled={locked}>
              <Vote className="h-4 w-4" /> {state.votingStatus === "closed" ? "Reopen voting" : "Open voting"}
            </Button>
          )}
          {state.votingStatus === "open" && (
            <Button variant="destructive" onClick={() => change("closed")} disabled={locked}>
              Close voting
            </Button>
          )}
          {locked && (
            <p className="flex items-center gap-2 text-sm text-charcoal-muted">
              <Lock className="h-4 w-4" /> Results locked — the window can't change.
            </p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-line bg-card shadow-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-cream-line bg-parchment text-left text-xs uppercase tracking-wide text-charcoal-muted">
              <th className="px-4 py-3">№</th>
              <th className="px-4 py-3">Contestant</th>
              <th className="px-4 py-3 text-center">Simulated votes</th>
              <th className="px-4 py-3 text-center">This browser</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((contestant) => {
              const mine = state.browserVote?.contestantId === contestant.id ? 1 : 0;
              return (
                <tr key={contestant.id} className="border-b border-cream-line last:border-0">
                  <td className="px-4 py-2.5 text-charcoal-muted">{contestant.order}</td>
                  <td className="px-4 py-2.5 font-medium text-charcoal">{contestant.name}</td>
                  <td className="px-4 py-2.5 text-center text-charcoal-muted">
                    {state.demoVotes[contestant.id] ?? 0}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {mine ? <span className="font-semibold text-forest-soft">1 ✓</span> : <span className="text-charcoal-muted">0</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold">{counts[contestant.id]}</td>
                </tr>
              );
            })}
            <tr className="bg-parchment font-semibold">
              <td className="px-4 py-2.5" colSpan={4}>Total votes counted</td>
              <td className="px-4 py-2.5 text-right">{totalVotes}</td>
            </tr>
          </tbody>
        </table>
        <p className="p-4 text-xs text-charcoal-muted">
          Simulated counts stand in for verified attendee votes in this demo; the "this browser"
          column is the one vote cast from your preview. A production build replaces both with
          verified single-use attendee passes and duplicate-vote protection on the server.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Durations tab
// ---------------------------------------------------------------------------

function DurationRow({ contestant, locked }: { contestant: Contestant; locked: boolean }) {
  const state = useDemoState();
  const entry = state.durations[contestant.id];
  const [raw, setRaw] = useState("");
  const limitRow = contestant.type === "visual_arts" ? { limit: 600, interval: 60 } : contestant.type === "mono_drama" ? { limit: 300, interval: 15 } : { limit: 240, interval: 15 };

  const penalty = timePenalty(entry?.seconds ?? null, limitRow.limit, limitRow.interval);

  function save() {
    const seconds = parseDuration(raw);
    if (seconds === null) {
      toast.error("Enter the duration as mm:ss (for example 4:05) or plain seconds.");
      return;
    }
    setDuration(contestant.id, seconds);
    setRaw("");
    toast.success(`Duration recorded for ${contestant.name}: ${formatSeconds(seconds)}.`);
  }

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-cream-line p-4 last:border-0">
      <div className="min-w-[180px] flex-1">
        <p className="text-sm font-semibold text-charcoal">
          № {contestant.order} · {contestant.name}
        </p>
        <p className="text-xs text-charcoal-muted">
          {typeLabel(contestant.type)} · limit {formatSeconds(limitRow.limit)} · −2 pts per{" "}
          {formatSeconds(limitRow.interval)} over
        </p>
      </div>
      <div className="w-[90px] text-center">
        <p className="text-xs uppercase tracking-wide text-charcoal-muted">Recorded</p>
        <p className="text-sm font-semibold">{formatSeconds(entry?.seconds ?? null)}</p>
      </div>
      <div className="flex items-center gap-2">
        <Input
          className="w-[110px]"
          placeholder="mm:ss"
          value={raw}
          disabled={locked}
          onChange={(e) => setRaw(e.target.value)}
          aria-label={`Duration for ${contestant.name}`}
        />
        <Button variant="outline" size="sm" disabled={locked} onClick={save}>
          <Timer className="h-3.5 w-3.5" /> Set
        </Button>
        <Button
          variant={entry?.verified ? "secondary" : "outline"}
          size="sm"
          disabled={locked || !entry || entry.seconds === null}
          onClick={() => {
            if (!entry || entry.seconds === null) return;
            setDurationVerified(contestant.id, !entry.verified);
            toast.success(
              entry.verified
                ? `Verification removed for ${contestant.name}.`
                : `Duration verified for ${contestant.name}.`,
            );
          }}
        >
          {entry?.verified ? "Verified ✓" : "Verify"}
        </Button>
      </div>
      <div className="w-[120px] text-right">
        <p className="text-xs uppercase tracking-wide text-charcoal-muted">Penalty preview</p>
        <p className={penalty > 0 ? "text-sm font-semibold text-destructive" : "text-sm"}>
          {penalty > 0 ? `−${penalty} pts` : "0"}
        </p>
      </div>
    </li>
  );
}

function DurationsTab({ locked }: { locked: boolean }) {
  const state = useDemoState();
  const ordered = [...state.contestants].sort((a, b) => a.order - b.order);
  return (
    <div className="rounded-2xl border border-cream-line bg-card shadow-card">
      <p className="border-b border-cream-line p-4 text-sm text-charcoal-muted">
        Enter each performance's actual duration from the stage timer, then verify it. Locking
        results requires every duration to be entered and verified.
      </p>
      <ul>
        {ordered.map((contestant) => (
          <DurationRow key={contestant.id} contestant={contestant} locked={locked} />
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score desk tab
// ---------------------------------------------------------------------------

function ConflictsSection({ locked }: { locked: boolean }) {
  const state = useDemoState();
  const declared = state.scorecards.filter((c) => c.conflictDeclared);
  return (
    <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
      <h3 className="flex items-center gap-2 font-display text-xl text-forest">
        <Gavel className="h-5 w-5 text-gold" /> Conflicts of interest
      </h3>
      {declared.length === 0 ? (
        <p className="mt-2 text-sm text-charcoal-muted">No conflicts declared by any judge.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {declared.map((card) => {
            const contestant = state.contestants.find((c) => c.id === card.contestantId);
            const judge = JUDGES.find((j) => j.id === card.judgeId);
            return (
              <li
                key={`${card.judgeId}-${card.contestantId}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-line p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-charcoal">
                    {judge?.name} × {contestant?.name}
                  </p>
                  <p className="text-xs text-charcoal-muted">
                    {card.conflictResolved
                      ? "Reviewed and resolved — scorecard counts once resubmitted."
                      : "Awaiting organiser review — this scorecard is excluded from collation."}
                  </p>
                </div>
                {card.conflictResolved ? (
                  <Badge variant="secondary">Resolved</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={locked}
                    onClick={() => {
                      resolveConflict(card.judgeId, card.contestantId);
                      toast.success("Conflict marked resolved (demo).", {
                        description: "The judge can now resubmit their scorecard.",
                      });
                    }}
                  >
                    Mark resolved
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ReopenSection({ locked }: { locked: boolean }) {
  const state = useDemoState();
  const [judgeId, setJudgeId] = useState<JudgeId | "">("");
  const [contestantId, setContestantId] = useState("");
  const [reason, setReason] = useState("");

  const submitted = state.scorecards.filter((c) => c.status === "submitted");

  function reopen() {
    if (!judgeId || !contestantId) {
      toast.error("Choose the judge and contestant whose scorecard to reopen.");
      return;
    }
    const result = reopenScorecard(judgeId, contestantId, reason);
    if (!result.ok) {
      toast.error("Give a recorded reason for the reopen.");
      return;
    }
    toast.success("Scorecard reopened (demo).", { description: "The judge can now edit and resubmit." });
    setJudgeId("");
    setContestantId("");
    setReason("");
  }

  return (
    <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
      <h3 className="flex items-center gap-2 font-display text-xl text-forest">
        <Undo2 className="h-5 w-5 text-gold" /> Reopen a submitted scorecard
      </h3>
      <p className="mt-1 text-sm text-charcoal-muted">
        Submitted cards are locked. Reopening requires a recorded reason, shown to the judge and
        kept in the audit trail.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Select value={judgeId} onValueChange={(v) => setJudgeId(v as JudgeId)}>
          <SelectTrigger><SelectValue placeholder="Judge" /></SelectTrigger>
          <SelectContent>
            {JUDGES.map((j) => (
              <SelectItem key={j.id} value={j.id}>{j.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={contestantId} onValueChange={setContestantId}>
          <SelectTrigger><SelectValue placeholder="Contestant" /></SelectTrigger>
          <SelectContent>
            {submitted.map((card) => {
              const contestant = state.contestants.find((c) => c.id === card.contestantId);
              return (
                <SelectItem key={`${card.judgeId}-${card.contestantId}`} value={card.contestantId}>
                  {contestant?.name} — {JUDGES.find((j) => j.id === card.judgeId)?.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <Textarea
          className="sm:col-span-2"
          placeholder="Reason for reopening (required)…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <Button className="mt-3" size="sm" variant="outline" disabled={locked} onClick={reopen}>
        <Undo2 className="h-3.5 w-3.5" /> Reopen scorecard
      </Button>
      {submitted.length === 0 && (
        <p className="mt-2 text-xs text-charcoal-muted">No submitted scorecards yet.</p>
      )}
    </div>
  );
}

function CollationTab({ locked }: { locked: boolean }) {
  const state = useDemoState();
  const rows = useMemo(
    () =>
      computeResults({
        contestants: state.contestants,
        scorecards: state.scorecards,
        voteCounts: voteCountsOf(state),
        durations: state.durations,
      }),
    [state],
  );
  const gates = verificationGates(
    rows,
    state.scorecards,
    state.durations,
    state.votingStatus,
    state.scoreDeskConfirmed,
  );
  const problems: string[] = [];
  if (!gates.votingClosed) problems.push("Voting must be closed.");
  if (!gates.allComplete) problems.push("Every contestant needs three valid submitted scorecards.");
  if (!gates.allDurationsVerified) problems.push("Every duration must be entered and verified.");
  if (!gates.noUnresolvedConflicts) problems.push("Resolve all declared conflicts of interest.");
  if (!gates.scoreDeskConfirmed) problems.push("The score desk must confirm the collation.");

  function handleLock() {
    const check = lockResults();
    if (!check.ok) {
      toast.error("Can't lock yet", { description: check.problems.join(" ") });
      return;
    }
    toast.success("Results locked.", {
      description: "A frozen snapshot was created. Publish when you're ready.",
    });
  }

  function handlePublish() {
    const result = publishResults();
    if (result.ok) {
      toast.success("Results published to the public results page.");
    } else {
      toast.error(result.reason === "not_locked" ? "Lock the results first." : "Results already published.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <h3 className="flex items-center gap-2 font-display text-xl text-forest">
          <ClipboardList className="h-5 w-5 text-gold" /> Verification gates
        </h3>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <GatesChecklist gates={gates} />
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-xl border border-cream-line p-4">
              <div>
                <p className="text-sm font-semibold text-charcoal">Score desk confirmation</p>
                <p className="text-xs text-charcoal-muted">
                  The desk confirms it has cross-checked subtotals, votes and durations.
                </p>
              </div>
              <Switch
                checked={state.scoreDeskConfirmed}
                onCheckedChange={(checked) => setScoreDeskConfirmed(checked)}
                aria-label="Score desk confirmation"
              />
            </div>
            <div className="rounded-xl border border-gold/40 bg-gold-wash p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-forest">
                <FlaskConical className="h-4 w-4" /> Demo shortcut
              </p>
              <p className="mt-1 text-xs text-charcoal-muted">
                Fill all 48 scorecards with simulated submissions and verified durations so the
                collation can be reviewed without typing every card.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="mt-2" size="sm" variant="outline" disabled={locked}>
                    <FlaskConical className="h-3.5 w-3.5" /> Load simulated sample scores
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Load simulated sample scores?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Every contestant's three scorecards are filled and submitted with simulated
                      (labelled) data, durations are entered and verified, and conflicts are cleared.
                      Judges' real drafts are overwritten. Demo data only.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        loadSampleScores();
                        toast.success("Simulated sample scores loaded (demo data only).");
                      }}
                    >
                      Load sample data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <h3 className="flex items-center gap-2 font-display text-xl text-forest">
          <Lock className="h-5 w-5 text-gold" /> Lock & publish
        </h3>
        <p className="mt-1 text-sm text-charcoal-muted">
          Locking freezes a snapshot of the collation. Publishing makes it visible on the public
          results page. Both are one-way.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleLock} disabled={locked}>
            <Lock className="h-4 w-4" /> Lock results
          </Button>
          <Button
            variant="secondary"
            onClick={handlePublish}
            disabled={!state.results || state.results.published}
          >
            <Trophy className="h-4 w-4" /> Publish results
          </Button>
          <Button
            variant="outline"
            onClick={() => downloadCsvFile(resultsToCsv(rows), "shabach-2026-collation.csv")}
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={locked}>
                <RotateCcw className="h-4 w-4" /> Reset demo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all demo data?</AlertDialogTitle>
                <AlertDialogDescription>
                  Everything returns to the seed state: original votes, empty durations and the
                  seed scorecards. Results are unlocked. This can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetDemo();
                    toast.info("Demo data reset to the seed state.");
                  }}
                >
                  Reset demo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {state.results && (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-forest-soft">
            <CheckCircle2 className="h-4 w-4" />
            Locked {formatLagos(state.results.lockedAt)} ·{" "}
            {state.results.published
              ? `published ${formatLagos(state.results.publishedAt ?? state.results.lockedAt)}`
              : "awaiting publication"}
          </p>
        )}
        {!locked && problems.length > 0 && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <span>{problems.join(" ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityTab() {
  const state = useDemoState();
  return (
    <div className="rounded-2xl border border-cream-line bg-card shadow-card">
      <p className="border-b border-cream-line p-4 text-sm text-charcoal-muted">
        Audit trail of every organiser action in this demo (newest first, times in {TIMEZONE_LABEL}).
      </p>
      <ul>
        {state.activity.length === 0 && (
          <li className="p-4 text-sm text-charcoal-muted">No activity yet.</li>
        )}
        {state.activity.map((event) => (
          <li key={event.id} className="flex flex-wrap items-baseline gap-3 border-b border-cream-line p-4 last:border-0">
            <Badge variant="secondary" className="shrink-0">
              {ACTIVITY_LABEL[event.kind]}
            </Badge>
            <p className="min-w-[240px] flex-1 text-sm text-charcoal">{event.detail}</p>
            <p className="text-xs text-charcoal-muted">{formatLagos(event.at)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function OrganiserPage() {
  const state = useDemoState();
  const locked = state.results !== null;

  const submittedCount = state.scorecards.filter(isValidSubmitted).length;
  const unresolvedConflicts = state.scorecards.filter(
    (c) => c.conflictDeclared && !c.conflictResolved,
  ).length;
  const totalVotes = Object.values(voteCountsOf(state)).reduce((sum, n) => sum + n, 0);
  const verifiedDurations = state.contestants.filter(
    (c) => {
      const entry = state.durations[c.id];
      return entry && entry.seconds !== null && entry.verified;
    },
  ).length;

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl text-forest">Organiser dashboard</h1>
            <p className="mt-1 max-w-2xl text-sm text-charcoal-muted">
              Run the voting window, keep durations honest, resolve conflicts, then verify, lock and
              publish. In this demo the dashboard is open — a production build would sit behind real
              staff sign-in.
            </p>
          </div>
          <Badge variant={locked ? "default" : "secondary"}>
            {state.results?.published ? "Results published" : locked ? "Results locked" : "Collation open"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Contestants" value={String(state.contestants.length)} sub="Grand Finale acts" />
          <StatCard
            icon={Gavel}
            label="Valid scorecards"
            value={`${submittedCount}/48`}
            sub="3 judges × 16 acts"
          />
          <StatCard icon={Vote} label="Votes counted" value={String(totalVotes)} sub="Simulated + this browser" />
          <StatCard
            icon={Hourglass}
            label="Durations verified"
            value={`${verifiedDurations}/${state.contestants.length}`}
            sub={unresolvedConflicts > 0 ? `${unresolvedConflicts} unresolved conflict(s)` : "No unresolved conflicts"}
          />
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contestants">Contestants</TabsTrigger>
            <TabsTrigger value="voting">Voting</TabsTrigger>
            <TabsTrigger value="durations">Durations</TabsTrigger>
            <TabsTrigger value="collation">Score desk</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
              <h3 className="flex items-center gap-2 font-display text-xl text-forest">
                <ScrollText className="h-5 w-5 text-gold" /> Results verification
              </h3>
              <p className="mt-1 text-sm text-charcoal-muted">
                Every gate must pass before results can be locked and published.
              </p>
              <div className="mt-4">
                <GatesChecklist
                  gates={verificationGates(
                    computeResults({
                      contestants: state.contestants,
                      scorecards: state.scorecards,
                      voteCounts: voteCountsOf(state),
                      durations: state.durations,
                    }),
                    state.scorecards,
                    state.durations,
                    state.votingStatus,
                    state.scoreDeskConfirmed,
                  )}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="contestants" className="mt-4">
            <ContestantsTab locked={locked} />
          </TabsContent>
          <TabsContent value="voting" className="mt-4">
            <VotingTab locked={locked} />
          </TabsContent>
          <TabsContent value="durations" className="mt-4">
            <DurationsTab locked={locked} />
          </TabsContent>
          <TabsContent value="collation" className="mt-4">
            <CollationTab locked={locked} />
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <ActivityTab />
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}
