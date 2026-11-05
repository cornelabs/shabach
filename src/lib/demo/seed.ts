import type { Contestant, DemoState, DurationEntry, JudgeId, Scorecard } from "./types";

/**
 * Demo seed data — 16 fictional contestants, two per district, mixed
 * performance types, simulated votes and a mixture of draft, submitted and
 * incomplete judge scorecards. All content is demo material.
 */

export const CONTESTANT_SEED: Omit<Contestant, "order" | "hue">[] = [
  {
    id: "c01",
    code: "SB7K2M",
    name: "Min. Lizzy",
    district: "Epe District",
    type: "music",
    title: "Vocal & Worship Ministry",
    bio: "Ministering from Epe District in the Music category.",
    avatarUrl: "/contestants/min-lizzy.jpeg",
  },
  {
    id: "c02",
    code: "V4Q9TP",
    name: "The Painters",
    district: "Epe District",
    type: "mono_drama",
    title: "Dramatic Presentation",
    bio: "Ministering from Epe District in the Drama category.",
    avatarUrl: "/contestants/the-painters.png",
  },
  {
    id: "c03",
    code: "NH6R8W",
    name: "Min. Kehinde Akintola",
    district: "Ijede District",
    type: "music",
    title: "Worship Rendition",
    bio: "Ministering from Ijede District in the Music category.",
    avatarUrl: "/contestants/min-kehinde-akintola.jpeg",
  },
  {
    id: "c04",
    code: "K2M5C7",
    name: "Min. TaegarGee",
    district: "Ijede District",
    type: "music",
    title: "Praise Rendition",
    bio: "Ministering from Ijede District in the Music category.",
    avatarUrl: "/contestants/min-taegargee.png",
  },
  {
    id: "c05",
    code: "P9X3JA",
    name: "SUCCESS",
    district: "Iranwo District",
    type: "music",
    title: "Gospel Rendition",
    bio: "Ministering from Iranwo District in the Music category.",
    avatarUrl: "/contestants/success.png",
  },
  {
    id: "c06",
    code: "T8B4ND",
    name: "Victoria",
    district: "Iranwo District",
    type: "spoken_word",
    title: "Spoken Word Ministry",
    bio: "Ministering from Iranwo District in the Spoken Word category.",
    avatarUrl: "/contestants/victoria.jpeg",
  },
  {
    id: "c07",
    code: "W5H7FE",
    name: "The Preacher",
    district: "Igbogbo District",
    type: "music",
    title: "Choral & Vocal Ministry",
    bio: "Ministering from Igbogbo District in the Music category.",
    avatarUrl: "/contestants/the-preacher.png",
  },
  {
    id: "c08",
    code: "Y3K9RU",
    name: "The Wise Ones",
    district: "Igbogbo District",
    type: "spoken_word",
    title: "Poetic & Spoken Word Presentation",
    bio: "Ministering from Igbogbo District in the Spoken Word category.",
    avatarUrl: "/contestants/the-wise-ones.png",
  },
  {
    id: "c09",
    code: "A7W2SM",
    name: "Elijah Victor",
    district: "Badagry District",
    type: "music",
    title: "Music Ministry",
    bio: "Ministering from Badagry District in the Music category.",
    avatarUrl: "/contestants/elijah-victor.jpeg",
  },
  {
    id: "c10",
    code: "D4PN6T",
    name: "LFC Dynasty",
    district: "Badagry District",
    type: "dance",
    title: "Choreographed Dance Ministry",
    bio: "Ministering from Badagry District in the Dance category.",
    avatarUrl: "/contestants/lfc-dynasty.png",
  },
  {
    id: "c11",
    code: "M8C3XE",
    name: "Magbon Finalist 1",
    district: "Magbon District",
    type: "dance",
    title: "Auditions Saturday",
    bio: "Magbon District Auditions taking place Saturday.",
    avatarUrl: null,
  },
  {
    id: "c12",
    code: "L1Z8RQ",
    name: "Magbon Finalist 2",
    district: "Magbon District",
    type: "visual_arts",
    title: "Auditions Saturday",
    bio: "Magbon District Auditions taking place Saturday.",
    avatarUrl: null,
  },
  {
    id: "c13",
    code: "B6F4PT",
    name: "HOPENDHOUSE DANCE",
    district: "Morogbo District",
    type: "dance",
    title: "Dance Ministry",
    bio: "Ministering from Morogbo District in the Dance category.",
    avatarUrl: "/contestants/hopendhouse-dance.jpeg",
  },
  {
    id: "c14",
    code: "G9D2KY",
    name: "The Gideonite Speaks",
    district: "Morogbo District",
    type: "spoken_word",
    title: "Spoken Word Ministry",
    bio: "Ministering from Morogbo District in the Spoken Word category.",
    avatarUrl: "/contestants/the-gideonite-speaks.png",
  },
  {
    id: "c15",
    code: "H5N8TC",
    name: "Favour Chukwudi",
    district: "State Church",
    type: "spoken_word",
    title: "Spoken Word Ministry",
    bio: "Ministering from State Church in the Spoken Word category.",
    avatarUrl: "/contestants/favour-chukwudi.png",
  },
  {
    id: "c16",
    code: "E3QK4V",
    name: "Min. Blessing",
    district: "State Church",
    type: "music",
    title: "Music Ministry",
    bio: "Ministering from State Church in the Music category.",
    avatarUrl: "/contestants/min-blessing.png",
  },
];

