import type { PerformanceType } from "./types";

/**
 * Rubric templates — one per performance type. Five criteria per scorecard:
 * four at 20 points + audience engagement/impact at 15 points = 95 raw points.
 * The public-voting contribution adds up to 5, for a 100-point maximum.
 */

export interface Criterion {
  key: string;
  name: string;
  max: number;
  /** Short judging guidance shown beside the input. */
  guidance: string;
}

export interface Rubric {
  type: PerformanceType;
  label: string;
  shortLabel: string;
  criteria: Criterion[];
  /** Allowed duration in seconds. */
  timeLimitSec: number;
  /** One penalty unit per completed interval beyond the limit. */
  penaltyIntervalSec: number;
  /** Criterion indices for tie-breaks, in resolution order. */
  tiebreak: { spiritual: number; technical: number; creativity: number };
}

export const RUBRICS: Record<PerformanceType, Rubric> = {
  music: {
    type: "music",
    label: "Music",
    shortLabel: "Music",
    criteria: [
      {
        key: "vocal",
        name: "Vocal Quality & Pitch Control",
        max: 20,
        guidance: "Tone, accuracy, breath control and steadiness across the range.",
      },
      {
        key: "creativity",
        name: "Creativity/Originality in Rendition",
        max: 20,
        guidance: "Fresh arrangement or interpretation while honouring the song.",
      },
      {
        key: "presence",
        name: "Stage Presence & Confidence",
        max: 20,
        guidance: "Command of the stage, composure and connection from the first note.",
      },
      {
        key: "spiritual",
        name: "Spiritual Depth",
        max: 20,
        guidance: "Ministry over performance — conviction, message and worship values.",
      },
      {
        key: "audience",
        name: "Audience Engagement & Impact",
        max: 15,
        guidance:
          "Meaningful communication and connection with listeners — not applause volume alone.",
      },
    ],
    timeLimitSec: 240,
    penaltyIntervalSec: 15,
    tiebreak: { spiritual: 3, technical: 0, creativity: 1 },
  },
  dance: {
    type: "dance",
    label: "Dance",
    shortLabel: "Dance",
    criteria: [
      {
        key: "choreography",
        name: "Choreography & Creativity",
        max: 20,
        guidance: "Originality of movement concepts, formations and transitions.",
      },
      {
        key: "sync",
        name: "Synchronization/Coordination",
        max: 20,
        guidance: "Precision, timing and unity between dancers and with the track.",
      },
      {
        key: "presence",
        name: "Stage Presence & Energy",
        max: 20,
        guidance: "Energy management, spatial use and sustained commitment.",
      },
      {
        key: "spiritual",
        name: "Spiritual Alignment",
        max: 20,
        guidance: "Does the piece edify and carry a redemptive, Christ-honouring message?",
      },
      {
        key: "audience",
        name: "Audience Engagement & Impact",
        max: 15,
        guidance:
          "Meaningful communication and connection with viewers — not applause volume alone.",
      },
    ],
    timeLimitSec: 240,
    penaltyIntervalSec: 15,
    tiebreak: { spiritual: 3, technical: 1, creativity: 0 },
  },
  spoken_word: {
    type: "spoken_word",
    label: "Spoken Word/Poetry",
    shortLabel: "Spoken Word",
    criteria: [
      {
        key: "content",
        name: "Content Depth & Scriptural Relevance",
        max: 20,
        guidance: "Depth of thought and faithful, well-woven use of Scripture.",
      },
      {
        key: "delivery",
        name: "Delivery",
        max: 20,
        guidance: "Clarity, pacing, dynamics and control of pauses and emphasis.",
      },
      {
        key: "creativity",
        name: "Creativity/Originality of Composition",
        max: 20,
        guidance: "Distinctive voice, imagery and structure.",
      },
      {
        key: "presence",
        name: "Stage Presence & Confidence",
        max: 20,
        guidance: "Ownership of the space, poise and audience contact.",
      },
      {
        key: "audience",
        name: "Audience Connection & Impact",
        max: 15,
        guidance: "Meaningful communication and connection — not applause volume alone.",
      },
    ],
    timeLimitSec: 240,
    penaltyIntervalSec: 15,
    tiebreak: { spiritual: 0, technical: 1, creativity: 2 },
  },
  mono_drama: {
    type: "mono_drama",
    label: "Mono-Drama",
    shortLabel: "Mono-Drama",
    criteria: [
      {
        key: "storyline",
        name: "Storyline",
        max: 20,
        guidance: "Coherent arc, stakes and resolution that serves the message.",
      },
      {
        key: "acting",
        name: "Acting Skills",
        max: 20,
        guidance: "Believable characterisation, voice work and emotional truth.",
      },
      {
        key: "spiritual",
        name: "Spiritual Message & Alignment",
        max: 20,
        guidance: "Clarity of the redemptive message and alignment with Scripture.",
      },
      {
        key: "craft",
        name: "Stage Use/Props/Costume",
        max: 20,
        guidance: "Purposeful use of space, props and costume choices.",
      },
      {
        key: "audience",
        name: "Audience Connection & Impact",
        max: 15,
        guidance: "Meaningful communication and connection — not applause volume alone.",
      },
    ],
    timeLimitSec: 300,
    penaltyIntervalSec: 15,
    tiebreak: { spiritual: 2, technical: 1, creativity: 0 },
  },
  visual_arts: {
    type: "visual_arts",
    label: "Visual Arts",
    shortLabel: "Visual Arts",
    criteria: [
      {
        key: "creativity",
        name: "Creativity & Originality of Concept",
        max: 20,
        guidance: "A distinctive idea, not a restatement of familiar motifs.",
      },
      {
        key: "technique",
        name: "Technical Skill & Execution",
        max: 20,
        guidance: "Mastery of medium, craft quality and finish.",
      },
      {
        key: "message",
        name: "Message/Interpretation",
        max: 20,
        guidance: "Legibility of meaning and spiritual interpretation of the theme.",
      },
      {
        key: "presentation",
        name: "Presentation",
        max: 20,
        guidance: "Display, staging and explanation of the work.",
      },
      {
        key: "audience",
        name: "Audience Appeal/Impact",
        max: 15,
        guidance: "Meaningful resonance with viewers — not applause volume alone.",
      },
    ],
    timeLimitSec: 600,
    penaltyIntervalSec: 60,
    tiebreak: { spiritual: 2, technical: 1, creativity: 0 },
  },
};

export const MAX_PER_CRITERION_MAIN = 20;
export const AUDIENCE_CRITERION_MAX = 15;
export const MAX_JUDGE_SUBTOTAL = 95;
export const AUDIENCE_POINTS_MAX = 5;
export const FINAL_MAX = 100;

export function rubricFor(type: PerformanceType): Rubric {
  return RUBRICS[type];
}
