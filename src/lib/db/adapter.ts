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
  setDurationVerified as demoSetDurationVerified,
  setScoreDeskConfirmed as demoSetScoreDeskConfirmed,
  submitScorecard as demoSubmitScorecard,
  updateContestant as demoUpdateContestant,
  voteCountsOf as demoVoteCountsOf,
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
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

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
    return getDemoState().contestants;
  }

  async getContestantByCode(code: string): Promise<Contestant | null> {
    const contestant = getDemoState().contestants.find(
      (c) => c.code.toUpperCase() === code.trim().toUpperCase(),
    );
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
    _voterId: string,
    contestantId: string,
  ): Promise<{ success: boolean; message: string; voteId?: string }> {
    const res = demoCastVote(contestantId);
    if (!res.ok) {
      return {
        success: false,
        message:
          res.reason === "already_voted"
            ? "You have already cast your vote."
            : "Voting window is not open or contestant is invalid.",
      };
    }
    return {
      success: true,
      message: "Vote cast successfully in demo environment.",
      voteId: `demo-vote-${Date.now()}`,
    };
  }

  async getScorecards(judgeId?: JudgeId): Promise<Scorecard[]> {
    const all = getDemoState().scorecards;
    if (judgeId) {
      return all.filter((s) => s.judgeId === judgeId);
    }
    return all;
  }

  async saveScorecardDraft(scorecard: Scorecard): Promise<void> {
    demoSaveDraft(scorecard.judgeId, scorecard.contestantId, scorecard.scores, scorecard.notes);
  }

  async submitScorecard(scorecard: Scorecard): Promise<void> {
    demoSaveDraft(scorecard.judgeId, scorecard.contestantId, scorecard.scores, scorecard.notes);
    const res = demoSubmitScorecard(scorecard.judgeId, scorecard.contestantId);
    if (!res.ok) {
      throw new Error(`Scorecard submission rejected: ${res.reason}`);
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

  async setDuration(contestantId: string, seconds: number, verified = false): Promise<void> {
    demoSetDuration(contestantId, seconds);
    if (verified) {
      demoSetDurationVerified(contestantId, true);
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

  async getContestants(): Promise<Contestant[]> {
    const { data, error } = await this.client
      .from("contestants")
      .select("*")
      .order("performance_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to load contestants: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      name: row.full_name,
      district: row.district,
      type: row.performance_type as PerformanceType,
      title: row.performance_title,
      bio: row.biography,
      order: row.performance_order,
      hue: (row.performance_order * 23) % 360,
    }));
  }

  async getContestantByCode(code: string): Promise<Contestant | null> {
    const { data, error } = await this.client
      .from("contestants")
      .select("*")
      .ilike("code", code.trim())
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      code: data.code,
      name: data.full_name,
      district: data.district,
      type: data.performance_type as PerformanceType,
      title: data.performance_title,
      bio: data.biography,
      order: data.performance_order,
      hue: (data.performance_order * 23) % 360,
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
      })
      .eq("id", contestant.id);

    if (error) {
      throw new Error(`Failed to update contestant: ${error.message}`);
    }
  }

  async castVote(
    voterId: string,
    contestantId: string,
  ): Promise<{ success: boolean; message: string; voteId?: string }> {
    const { data, error } = await this.client.rpc("cast_audience_vote", {
      p_event_id: "00000000-0000-0000-0000-000000002026",
      p_voter_id: voterId,
      p_contestant_id: contestantId,
    });

    if (error) {
      return {
        success: false,
        message: error.message || "Failed to record vote on server.",
      };
    }

    const res = data as { success: boolean; vote_id?: string; message: string };
    const result: { success: boolean; message: string; voteId?: string } = {
      success: res.success,
      message: res.message,
    };
    if (res.vote_id) {
      result.voteId = res.vote_id;
    }
    return result;
  }

  async getScorecards(judgeId?: JudgeId): Promise<Scorecard[]> {
    let query = this.client.from("scorecards").select("*");
    if (judgeId) {
      query = query.eq("judge_id", judgeId);
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to load scorecards: ${error.message}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
      contestantId: row.contestant_id,
      judgeId: row.judge_id as JudgeId,
      scores: Array.isArray(row.criteria_scores)
        ? (row.criteria_scores as (number | null)[])
        : Object.values(row.criteria_scores || {}).map(Number),
      notes: row.notes || "",
      status: row.status,
      conflictDeclared: row.conflict_declared,
      conflictResolved: row.conflict_resolved,
      reopened: row.reopened,
      reopenReason: row.reopened_reason || undefined,
      updatedAt: row.updated_at,
    }));
  }

  async saveScorecardDraft(scorecard: Scorecard): Promise<void> {
    const { error } = await this.client.from("scorecards").upsert(
      {
        event_id: "00000000-0000-0000-0000-000000002026",
        contestant_id: scorecard.contestantId,
        judge_id: scorecard.judgeId,
        status: "draft",
        criteria_scores: scorecard.scores.reduce<Record<string, number>>((acc, s, i) => {
          if (s !== null) acc[`crit_${i}`] = s;
          return acc;
        }, {}),
        subtotal: scorecard.scores.reduce<number>((sum, s) => sum + (s || 0), 0),
        notes: scorecard.notes,
        conflict_declared: scorecard.conflictDeclared,
        conflict_resolved: scorecard.conflictResolved,
        reopened: scorecard.reopened,
        reopened_reason: scorecard.reopenReason || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,contestant_id,judge_id" },
    );

    if (error) throw new Error(`Failed to save draft scorecard: ${error.message}`);
  }

  async submitScorecard(scorecard: Scorecard): Promise<void> {
    const { error } = await this.client.from("scorecards").upsert(
      {
        event_id: "00000000-0000-0000-0000-000000002026",
        contestant_id: scorecard.contestantId,
        judge_id: scorecard.judgeId,
        status: "submitted",
        criteria_scores: scorecard.scores.reduce<Record<string, number>>((acc, s, i) => {
          if (s !== null) acc[`crit_${i}`] = s;
          return acc;
        }, {}),
        subtotal: scorecard.scores.reduce<number>((sum, s) => sum + (s || 0), 0),
        notes: scorecard.notes,
        conflict_declared: scorecard.conflictDeclared,
        conflict_resolved: scorecard.conflictResolved,
        reopened: false,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "event_id,contestant_id,judge_id" },
    );

    if (error) throw new Error(`Failed to submit scorecard: ${error.message}`);
  }

  async reopenScorecard(contestantId: string, judgeId: JudgeId, reason: string): Promise<void> {
    const { error } = await this.client
      .from("scorecards")
      .update({
        status: "draft",
        reopened: true,
        reopened_reason: reason,
        reopened_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .match({
        event_id: "00000000-0000-0000-0000-000000002026",
        contestant_id: contestantId,
        judge_id: judgeId,
      });

    if (error) throw new Error(`Failed to reopen scorecard: ${error.message}`);
  }

  async resolveConflict(contestantId: string, judgeId: JudgeId, notes: string): Promise<void> {
    const { error } = await this.client
      .from("scorecards")
      .update({
        conflict_resolved: true,
        conflict_resolution_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .match({
        event_id: "00000000-0000-0000-0000-000000002026",
        contestant_id: contestantId,
        judge_id: judgeId,
      });

    if (error) throw new Error(`Failed to resolve conflict: ${error.message}`);
  }

  async getDurations(): Promise<Record<string, DurationEntry>> {
    const { data, error } = await this.client
      .from("durations")
      .select("*")
      .eq("event_id", "00000000-0000-0000-0000-000000002026");

    if (error) throw new Error(`Failed to get durations: ${error.message}`);

    const result: Record<string, DurationEntry> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of (data || []) as any[]) {
      result[row.contestant_id] = {
        contestantId: row.contestant_id,
        seconds: row.duration_seconds,
        verified: row.is_verified,
      };
    }
    return result;
  }

  async setDuration(contestantId: string, seconds: number, verified = false): Promise<void> {
    const { error } = await this.client.from("durations").upsert(
      {
        event_id: "00000000-0000-0000-0000-000000002026",
        contestant_id: contestantId,
        duration_seconds: seconds,
        is_verified: verified,
        verified_at: verified ? new Date().toISOString() : null,
      },
      { onConflict: "event_id,contestant_id" },
    );

    if (error) throw new Error(`Failed to update duration: ${error.message}`);
  }

  async lockResults(tieResolutions: TieResolution[]): Promise<ResultsSnapshot> {
    const masterRows = await this.getMasterCollation();
    const snapshot: ResultsSnapshot = {
      lockedAt: new Date().toISOString(),
      published: false,
      rows: masterRows,
    };

    const { error } = await this.client.from("results_snapshots").upsert(
      {
        event_id: "00000000-0000-0000-0000-000000002026",
        locked_at: snapshot.lockedAt,
        snapshot_data: snapshot as unknown as Record<string, unknown>,
        is_published: false,
        tie_resolutions: tieResolutions as unknown as Record<string, unknown>[],
      },
      { onConflict: "event_id" },
    );

    if (error) throw new Error(`Failed to lock results snapshot: ${error.message}`);
    return snapshot;
  }

  async publishResults(): Promise<void> {
    const { error } = await this.client
      .from("results_snapshots")
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq("event_id", "00000000-0000-0000-0000-000000002026");

    if (error) throw new Error(`Failed to publish results: ${error.message}`);
  }

  async getPublishedResults(): Promise<ResultsSnapshot | null> {
    const { data, error } = await this.client
      .from("results_snapshots")
      .select("*")
      .eq("event_id", "00000000-0000-0000-0000-000000002026")
      .eq("is_published", true)
      .single();

    if (error || !data) return null;
    const snap = data.snapshot_data as unknown as ResultsSnapshot;
    return snap;
  }

  async getMasterCollation(): Promise<ResultRow[]> {
    const contestants = await this.getContestants();
    const scorecards = await this.getScorecards();
    const durations = await this.getDurations();

    // Query votes count per contestant
    const { data: voteCounts } = await this.client
      .from("votes")
      .select("contestant_id")
      .eq("event_id", "00000000-0000-0000-0000-000000002026");

    const votesMap: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const v of (voteCounts || []) as any[]) {
      votesMap[v.contestant_id] = (votesMap[v.contestant_id] || 0) + 1;
    }

    return computeMasterRows({
      contestants,
      scorecards,
      durations,
      voteCounts: votesMap,
      tieResolutions: [],
    });
  }
}

// Default singleton adapter based on runtime configuration
let activeAdapter: IDataAdapter | null = null;

export function getDataAdapter(): IDataAdapter {
  if (!activeAdapter) {
    if (isSupabaseConfigured()) {
      activeAdapter = new LiveSupabaseAdapter();
    } else {
      activeAdapter = new DemoDataAdapter();
    }
  }
  return activeAdapter;
}