// Interleave performance types across a 1..16 running order.
const ORDER_SEED = [
  "c01",
  "c07",
  "c13",
  "c03",
  "c09",
  "c11",
  "c15",
  "c05",
  "c02",
  "c14",
  "c10",
  "c08",
  "c12",
  "c06",
  "c16",
  "c04",
];

const HUES: Record<string, number> = {
  c01: 168,
  c02: 150,
  c03: 202,
  c04: 20,
  c05: 130,
  c06: 88,
  c07: 320,
  c08: 246,
  c09: 190,
  c10: 40,
  c11: 300,
  c12: 70,
  c13: 210,
  c14: 175,
  c15: 95,
  c16: 15,
};

export function buildContestants(): Contestant[] {
  return CONTESTANT_SEED.map((c) => ({
    ...c,
    order: ORDER_SEED.indexOf(c.id) + 1,
    hue: HUES[c.id] ?? 160,
  }));
}

/** Simulated audience vote counts (demo data, labelled as such everywhere they appear). */
export const DEMO_VOTES_SEED: Record<string, number> = {
  c01: 412,
  c02: 338,
  c03: 287,
  c04: 121,
  c05: 356,
  c06: 88,
  c07: 301,
  c08: 245,
  c09: 198,
  c10: 154,
  c11: 266,
  c12: 73,
  c13: 349,
  c14: 132,
  c15: 224,
  c16: 96,
};

function card(
  contestantId: string,
  judgeId: JudgeId,
  scores: (number | null)[],
  status: Scorecard["status"],
  notes = "",
  extra: Partial<Scorecard> = {},
): Scorecard {
  return {
    contestantId,
    judgeId,
    scores,
    notes,
    status,
    conflictDeclared: false,
    conflictResolved: false,
    reopened: false,
    ...extra,
  };
}

const ALL_NULL = [null, null, null, null, null];

/** A mixture of draft, submitted and incomplete scorecards across the three judges. */
export function buildScorecards(contestants: Contestant[]): Scorecard[] {
  const cards: Scorecard[] = [];

  const submitted: Array<[string, JudgeId, (number | null)[]]> = [
    ["c01", "judge1", [17, 15, 18, 16, 12]],
    ["c01", "judge2", [16, 14, 17, 17, 11]],
    ["c03", "judge1", [18, 17, 16, 14, 13]],
    ["c03", "judge2", [17, 16, 15, 15, 12]],
    ["c05", "judge1", [15, 17, 16, 15, 11]],
    ["c05", "judge3", [14, 16, 15, 14, 10]],
    ["c07", "judge2", [18, 17, 17, 16, 12]],
    ["c07", "judge3", [17, 16, 16, 17, 11]],
    ["c09", "judge1", [16, 15, 14, 15, 10]],
    ["c09", "judge2", [15, 14, 15, 16, 11]],
    ["c13", "judge1", [19, 16, 17, 18, 13]],
    ["c13", "judge2", [18, 15, 16, 18, 12]],
    ["c02", "judge3", [16, 17, 15, 14, 11]],
    ["c11", "judge2", [17, 18, 16, 15, 12]],
    ["c14", "judge3", [16, 15, 17, 13, 11]],
    ["c15", "judge1", [15, 14, 16, 15, 10]],
    ["c06", "judge2", [14, 13, 15, 12, 9]],
    ["c12", "judge3", [15, 12, 14, 13, 9]],
  ];
  for (const [id, judge, scores] of submitted) cards.push(card(id, judge, scores, "submitted"));

  const drafts: Array<[string, JudgeId, (number | null)[], string]> = [
    [
      "c01",
      "judge3",
      [17, null, 16, 15, 11],
      "Come back to creativity after the finale run-through.",
    ],
    ["c03", "judge3", [null, 15, null, 14, null], ""],
    ["c10", "judge1", [16, 15, 17, 14, null], "Strong acting; props use still developing."],
    ["c08", "judge2", [17, null, 16, null, 12], ""],
  ];
  for (const [id, judge, scores, notes] of drafts)
    cards.push(card(id, judge, scores, "draft", notes));

  // One declared, unresolved conflict of interest — blocks finalisation until resolved.
  cards.push(
    card("c11", "judge3", ALL_NULL, "draft", "", {
      conflictDeclared: true,
    }),
  );

  return cards;
}

export function buildDurations(contestants: Contestant[]): Record<string, DurationEntry> {
  const durations: Record<string, DurationEntry> = {};
  // A few demo durations already entered (some over time), most unverified.
  const entered: Record<string, number> = {
    c01: 238,
    c02: 252,
    c03: 226,
    c05: 244,
    c13: 239,
    c12: 571,
    c16: 605,
  };
  for (const c of contestants) {
    const seconds = entered[c.id] ?? null;
    durations[c.id] = { contestantId: c.id, seconds, verified: false };
  }
  return durations;
}

export function createSeedState(): DemoState {
  const contestants = buildContestants();
  return {
    version: 1,
    contestants,
    scorecards: buildScorecards(contestants),
    demoVotes: { ...DEMO_VOTES_SEED },
    browserVote: null,
    votes: [],
    votingStatus: "open",
    durations: buildDurations(contestants),
    activity: [
      {
        id: "seed-1",
        at: "2026-10-24T09:00:00Z",
        kind: "voting_opened",
        detail: "Demo voting window opened (simulated).",
      },
    ],
    scoreDeskConfirmed: false,
    results: null,
    activeJudge: null,
    tieResolutions: [],
  };
}
