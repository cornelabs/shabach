import {
  AUDIENCE_POINTS_MAX,
  MAX_JUDGE_SUBTOTAL,
  rubricFor,
  type Rubric,
} from "./rubrics";
import type {
  Contestant,
  DurationEntry,
  JudgeId,
  ResultRow,
  Scorecard,
  VotingStatus,
} from "./types";
import { JUDGES } from "./types";

/**
 * Pure scoring engine. No browser, storage or random APIs — fully testable.
 *
 * Scoring model (demo revision):
 *  - Four main criteria x 20 = 80
 *  - Audience engagement/impact, judge-assessed = 15
 *  - Judge raw subtotal = /95
 *  - Public voting contribution = up to +5
 *  - Combined maximum = 100, before time deductions.
 */

/** Sum of a scorecard's entered values. Missing entries contribute 0 here; use validateScores to gate completeness. */
export function judgeSubtotal(scores: (number | null)[]): number {
  return scores.reduce<number>((sum, s) => sum + (typeof s === "number" ? s : 0), 0);
}

export interface ScoreValidation {
  ok: boolean;
  /** Machine-readable problems for inline display. */
  errors: string[];
}

/** Whole numbers 0..max on every criterion; blanks are incomplete, not zero. */
export function validateScores(scores: (number | null)[], rubric: Rubric): ScoreValidation {
  const errors: string[] = [];
  rubric.criteria.forEach((c, i) => {
    const raw = scores[i];
    if (raw === null || raw === undefined || Number.isNaN(raw)) {
      errors.push(`${c.name} is unscored.`);
      return;
    }
    if (!Number.isInteger(raw)) {
      errors.push(`${c.name} must be a whole number.`);
      return;
    }
    if (raw < 0) errors.push(`${c.name} cannot be below zero.`);
    if (raw > c.max) errors.push(`${c.name} cannot exceed ${c.max}.`);
  });
  return { ok: errors.length === 0, errors };
}

/** audiencePoints = 5 x validVotes / highestEligibleVoteCount (0 when no votes at all). */
export function audiencePoints(validVotes: number, highestVoteCount: number): number {
  if (highestVoteCount <= 0 || validVotes <= 0) return 0;
  return (AUDIENCE_POINTS_MAX * validVotes) / highestVoteCount;
}

/** timePenalty = 2 x floor(max(0, actual - allowed) / interval). Partial intervals earn nothing. */
export function timePenalty(
  actualSeconds: number | null,
  allowedSeconds: number,
  intervalSeconds: number,
): number {
  if (actualSeconds === null || actualSeconds <= allowedSeconds) return 0;
  const periods = Math.floor((actualSeconds - allowedSeconds) / intervalSeconds);
  return 2 * periods;
}

export function allowedSecondsFor(type: Contestant["type"]): number {
  return rubricFor(type).timeLimitSec;
}

export function penaltyIntervalFor(type: Contestant["type"]): number {
  return rubricFor(type).penaltyIntervalSec;
}

/** A submitted scorecard counts as valid only when the conflict is resolved or was never declared. */
export function isValidSubmitted(card: Scorecard): boolean {
  return card.status === "submitted" && !(card.conflictDeclared && !card.conflictResolved);
}

export interface VotesLike {
  demoVotes: Record<string, number>;
  browserVote: { contestantId: string } | null;
}

/** Valid vote count per contestant: simulated votes plus this browser's single vote. */
export function voteCounts(state: VotesLike, contestants: Contestant[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of contestants) counts[c.id] = state.demoVotes[c.id] ?? 0;
  if (state.browserVote) {
    counts[state.browserVote.contestantId] =
      (counts[state.browserVote.contestantId] ?? 0) + 1;
  }
  return counts;
}

export interface MasterInput {
  contestants: Contestant[];
  scorecards: Scorecard[];
  voteCounts: Record<string, number>;
  durations: Record<string, DurationEntry>;
}

