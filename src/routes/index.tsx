import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Gavel, ScrollText, Search, Timer, Trophy, Users, Vote, X } from "lucide-react";

import { ContestantCard } from "@/components/contestant-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoState } from "@/hooks/use-demo";
import { FINALE_DATE_LABEL, VOTING_STATUS_LABEL } from "@/lib/demo/labels";

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
        <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 text-sm font-medium text-forest">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-forest-soft" />
          Voting is open — one vote per person. Choose your favourite contestant below.
        </p>
      </div>
    );
  }
  if (votingStatus === "closed") {
    return (
      <div className="border-b border-cream-line bg-parchment">
        <p className="mx-auto max-w-6xl px-4 py-2.5 text-sm font-medium text-charcoal">
          Voting is closed. Results are being verified and will be published on the results page.
        </p>
      </div>
    );
  }
  return (
    <div className="border-b border-cream-line bg-parchment">
      <p className="mx-auto max-w-6xl px-4 py-2.5 text-sm font-medium text-charcoal">
        Voting hasn't opened yet — it will open at the Grand Finale. Browse the contestants below in
        the meantime.
      </p>
    </div>
  );
}

function Hero() {
  const { votingStatus } = useDemoState();
  return (
    <section className="bg-forest-deep text-ivory">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-forest px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold-soft">
          <Trophy className="h-3.5 w-3.5" />
          Grand Finale · {FINALE_DATE_LABEL} · Lagos
        </p>
        <h1 className="mt-6 font-display text-5xl sm:text-7xl">
          SHABACH <span className="text-gold">2026</span>
        </h1>
        <p className="mt-2 font-display text-2xl text-gold-soft sm:text-3xl">Talent for Christ</p>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-ivory/85 sm:text-lg">
          Sixteen contestants — individuals and groups from eight districts — bring music, dance,
          spoken word, mono-drama and visual arts to the Grand Finale stage. The audience votes,
          three independent judges score, and every result is verified before it is published.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#contestants"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-forest-deep transition-colors hover:bg-gold-soft"
          >
            {votingStatus === "open" ? (
              <>
                <Vote className="h-4 w-4" /> Cast your vote
              </>
            ) : (
              <>
                <Users className="h-4 w-4" /> Meet the contestants
              </>
            )}
          </a>
          <Link
            to="/results"
            className="inline-flex items-center gap-2 rounded-lg border border-ivory/30 px-5 py-2.5 text-sm font-semibold text-ivory transition-colors hover:bg-forest"
          >
            <ScrollText className="h-4 w-4" />
            View results
          </Link>
        </div>
        <p className="mt-8 text-xs text-ivory/60">
          {VOTING_STATUS_LABEL[votingStatus]} · Organised by Youth Alive Fellowship, Living Faith
          Church, Lagos State
        </p>
      </div>
    </section>
  );
}

function ContestantGrid() {
  const state = useDemoState();
  const [searchQuery, setSearchQuery] = React.useState("");

  const sorted = React.useMemo(() => {
    return [...state.contestants].sort((a, b) => a.order - b.order);
  }, [state.contestants]);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q),
    );
  }, [sorted, searchQuery]);

  return (
    <section id="contestants" className="scroll-mt-20 bg-ivory py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl text-forest">Meet the contestants</h2>
            <p className="mt-1 text-sm text-charcoal-muted">
              Sixteen acts in one overall running order. Tap a card for the full profile.
            </p>
          </div>
          {state.votingStatus === "open" && (
            <p className="text-sm font-semibold text-forest-soft">
              One vote per person · {state.votingStatus && "voting is open"}
            </p>
          )}
        </div>

        {/* Search bar */}
        <div className="mt-6 flex max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-muted" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by contestant name or code (e.g. Grace or SB7K2M)..."
              className="border-cream-line bg-card pl-9 pr-9 text-sm text-charcoal placeholder:text-charcoal-muted/70 focus-visible:ring-forest"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-muted hover:text-forest"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="border-cream-line text-xs"
            >
              Reset
            </Button>
          )}
        </div>

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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-parchment text-charcoal-muted">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-xl text-forest">
              No contestants match “{searchQuery}”
            </h3>
            <p className="mt-2 text-sm text-charcoal-muted">
              Check the spelling, or try searching by six-character share code (e.g. SB7K2M) or
              district name.
            </p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="mt-5 border-cream-line"
            >
              Show all 16 contestants
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

const SCORING_CARDS = [
  {
    icon: Gavel,
    title: "Independent judging",
    body: "Three judges score every act on a five-criterion rubric — four criteria at 20 points plus audience engagement at 15 — for a raw subtotal out of 95.",
  },
  {
    icon: Vote,
    title: "Your vote counts",
    body: "The public vote adds up to 5 points, scaled so the act with the most valid votes earns the full 5. One vote per person, verified before counting.",
  },
  {
    icon: Timer,
    title: "Time discipline",
    body: "Performances that run past their category's time limit lose 2 points for every completed overtime interval. Durations are verified by the score desk.",
  },
] as const;

function HowScoringWorks() {
  return (
    <section className="bg-parchment py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-display text-3xl text-forest">How scoring works</h2>
        <p className="mt-1 max-w-2xl text-sm text-charcoal-muted">
          The final score out of 100 combines the judges' average, the scaled public vote and any
          time penalty. Nothing is published until every gate is cleared.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {SCORING_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-cream-line bg-card p-6 shadow-card"
            >
              <card.icon className="h-6 w-6 text-gold" />
              <h3 className="mt-3 font-display text-xl text-forest">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-muted">{card.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-cream-line bg-card p-6 shadow-card">
          <h3 className="font-display text-xl text-forest">Before results are published</h3>
          <ul className="mt-3 grid gap-2 text-sm text-charcoal-muted sm:grid-cols-2">
            <li>• Voting is closed and every vote is counted once.</li>
            <li>• All 48 judge scorecards are complete and submitted.</li>
            <li>• Every performance duration is entered and verified.</li>
            <li>• Declared conflicts of interest are reviewed and resolved.</li>
            <li>• The score desk confirms the collation, then results are locked.</li>
            <li>• Exact ties go through a fixed tie-break ladder — never a coin toss.</li>
          </ul>
          <Link
            to="/results"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
          >
            Go to the results page <ArrowRight className="h-4 w-4" />
          </Link>
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
        <Hero />
        <ContestantGrid />
        <HowScoringWorks />
      </main>
      <SiteFooter />
    </div>
  );
}
