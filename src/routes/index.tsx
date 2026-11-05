import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Clock,
  Gavel,
  Info,
  Lock,
  Scale,
  ScrollText,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  Users,
  Vote,
  X,
} from "lucide-react";

import { ContestantCard } from "@/components/contestant-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoState } from "@/hooks/use-demo";
import { FINALE_DATE_LABEL, typeLabel, VOTING_STATUS_LABEL } from "@/lib/demo/labels";
import { buildContestants, CONTESTANT_SEED, OLD_DUMMY_NAMES } from "@/lib/demo/seed";
import type { PerformanceType } from "@/lib/demo/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "SHABACH 2026 — Talent for Christ | Grand Finale, 14 November 2026",
      },
      {
        name: "description",
        content:
          "Meet the 16 Grand Finale contestants of SHABACH 2026, cast your public vote, and follow the independently judged, verified results.",
      },
      {
        property: "og:title",
        content: "SHABACH 2026 — Talent for Christ | Grand Finale, 14 November 2026",
      },
      {
        property: "og:description",
        content:
          "Meet the 16 Grand Finale contestants, cast your public vote, and follow the verified results of SHABACH 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function VotingBanner() {
  const { votingStatus } = useDemoState();
  if (votingStatus === "open") {
    return (
      <div className="border-b border-cream-line bg-gold-wash">
        <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-forest">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-forest-soft shrink-0" />
          <span>
            <strong>Voting is live:</strong> Viewers get one verified vote across the entire Grand Finale. Browse the finalists below.
          </span>
        </p>
      </div>
    );
  }
  if (votingStatus === "closed") {
    return (
      <div className="border-b border-cream-line bg-parchment">
        <p className="mx-auto max-w-6xl px-4 py-2.5 text-xs sm:text-sm font-medium text-charcoal">
          Voting is closed. Official scorecards and audience votes are being collated.
        </p>
      </div>
    );
  }
  return (
    <div className="border-b border-cream-line bg-parchment">
      <p className="mx-auto max-w-6xl px-4 py-2.5 text-xs sm:text-sm font-medium text-charcoal">
        Voting opens live at the Grand Finale. Explore all 16 finalists and category durations below.
      </p>
    </div>
  );
}

