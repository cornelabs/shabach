import { AUDIENCE_POINTS_MAX, MAX_JUDGE_SUBTOTAL, rubricFor, type Rubric } from "./rubrics";
import type {
  Contestant,
  DurationEntry,
  JudgeId,
  ResultRow,
  Scorecard,
  TieResolution,
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
  if (!Array.isArray(scores) || scores.length !== rubric.criteria.length) {
    return {
      ok: false,
      errors: [`Scorecard must contain exactly ${rubric.criteria.length} criterion scores.`],
    };
  }
  rubric.criteria.forEach((c, i) => {
    const raw = scores[i];
    if (raw === null || raw === undefined || Number.isNaN(raw)) {
      errors.push(`${c.name} is unscored.`);
      return;
    }
    if (typeof raw !== "number" || !Number.isFinite(raw) || !Number.isInteger(raw)) {
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
  if (
    !Number.isFinite(validVotes) ||
    !Number.isFinite(highestVoteCount) ||
    highestVoteCount <= 0 ||
    validVotes <= 0
  ) {
    return 0;
  }
  return (AUDIENCE_POINTS_MAX * validVotes) / highestVoteCount;
}

/** timePenalty = 2 x floor(max(0, actual - allowed) / interval). Partial intervals earn nothing. */
export function timePenalty(
  actualSeconds: number | null,
  allowedSeconds: number,
  intervalSeconds: number,
): number {
  if (
    actualSeconds === null ||
    !Number.isFinite(actualSeconds) ||
    actualSeconds <= allowedSeconds ||
    intervalSeconds <= 0
  ) {
    return 0;
  }
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
export function isValidSubmitted(card: Scorecard, rubric?: Rubric): boolean {
  if (card.status !== "submitted") return false;
  if (card.conflictDeclared && !card.conflictResolved) return false;
  if (rubric && !validateScores(card.scores, rubric).ok) return false;
  return true;
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
    counts[state.browserVote.contestantId] = (counts[state.browserVote.contestantId] ?? 0) + 1;
  }
  return counts;
}

export interface MasterInput {
  contestants: Contestant[];
  scorecards: Scorecard[];
  voteCounts: Record<string, number>;
  durations: Record<string, DurationEntry>;
  tieResolutions?: TieResolution[];
}

/** Collate the master results table. Missing scorecards stay incomplete — never zeros. */
export function computeMasterRows(input: MasterInput): ResultRow[] {
  const { contestants, scorecards, voteCounts: votes, durations } = input;
  const highest = Math.max(0, ...Object.values(votes).filter((v) => Number.isFinite(v) && v > 0));
  const assignedJudgeIds = new Set(JUDGES.map((j) => j.id));

  const rows: ResultRow[] = contestants.map((contestant) => {
    const rubric = rubricFor(contestant.type);
    // Find all valid submitted cards for this contestant from assigned judges
    const validCards = scorecards.filter(
      (s) =>
        s.contestantId === contestant.id &&
        assignedJudgeIds.has(s.judgeId) &&
        isValidSubmitted(s, rubric),
    );

    // Group by judgeId to detect duplicates
    const cardsByJudge = new Map<JudgeId, Scorecard[]>();
    for (const card of validCards) {
      const list = cardsByJudge.get(card.judgeId) ?? [];
      list.push(card);
      cardsByJudge.set(card.judgeId, list);
    }

    const judgeSubtotals: Partial<Record<JudgeId, number>> = {};
    let hasDuplicateJudges = false;

    for (const judge of JUDGES) {
      const judgeCards = cardsByJudge.get(judge.id) ?? [];
      if (judgeCards.length === 1 && judgeCards[0]) {
        judgeSubtotals[judge.id] = judgeSubtotal(judgeCards[0].scores);
      } else if (judgeCards.length > 1) {
        hasDuplicateJudges = true;
      }
    }

    // A contestant is complete ONLY IF every assigned judge has exactly one valid submitted scorecard
    // and there are no duplicate judges.
    const complete =
      !hasDuplicateJudges &&
      JUDGES.every((judge) => (cardsByJudge.get(judge.id)?.length ?? 0) === 1);

    const judgeCount = Object.keys(judgeSubtotals).length;
    const validVotes = Math.max(0, votes[contestant.id] ?? 0);
    const entry = durations[contestant.id];
    const penalty =
      entry && entry.seconds !== null && Number.isFinite(entry.seconds)
        ? timePenalty(entry.seconds, rubric.timeLimitSec, rubric.penaltyIntervalSec)
        : 0;
    const audience = audiencePoints(validVotes, highest);

    const judgeAverage = complete
      ? JUDGES.reduce((sum, j) => sum + (judgeSubtotals[j.id] ?? 0), 0) / JUDGES.length
      : null;

    const finalScore =
      complete && judgeAverage !== null ? Math.max(0, judgeAverage + audience - penalty) : null;

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
 * Compare two contestants deterministically using:
 * 1. Final score
 * 2. Averaged spiritual criterion score (across discipline-specific rubrics)
 * 3. Averaged technical criterion score (across discipline-specific rubrics)
 * 4. Averaged creativity criterion score (across discipline-specific rubrics)
 * 5. Collective judges' tie resolution recorded by the organiser
 */
function compareContestants(
  a: ResultRow,
  b: ResultRow,
  byContestant: Map<string, Scorecard[]>,
  tieResolutions?: TieResolution[],
): number {
  if (b.finalScore !== a.finalScore) {
    return (b.finalScore ?? -Infinity) - (a.finalScore ?? -Infinity);
  }

  // Same final score — apply cross-type tie-break ladder
  const cardsA = byContestant.get(a.contestant.id) ?? [];
  const cardsB = byContestant.get(b.contestant.id) ?? [];
  const rubricA = rubricFor(a.contestant.type);
  const rubricB = rubricFor(b.contestant.type);

  for (const key of ["spiritual", "technical", "creativity"] as const) {
    const idxA = rubricA.tiebreak[key];
    const idxB = rubricB.tiebreak[key];
    const av = averagedCriterion(cardsA, idxA);
    const bv = averagedCriterion(cardsB, idxB);
    if (av !== null && bv !== null) {
      const diff = bv - av;
      if (Math.abs(diff) > 1e-9) {
        return diff;
      }
    }
  }

  // Check organiser recorded collective judges' decision
  if (tieResolutions && tieResolutions.length > 0) {
    const resolution = tieResolutions.find(
      (tr) =>
        (tr.contestantIds[0] === a.contestant.id && tr.contestantIds[1] === b.contestant.id) ||
        (tr.contestantIds[0] === b.contestant.id && tr.contestantIds[1] === a.contestant.id),
    );
    if (resolution) {
      if (resolution.winnerId === a.contestant.id) return -1;
      if (resolution.winnerId === b.contestant.id) return 1;
    }
  }

  return 0;
}

/**
 * Rank and assign tie-break flags deterministically without comparison sort side-effects.
 * Ladder: spiritual, technical/performance, creativity, then "Judges' review required".
 * Never resolves remaining ties randomly, alphabetically or by audience votes.
 */
export function rankAndAssign(
  rows: ResultRow[],
  scorecards: Scorecard[],
  tieResolutions?: TieResolution[],
): ResultRow[] {
  const byContestant = new Map<string, Scorecard[]>();
  for (const card of scorecards) {
    const contestant = rows.find((r) => r.contestant.id === card.contestantId)?.contestant;
    if (!contestant) continue;
    const rubric = rubricFor(contestant.type);
    if (!isValidSubmitted(card, rubric)) continue;
    const list = byContestant.get(card.contestantId) ?? [];
    list.push(card);
    byContestant.set(card.contestantId, list);
  }

  const comparable = rows.filter((r) => r.finalScore !== null);
  const others = rows.filter((r) => r.finalScore === null);

  // Pure sort without mutation side-effects
  comparable.sort((a, b) => compareContestants(a, b, byContestant, tieResolutions));

  // Clear tie flags
  for (const r of comparable) {
    r.tieFlags = [];
  }

  // Identify unresolved ties: any adjacent pair where comparator returns 0
  const reviewFlag = "Judges' review required";
  for (let i = 0; i < comparable.length; i++) {
    const current = comparable[i];
    if (!current) continue;
    const prev = i > 0 ? comparable[i - 1] : undefined;
    const next = i < comparable.length - 1 ? comparable[i + 1] : undefined;

    const tiedWithPrev =
      prev !== undefined && compareContestants(prev, current, byContestant, tieResolutions) === 0;
    const tiedWithNext =
      next !== undefined && compareContestants(current, next, byContestant, tieResolutions) === 0;

    if (tiedWithPrev || tiedWithNext) {
      if (!current.tieFlags.includes(reviewFlag)) {
        current.tieFlags.push(reviewFlag);
      }
    }
  }

  // Assign ranks: resolved ties receive distinct sequential ranks; only true unresolved ties share ranks
  for (let i = 0; i < comparable.length; i++) {
    const current = comparable[i];
    if (!current) continue;
    if (i === 0) {
      current.rank = 1;
    } else {
      const prev = comparable[i - 1];
      if (prev && compareContestants(prev, current, byContestant, tieResolutions) === 0) {
        // Shared rank for unresolved tie
        current.rank = prev.rank;
      } else {
        // Distinct sequential rank
        current.rank = i + 1;
      }
    }
  }

  for (const row of others) {
    row.rank = null;
    row.tieFlags = [];
  }

  return [...comparable, ...others];
}

/** Full collation: master rows ranked with the tie-break ladder applied. */
export function computeResults(input: MasterInput): ResultRow[] {
  return rankAndAssign(computeMasterRows(input), input.scorecards, input.tieResolutions);
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
  noUnresolvedTies: boolean;
  scoreDeskConfirmed: boolean;
}

export function verificationGates(
  rows: ResultRow[],
  scorecards: Scorecard[],
  durations: Record<string, DurationEntry>,
  votingStatus: VotingStatus,
  scoreDeskConfirmed: boolean,
): VerificationGate {
  const unresolvedConflicts = scorecards.some((s) => s.conflictDeclared && !s.conflictResolved);
  const unresolvedTies = rows.some((r) => r.tieFlags.includes("Judges' review required"));

  return {
    votingClosed: votingStatus === "closed",
    allComplete: rows.length > 0 && rows.every((r) => r.complete),
    allDurationsVerified:
      rows.length > 0 &&
      rows.every(
        (r) =>
          durations[r.contestant.id]?.seconds !== null &&
          Number.isFinite(durations[r.contestant.id]?.seconds) &&
          durations[r.contestant.id]?.verified,
      ),
    noUnresolvedConflicts: !unresolvedConflicts,
    noUnresolvedTies: !unresolvedTies,
    scoreDeskConfirmed,
  };
}

export function canLock(gates: VerificationGate): boolean {
  return Object.values(gates).every(Boolean);
}

export const SUBTOTAL_MAX = MAX_JUDGE_SUBTOTAL;
