/**
 * Shared domain types for the SHABACH 2026 platform.
 * Everything here is plain data — no browser or server APIs.
 */

export type PerformanceType = "music" | "dance" | "spoken_word" | "mono_drama" | "visual_arts";

export const PERFORMANCE_TYPES: PerformanceType[] = [
  "music",
  "dance",
  "spoken_word",
  "mono_drama",
  "visual_arts",
];

export type JudgeId = "judge1" | "judge2" | "judge3" | "judge4";

export interface JudgeProfile {
  id: JudgeId;
  name: string;
  label: string;
  seatTitle: string;
  roleTitle: string;
  bio: string;
  avatarUrl: string;
}

export const JUDGES: JudgeProfile[] = [
  {
    id: "judge1",
    name: "David O. Umoru",
    label: "Digital Media Strategist & State ICT/Media Director",
    seatTitle: "Judge Seat 1",
    roleTitle: "Digital Media Strategist | Entrepreneur | Creative Visionary",
    bio: "Founder of Hebron Media and Convener of Creators Experience. Serves as State ICT/Media Director for Youth Arm of Living Faith Church Worldwide (Winners' Chapel), Ondo State, empowering creatives across Nigeria.",
    avatarUrl: "/judges/david-umoru.jpeg",
  },
  {
    id: "judge2",
    name: "Molu Gbenga",
    label: "Pioneer Creative Director, Youth Alive (Gideonites)",
    seatTitle: "Judge Seat 2",
    roleTitle: "Engineer | Entrepreneur | Creative Director | Leadership Strategist",
    bio: "Pioneer Creative Director of the Youth Alive Creativity Department (Gideonites) and CEO of Alpha Craft Global Resources Ltd. Seasoned leadership strategist and programs coordinator for WYCF.",
    avatarUrl: "/judges/molu-gbenga.jpeg",
  },
  {
    id: "judge3",
    name: "Mrs. Priscillia Fayomi",
    label: "Global Creativity Director, Youth Alive Ministry",
    seatTitle: "Judge Seat 3",
    roleTitle: "Global Creativity Director | TV Producer | Filmmaker | Lead Vocalist",
    bio: "Global Creativity Director for the Youth Alive Ministry of Living Faith Church Worldwide. TV producer, filmmaker, scriptwriter, and celebrated lead vocalist in the Faith Tabernacle Choir, Canaanland.",
    avatarUrl: "/judges/priscillia-fayomi.jpeg",
  },
  {
    id: "judge4",
    name: "Sochi Daniel-Onuoha",
    label: "Principal Architect, SD Universal & Music Evangelist",
    seatTitle: "Judge Seat 4",
    roleTitle: "Architect | Entrepreneur | Music Evangelist | Humanitarian",
    bio: "Principal at SD Universal Limited, lead architect on major sacred monuments, MBA from Covenant University, visionary leader of Radiate Ministries, and secretary of Dan Onuoha Foundation.",
    avatarUrl: "/judges/sochi-daniel-onuoha.jpeg",
  },
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
  /** Contestant photo URL (from public/contestants/ or remote storage). */
  avatarUrl?: string | null | undefined;
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
  reopenReason?: string | undefined;
  updatedAt?: string | undefined;
  submittedAt?: string | undefined;
  subtotal?: number | undefined;
}

export type VotingStatus = "not_open" | "open" | "closed";

export interface DurationEntry {
  contestantId: string;
  /** Actual performance duration in seconds; null until entered. */
  seconds: number | null;
  verified: boolean;
  updatedAt?: string | undefined;
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
  /** True when all required judges (4) submitted valid (unconflicted) scorecards. */
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

export interface TieResolution {
  contestantIds: [string, string];
  winnerId: string;
  reason: string;
  recordedAt: string;
}

export interface DemoState {
  version: 2;
  contestants: Contestant[];
  scorecards: Scorecard[];
  /** Simulated audience votes per contestant id (labelled as demo data). */
  demoVotes: Record<string, number>;
  /** Votes cast in this demo browser; at most one across the competition. */
  browserVote: { contestantId: string; at: string } | null;
  /** Granular record of all individual votes cast by verified voter tokens */
  votes: Array<{ id: string; voterId: string; contestantId: string; createdAt: string }>;
  votingStatus: VotingStatus;
  durations: Record<string, DurationEntry>;
  activity: ActivityEvent[];
  /** Score-desk confirmation gate for locking results. */
  scoreDeskConfirmed: boolean;
  results: ResultsSnapshot | null;
  /** Which sample judge the judge workspace is signed in as. */
  activeJudge: JudgeId | null;
  tieResolutions: TieResolution[];
  /** Flag indicating that this state contains local simulated demo data and must not overwrite production. */
  isSimulatedDemo?: boolean | undefined;
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
