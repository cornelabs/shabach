/**
 * Shared domain types for the SHABACH 2026 demo.
 * Everything here is plain data — no browser or server APIs.
 */

export type PerformanceType =
  | "music"
  | "dance"
  | "spoken_word"
  | "mono_drama"
  | "visual_arts";

export const PERFORMANCE_TYPES: PerformanceType[] = [
  "music",
  "dance",
  "spoken_word",
  "mono_drama",
  "visual_arts",
];

export type JudgeId = "judge1" | "judge2" | "judge3";

export const JUDGES: { id: JudgeId; name: string; label: string }[] = [
  { id: "judge1", name: "Judge 1", label: "Sample judge (demo)" },
  { id: "judge2", name: "Judge 2", label: "Sample judge (demo)" },
  { id: "judge3", name: "Judge 3", label: "Sample judge (demo)" },
];

export interface Contestant {
  id: string;
  /** Stable six-character uppercase alphanumeric share code. */
  code: string;
  name: string;
  district: string;
  type: PerformanceType;
  /** Performance title. */
  title: string;
  bio: string;
  /** Performance order, 1..16, one overall ranking. */
  order: number;
  /** Hue (0-360) used for the monogram placeholder. */
  hue: number;
}

export type ScorecardStatus = "not_started" | "draft" | "submitted";

export interface Scorecard {
  contestantId: string;
  judgeId: JudgeId;
  /** Aligned to the rubric criteria for the contestant's performance type. */
  scores: (number | null)[];
  notes: string;
  status: ScorecardStatus;
  conflictDeclared: boolean;
  /** Set by the organiser after reviewing a declared conflict. */
  conflictResolved: boolean;
  reopened: boolean;
  reopenReason?: string;
  updatedAt?: string;
}

export type VotingStatus = "not_open" | "open" | "closed";

export interface DurationEntry {
  contestantId: string;
  /** Actual performance duration in seconds; null until entered. */
  seconds: number | null;
  verified: boolean;
}

export type ActivityKind =
  | "voting_opened"
  | "voting_closed"
  | "voting_reopened"
  | "scorecard_reopened"
  | "conflict_resolved"
  | "durations_verified"
  | "results_verified"
  | "results_locked"
  | "results_published"
  | "sample_scores_loaded"
  | "demo_reset";

export interface ActivityEvent {
  id: string;
  at: string;
  kind: ActivityKind;
  detail: string;
}

export interface ResultRow {
  contestant: Contestant;
  /** Submitted, conflict-free scorecards, keyed by judge. */
  judgeSubtotals: Partial<Record<JudgeId, number>>;
  judgeCount: number;
  judgeAverage: number | null;
  validVotes: number;
  audiencePoints: number;
  timePenalty: number;
  finalScore: number | null;
  /** True when all three judges submitted valid (unconflicted) scorecards. */
  complete: boolean;
  tieFlags: string[];
  rank: number | null;
}

export interface ResultsSnapshot {
  lockedAt: string;
  published: boolean;
  publishedAt?: string;
  rows: ResultRow[];
}

export interface DemoState {
  version: 1;
  contestants: Contestant[];
  scorecards: Scorecard[];
  /** Simulated audience votes per contestant id (labelled as demo data). */
  demoVotes: Record<string, number>;
  /** Votes cast in this demo browser; at most one across the competition. */
  browserVote: { contestantId: string; at: string } | null;
  votingStatus: VotingStatus;
  durations: Record<string, DurationEntry>;
  activity: ActivityEvent[];
  /** Score-desk confirmation gate for locking results. */
  scoreDeskConfirmed: boolean;
  results: ResultsSnapshot | null;
  /** Which sample judge the judge workspace is signed in as. */
  activeJudge: JudgeId | null;
}

export const DISTRICTS = [
  "Epe District",
  "Ijede District",
  "Iranwo District",
  "Igbogbo District",
  "Badagry District",
  "Magbon District",
  "Morogbo District",
  "State Church",
] as const;
