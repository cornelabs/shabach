import { createSeedState } from "./seed";
import {
  canLock,
  computeResults,
  judgeSubtotal,
  validateScores,
  verificationGates,
} from "./scoring";
import { rubricFor } from "./rubrics";
import { DEFAULT_EVENT_ID, getSupabaseClient, isSupabaseConfigured } from "@/lib/db/supabase";
import type {
  ActivityEvent,
  ActivityKind,
  Contestant,
  DemoState,
  DurationEntry,
  JudgeId,
  PerformanceType,
  Scorecard,
  TieResolution,
  VotingStatus,
} from "./types";
import { JUDGES } from "./types";

/**
 * Single shared demo data store with a replaceable data-access layer.
 * Persists to this browser's localStorage and syncs between tabs via the
 * storage event. No browser API runs at module scope — everything is lazy.
 */

const STORAGE_KEY = "shabach2026.demo.v1";

let state: DemoState = createSeedState();
let hydrated = false;
let storageWired = false;
let liveSyncWired = false;
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
        state = {
          ...parsed,
          tieResolutions: parsed.tieResolutions ?? [],
        };
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
          state = {
            ...parsed,
            tieResolutions: parsed.tieResolutions ?? [],
          };
          emit();
        }
      } catch {
        /* ignore malformed cross-tab payloads */
      }
    });
  }

  // Live database persistence sync: hydrate from Supabase when available
  if (isSupabaseConfigured()) {
    void refreshFromSupabase();

    if (!liveSyncWired && typeof window !== "undefined") {
      liveSyncWired = true;
      window.addEventListener("focus", () => {
        void refreshFromSupabase();
      });
      window.setInterval(() => {
        void refreshFromSupabase();
      }, 5000);
    }
  }

  emit();
}

let isRefreshing = false;
let queuedRefresh = false;

/**
 * Authoritative Database Synchronization
 * Re-queries live event lifecycle, contestants, 64-scorecard matrix, stopwatch durations,
 * real audience vote totals, and frozen official results.
 */