/** Collate the master results table. Missing scorecards stay incomplete — never zeros. */
export function computeMasterRows(input: MasterInput): ResultRow[] {
  const { contestants, scorecards, voteCounts: votes, durations } = input;
  const highest = Math.max(0, ...Object.values(votes));
  const rows: ResultRow[] = contestants.map((contestant) => {
    const rubric = rubricFor(contestant.type);
    const mine = scorecards.filter(
      (s) => s.contestantId === contestant.id && isValidSubmitted(s),
    );
    const judgeSubtotals: Partial<Record<JudgeId, number>> = {};
    for (const card of mine) {
      judgeSubtotals[card.judgeId] = judgeSubtotal(card.scores);
    }
    const judgeCount = mine.length;
    const validVotes = votes[contestant.id] ?? 0;
    const entry = durations[contestant.id];
    const penalty =
      entry && entry.seconds !== null
        ? timePenalty(entry.seconds, rubric.timeLimitSec, rubric.penaltyIntervalSec)
        : 0;
    const audience = audiencePoints(validVotes, highest);
    const complete = judgeCount === JUDGES.length;
    const judgeAverage = complete
      ? mine.reduce((sum, c) => sum + judgeSubtotal(c.scores), 0) / JUDGES.length
      : null;
    const finalScore =
      complete && judgeAverage !== null
        ? Math.max(0, judgeAverage + audience - penalty)
        : null;
    return {
      contestant,
      judgeSubtotals,
      judgeCount,
      judgeAverage,
      validVotes,
      audiencePoints: audience,
      timePenalty: penalty,
      finalScore,
      complete,
      tieFlags: [],
      rank: null,
    };
  });
  return rows;
}

/** Tie-break averaged criterion scores: mean of each valid submitted scorecard's value for an index. */
function averagedCriterion(cards: Scorecard[], index: number): number | null {
  if (cards.length === 0) return null;
  const total = cards.reduce((sum, c) => sum + (c.scores[index] ?? 0), 0);
  return total / cards.length;
}

/**
 * Rank and assign tie-break flags in place, then return the rows sorted.
 * Ladder: spiritual, technical/performance, creativity, then "Judges' review required".
 * Never resolves remaining ties randomly, alphabetically or by audience votes.
 */
export function rankAndAssign(
  rows: ResultRow[],
  scorecards: Scorecard[],
): ResultRow[] {
  const byContestant = new Map<string, Scorecard[]>();
  for (const card of scorecards) {
    if (!isValidSubmitted(card)) continue;
    const list = byContestant.get(card.contestantId) ?? [];
    list.push(card);
    byContestant.set(card.contestantId, list);
  }

  const comparable = rows.filter((r) => r.finalScore !== null);
  const others = rows.filter((r) => r.finalScore === null);

  comparable.sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore! - a.finalScore!;
    const aType = a.contestant.type;
    const bType = b.contestant.type;
    if (aType === bType) {
      const cardsA = byContestant.get(a.contestant.id) ?? [];
      const cardsB = byContestant.get(b.contestant.id) ?? [];
      for (const key of ["spiritual", "technical", "creativity"] as const) {
        const idx = rubricFor(aType).tiebreak[key];
        const av = averagedCriterion(cardsA, idx);
        const bv = averagedCriterion(cardsB, idx);
        if (av !== null && bv !== null && bv !== av) return bv - av;
      }
    }
    // Still tied after the ladder — flag for judges' review, keep original order.
    const flag = "Judges' review required";
    if (!a.tieFlags.includes(flag)) a.tieFlags.push(flag);
    if (!b.tieFlags.includes(flag)) b.tieFlags.push(flag);
    return 0;
  });

  let rank = 0;
  let prevScore: number | null = null;
  comparable.forEach((row, i) => {
    if (prevScore === null || row.finalScore !== prevScore) {
      rank = i + 1;
      prevScore = row.finalScore;
    }
    row.rank = rank;
  });
  others.forEach((row) => {
    row.rank = null;
  });
  return [...comparable, ...others];
}

/** Full collation: master rows ranked with the tie-break ladder applied. */
export function computeResults(input: MasterInput): ResultRow[] {
  return rankAndAssign(computeMasterRows(input), input.scorecards);
}

/** Format a score for display at two decimals. */
export function fmt2(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface VerificationGate {
  votingClosed: boolean;
  allComplete: boolean;
  allDurationsVerified: boolean;
  noUnresolvedConflicts: boolean;
  scoreDeskConfirmed: boolean;
}

export function verificationGates(
  rows: ResultRow[],
  scorecards: Scorecard[],
  durations: Record<string, DurationEntry>,
  votingStatus: VotingStatus,
  scoreDeskConfirmed: boolean,
): VerificationGate {
  const unresolved = scorecards.some((s) => s.conflictDeclared && !s.conflictResolved);
  return {
    votingClosed: votingStatus === "closed",
    allComplete: rows.length > 0 && rows.every((r) => r.complete),
    allDurationsVerified:
      rows.length > 0 &&
      rows.every(
        (r) => durations[r.contestant.id]?.seconds !== null && durations[r.contestant.id]?.verified,
      ),
    noUnresolvedConflicts: !unresolved,
    scoreDeskConfirmed,
  };
}

export function canLock(gates: VerificationGate): boolean {
  return Object.values(gates).every(Boolean);
}

export const SUBTOTAL_MAX = MAX_JUDGE_SUBTOTAL;
