/**
 * SHABACH 2026 Data Access Adapter
 * Unifies Demo mode (localStorage) and Live mode (Supabase Postgres) behind a typed interface.
 */

import { computeMasterRows } from "@/lib/demo/scoring";
import {
  castVote as demoCastVote,
  getState as getDemoState,
  lockResults as demoLockResults,
  publishResults as demoPublishResults,
  recordTieResolution as demoRecordTieResolution,
  reopenScorecard as demoReopenScorecard,
  resolveConflict as demoResolveConflict,
  saveDraft as demoSaveDraft,
  setDuration as demoSetDuration,
  setScoreDeskConfirmed as demoSetScoreDeskConfirmed,
  submitScorecard as demoSubmitScorecard,
  updateContestant as demoUpdateContestant,
  voteCountsOf as demoVoteCountsOf,
  refreshFromSupabase,
} from "@/lib/demo/store";
import type {
  Contestant,
  DurationEntry,
  JudgeId,
  PerformanceType,
  ResultRow,
  ResultsSnapshot,
  Scorecard,
  TieResolution,
} from "@/lib/demo/types";
import { buildContestants } from "@/lib/demo/seed";
import { DEFAULT_EVENT_ID, getSupabaseClient, isSupabaseConfigured } from "./supabase";

export interface IDataAdapter {
  isLive(): boolean;
  getContestants(): Promise<Contestant[]>;
  getContestantByCode(code: string): Promise<Contestant | null>;
  updateContestant(contestant: Contestant): Promise<void>;
  castVote(
    voterId: string,
    contestantId: string,
  ): Promise<{ success: boolean; message: string; voteId?: string }>;
  getScorecards(judgeId?: JudgeId): Promise<Scorecard[]>;
  saveScorecardDraft(scorecard: Scorecard): Promise<void>;
  submitScorecard(scorecard: Scorecard): Promise<void>;
  reopenScorecard(contestantId: string, judgeId: JudgeId, reason: string): Promise<void>;
  resolveConflict(contestantId: string, judgeId: JudgeId, notes: string): Promise<void>;
  getDurations(): Promise<Record<string, DurationEntry>>;
  setDuration(contestantId: string, seconds: number, verified?: boolean): Promise<void>;
  lockResults(tieResolutions: TieResolution[]): Promise<ResultsSnapshot>;
  publishResults(): Promise<void>;
  getPublishedResults(): Promise<ResultsSnapshot | null>;
  getMasterCollation(): Promise<ResultRow[]>;
}

/**
 * ---------------------------------------------------------------------------
 * Demo Data Adapter (Local sandbox, localStorage, zero server dependencies)
 * ---------------------------------------------------------------------------
 */
export class DemoDataAdapter implements IDataAdapter {
  isLive(): boolean {
    return false;
  }

  async getContestants(): Promise<Contestant[]> {
    const list = getDemoState().contestants;
    return list && list.length > 0 ? list : buildContestants();
  }

  async getContestantByCode(code: string): Promise<Contestant | null> {
    const cleanCode = code.trim().toUpperCase();
    const list = getDemoState().contestants;
    const pool = list && list.length > 0 ? list : buildContestants();
    let contestant = pool.find((c) => c.code.toUpperCase() === cleanCode);
    if (!contestant) {
      contestant = buildContestants().find((c) => c.code.toUpperCase() === cleanCode);
    }
    return contestant || null;
  }

  async updateContestant(contestant: Contestant): Promise<void> {
    const res = demoUpdateContestant(contestant.id, {
      name: contestant.name,
      district: contestant.district,
      type: contestant.type,
      title: contestant.title,
      bio: contestant.bio,
      order: contestant.order,
    });
    if (!res.ok) {
      throw new Error(`Failed to update contestant: ${res.reason}`);
    }
  }

