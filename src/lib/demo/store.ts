import { createSeedState } from "./seed";
import {
  canLock,
  computeResults,
  judgeSubtotal,
  validateScores,
  verificationGates,
} from "./scoring";
import { rubricFor } from "./rubrics";
import type {
  ActivityEvent,
  ActivityKind,
  DemoState,
  DurationEntry,
  JudgeId,
  PerformanceType,
  Scorecard,
  VotingStatus,
} from "./types";

/**
 * Single shared demo data store with a replaceable data-access layer.
 * Persists to this browser's localStorage and syncs between tabs via the
 * storage event. No browser API runs at module scope — everything is lazy.
 */

const STORAGE_KEY = "shabach2026.demo.v1";

let state: DemoState = createSeedState();
let hydrated = false;
let storageWired = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode); the demo still works in-memory.
  }
}

function emit() {
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState(): DemoState {
  return state;
}

export function getServerState(): DemoState {
  return state;
}

/**
 * Hydrate from localStorage once, on the client, after first render — so the
 * server snapshot (seed data) matches the first client render and there is no
 * hydration mismatch. Also wires cross-tab sync.
 */
export function hydrateDemoStore() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed && parsed.version === 1 && Array.isArray(parsed.contestants)) {
        state = parsed;
      } else {
        persist();
      }
    } else {
      persist();
    }
  } catch {
    persist();
  }
  if (!storageWired) {
    storageWired = true;
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue ? (JSON.parse(e.newValue) as DemoState) : null;
        if (parsed && parsed.version === 1) {
          state = parsed;
          emit();
        }
      } catch {
        /* ignore malformed cross-tab payloads */
      }
    });
  }
  emit();
}

function update(mutate: (s: DemoState) => DemoState) {
  state = mutate(state);
  persist();
  emit();
}

function log(s: DemoState, kind: ActivityKind, detail: string): ActivityEvent[] {
  const event: ActivityEvent = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    kind,
    detail,
  };
  return [event, ...s.activity].slice(0, 100);
}

function resultsLocked(s: DemoState): boolean {
  return s.results !== null;
}

// ---------------------------------------------------------------------------
// Public (voting)
// ---------------------------------------------------------------------------

export type CastVoteResult =
  | { ok: true }
  | { ok: false; reason: "not_open" | "closed" | "already_voted" };

export function castVote(contestantId: string): CastVoteResult {
  const s = state;
  if (s.votingStatus === "not_open") return { ok: false, reason: "not_open" };
  if (s.votingStatus === "closed") return { ok: false, reason: "closed" };
  if (s.browserVote) return { ok: false, reason: "already_voted" };
  update((cur) => ({
    ...cur,
    browserVote: { contestantId, at: new Date().toISOString() },
  }));
  return { ok: true };
}

export function setVotingStatus(status: VotingStatus) {
  update((s) => {
    if (resultsLocked(s)) return s;
    const kind: ActivityKind =
      status === "open"
        ? s.votingStatus === "closed"
          ? "voting_reopened"
          : "voting_opened"
        : "voting_closed";
    const detail =
      status === "open"
        ? s.votingStatus === "closed"
          ? "Voting window reopened (demo)."
          : "Voting window opened (demo)."
        : "Voting window closed (demo).";
    return {
      ...s,
      votingStatus: status,
      activity: log(s, kind, detail),
    };
  });
}

// ---------------------------------------------------------------------------
// Judge workspace
// ---------------------------------------------------------------------------

export function setActiveJudge(judgeId: JudgeId | null) {
  update((s) => ({ ...s, activeJudge: judgeId }));
}

export function upsertCard(s: DemoState, next: Scorecard): Scorecard[] {
  const i = s.scorecards.findIndex(
    (c) => c.judgeId === next.judgeId && c.contestantId === next.contestantId,
  );
  if (i === -1) return [...s.scorecards, next];
  const copy = [...s.scorecards];
  copy[i] = next;
  return copy;
}