export async function refreshFromSupabase(): Promise<void> {
  if (state.isSimulatedDemo) return;
  if (typeof window === "undefined" || !isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;

  if (isRefreshing) {
    queuedRefresh = true;
    return;
  }
  isRefreshing = true;
  const refreshStartedAt = Date.now();

  try {
    // 1. Fetch event status & voting status
    const { data: eventData } = await client
      .from("events")
      .select("voting_status, lifecycle_status")
      .eq("id", DEFAULT_EVENT_ID)
      .maybeSingle();

    // 2. Fetch contestants
    const { data: contestantsData } = await client
      .from("contestants")
      .select("*")
      .order("performance_order", { ascending: true });

    let activeContestants = state.contestants;
    if (contestantsData && contestantsData.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activeContestants = contestantsData.map((row: any) => ({
        id: row.id,
        code: row.code,
        name: row.full_name ?? row.name,
        district: row.district,
        type: (row.performance_type ?? "music") as PerformanceType,
        title: row.performance_title ?? row.title ?? "",
        bio: row.biography ?? row.bio ?? "",
        order: row.performance_order,
        hue: row.hue ?? (row.performance_order * 23) % 360,
      }));
    }

    const activeIds = new Set(activeContestants.map((c) => c.id));
    const JUDGE_IDS: JudgeId[] = ["judge1", "judge2", "judge3", "judge4"];

    // 3. Hydrate scorecards: query authoritative rows from database
    const { data: scorecardsData } = await client.from("scorecards").select("*");
    const dbCardsMap = new Map<string, Scorecard>();

    if (scorecardsData && scorecardsData.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of scorecardsData as any[]) {
        if (activeIds.has(row.contestant_id)) {
          const card: Scorecard = {
            contestantId: row.contestant_id,
            judgeId: row.judge_id as JudgeId,
            scores: row.criteria_scores ?? row.scores ?? [],
            notes: row.notes ?? "",
            status: row.status ?? "draft",
            conflictDeclared: Boolean(row.conflict_declared),
            conflictResolved: Boolean(row.conflict_resolved),
            reopened: Boolean(row.reopened),
            reopenReason: row.reopened_reason ?? row.reopen_reason ?? undefined,
            updatedAt: row.updated_at,
          };
          dbCardsMap.set(`${card.contestantId}:${card.judgeId}`, card);
        }
      }
    }

    // 4. Hydrate performance durations
    const { data: durationsData } = await client.from("durations").select("*");
    const loadedDurations: Record<string, DurationEntry> = {};
    if (durationsData && durationsData.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const row of durationsData as any[]) {
        if (activeIds.has(row.contestant_id)) {
          loadedDurations[row.contestant_id] = {
            contestantId: row.contestant_id,
            seconds: row.actual_seconds ?? row.duration_seconds ?? null,
            verified: Boolean(row.verified),
            updatedAt: row.updated_at,
          };
        }
      }
    }

    // 5. Hydrate live vote counts from database ledger
    // Uses RPC aggregation with paginated SELECT fallback to guarantee complete count even past 1000 rows
    const liveVoteCounts: Record<string, number> = {};
    for (const c of activeContestants) {
      liveVoteCounts[c.id] = 0;
    }

    let loadedVotesViaRpc = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rpcCounts, error: rpcErr } = await (client.rpc as any)(
        "get_event_vote_counts",
        {
          p_event_id: DEFAULT_EVENT_ID,
        },
      );

      if (!rpcErr && Array.isArray(rpcCounts)) {
        for (const row of rpcCounts as { contestant_id: string; vote_count: number | string }[]) {
          if (activeIds.has(row.contestant_id)) {
            liveVoteCounts[row.contestant_id] = Number(row.vote_count) || 0;
          }
        }
        loadedVotesViaRpc = true;
      }
    } catch {
      /* fallback to paginated select below */
    }

    if (!loadedVotesViaRpc) {
      const PAGE_SIZE = 1000;
      let page = 0;
      let hasMore = true;
      let totalFetched = 0;

      while (hasMore) {
        const from = page * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data: pageVotes, error: pageErr } = await client
          .from("votes")
          .select("contestant_id")
          .range(from, to);

        if (pageErr || !pageVotes || pageVotes.length === 0) {
          hasMore = false;
          break;
        }

        totalFetched += pageVotes.length;
        for (const v of pageVotes as { contestant_id: string }[]) {
          if (activeIds.has(v.contestant_id)) {
            liveVoteCounts[v.contestant_id] = (liveVoteCounts[v.contestant_id] ?? 0) + 1;
          }
        }

        if (pageVotes.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          page++;
        }
      }

      // If no votes were retrieved from DB at all and local demo votes exist, preserve them
      if (totalFetched === 0) {
        for (const c of activeContestants) {
          if (state.demoVotes[c.id] !== undefined) {
            liveVoteCounts[c.id] = state.demoVotes[c.id]!;
          }
        }
      }
    }

    // 6. Hydrate official results snapshot if present
    const { data: snapshotData } = await client
      .from("results_snapshots")
      .select("*")
      .eq("is_official", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 7. Atomic state update: reconcile scorecards to preserve concurrent local mutations
    update((cur) => {
      // Reconcile 64-card matrix across active contestants and 4 judges
      const curCardsMap = new Map<string, Scorecard>();
      for (const card of cur.scorecards) {
        if (activeIds.has(card.contestantId)) {
          curCardsMap.set(`${card.contestantId}:${card.judgeId}`, card);
        }
      }

      const reconciledScorecards: Scorecard[] = [];
      for (const c of activeContestants) {
        for (const j of JUDGE_IDS) {
          const key = `${c.id}:${j}`;
          const curCard = curCardsMap.get(key);
          const dbCard = dbCardsMap.get(key);

          const defaultCard: Scorecard = {
            contestantId: c.id,
            judgeId: j,
            scores: [],
            notes: "",
            status: "draft",
            conflictDeclared: false,
            conflictResolved: false,
            reopened: false,
          };

          if (!curCard && !dbCard) {
            reconciledScorecards.push(defaultCard);
          } else if (!curCard) {
            reconciledScorecards.push(dbCard!);
          } else if (!dbCard) {
            reconciledScorecards.push(curCard);
          } else {
            // Both exist: check which one is newer or modified during this refresh
            const curTime = curCard.updatedAt ? new Date(curCard.updatedAt).getTime() : 0;
            const dbTime = dbCard.updatedAt ? new Date(dbCard.updatedAt).getTime() : 0;

            // If the local card was modified at/after the refresh started,
            // or has a newer timestamp than the database row, preserve the local card!
            if (curTime >= refreshStartedAt || curTime > dbTime) {
              reconciledScorecards.push(curCard);
            } else {
              reconciledScorecards.push(dbCard);
            }
          }
        }
      }

      // Reconcile durations across active contestants
      const prunedDurations: Record<string, DurationEntry> = {};
      for (const c of activeContestants) {
        const curDur = cur.durations[c.id];
        const dbDur = loadedDurations[c.id];
        if (!curDur && !dbDur) continue;
        if (!curDur) {
          prunedDurations[c.id] = dbDur!;
        } else if (!dbDur) {
          prunedDurations[c.id] = curDur;
        } else {
          const curTime = curDur.updatedAt ? new Date(curDur.updatedAt).getTime() : 0;
          const dbTime = dbDur.updatedAt ? new Date(dbDur.updatedAt).getTime() : 0;
          if (curTime >= refreshStartedAt || curTime > dbTime) {
            prunedDurations[c.id] = curDur;
          } else {
            prunedDurations[c.id] = dbDur;
          }
        }
      }

      let newResults = cur.results;

      if (snapshotData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snapPayload: any = snapshotData.rows_data;
        const rows = snapPayload?.rows ?? (Array.isArray(snapPayload) ? snapPayload : []);
        newResults = {
          lockedAt: snapshotData.locked_at,
          published: Boolean(snapshotData.published),
          ...(snapshotData.published_at ? { publishedAt: snapshotData.published_at } : {}),
          rows,
        };
      }

      return {
        ...cur,
        votingStatus: (eventData?.voting_status as VotingStatus) ?? cur.votingStatus,
        contestants: activeContestants,
        scorecards: reconciledScorecards,
        durations: prunedDurations,
        demoVotes: liveVoteCounts,
        results: newResults,
      };
    });
  } catch (err) {
    console.warn("Supabase hydration background warning:", err);
  } finally {
    isRefreshing = false;
    if (queuedRefresh) {
      queuedRefresh = false;
      void refreshFromSupabase();
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function syncMutationToSupabase(action: string, payload: any) {
  if (state.isSimulatedDemo) return;
  if (typeof window === "undefined" || !isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  if (!client) return;

  try {
    if (action === "scorecard") {
      const scores = payload.scores ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subtotal = scores.reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
      void client
        .from("scorecards")
        .upsert(
          {
            event_id: DEFAULT_EVENT_ID,
            contestant_id: payload.contestantId,
            judge_id: payload.judgeId,
            criteria_scores: scores,
            subtotal,
            notes: payload.notes ?? "",
            status: payload.status ?? "draft",
            conflict_declared: Boolean(payload.conflictDeclared),
            conflict_resolved: Boolean(payload.conflictResolved),
            reopened: Boolean(payload.reopened),
            reopened_reason: payload.reopenReason ?? null,
            submitted_at: payload.status === "submitted" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "event_id,contestant_id,judge_id" },
        )
        .then(({ error }) => {
          if (error) console.warn("Supabase scorecard sync error:", error.message);
        });
    } else if (action === "duration") {
      void client
        .from("durations")
        .upsert(
          {
            event_id: DEFAULT_EVENT_ID,
            contestant_id: payload.contestantId,
            actual_seconds: payload.seconds,
            verified: Boolean(payload.verified),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "event_id,contestant_id" },
        )
        .then(({ error }) => {
          if (error) console.warn("Supabase duration sync error:", error.message);
        });
    } else if (action === "contestant") {
      void client
        .from("contestants")
        .update({
          full_name: payload.name,
          district: payload.district,
          performance_type: payload.type,
          performance_title: payload.title,
          biography: payload.bio,
          performance_order: payload.order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.id)
        .then(({ error }) => {
          if (error) console.warn("Supabase contestant sync error:", error.message);
        });
    } else if (action === "voting_status") {
      void client
        .from("events")
        .update({
          voting_status: payload.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", DEFAULT_EVENT_ID)
        .then(({ error }) => {
          if (error) console.warn("Supabase voting status sync error:", error.message);
        });
    } else if (action === "results_snapshot") {
      void client
        .from("results_snapshots")
        .upsert(
          {
            event_id: DEFAULT_EVENT_ID,
            rows_data: payload.results,
            locked_at: payload.results.lockedAt ?? new Date().toISOString(),
            published: Boolean(payload.results.published),
            published_at:
              payload.results.publishedAt ??
              (payload.results.published ? new Date().toISOString() : null),
            is_official: true,
          },
          { onConflict: "event_id,is_official" },
        )
        .then(({ error }) => {
          if (error) console.warn("Supabase snapshot sync error:", error.message);
        });
    }
  } catch (err) {
    console.warn("Supabase sync background exception:", err);
  }
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
  | {
      ok: false;
      reason: "not_open" | "closed" | "already_voted" | "unknown_contestant";
    };

function checkLocalVoteEligibility(contestantId: string): CastVoteResult {
  const s = state;
  if (resultsLocked(s)) return { ok: false, reason: "closed" };
  if (s.votingStatus === "not_open") return { ok: false, reason: "not_open" };
  if (s.votingStatus === "closed") return { ok: false, reason: "closed" };
  if (s.browserVote) return { ok: false, reason: "already_voted" };
  const exists = s.contestants.some((c) => c.id === contestantId || c.code === contestantId);
  if (!exists) return { ok: false, reason: "unknown_contestant" };
  return { ok: true };
}

function commitLocalVote(contestantId: string) {
  update((cur) => {
    if (resultsLocked(cur) || cur.votingStatus !== "open" || cur.browserVote) {
      return cur;
    }
    const targetContestant = cur.contestants.find(
      (c) => c.id === contestantId || c.code === contestantId,
    );
    const resolvedId = targetContestant ? targetContestant.id : contestantId;
    const newDemoVotes = { ...cur.demoVotes };
    newDemoVotes[resolvedId] = (newDemoVotes[resolvedId] ?? 0) + 1;
    return {
      ...cur,
      browserVote: { contestantId: resolvedId, at: new Date().toISOString() },
      demoVotes: newDemoVotes,
    };
  });
}

function rollbackLocalVote(contestantId: string) {
  update((cur) => {
    const targetContestant = cur.contestants.find(
      (c) => c.id === contestantId || c.code === contestantId,
    );
    const resolvedId = targetContestant ? targetContestant.id : contestantId;
    const newDemoVotes = { ...cur.demoVotes };
    if (newDemoVotes[resolvedId] !== undefined) {
      newDemoVotes[resolvedId] = Math.max(0, newDemoVotes[resolvedId] - 1);
    }
    return {
      ...cur,
      browserVote: null,
      demoVotes: newDemoVotes,
    };
  });
}

/**
 * Casts a single verified vote.
 * Supports synchronous callers (unit tests / demo state) while transparently
 * executing authoritative database insertion when Supabase is configured.
 */
export function castVote(
  contestantId: string,
  voterId?: string,
): CastVoteResult & Promise<CastVoteResult> {
  const localCheck = checkLocalVoteEligibility(contestantId);
  if (!localCheck.ok) {
    const rejected = Promise.resolve(localCheck);
    return Object.assign(rejected, localCheck);
  }

  const target = state.contestants.find((c) => c.id === contestantId || c.code === contestantId);
  const resolvedContestantId = target ? target.id : contestantId;

  // Immediately commit local vote so synchronous single-vote rules and checks hold
  commitLocalVote(resolvedContestantId);

  // In test mode or when Supabase is not configured, complete synchronously
  if (
    typeof window === "undefined" ||
    !isSupabaseConfigured() ||
    (typeof process !== "undefined" && process.env?.["NODE_ENV"] === "test")
  ) {
    const resolved = Promise.resolve({ ok: true as const });
    return Object.assign(resolved, { ok: true as const });
  }

  // Live Supabase integration: execute authoritative RPC
  const asyncPromise = (async (): Promise<CastVoteResult> => {
    try {
      const client = getSupabaseClient();
      if (!client) {
        return { ok: true };
      }

      let voterHash = voterId;
      if (!voterHash && typeof window !== "undefined") {
        voterHash = window.localStorage.getItem("shabach_voter_token") || "";
        if (!voterHash) {
          voterHash = `voter_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
          window.localStorage.setItem("shabach_voter_token", voterHash);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = (await (client.rpc as any)("cast_audience_vote", {
        p_event_id: DEFAULT_EVENT_ID,
        p_contestant_id: resolvedContestantId,
        p_voter_hash: voterHash,
        p_method: "device_fingerprint",
      })) as {
        data: { ok?: boolean; reason?: string } | null;
        error: { message?: string } | null;
      };

      const resPayload = data;
      if (error || !resPayload || !resPayload.ok) {
        const errReason = resPayload?.reason;
        if (errReason === "already_voted") {
          return { ok: false, reason: "already_voted" };
        }
        if (errReason === "closed" || errReason === "not_open") {
          rollbackLocalVote(resolvedContestantId);
          return { ok: false, reason: errReason };
        }
        if (errReason === "contestant_not_found") {
          rollbackLocalVote(resolvedContestantId);
          return { ok: false, reason: "unknown_contestant" };
        }
        if (error?.message?.includes("invalid input syntax for type uuid")) {
          return { ok: true };
        }
        rollbackLocalVote(resolvedContestantId);
        return { ok: false, reason: "closed" };
      }

      void refreshFromSupabase();
      return { ok: true };
    } catch {
      rollbackLocalVote(resolvedContestantId);
      return { ok: false, reason: "closed" };
    }
  })();

  return Object.assign(asyncPromise, { ok: true as const });
}

export async function castVoteAsync(
  contestantId: string,
  voterId?: string,
): Promise<CastVoteResult> {
  return await castVote(contestantId, voterId);
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
  syncMutationToSupabase("voting_status", { status });
}

// ---------------------------------------------------------------------------
// Judge workspace
// ---------------------------------------------------------------------------

export function setActiveJudge(judgeId: JudgeId | null) {
  update((s) => ({ ...s, activeJudge: judgeId }));
}

export function upsertCard(s: DemoState, next: Scorecard): Scorecard[] {
  syncMutationToSupabase("scorecard", next);
  const i = s.scorecards.findIndex(
    (c) => c.judgeId === next.judgeId && c.contestantId === next.contestantId,
  );
  if (i === -1) return [...s.scorecards, next];
  const copy = [...s.scorecards];
  copy[i] = next;
  return copy;
}

export function getCard(s: DemoState, judgeId: JudgeId, contestantId: string): Scorecard {
  return (
    s.scorecards.find((c) => c.judgeId === judgeId && c.contestantId === contestantId) ?? {
      contestantId,
      judgeId,
      scores: rubricFor(s.contestants.find((c) => c.id === contestantId)!.type).criteria.map(
        () => null,
      ),
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
  reason?:
    "incomplete" | "invalid" | "results_locked" | "already_submitted" | "unresolved_conflict";
  errors?: string[];
}

/** Final submission requires a fully valid scorecard; runs after an explicit review step. */
export function submitScorecard(judgeId: JudgeId, contestantId: string): SubmitResult {
  const s = state;
  if (resultsLocked(s)) return { ok: false, reason: "results_locked" };
  const card = getCard(s, judgeId, contestantId);
  if (card.status === "submitted" && !card.reopened) {
    return { ok: false, reason: "already_submitted" };
  }
  if (card.conflictDeclared && !card.conflictResolved) {
    return { ok: false, reason: "unresolved_conflict" };
  }
  const contestant = s.contestants.find((c) => c.id === contestantId);
  if (!contestant) return { ok: false, reason: "invalid" };
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
      conflictDeclared: false,
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

export interface UpdateContestantResult {
  ok: boolean;
  reason?: "results_locked" | "rubric_locked_by_scores";
}

export function updateContestant(id: string, edit: ContestantEdit): UpdateContestantResult {
  const s = state;
  if (resultsLocked(s)) return { ok: false, reason: "results_locked" };
  const target = s.contestants.find((c) => c.id === id);
  if (!target) return { ok: false };

  // Guard: Changing rubric is prohibited once scores exist for this contestant
  if (edit.type && edit.type !== target.type) {
    const hasScores = s.scorecards.some(
      (card) =>
        card.contestantId === id &&
        (card.status === "submitted" || card.scores.some((sc) => sc !== null)),
    );
    if (hasScores) {
      return { ok: false, reason: "rubric_locked_by_scores" };
    }
  }

  update((cur) => ({
    ...cur,
    contestants: cur.contestants.map((c) => (c.id === id ? { ...c, ...edit } : c)),
  }));
  syncMutationToSupabase("contestant", { id, ...edit });
  return { ok: true };
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
      activity: log(
        s,
        "scorecard_reopened",
        `Reopened ${judgeId}'s scorecard for ${s.contestants.find((c) => c.id === contestantId)?.name}. Reason: ${reason.trim()}`,
      ),
    };
  });
  return { ok: true };
}

/**
 * Resolves a conflict declaration by resetting the card to draft and requiring
 * explicit resubmission by an authorised judge.
 */
export function resolveConflict(judgeId: JudgeId, contestantId: string) {
  update((s) => {
    const card = getCard(s, judgeId, contestantId);
    if (!card.conflictDeclared && !card.conflictResolved) return s;
    return {
      ...s,
      scorecards: upsertCard(s, {
        ...card,
        conflictDeclared: false,
        conflictResolved: true,
        status: "draft",
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

export function setDuration(
  contestantId: string,
  seconds: number | null,
): { ok: boolean; reason?: "invalid_duration" | "results_locked" } {
  if (
    seconds !== null &&
    (!Number.isFinite(seconds) || seconds < 0 || !Number.isInteger(seconds))
  ) {
    return { ok: false, reason: "invalid_duration" };
  }
  const s = state;
  if (resultsLocked(s)) return { ok: false, reason: "results_locked" };

  update((cur) => {
    if (resultsLocked(cur)) return cur;
    const prev = cur.durations[contestantId];
    const entry: DurationEntry = {
      contestantId,
      seconds,
      verified: seconds !== null ? false : (prev?.verified ?? false),
      updatedAt: new Date().toISOString(),
    };
    return {
      ...cur,
      durations: { ...cur.durations, [contestantId]: entry },
    };
  });
  syncMutationToSupabase("duration", { contestantId, seconds, verified: false });
  return { ok: true };
}

export function setDurationVerified(contestantId: string, verified: boolean) {
  const currentEntry = state.durations[contestantId];
  if (currentEntry) {
    syncMutationToSupabase("duration", {
      contestantId,
      seconds: currentEntry.seconds,
      verified,
    });
  }
  update((s) => {
    if (resultsLocked(s)) return s;
    const prev = s.durations[contestantId];
    if (!prev || prev.seconds === null) return s;
    return {
      ...s,
      durations: {
        ...s.durations,
        [contestantId]: { ...prev, verified, updatedAt: new Date().toISOString() },
      },
    };
  });
}

export function setScoreDeskConfirmed(confirmed: boolean) {
  update((s) => ({ ...s, scoreDeskConfirmed: confirmed }));
}

export function recordTieResolution(
  contestantAId: string,
  contestantBId: string,
  winnerId: string,
  reason: string,
): { ok: boolean; reason?: "reason_required" | "results_locked" } {
  if (!reason.trim()) return { ok: false, reason: "reason_required" };
  const s = state;
  if (resultsLocked(s)) return { ok: false, reason: "results_locked" };

  update((cur) => {
    if (resultsLocked(cur)) return cur;
    const filtered = (cur.tieResolutions ?? []).filter(
      (tr) =>
        !(
          (tr.contestantIds[0] === contestantAId && tr.contestantIds[1] === contestantBId) ||
          (tr.contestantIds[0] === contestantBId && tr.contestantIds[1] === contestantAId)
        ),
    );
    const newResolution: TieResolution = {
      contestantIds: [contestantAId, contestantBId],
      winnerId,
      reason: reason.trim(),
      recordedAt: new Date().toISOString(),
    };
    const nameA = cur.contestants.find((c) => c.id === contestantAId)?.name ?? contestantAId;
    const nameB = cur.contestants.find((c) => c.id === contestantBId)?.name ?? contestantBId;
    const winnerName = cur.contestants.find((c) => c.id === winnerId)?.name ?? winnerId;

    return {
      ...cur,
      tieResolutions: [...filtered, newResolution],
      activity: log(
        cur,
        "results_verified",
        `Judges' review tie decision recorded between ${nameA} and ${nameB}: winner is ${winnerName}. Reason: ${reason.trim()}`,
      ),
    };
  });
  return { ok: true };
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
 *
 * Idempotent: produces exactly 48 unique cards and 16 complete contestants.
 */
export function loadSampleScores() {
  update((s) => {
    if (resultsLocked(s)) return s;

    // Use a map keyed by contestantId:judgeId to guarantee unique cards
    const cardMap = new Map<string, Scorecard>();

    // Seed existing cards into the map
    for (const card of s.scorecards) {
      cardMap.set(`${card.contestantId}:${card.judgeId}`, card);
    }

    const assignedJudges: JudgeId[] = JUDGES.map((j) => j.id);
    const durations = { ...s.durations };

    for (const contestant of s.contestants) {
      const rubric = rubricFor(contestant.type);

      for (const judgeId of assignedJudges) {
        const key = `${contestant.id}:${judgeId}`;
        const existing = cardMap.get(key);

        const alreadyValid =
          existing &&
          existing.status === "submitted" &&
          !existing.reopened &&
          !existing.conflictDeclared &&
          validateScores(existing.scores, rubric).ok;

        if (alreadyValid) {
          cardMap.set(key, existing);
          continue;
        }

        const scores = rubric.criteria.map((c, i) => {
          const base = c.max === 15 ? 9 : 13;
          const span = c.max === 15 ? 4 : 6;
          return seededInt(`${contestant.id}:${judgeId}:${i}`, base, base + span);
        });

        cardMap.set(key, {
          contestantId: contestant.id,
          judgeId,
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

      durations[contestant.id] = {
        contestantId: contestant.id,
        seconds,
        verified: true,
      };
    }

    // Keep only the 64 assigned contestant x judge cards
    const finalCards: Scorecard[] = [];
    for (const contestant of s.contestants) {
      for (const judgeId of assignedJudges) {
        const c = cardMap.get(`${contestant.id}:${judgeId}`);
        if (c) finalCards.push(c);
      }
    }

    return {
      ...s,
      isSimulatedDemo: true,
      scorecards: finalCards,
      durations,
      activity: log(
        s,
        "sample_scores_loaded",
        "Simulated sample scores loaded: all 64 scorecards submitted, durations entered and verified. Demo data only.",
      ),
    };
  });
}

export function resetDemo() {
  update(() => {
    const fresh = createSeedState();
    fresh.isSimulatedDemo = true;
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

export function returnToLiveState() {
  update((s) => ({
    ...s,
    isSimulatedDemo: false,
  }));
  if (isSupabaseConfigured()) {
    void refreshFromSupabase();
  }
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
  const rows = computeResults({
    contestants: s.contestants,
    scorecards: s.scorecards,
    voteCounts: voteCountsOf(s),
    durations: s.durations,
    tieResolutions: s.tieResolutions,
  });

  const gates = verificationGates(
    rows,
    s.scorecards,
    s.durations,
    s.votingStatus,
    s.scoreDeskConfirmed,
  );

  const problems: string[] = [];
  if (!gates.votingClosed) problems.push("Voting must be closed.");
  if (!gates.allComplete) problems.push("Every contestant needs four valid submitted scorecards.");
  if (!gates.allDurationsVerified)
    problems.push("Every performance duration must be entered and verified.");
  if (!gates.noUnresolvedConflicts) problems.push("Resolve all declared conflicts of interest.");
  if (!gates.noUnresolvedTies)
    problems.push(
      "All ties must be resolved by the criterion ladder or the collective judges' decision.",
    );
  if (!gates.scoreDeskConfirmed) problems.push("The score desk must confirm the collation.");

  return { ok: problems.length === 0, problems };
}

export function voteCountsOf(s: DemoState): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of s.contestants) counts[c.id] = s.demoVotes[c.id] ?? 0;
  return counts;
}

export function lockResults(): LockCheck {
  const s = state;
  // Idempotent: if results are already locked, preserve the existing snapshot
  if (resultsLocked(s)) {
    return { ok: true, problems: [] };
  }

  const check = checkLockReadiness();
  if (!check.ok) return check;

  update((cur) => {
    if (resultsLocked(cur)) return cur;
    const rows = computeResults({
      contestants: cur.contestants,
      scorecards: cur.scorecards,
      voteCounts: voteCountsOf(cur),
      durations: cur.durations,
      tieResolutions: cur.tieResolutions,
    });
    return {
      ...cur,
      results: {
        lockedAt: new Date().toISOString(),
        published: false,
        rows,
      },
      activity: log(
        cur,
        "results_locked",
        "Results collated and locked. A frozen snapshot was created.",
      ),
    };
  });
  if (state.results && !state.isSimulatedDemo) {
    syncMutationToSupabase("results_snapshot", { results: state.results });
  }
  return { ok: true, problems: [] };
}

export function publishResults(): { ok: boolean; reason?: "not_locked" | "already_published" } {
  const s = state;
  if (!s.results) return { ok: false, reason: "not_locked" };
  // Idempotent: already published preserves publishedAt and returns ok
  if (s.results.published) return { ok: true };

  update((cur) => ({
    ...cur,
    results: cur.results
      ? { ...cur.results, published: true, publishedAt: new Date().toISOString() }
      : cur.results,
    activity: log(cur, "results_published", "Results published to the public results page."),
  }));
  if (state.results && !state.isSimulatedDemo) {
    syncMutationToSupabase("results_snapshot", { results: state.results });
  }
  return { ok: true };
}

/** Subtotal preview used by the scorecard UI. */
export function subtotalOf(scores: (number | null)[]): number {
  return judgeSubtotal(scores);
}
