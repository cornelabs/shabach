import type {
  Contestant,
  DemoState,
  DurationEntry,
  JudgeId,
  Scorecard,
} from "./types";

/**
 * Demo seed data — 16 fictional contestants, two per district, mixed
 * performance types, simulated votes and a mixture of draft, submitted and
 * incomplete judge scorecards. All content is demo material.
 */

export const CONTESTANT_SEED: Omit<Contestant, "order" | "hue">[] = [
  {
    id: "c01",
    code: "SB7K2M",
    name: "Grace Adeyemi",
    district: "Epe District",
    type: "music",
    title: "Great Are You Lord — Acoustic Rendition",
    bio: "A 200-level student who leads worship at her campus fellowship and has been singing since age nine.",
  },
  {
    id: "c02",
    code: "V4Q9TP",
    name: "Epe Praise Crew",
    district: "Epe District",
    type: "dance",
    title: "Hallelujah Challenge — Choreographed Piece",
    bio: "A five-member dance family from Epe who rehearse on the beach every Saturday morning.",
  },
  {
    id: "c03",
    code: "NH6R8W",
    name: "Tobi Odukoya",
    district: "Ijede District",
    type: "spoken_word",
    title: "The Potter's Wheel",
    bio: "Spoken-word artist and final-year law student who writes poems about grace and second chances.",
  },
  {
    id: "c04",
    code: "K2M5C7",
    name: "Ijede Acts Troupe",
    district: "Ijede District",
    type: "mono_drama",
    title: "The Return of the Son",
    bio: "A drama team of four that stages street sketches in Ijede every market day.",
  },
  {
    id: "c05",
    code: "P9X3JA",
    name: "David Balogun",
    district: "Iranwo District",
    type: "music",
    title: "Nara Kele — Medley of Thanks",
    bio: "Self-taught guitarist and tenor who composes in Yoruba, English and Pidgin.",
  },
  {
    id: "c06",
    code: "T8B4ND",
    name: "Seun Amolegbe",
    district: "Iranwo District",
    type: "visual_arts",
    title: "Light in the Tenement",
    bio: "Painter and printer who works with discarded wood and found pigments.",
  },
  {
    id: "c07",
    code: "W5H7FE",
    name: "Igbogbo Daughters",
    district: "Igbogbo District",
    type: "dance",
    title: "Daughters of Zion — Unity Dance",
    bio: "Three sisters who grew up dancing in their father's living room in Igbogbo.",
  },
  {
    id: "c08",
    code: "Y3K9RU",
    name: "Nkechi Obi",
    district: "Igbogbo District",
    type: "spoken_word",
    title: "Salt & Lamp",
    bio: "Campus poet whose verses call young believers to visible, everyday faith.",
  },
  {
    id: "c09",
    code: "A7W2SM",
    name: "Badagry Young Voices",
    district: "Badagry District",
    type: "music",
    title: "Voice of the Lagoon — Choral Set",
    bio: "A six-voice choir of teenagers from coastal Badagry, directed by a volunteer music teacher.",
  },
  {
    id: "c10",
    code: "D4PN6T",
    name: "Femi Towolawi",
    district: "Badagry District",
    type: "mono_drama",
    title: "One Bread, One Body",
    bio: "Solo performer and Sunday-school teacher famous for playing every character himself.",
  },
  {
    id: "c11",
    code: "G6TM3X",
    name: "Kemi Sanusi",
    district: "Magbon District",
    type: "dance",
    title: "Whirlwind of Praise",
    bio: "Contemporary dancer who blends Hausa folk movement with modern praise choreography.",
  },
  {
    id: "c12",
    code: "J8CV5B",
    name: "Magbon Potters",
    district: "Magbon District",
    type: "visual_arts",
    title: "Vessels of Honour — Live Pottery",
    bio: "A duo of young potters who throw clay on stage while narrating Jeremiah 18.",
  },
  {
    id: "c13",
    code: "Z2FS8K",
    name: "Emeka Nwosu",
    district: "Morogbo District",
    type: "music",
    title: "Oceans — Solo Piano Worship",
    bio: "Piano prodigy who learned on the church keyboard after midweek services.",
  },
  {
    id: "c14",
    code: "M5YR7H",
    name: "Ayoola Kadiri",
    district: "Morogbo District",
    type: "spoken_word",
    title: "Fisherman's Faith",
    bio: "Poet-performer from a fishing family whose verses smell of salt and sunrise.",
  },
  {
    id: "c15",
    code: "R9J3PW",
    name: "State Church Youth Ensemble",
    district: "State Church",
    type: "dance",
    title: "Chosen Generation — Mass Piece",
    bio: "An eight-member ensemble drawn from teens who serve across the state church departments.",
  },
  {
    id: "c16",
    code: "E3QK4V",
    name: "Bisi Ogundipe",
    district: "State Church",
    type: "visual_arts",
    title: "The Vine — Mixed Media",
    bio: "Textile artist who embroiders scripture into fabric collages from remnant cloth.",
  },
];

// Interleave performance types across a 1..16 running order.
const ORDER_SEED = ["c01", "c07", "c13", "c03", "c09", "c11", "c15", "c05", "c02", "c14", "c10", "c08", "c12", "c06", "c16", "c04"];

const HUES: Record<string, number> = {
  c01: 168, c02: 150, c03: 202, c04: 20, c05: 130, c06: 88, c07: 320,
  c08: 246, c09: 190, c10: 40, c11: 300, c12: 70, c13: 210, c14: 175,
  c15: 95, c16: 15,
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
  c01: 412, c02: 338, c03: 287, c04: 121, c05: 356, c06: 88, c07: 301,
  c08: 245, c09: 198, c10: 154, c11: 266, c12: 73, c13: 349, c14: 132,
  c15: 224, c16: 96,
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
    ["c01", "judge3", [17, null, 16, 15, 11], "Come back to creativity after the finale run-through."],
    ["c03", "judge3", [null, 15, null, 14, null], ""],
    ["c10", "judge1", [16, 15, 17, 14, null], "Strong acting; props use still developing."],
    ["c08", "judge2", [17, null, 16, null, 12], ""],
  ];
  for (const [id, judge, scores, notes] of drafts) cards.push(card(id, judge, scores, "draft", notes));

  // One declared, unresolved conflict of interest — blocks finalisation until resolved.
  cards.push(
    card("c11", "judge3", ALL_NULL, "draft", "", {
      conflictDeclared: true,
    }),
  );

  void idx;
  return cards;
}

export function buildDurations(contestants: Contestant[]): Record<string, DurationEntry> {
  const durations: Record<string, DurationEntry> = {};
  // A few demo durations already entered (some over time), most unverified.
  const entered: Record<string, number> = {
    c01: 238, c02: 252, c03: 226, c05: 244, c13: 239, c12: 571, c16: 605,
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
  };
}