export function getCard(
  s: DemoState,
  judgeId: JudgeId,
  contestantId: string,
): Scorecard {
  return (
    s.scorecards.find(
      (c) => c.judgeId === judgeId && c.contestantId === contestantId,
    ) ?? {
      contestantId,
      judgeId,
      scores: rubricFor(
        s.contestants.find((c) => c.id === contestantId)!.type,
      ).criteria.map(() => null),
      notes: "",
      status: "not_started",
      conflictDeclared: false,
      conflictResolved: false,
      reopened: false,
    }
  );
}

export interface SaveResult {
  ok: boolean;
  reason?: "results_locked";
}

/** Autosave a draft. Submitted cards cannot be edited without an admin reopen. */
export function saveDraft(
  judgeId: JudgeId,
  contestantId: string,
  scores: (number | null)[],
  notes: string,
): SaveResult {
  const s = state;
  if (resultsLocked(s)) return { ok: false, reason: "results_locked" };
  const existing = getCard(s, judgeId, contestantId);
  if (existing.status === "submitted" && !existing.reopened) return { ok: false };
  update((cur) => ({
    ...cur,
    scorecards: upsertCard(cur, {
      ...existing,
      scores,
      notes,
      status: "draft",
      updatedAt: new Date().toISOString(),
    }),
  }));
  return { ok: true };
}

export interface SubmitResult {
  ok: boolean;
  reason?: "incomplete" | "invalid" | "results_locked" | "already_submitted";
  errors?: string[];
}

/** Final submission requires a fully valid scorecard; runs after an explicit review step. */
export function submitScorecard(
  judgeId: JudgeId,
  contestantId: string,
): SubmitResult {
  const s = state;
  if (resultsLocked(s)) return { ok: false, reason: "results_locked" };
  const card = getCard(s, judgeId, contestantId);
  if (card.status === "submitted" && !card.reopened) {
    return { ok: false, reason: "already_submitted" };
  }
  const contestant = s.contestants.find((c) => c.id === contestantId)!;
  const rubric = rubricFor(contestant.type);
  const validation = validateScores(card.scores, rubric);
  if (!validation.ok) {
    return { ok: false, reason: "incomplete", errors: validation.errors };
  }
  update((cur) => ({
    ...cur,
    scorecards: upsertCard(cur, {
      ...card,
      status: "submitted",
      reopened: false,
      reopenReason: undefined,
      updatedAt: new Date().toISOString(),
    }),
  }));
  return { ok: true };
}

export function declareConflict(judgeId: JudgeId, contestantId: string, declared: boolean) {
  const s = state;
  if (resultsLocked(s)) return;
  const card = getCard(s, judgeId, contestantId);
  update((cur) => ({
    ...cur,
    scorecards: upsertCard(cur, {
      ...card,
      conflictDeclared: declared,
      conflictResolved: declared ? false : card.conflictResolved,
      updatedAt: new Date().toISOString(),
    }),
  }));
}

export function resetJudgeScorecard(judgeId: JudgeId, contestantId: string) {
  const s = state;
  if (resultsLocked(s)) return;
  const card = getCard(s, judgeId, contestantId);
  if (card.status === "submitted" && !card.reopened) return;
  update((cur) => ({
    ...cur,
    scorecards: upsertCard(cur, {
      ...card,
      scores: rubricFor(cur.contestants.find((c) => c.id === contestantId)!.type).criteria.map(
        () => null,
      ),
      notes: "",
      status: "not_started",
      updatedAt: new Date().toISOString(),
    }),
  }));
}

// ---------------------------------------------------------------------------
// Organiser dashboard
// ---------------------------------------------------------------------------

export interface ContestantEdit {
  name?: string;
  district?: string;
  title?: string;
  bio?: string;
  order?: number;
  type?: PerformanceType;
}

export function updateContestant(id: string, edit: ContestantEdit) {
  update((s) => ({
    ...s,
    contestants: s.contestants.map((c) =>
      c.id === id ? { ...c, ...edit } : c,
    ),
  }));
}