  async castVote(
    voterId: string,
    contestantId: string,
  ): Promise<{ success: boolean; message: string; voteId?: string }> {
    const s = getDemoState();
    if (s.results !== null) {
      return {
        success: false,
        message: "Competition results are locked. Voting window is permanently closed.",
      };
    }
    if (s.votingStatus === "not_open") {
      return {
        success: false,
        message: "Voting has not opened yet.",
      };
    }
    if (s.votingStatus === "closed") {
      return {
        success: false,
        message: "Voting window is currently closed.",
      };
    }

    const res = demoCastVote(contestantId, voterId);
    if (!res.ok) {
      return {
        success: false,
        message:
          res.reason === "already_voted"
            ? "You have already cast your single vote."
            : res.reason === "closed"
              ? "Voting window is currently closed."
              : res.reason === "not_open"
                ? "Voting has not opened yet."
                : "Unknown contestant.",
      };
    }
    return {
      success: true,
      message: "Vote confirmed and recorded successfully.",
      voteId: `demo-vote-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
  }

  async getScorecards(judgeId?: JudgeId): Promise<Scorecard[]> {
    const cards = getDemoState().scorecards;
    if (judgeId) {
      return cards.filter((c) => c.judgeId === judgeId);
    }
    return cards;
  }

  async saveScorecardDraft(scorecard: Scorecard): Promise<void> {
    const res = demoSaveDraft(
      scorecard.judgeId,
      scorecard.contestantId,
      scorecard.scores,
      scorecard.notes,
    );
    if (!res.ok) {
      throw new Error(`Failed to save draft: ${res.reason}`);
    }
  }

  async submitScorecard(scorecard: Scorecard): Promise<void> {
    const res = demoSubmitScorecard(scorecard.judgeId, scorecard.contestantId);
    if (!res.ok) {
      throw new Error(`Failed to submit scorecard: ${res.reason}`);
    }
  }

  async reopenScorecard(contestantId: string, judgeId: JudgeId, reason: string): Promise<void> {
    demoReopenScorecard(judgeId, contestantId, reason);
  }

  async resolveConflict(contestantId: string, judgeId: JudgeId, _notes: string): Promise<void> {
    demoResolveConflict(judgeId, contestantId);
  }

  async getDurations(): Promise<Record<string, DurationEntry>> {
    return getDemoState().durations;
  }

  async setDuration(contestantId: string, seconds: number, _verified?: boolean): Promise<void> {
    const res = demoSetDuration(contestantId, seconds);
    if (!res.ok) {
      throw new Error(`Failed to update duration: ${res.reason}`);
    }
  }

  async lockResults(tieResolutions: TieResolution[]): Promise<ResultsSnapshot> {
    for (const tie of tieResolutions) {
      demoRecordTieResolution(tie.contestantIds[0], tie.contestantIds[1], tie.winnerId, tie.reason);
    }
    demoSetScoreDeskConfirmed(true);
    const check = demoLockResults();
    if (!check.ok) {
      const reasons = check.problems.join("; ");
      throw new Error(`Unable to lock results: ${reasons}`);
    }
    const snapshot = getDemoState().results;
    if (!snapshot) {
      throw new Error("Unable to retrieve locked results snapshot.");
    }
    return snapshot;
  }

  async publishResults(): Promise<void> {
    const res = demoPublishResults();
    if (!res.ok) {
      throw new Error(`Unable to publish results: ${res.reason}`);
    }
  }

  async getPublishedResults(): Promise<ResultsSnapshot | null> {
    const results = getDemoState().results;
    if (results && results.published) {
      return results;
    }
    return null;
  }

  async getMasterCollation(): Promise<ResultRow[]> {
    const state = getDemoState();
    return computeMasterRows({
      contestants: state.contestants,
      scorecards: state.scorecards,
      durations: state.durations,
      voteCounts: demoVoteCountsOf(state),
      tieResolutions: state.tieResolutions,
    });
  }
}

/**
 * ---------------------------------------------------------------------------
 * Live Supabase Data Adapter (PostgreSQL database, Row Level Security, Auth)
 * ---------------------------------------------------------------------------
 */
export class LiveSupabaseAdapter implements IDataAdapter {
  isLive(): boolean {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get client(): any {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error("Live Supabase adapter invoked, but Supabase credentials are missing.");
    }
    return client;
  }

  async bootstrapIfEmpty(): Promise<void> {
    try {
      const { data, error } = await this.client.from("contestants").select("id").limit(1);
      if (error) return; // Table not yet created or permission restricted
      if (data && data.length === 0) {
        // Seed contestants
        const seeds = buildContestants();
        const rows = seeds.map((c) => ({
          event_id: DEFAULT_EVENT_ID,
          code: c.code,
          full_name: c.name,
          district: c.district,
          performance_type: c.type,
          performance_title: c.title,
          biography: c.bio,
          performance_order: c.order,
          avatar_url: null,
        }));
        await this.client.from("contestants").insert(rows);
      }
    } catch {
      // Ignore background bootstrap failures
    }
  }

  async getContestants(): Promise<Contestant[]> {
    const { data, error } = await this.client
      .from("contestants")
      .select("*")
      .order("performance_order", { ascending: true });

    if (error) {
      // Fallback to local state if database table query fails
      return getDemoState().contestants;
    }

    if (!data || data.length === 0) {
      return getDemoState().contestants;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.name ?? row.full_name,
      district: row.district,
      type: (row.performance_type ?? "music") as PerformanceType,
      title: row.title ?? row.performance_title ?? "",
      bio: row.bio ?? row.biography ?? "",
      order: row.performance_order,
      hue: row.hue ?? (row.performance_order * 23) % 360,
    }));
  }

  async getContestantByCode(code: string): Promise<Contestant | null> {
    const { data, error } = await this.client
      .from("contestants")
      .select("*")
      .ilike("code", code.trim())
      .maybeSingle();

    if (error || !data) {
      return new DemoDataAdapter().getContestantByCode(code);
    }

    return {
      id: data.id,
      code: data.code,
      name: data.name ?? data.full_name,
      district: data.district,
      type: (data.performance_type ?? "music") as PerformanceType,
      title: data.title ?? data.performance_title ?? "",
      bio: data.bio ?? data.biography ?? "",
      order: data.performance_order,
      hue: data.hue ?? (data.performance_order * 23) % 360,
    };
  }

  async updateContestant(contestant: Contestant): Promise<void> {
    const { error } = await this.client
      .from("contestants")
      .update({
        full_name: contestant.name,
        district: contestant.district,
        performance_type: contestant.type,
        performance_title: contestant.title,
        biography: contestant.bio,
        performance_order: contestant.order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contestant.id);

    // Also update local store
    await new DemoDataAdapter().updateContestant(contestant);

    if (error) {
      console.warn("Supabase update contestant warning:", error.message);
    }
  }

  async castVote(
    voterId: string,
    contestantId: string,
  ): Promise<{ success: boolean; message: string; voteId?: string }> {
    try {
      const { data, error } = await this.client.rpc("cast_audience_vote", {
        p_event_id: DEFAULT_EVENT_ID,
        p_contestant_id: contestantId,
        p_voter_token: voterId,
        p_method: "otp_email",
        p_voter_hash: voterId,
      });

      if (!error && data && typeof data === "object" && (data as { ok?: boolean }).ok) {
        // Also reflect locally
        new DemoDataAdapter().castVote(voterId, contestantId);
        void refreshFromSupabase();
        const resVoteId = (data as { vote_id?: string }).vote_id;
        return {
          success: true,
          message: "Vote cast successfully and verified on Supabase ledger.",
          ...(resVoteId ? { voteId: resVoteId } : {}),
        };
      }
    } catch {
      // Fall through to local fallback
    }

    return new DemoDataAdapter().castVote(voterId, contestantId);
  }

  async getScorecards(judgeId?: JudgeId): Promise<Scorecard[]> {
    try {
      let query = this.client.from("scorecards").select("*");
      if (judgeId) {
        query = query.eq("judge_id", judgeId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((row: any) => ({
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
        }));
      }
    } catch {
      // Fall through
    }
    return new DemoDataAdapter().getScorecards(judgeId);
  }

  async saveScorecardDraft(scorecard: Scorecard): Promise<void> {
    // Save locally
    await new DemoDataAdapter().saveScorecardDraft(scorecard);

    try {
      const scores = scorecard.scores ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subtotal = scores.reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
      await this.client.from("scorecards").upsert(
        {
          event_id: DEFAULT_EVENT_ID,
          contestant_id: scorecard.contestantId,
          judge_id: scorecard.judgeId,
          criteria_scores: scores,
          subtotal,
          notes: scorecard.notes ?? "",
          status: "draft",
          conflict_declared: Boolean(scorecard.conflictDeclared),
          conflict_resolved: Boolean(scorecard.conflictResolved),
          reopened: Boolean(scorecard.reopened),
          reopened_reason: scorecard.reopenReason ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_id,contestant_id,judge_id" },
      );
    } catch (err) {
      console.warn("Supabase saveScorecardDraft warning:", err);
    }
  }

  async submitScorecard(scorecard: Scorecard): Promise<void> {
    // Submit locally
    await new DemoDataAdapter().submitScorecard(scorecard);

    try {
      const scores = scorecard.scores ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subtotal = scores.reduce((acc: number, val: any) => acc + (Number(val) || 0), 0);
      await this.client.from("scorecards").upsert(
        {
          event_id: DEFAULT_EVENT_ID,
          contestant_id: scorecard.contestantId,
          judge_id: scorecard.judgeId,
          criteria_scores: scores,
          subtotal,
          notes: scorecard.notes ?? "",
          status: "submitted",
          conflict_declared: Boolean(scorecard.conflictDeclared),
          conflict_resolved: Boolean(scorecard.conflictResolved),
          reopened: false,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_id,contestant_id,judge_id" },
      );
    } catch (err) {
      console.warn("Supabase submitScorecard warning:", err);
    }
  }

  async reopenScorecard(contestantId: string, judgeId: JudgeId, reason: string): Promise<void> {
    await new DemoDataAdapter().reopenScorecard(contestantId, judgeId, reason);

    try {
      const { data, error } = await this.client.rpc("reopen_judge_scorecard", {
        p_event_id: DEFAULT_EVENT_ID,
        p_judge_id: judgeId,
        p_contestant_id: contestantId,
        p_reason: reason,
      });

      if (error) {
        // Fallback to direct update if RPC is not yet active
        await this.client
          .from("scorecards")
          .update({
            reopened: true,
            reopened_reason: reason,
            status: "draft",
            updated_at: new Date().toISOString(),
          })
          .match({ event_id: DEFAULT_EVENT_ID, contestant_id: contestantId, judge_id: judgeId });
      }
    } catch (err) {
      console.warn("Supabase reopenScorecard warning:", err);
    }
  }

  async resolveConflict(contestantId: string, judgeId: JudgeId, notes: string): Promise<void> {
    await new DemoDataAdapter().resolveConflict(contestantId, judgeId, notes);

    try {
      await this.client
        .from("scorecards")
        .update({
          conflict_declared: false,
          conflict_resolved: true,
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .match({ event_id: DEFAULT_EVENT_ID, contestant_id: contestantId, judge_id: judgeId });
    } catch (err) {
      console.warn("Supabase resolveConflict warning:", err);
    }
  }

  async getDurations(): Promise<Record<string, DurationEntry>> {
    try {
      const { data, error } = await this.client.from("durations").select("*");
      if (!error && data && data.length > 0) {
        const dict: Record<string, DurationEntry> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const row of data as any[]) {
          dict[row.contestant_id] = {
            contestantId: row.contestant_id,
            seconds: row.actual_seconds ?? row.duration_seconds,
            verified: Boolean(row.verified),
          };
        }
        return dict;
      }
    } catch {
      // Fall through
    }
    return new DemoDataAdapter().getDurations();
  }

  async setDuration(contestantId: string, seconds: number, verified?: boolean): Promise<void> {
    await new DemoDataAdapter().setDuration(contestantId, seconds, verified);

    try {
      await this.client.from("durations").upsert(
        {
          event_id: DEFAULT_EVENT_ID,
          contestant_id: contestantId,
          actual_seconds: seconds,
          verified: verified ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "event_id,contestant_id" },
      );
    } catch (err) {
      console.warn("Supabase setDuration warning:", err);
    }
  }

  async lockResults(tieResolutions: TieResolution[]): Promise<ResultsSnapshot> {
    // Refresh authoritative scorecards and vote totals from database before collation
    await refreshFromSupabase();
    const snapshot = await new DemoDataAdapter().lockResults(tieResolutions);

    try {
      await this.client.from("results_snapshots").upsert(
        {
          event_id: DEFAULT_EVENT_ID,
          rows_data: snapshot,
          locked_at: snapshot.lockedAt,
          published: false,
          is_official: true,
        },
        { onConflict: "event_id,is_official" },
      );

      // Transition event lifecycle status to 'locked' via authoritative RPC
      await this.client.rpc("lock_competition_results", {
        p_event_id: DEFAULT_EVENT_ID,
      });
    } catch (err) {
      console.warn("Supabase lockResults warning:", err);
    }

    return snapshot;
  }

  async publishResults(): Promise<void> {
    await new DemoDataAdapter().publishResults();

    try {
      // Publish snapshot and update event lifecycle to 'published' via authoritative RPC
      const { error } = await this.client.rpc("publish_competition_results", {
        p_event_id: DEFAULT_EVENT_ID,
      });

      if (error) {
        // Fallback update
        await this.client
          .from("results_snapshots")
          .update({
            published: true,
            published_at: new Date().toISOString(),
          })
          .match({ event_id: DEFAULT_EVENT_ID, is_official: true });
      }
    } catch (err) {
      console.warn("Supabase publishResults warning:", err);
    }
  }

  async getPublishedResults(): Promise<ResultsSnapshot | null> {
    try {
      const { data, error } = await this.client
        .from("results_snapshots")
        .select("*")
        .match({ event_id: DEFAULT_EVENT_ID, is_official: true, published: true })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data && data.rows_data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snapPayload: any = data.rows_data;
        return {
          lockedAt: data.locked_at,
          published: Boolean(data.published),
          ...(data.published_at ? { publishedAt: data.published_at } : {}),
          rows: snapPayload?.rows ?? (Array.isArray(snapPayload) ? snapPayload : []),
        };
      }
    } catch {
      // Fall through
    }
    return new DemoDataAdapter().getPublishedResults();
  }

  async getMasterCollation(): Promise<ResultRow[]> {
    return new DemoDataAdapter().getMasterCollation();
  }
}

/**
 * Global singleton adapter selector.
 * Returns LiveSupabaseAdapter when configured, DemoDataAdapter otherwise.
 */
let cachedAdapter: IDataAdapter | null = null;

export function getDataAdapter(): IDataAdapter {
  if (cachedAdapter) return cachedAdapter;
  if (isSupabaseConfigured()) {
    cachedAdapter = new LiveSupabaseAdapter();
  } else {
    cachedAdapter = new DemoDataAdapter();
  }
  return cachedAdapter;
}
