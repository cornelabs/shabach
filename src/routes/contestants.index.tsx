import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Vote } from "lucide-react";

import { ContestantCard } from "@/components/contestant-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { useDemoState } from "@/hooks/use-demo";
import { FINALE_DATE_LABEL, VOTING_STATUS_LABEL } from "@/lib/demo/labels";
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
          "Meet the 16 Grand Finale contestants of SHABACH 2026 and cast your single verified public vote.",
      },
      {
        property: "og:title",
        content: "Contestants & Public Voting — SHABACH 2026",
      },
      {
        property: "og:description",
        content:
          "Meet the 16 Grand Finale finalists and cast your verified vote.",
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
        Public voting opens during the Grand Finale live broadcast. Explore all 16 finalists below.
      </p>
    </div>
  );
}

export function ContestantsList() {
  const state = useDemoState();

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

  const finalists = [...pool].sort((a, b) => a.order - b.order);

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

      {/* 16 Finalists Grid — Direct, clean and simple */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {finalists.map((contestant) => (
          <ContestantCard
            key={contestant.id}
            contestant={contestant}
            votingStatus={state.votingStatus}
            myVote={state.browserVote?.contestantId ?? null}
          />
        ))}
      </div>
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