export function reopenScorecard(judgeId: JudgeId, contestantId: string, reason: string) {
  if (!reason.trim()) return { ok: false };
  update((s) => {
    const card = getCard(s, judgeId, contestantId);
    if (card.status !== "submitted") return s;
    return {
      ...s,
      scorecards: upsertCard(s, {
        ...card,
        reopened: true,
        reopenReason: reason.trim(),
        status: "draft",
        updatedAt: new Date().toISOString(),
      }),
      activity: log(s, "scorecard_reopened", `Reopened ${judgeId}'s scorecard for ${s.contestants.find((c) => c.id === contestantId)?.name}. Reason: ${reason.trim()}`),
    };
  });
  return { ok: true };
}

export function resolveConflict(judgeId: JudgeId, contestantId: string) {
  update((s) => {
    const card = getCard(s, judgeId, contestantId);
    if (!card.conflictDeclared || card.conflictResolved) return s;
    return {
      ...s,
      scorecards: upsertCard(s, {
        ...card,
        conflictResolved: true,
        updatedAt: new Date().toISOString(),
      }),
      activity: log(
        s,
        "conflict_resolved",
        `Conflict of interest resolved for ${judgeId} on ${s.contestants.find((c) => c.id === contestantId)?.name}. Scorecard excluded until resubmitted.`,
      ),
    };
  });
}

export function setDuration(contestantId: string, seconds: number | null) {
  update((s) => {
    if (resultsLocked(s)) return s;
    const prev = s.durations[contestantId];
    const entry: DurationEntry = {
      contestantId,
      seconds,
      verified: seconds !== null ? false : (prev?.verified ?? false),
    };
    return {
      ...s,
      durations: { ...s.durations, [contestantId]: entry },
    };
  });
}

export function setDurationVerified(contestantId: string, verified: boolean) {
  update((s) => {
    if (resultsLocked(s)) return s;
    const prev = s.durations[contestantId];
    if (!prev || prev.seconds === null) return s;
    return {
      ...s,
      durations: {
        ...s.durations,
        [contestantId]: { ...prev, verified },
      },
    };
  });
}

export function setScoreDeskConfirmed(confirmed: boolean) {
  update((s) => ({ ...s, scoreDeskConfirmed: confirmed }));
}

// ---------------------------------------------------------------------------
// Demo controls
// ---------------------------------------------------------------------------

/** Deterministic pseudo-random in [min, max] from a string seed. */
function seededInt(seed: string, min: number, max: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = Math.abs(h % 1000) / 1000;
  return min + Math.floor(n * (max - min + 1));
}

/**
 * Admin-only demo control: fill every contestant's three scorecards with
 * complete sample submissions (labelled simulated), enter and verify
 * durations, and clear conflicts so verification and publication can be
 * demonstrated without typing 48 scorecards.
 */
export function loadSampleScores() {
  update((s) => {
    if (resultsLocked(s)) return s;
    let cards = [...s.scorecards];
    const newCards: Scorecard[] = [];
    for (const contestant of s.contestants) {
      const rubric = rubricFor(contestant.type);
      for (const judgeId of ["judge1", "judge2", "judge3"] as JudgeId[]) {
        const card = getCard(s, judgeId, contestant.id);
        if (card.status === "submitted" && !card.reopened && !(card.conflictDeclared && !card.conflictResolved)) {
          continue;
        }
        const scores = rubric.criteria.map((c, i) => {
          const base = c.max === 15 ? 8 : 12;
          const span = c.max === 15 ? 5 : 7;
          return seededInt(`${contestant.id}:${judgeId}:${i}`, base, base + span);
        });
        newCards.push({
          ...card,
          scores,
          notes: "",
          status: "submitted",
          conflictDeclared: false,
          conflictResolved: false,
          reopened: false,
          reopenReason: undefined,
          updatedAt: new Date().toISOString(),
        });
      }
      // Sample durations: mostly within time, a few over so deductions show.
      const overBy = seededInt(`${contestant.id}:dur`, 0, 100);
      const seconds =
        overBy > 82
          ? rubric.timeLimitSec + overBy - 60
          : Math.max(60, rubric.timeLimitSec - overBy - 10);
      const durations = { ...s.durations };
      durations[contestant.id] = {
        contestantId: contestant.id,
        seconds,
        verified: true,
      };
      s = { ...s, durations };
    }
    cards = [...cards, ...newCards];
    const resolved = cards.map((c) =>
      c.conflictDeclared ? { ...c, conflictResolved: true } : c,
    );
    return {
      ...s,
      scorecards: resolved,
      activity: log(
        s,
        "sample_scores_loaded",
        "Simulated sample scores loaded: all 48 scorecards submitted, durations entered and verified. Demo data only.",
      ),
    };
  });
}