function SeamlessDashboardHub() {
  const { votingStatus } = useDemoState();

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="bg-forest-deep text-ivory py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        {/* Top Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-forest/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-forest px-3.5 py-1 text-xs font-semibold tracking-wide text-gold-soft">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              Grand Finale · {FINALE_DATE_LABEL} · Lagos
            </div>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl text-ivory tracking-tight">
              SHABACH <span className="text-gold">2026</span>
            </h1>
            <p className="mt-1 font-display text-xl sm:text-2xl text-gold-soft">
              Talent for Christ
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-block rounded-full bg-forest/80 border border-gold/30 px-3 py-1 text-xs font-semibold text-gold-soft">
              {VOTING_STATUS_LABEL[votingStatus]}
            </span>
            <p className="mt-1 text-xs text-ivory/60">
              Youth Alive Fellowship · Lagos State
            </p>
          </div>
        </div>

        {/* Dashboard 5-Action Hub */}
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-soft mb-3 flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Quick Access Portal
          </p>

          <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {/* 1. Vote Your Contestant */}
            <button
              type="button"
              onClick={() => handleScrollTo("contestants")}
              className="group relative flex flex-col justify-between rounded-2xl border-2 border-gold/70 bg-gradient-to-b from-forest via-forest to-forest-deep p-5 text-left shadow-lg transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-gold/20 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-forest-deep shadow">
                  <Vote className="h-5 w-5" />
                </div>
                <Badge className="bg-gold text-forest-deep text-[11px] font-bold">
                  {votingStatus === "open" ? "Live Vote" : "16 Acts"}
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="font-display text-lg font-bold text-ivory group-hover:text-gold transition-colors">
                  1. Vote Contestant
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ivory/80">
                  Browse all 16 finalists, see photos & durations, and cast your verified 1 vote.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-gold group-hover:translate-x-0.5 transition-transform">
                <span>View Finalists</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </button>

            {/* 2. Voting Result */}
            <Link
              to="/results"
              className="group relative flex flex-col justify-between rounded-2xl border border-cream-line/20 bg-forest/60 p-5 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-forest/80 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-wash/20 text-gold shadow-sm">
                  <Trophy className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-gold/30 text-gold-soft text-[11px]">
                  Official
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="font-display text-lg font-bold text-ivory group-hover:text-gold transition-colors">
                  2. Voting Result
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ivory/80">
                  Top 3 placements, verified scorecards, and published Grand Finale standings.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-gold-soft group-hover:text-gold transition-colors">
                <span>View Results</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </Link>

            {/* 3. Judges Panel */}
            <Link
              to="/judges"
              className="group relative flex flex-col justify-between rounded-2xl border border-cream-line/20 bg-forest/60 p-5 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-forest/80 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-wash/20 text-gold shadow-sm">
                  <Gavel className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-gold/30 text-gold-soft text-[11px]">
                  <Lock className="h-2.5 w-2.5 mr-1" /> PIN Protected
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="font-display text-lg font-bold text-ivory group-hover:text-gold transition-colors">
                  3. Judges Panel
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ivory/80">
                  Adjudication desk for 4 appointed judges to score category rubrics securely.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-gold-soft group-hover:text-gold transition-colors">
                <span>Judge Access</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </Link>

            {/* 4. Admin */}
            <Link
              to="/organiser"
              className="group relative flex flex-col justify-between rounded-2xl border border-cream-line/20 bg-forest/60 p-5 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-forest/80 focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/20 text-destructive-foreground shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-gold" />
                </div>
                <Badge variant="outline" className="border-gold/30 text-gold-soft text-[11px]">
                  <Lock className="h-2.5 w-2.5 mr-1" /> Admin Gate
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="font-display text-lg font-bold text-ivory group-hover:text-gold transition-colors">
                  4. Admin Desk
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ivory/80">
                  Organiser collation, timer verification, scorecard resets, and result lock.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-gold-soft group-hover:text-gold transition-colors">
                <span>Admin Login</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </Link>

            {/* 5. Platform Details */}
            <button
              type="button"
              onClick={() => handleScrollTo("platform-details")}
              className="group relative flex flex-col justify-between rounded-2xl border border-cream-line/20 bg-forest/60 p-5 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-forest/80 focus:outline-none focus:ring-2 focus:ring-gold sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-wash/20 text-gold shadow-sm">
                  <Info className="h-5 w-5" />
                </div>
                <Badge variant="outline" className="border-gold/30 text-gold-soft text-[11px]">
                  Guidelines
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="font-display text-lg font-bold text-ivory group-hover:text-gold transition-colors">
                  5. Platform Details
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-ivory/80">
                  100-Point Cake, category duration allocations, and score integrity rules.
                </p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-gold-soft group-hover:text-gold transition-colors">
                <span>View Guidelines</span>
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const CATEGORY_TABS: { label: string; value: string; duration: string }[] = [
  { label: "All Acts", value: "all", duration: "16 Finalists" },
  { label: "Music", value: "music", duration: "4 mins" },
  { label: "Spoken Word", value: "spoken_word", duration: "4 mins" },
  { label: "Dance", value: "dance", duration: "4 mins" },
  { label: "Drama", value: "drama", duration: "7 mins" },
  { label: "Visual Art", value: "visual_arts", duration: "10 mins" },
];

function ContestantGrid() {
  const state = useDemoState();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const rawPool =
    state.contestants && state.contestants.length > 0 ? state.contestants : buildContestants();
  const pool = rawPool.map((c) => {
    const seed = CONTESTANT_SEED.find((s) => s.code === c.code || s.id === c.id);
    const isLegacy = !c.name || OLD_DUMMY_NAMES.has(c.name);
    if (isLegacy && seed) {
      return {
        ...c,
        name: seed.name,
        district: seed.district,
        type: seed.type,
        title: seed.title,
        bio: seed.bio,
        avatarUrl: seed.avatarUrl,
      };
    }
    if (seed && (!c.avatarUrl || c.avatarUrl !== seed.avatarUrl)) {
      return { ...c, avatarUrl: seed.avatarUrl };
    }
    return c;
  });

  const query = searchQuery.trim().toLowerCase();

  const filtered = pool
    .filter((c) => {
      // Category filter
      if (activeCategory !== "all" && c.type !== activeCategory) {
        return false;
      }
      // Query filter
      if (!query) return true;
      const name = c.name.toLowerCase();
      const code = c.code.toLowerCase();
      const district = c.district.toLowerCase();
      const categoryName = typeLabel(c.type).toLowerCase();
      return (
        name.includes(query) ||
        code.includes(query) ||
        district.includes(query) ||
        categoryName.includes(query)
      );
    })
    .sort((a, b) => a.order - b.order);

  return (
    <section id="contestants" className="scroll-mt-16 bg-ivory py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        {/* Section Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
              <Vote className="h-4 w-4" /> 1. Vote Your Contestant
            </div>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl text-forest">
              Meet the 16 Finalists
            </h2>
            <p className="mt-1 text-sm text-charcoal-muted">
              Select any act to view their profile, verify their allocated time, and vote.
            </p>
          </div>
          <div className="rounded-xl border border-gold/40 bg-gold-wash px-3.5 py-2 text-xs font-semibold text-forest">
            One vote per verified voter · 5% weight on final score
          </div>
        </div>

        {/* Category Filter Chips with Duration Badges (Mobile Responsive) */}
        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveCategory(tab.value)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-forest text-ivory shadow-sm ring-2 ring-forest/20"
                    : "bg-card text-charcoal border border-cream-line hover:border-gold hover:text-forest"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
                    isActive ? "bg-gold text-forest-deep" : "bg-parchment text-charcoal-muted"
                  }`}
                >
                  {tab.duration}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search controls */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contestants by name or code (e.g. Lizzy, SB7K2M)..."
              className="pl-9 pr-9 border-cream-line bg-card text-sm focus-visible:ring-forest"
              aria-label="Search contestants"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-forest"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-xs font-medium text-charcoal-muted">
            {query || activeCategory !== "all"
              ? `Showing ${filtered.length} of ${pool.length} contestants`
              : `All ${pool.length} finalists in running order`}
          </p>
        </div>

        {/* Results grid or clean empty state */}
        {filtered.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((contestant) => (
              <ContestantCard
                key={contestant.id}
                contestant={contestant}
                votingStatus={state.votingStatus}
                myVote={state.browserVote?.contestantId ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-cream-line bg-card p-10 text-center shadow-card">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-wash text-gold">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="mt-4 font-display text-2xl text-forest">
              No contestants match “{searchQuery.trim()}”
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-charcoal-muted">
              We couldn't find any finalists matching your search. Try searching by contestant name,
              district, or 6-character code (e.g. SB7K2M, B6F4PT).
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="border-cream-line hover:bg-parchment text-xs"
              >
                Clear search
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PlatformDetailsSection() {
  const CATEGORY_RULES = [
    { category: "Music", time: "4 minutes", seconds: "240 sec", focus: "Musicality, Biblical depth, vocal technique, arrangement" },
    { category: "Spoken Word", time: "4 minutes", seconds: "240 sec", focus: "Diction, theology, delivery, poetic rhythm" },
    { category: "Dance", time: "4 minutes", seconds: "240 sec", focus: "Choreography, musicality, synchronization, message" },
    { category: "Drama", time: "7 minutes", seconds: "420 sec", focus: "Scripture interpretation, acting, narrative arc, stagecraft" },
    { category: "Visual Arts", time: "10 minutes", seconds: "600 sec", focus: "Composition, thematic resonance, technique, live execution" },
  ];

  return (
    <section id="platform-details" className="scroll-mt-16 bg-parchment py-16 border-t border-cream-line">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
              <Info className="h-4 w-4" /> 5. Platform Details
            </div>
            <h2 className="mt-1 font-display text-3xl sm:text-4xl text-forest">
              Scoring Model & Competition Rules
            </h2>
            <p className="mt-1 text-sm text-charcoal-muted max-w-2xl">
              SHABACH 2026 operates on the 100-Point Cake model — blending rigorous independent adjudication with verified audience engagement.
            </p>
          </div>
          <Link
            to="/results"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
          >
            Check Grand Finale Standings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* 100-Point Cake Visualization */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-wash text-gold">
              <Gavel className="h-5 w-5" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-forest">95%</span>
              <span className="text-xs font-semibold text-charcoal-muted">Independent Judges</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-charcoal-muted">
              Four appointed judges score every act across 5 criteria (Musicality/Technique 20, Message & Biblical Depth 20, Originality 20, Stage Craft 20, and Audience Engagement 15). The four subtotals are averaged out of 95.
            </p>
          </div>

          <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-wash text-gold">
              <Vote className="h-5 w-5" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-forest">5%</span>
              <span className="text-xs font-semibold text-charcoal-muted">Public Audience Vote</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-charcoal-muted">
              Audience members cast a single vote verified via email OTP. Points are scaled proportionally: the contestant with the highest valid public vote count receives the maximum 5.0 points.
            </p>
          </div>

          <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-wash text-gold">
              <Timer className="h-5 w-5" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-destructive">-2 pts</span>
              <span className="text-xs font-semibold text-charcoal-muted">Overtime Interval Penalty</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-charcoal-muted">
              Discipline is sacred. Acts exceeding their allocated category duration receive an automatic penalty of 2 points deducted from their 100-point total for each completed overtime interval.
            </p>
          </div>
        </div>

        {/* Category Time Allocation Table */}
        <div className="mt-8 rounded-2xl border border-cream-line bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" />
            <h3 className="font-display text-xl text-forest">Allocated Category Durations</h3>
          </div>
          <p className="mt-1 text-xs text-charcoal-muted">
            All 16 finalists perform within their category's designated duration limit:
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cream-line text-charcoal-muted uppercase tracking-wider font-semibold">
                  <th className="py-2.5 pr-4">Category</th>
                  <th className="py-2.5 px-4">Allocated Time</th>
                  <th className="py-2.5 px-4 hidden sm:table-cell">Duration in Sec</th>
                  <th className="py-2.5 pl-4">Rubric Focus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-line">
                {CATEGORY_RULES.map((rule) => (
                  <tr key={rule.category} className="hover:bg-ivory/50">
                    <td className="py-3 pr-4 font-semibold text-forest">{rule.category}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-md bg-gold-wash px-2 py-0.5 font-mono font-bold text-forest">
                        {rule.time}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-charcoal-muted hidden sm:table-cell">{rule.seconds}</td>
                    <td className="py-3 pl-4 text-charcoal-muted">{rule.focus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Integrity Gates */}
        <div className="mt-6 rounded-2xl border border-cream-line bg-card p-6 shadow-card">
          <h3 className="font-display text-xl text-forest flex items-center gap-2">
            <Scale className="h-5 w-5 text-gold" /> Integrity & Collation Safeguards
          </h3>
          <ul className="mt-3 grid gap-2.5 text-xs text-charcoal-muted sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-forest">•</span>
              <span><strong>One-Vote Rule:</strong> Each audience email receives an OTP code to cast exactly 1 non-transferable vote.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-forest">•</span>
              <span><strong>64 Complete Scorecards:</strong> All 4 judges must submit scores for all 16 acts before collation locks.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-forest">•</span>
              <span><strong>Duration Audit:</strong> The score desk verifies timer logs for each performance to calculate exact overtime penalties.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-forest">•</span>
              <span><strong>Conflict Resolution:</strong> Any declared judge conflicts of interest must be resolved by the committee.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-forest">•</span>
              <span><strong>Tie-Break Ladder:</strong> Exact ties pass through a deterministic criterion hierarchy — no coin tosses.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-forest">•</span>
              <span><strong>Dual Confirmation:</strong> Results remain frozen until verified and officially published by the score desk.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main>
        <VotingBanner />
        <SeamlessDashboardHub />
        <ContestantGrid />
        <PlatformDetailsSection />
      </main>
      <SiteFooter />
    </div>
  );
}
