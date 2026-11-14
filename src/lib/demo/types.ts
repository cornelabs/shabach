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
  fullBio?: string;
  avatarUrl: string;
}

export const JUDGES: JudgeProfile[] = [
  {
    id: "judge1",
    name: "Mrs. Priscillia Fayomi",
    label: "Global Creativity Director, Youth Alive Ministry · Head Judge",
    seatTitle: "Head Judge (Seat 1)",
    roleTitle: "Head Judge | Global Creativity Director | TV Producer | Lead Vocalist",
    bio: "Head Judge for the SHABACH 2026 Grand Finale. Global Creativity Director for the Youth Alive Ministry of Living Faith Church Worldwide. TV producer, filmmaker, scriptwriter, and celebrated lead vocalist in the Faith Tabernacle Choir, Canaanland.",
    fullBio:
      "Mrs. Priscillia Fayomi is a dynamic leader, creative visionary, and passionate minister with a heart for inspiring young people and empowering lives through faith and purposeful communication. She currently serves as the Global Creativity Director for the Youth Alive Ministry of the Living Faith Church Worldwide, where she leads innovative initiatives designed to engage, equip, and impact the next generation creatives for Christ.\n\nWith a degree in Communication and certifications in Filmmaking, Social Media Management, and Content Creation, Priscillia seamlessly integrates creativity and strategy to tell compelling stories that inspire transformation. Professionally, she is a tv producer, voice-over artist, scriptwriter, filmmaker, and content creator, using her diverse skill set to create uplifting and impactful media that connects with audiences on a global scale.\n\nBeyond her professional responsibilities, Priscillia is deeply committed to worship and service. She serves as one of the lead vocalists in the Faith Tabernacle Choir in Canaanland, where her voice continues to bless, uplift, and stir hearts in worship.\n\nA devoted wife and mother of two, Mrs. Fayomi embodies grace, excellence, and purpose in every sphere of her life. Her journey reflects an unwavering passion for creativity, leadership, and service, a true testament to using one’s gifts to glorify God and transform lives.",
    avatarUrl: "/judges/priscillia-fayomi.jpeg",
  },
  {
    id: "judge2",
    name: "Rex Omoigberale",
    label: "Music Artist, Producer, Music Instructor & Vocal Coach",
    seatTitle: "Judge Seat 2",
    roleTitle: "Music Artist | Music Producer | Music Instructor | Vocal Coach",
    bio: "Passionate and versatile music professional, recording artist, producer, instructor, and vocal coach from Edo State, Nigeria. Holds an HND in Statistics from Federal Polytechnic, Auchi, bringing a unique blend of analytical discipline, creativity, and vocal mentorship to empower musical talents.",
    fullBio:
      "Rex Omoigberale is a passionate and versatile music professional from Edo State, Nigeria, with a deep-rooted love for creativity, musical expression, and artistic excellence. He is a Music Artist, Music Producer, Music Instructor, and Vocal Coach dedicated to using music as a powerful medium for storytelling, emotional expression, and human connection.\n\nWith a Higher National Diploma (HND) in Statistics from the Federal Polytechnic, Auchi, Rex brings a unique blend of analytical thinking, creativity, and discipline to his professional journey.\n\nBeyond his work as a recording artist and producer, Rex has gained professional music teaching experience across various platforms, where he has shared his knowledge, developed musical talents, and helped aspiring musicians discover and refine their abilities. His expertise spans music instruction, vocal development, music production, and artistic performance.\n\nAs an artist, Rex believes that music goes beyond entertainment; it is a universal language capable of inspiring, influencing, and connecting people across cultures and generations. His creative vision is driven by a commitment to producing meaningful sounds, telling compelling stories, and creating music that resonates with listeners.\n\nBuilt on hard work, consistency, continuous learning, and a desire for excellence, Rex Omoigberale remains committed to evolving as an artist and music professional while making a lasting impact in the music industry.\n\nFor Rex, every song tells a story, every melody carries an emotion, and every new chapter is another opportunity to share his gift with the world.",
    avatarUrl: "/judges/rex-omoigberale.jpeg",
  },
  {
    id: "judge3",
    name: "David O. Umoru",
    label: "Digital Media Strategist & State ICT/Media Director",
    seatTitle: "Judge Seat 3",
    roleTitle: "Digital Media Strategist | Entrepreneur | Creative Visionary",
    bio: "Founder of Hebron Media and Convener of Creators Experience. Serves as State ICT/Media Director for Youth Arm of Living Faith Church Worldwide (Winners' Chapel), Ondo State, empowering creatives across Nigeria.",
    fullBio:
      "David O. Umoru is a Nigerian digital media strategist, entrepreneur, public speaker, and creative visionary passionate about using media, technology, and strategic communication to create influence and lasting impact.\n\nHe is the Founder of Hebron Media, a growing digital media and creative enterprise with specialised platforms and subsidiaries, including Hebron Pulse, which promotes events and amplifies impactful experiences. Through these initiatives, David is building a media ecosystem that connects creativity, communication, and digital innovation.\n\nHe currently serves as the State ICT/Media Director for the Youth Arm of Living Faith Church Worldwide (Winners' Chapel), Ondo State, providing leadership in media strategy, digital communications, and technical operations. He is committed to strengthening media structures, expanding digital reach, and equipping young creatives with relevant skills.\n\nOver the years, David has worked with ministries, organisations, leaders, and businesses to strengthen their digital presence, build recognisable brands, and communicate effectively. His expertise spans digital media strategy, social media management, content creation, video production, brand positioning, and audience growth.\n\nHe is also the Convener of Creators Experience, a community of like-minded creatives seeking excellence, growth, and collaboration. The community brings together content creators, digital entrepreneurs, media professionals, and innovators through networking, training, mentorship, and conversations designed to promote professional development and opportunities within the creative industry.\n\nAs a public speaker, David speaks on digital media, entrepreneurship, creativity, personal branding, leadership, innovation, and youth development. He is passionate about inspiring young people to overcome limitations, develop valuable skills, and build meaningful careers.\n\nBeyond his professional pursuits, David is committed to mentorship, capacity development, and empowering the next generation of creatives and entrepreneurs. His interests include emerging technologies, artificial intelligence, digital innovation, business development, leadership, and the future of the creator economy.\n\nAt the heart of his vision is the belief that media is more than content creation; it is a tool for influence, education, transformation, and generational impact. Through his businesses, leadership, and community initiatives, David continues to inspire people to create, innovate, and build lasting legacies.",
    avatarUrl: "/judges/david-umoru.jpeg",
  },
  {
    id: "judge4",
    name: "Sochi Daniel-Onuoha",
    label: "Principal Architect, SD Universal & Music Evangelist",
    seatTitle: "Judge Seat 4",
    roleTitle: "Architect | Entrepreneur | Music Evangelist | Humanitarian",
    bio: "Principal at SD Universal Limited, lead architect on major sacred monuments, MBA from Covenant University, visionary leader of Radiate Ministries, and secretary of Dan Onuoha Foundation.",
    fullBio:
      "Sochi Daniel-Onuoha is a multifaceted professional, architect, music evangelist, and visionary leader with a passion for excellence, creativity, ministry, and humanitarian impact.\n\nBy profession, she is an architect with a special focus on interior design and landscape architecture. She owns and leads SD UNIVERSAL LIMITED, delivering top notch designs in and outside the country. Over the years, she has contributed to several notable projects, including The Hand of God Cathedral, among other architectural and design projects that reflect her passion for creating beautiful, functional, and meaningful spaces.\n\nShe also holds a Master of Business Administration (MBA) in Marketing from Covenant University, Nigeria, combining her creative expertise with strategic business and marketing knowledge.\n\nBeyond her professional pursuits, Sochi is a passionate music evangelist whose mission is to market Jesus in every sphere of life. Her conviction is that the Gospel should find expression in every aspect of human existence, including creativity, business, culture, music, and everyday living.\n\nShe is the visionary leader of RADIATE MINISTRIES, a ministry birthed out of divine instruction, committed to spreading the message of Christ and advancing God’s kingdom through impactful annual programmes held across different locations in Nigeria.\n\nShe is also privileged to be the secretary of the DAN ONUOHA FOUNDATION, a humanitarian initiative committed to addressing the needs of children, women, and men across the world through acts of compassion, support, and community impact.\n\nAt the intersection of faith, creativity, leadership, and service, Sochi Daniel-Onuoha continues to pursue a life of purpose, using her gifts, platforms, and influence to inspire people, transform lives, and ultimately make Jesus known.\n\nHer life’s mission is simple: to Radiate God’s Glory, influence her world, and make Jesus known in every area of life.",
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
  "State Church",
  "Badagry District",
  "Epe District",
  "Igbogbo District",
  "Ijede District",
  "Irawo District",
  "Magbon District",
  "Morogbo District",
] as const;