export function resetDemo() {
  update(() => {
    const fresh = createSeedState();
    fresh.activity = [
      {
        id: `reset-${Date.now()}`,
        at: new Date().toISOString(),
        kind: "demo_reset",
        detail: "Demo data reset to seed state.",
      },
    ];
    return fresh;
  });
}

// ---------------------------------------------------------------------------
// Verification, lock and publish
// ---------------------------------------------------------------------------

export interface LockCheck {
  ok: boolean;
  problems: string[];
}

export function checkLockReadiness(): LockCheck {
  const s = state;
  const votes = { demoVotes: s.demoVotes, browserVote: s.browserVote };
  const rows = computeResults({
    contestants: s.contestants,
    scorecards: s.scorecards,
    voteCounts: voteCountsOf(s),
    durations: s.durations,
  });
  void votes;
  const gates = verificationGates(
    rows,
    s.scorecards,
    s.durations,
    s.votingStatus,
    s.scoreDeskConfirmed,
  );
  const problems: string[] = [];
  if (!gates.votingClosed) problems.push("Voting must be closed.");
  if (!gates.allComplete) problems.push("Every contestant needs three valid submitted scorecards.");
  if (!gates.allDurationsVerified) problems.push("Every performance duration must be entered and verified.");
  if (!gates.noUnresolvedConflicts) problems.push("Resolve all declared conflicts of interest.");
  if (!gates.scoreDeskConfirmed) problems.push("The score desk must confirm the collation.");
  return { ok: problems.length === 0, problems };
}

export function voteCountsOf(s: DemoState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of s.contestants) counts[c.id] = s.demoVotes[c.id] ?? 0;
  if (s.browserVote) {
    counts[s.browserVote.contestantId] =
      (counts[s.browserVote.contestantId] ?? 0) + 1;
  }
  return counts;
}

export function lockResults(): LockCheck {
  const check = checkLockReadiness();
  if (!check.ok) return check;
  update((s) => {
    const rows = computeResults({
      contestants: s.contestants,
      scorecards: s.scorecards,
      voteCounts: voteCountsOf(s),
      durations: s.durations,
    });
    return {
      ...s,
      results: {
        lockedAt: new Date().toISOString(),
        published: false,
        rows,
      },
      activity: log(s, "results_locked", "Results collated and locked. A frozen snapshot was created."),
    };
  });
  return { ok: true, problems: [] };
}

export function publishResults(): { ok: boolean; reason?: "not_locked" | "already_published" } {
  const s = state;
  if (!s.results) return { ok: false, reason: "not_locked" };
  if (s.results.published) return { ok: false, reason: "already_published" };
  update((cur) => ({
    ...cur,
    results: cur.results
      ? { ...cur.results, published: true, publishedAt: new Date().toISOString() }
      : cur.results,
    activity: log(cur, "results_published", "Results published to the public results page."),
  }));
  return { ok: true };
}

/** Subtotal preview used by the scorecard UI. */
export function subtotalOf(scores: (number | null)[]): number {
  return judgeSubtotal(scores);
}
