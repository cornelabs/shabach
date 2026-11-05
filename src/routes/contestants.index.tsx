import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Clock, Search, Trophy, Vote, X } from "lucide-react";

import { ContestantCard } from "@/components/contestant-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoState } from "@/hooks/use-demo";
import { FINALE_DATE_LABEL, typeLabel, VOTING_STATUS_LABEL } from "@/lib/demo/labels";
import { buildContestants, CONTESTANT_SEED, OLD_DUMMY_NAMES } from "@/lib/demo/seed";

export const Route = createFileRoute("/contestants/")({
  head: () => ({
    meta: [
      {
        title: "Contestants & Public Voting — SHABACH 2026",
      },
      {
        name: "description",
        content:
          "Meet the 16 Grand Finale contestants of SHABACH 2026, check their allocated performance durations, and cast your single verified public vote.",
      },
      {
        property: "og:title",
        content: "Contestants & Public Voting — SHABACH 2026",
      },
      {
        property: "og:description",
        content:
          "Meet the 16 Grand Finale finalists, explore their acts and durations, and vote.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContestantsPage,
});

function VotingBanner() {
  const { votingStatus } = useDemoState();
  if (votingStatus === "open") {
    return (
      <div className="border-b border-cream-line bg-gold-wash">
        <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-forest">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-forest-soft shrink-0" />
          <span>
            <strong>Voting is open:</strong> Each voter receives exactly one verified vote across the entire Grand Finale. Select your act below.
          </span>
        </p>
      </div>
    );
  }
  if (votingStatus === "closed") {
    return (
      <div className="border-b border-cream-line bg-parchment">
        <p className="mx-auto max-w-6xl px-4 py-2.5 text-xs sm:text-sm font-medium text-charcoal">
          Public voting has closed. Official audience votes and judge scorecards are being collated.
        </p>
      </div>
    );
  }
  return (
    <div className="border-b border-cream-line bg-parchment">
      <p className="mx-auto max-w-6xl px-4 py-2.5 text-xs sm:text-sm font-medium text-charcoal">
        Public voting opens during the Grand Finale live broadcast. Explore all 16 finalists and allocated durations below.
      </p>
    </div>
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

export function ContestantsList() {
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
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Back button & Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <span className="text-xs font-medium text-charcoal-muted">
          Grand Finale · {FINALE_DATE_LABEL}
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-cream-line pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-wash px-3 py-1 text-xs font-semibold text-forest">
            <Vote className="h-3.5 w-3.5 text-gold" /> Public Voting Stage
          </div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl text-forest">
            Meet the 16 Finalists
          </h1>
          <p className="mt-1 text-sm text-charcoal-muted max-w-2xl">
            Browse contestants by running order, view their district representation and verified category duration limits, and cast your public vote.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium">
            {VOTING_STATUS_LABEL[state.votingStatus]}
          </Badge>
          <Badge className="bg-forest text-ivory text-xs font-semibold">
            1 Vote Per Person
          </Badge>
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

      {/* Search Controls */}
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

      {/* Finalists Grid or Empty State */}
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
  );
}

function ContestantsPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main>
        <VotingBanner />
        <ContestantsList />
      </main>
      <SiteFooter />
    </div>
  );
}
