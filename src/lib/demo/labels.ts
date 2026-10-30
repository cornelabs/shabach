import { rubricFor } from "./rubrics";
import type {
  ActivityKind,
  PerformanceType,
  ScorecardStatus,
  VotingStatus,
} from "./types";

export function typeLabel(type: PerformanceType): string {
  return rubricFor(type).label;
}

export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Parse a "mm:ss" or plain-seconds string into seconds; null when invalid. */
export function parseDuration(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) return Number(text);
  const match = text.match(/^(\d+):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export const VOTING_STATUS_LABEL: Record<VotingStatus, string> = {
  not_open: "Voting not open yet",
  open: "Voting is open",
  closed: "Voting is closed",
};

export const SCORECARD_STATUS_LABEL: Record<ScorecardStatus, string> = {
  not_started: "Not started",
  draft: "Draft",
  submitted: "Submitted",
};

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  voting_opened: "Voting opened",
  voting_closed: "Voting closed",
  voting_reopened: "Voting reopened",
  scorecard_reopened: "Scorecard reopened",
  conflict_resolved: "Conflict resolved",
  durations_verified: "Durations verified",
  results_verified: "Results verified",
  results_locked: "Results locked",
  results_published: "Results published",
  sample_scores_loaded: "Sample scores loaded",
  demo_reset: "Demo reset",
};

/** Format an ISO timestamp in the event timezone (Africa/Lagos). */
export function formatLagos(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

export const FINALE_DATE_LABEL = "Saturday, 14 November 2026";
export const TIMEZONE_LABEL = "Africa/Lagos (WAT)";
