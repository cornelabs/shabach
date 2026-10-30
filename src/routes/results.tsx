import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Medal, Trophy } from "lucide-react";

import { Monogram } from "@/components/monogram";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { useDemoState } from "@/hooks/use-demo";
import { FINALE_DATE_LABEL, typeLabel } from "@/lib/demo/labels";
import type { ResultRow } from "@/lib/demo/types";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Grand Finale Winners & Results — SHABACH 2026" },
      {
        name: "description",
        content:
          "Official published winners of the SHABACH 2026 Grand Finale — Talent for Christ. Verified and celebrated.",
      },
      { property: "og:title", content: "Grand Finale Winners & Results — SHABACH 2026" },
      {
        property: "og:description",
        content:
          "Official published winners of the SHABACH 2026 Grand Finale. Verified and celebrated.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

const PLACEMENT_CONFIG = [
  {
    rank: 1,
    title: "1st Place · Winner",
    accent: "border-gold bg-gradient-to-b from-gold-wash to-card shadow-lift",
    badge: "bg-gold text-forest-deep font-bold",
    trophyColor: "text-gold",
  },
  {
    rank: 2,
    title: "2nd Place · First Runner-Up",
    accent: "border-cream-line bg-card shadow-card",
    badge: "bg-parchment text-forest font-semibold",
    trophyColor: "text-charcoal-muted",
  },
  {
    rank: 3,
    title: "3rd Place · Second Runner-Up",
    accent: "border-cream-line bg-card shadow-card",
    badge: "bg-parchment text-forest font-semibold",
    trophyColor: "text-charcoal-muted",
  },
] as const;

function TopThreeCard({ row, position }: { row: ResultRow; position: number }) {
  const config = PLACEMENT_CONFIG[position] ?? PLACEMENT_CONFIG[2];

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all ${config.accent}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${config.badge}`}
          >
            {config.title}
          </span>
          {position === 0 ? (
            <Trophy className={`h-6 w-6 ${config.trophyColor}`} />
          ) : (
            <Medal className={`h-6 w-6 ${config.trophyColor}`} />
          )}
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Monogram name={row.contestant.name} hue={row.contestant.hue} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-2xl text-forest truncate">{row.contestant.name}</h3>
            <p className="text-sm font-medium text-charcoal italic truncate">
              “{row.contestant.title}”
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {typeLabel(row.contestant.type)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {row.contestant.district}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-cream-line pt-4">
        <Link
          to="/contestants/$code"
          params={{ code: row.contestant.code }}
          className="text-xs font-semibold text-forest hover:underline"
        >
          View profile & performance details ({row.contestant.code}) →
        </Link>
      </div>
    </div>
  );
}

export function PublicTopThree({ rows }: { rows: ResultRow[] }) {
  // Filter only ranked contestants and take top 3
  const topThree = rows.filter((r) => r.rank !== null).slice(0, 3);

  return (
    <div className="mt-8">
      <div className="text-center sm:text-left">
        <h2 className="font-display text-3xl text-forest">Grand Finale Winners</h2>
        <p className="mt-2 text-sm text-charcoal-muted">
          Official top three placements for SHABACH 2026 — Talent for Christ. All 16 contestants
          competed in one overall ranking across disciplines.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {topThree.map((row, index) => (
          <TopThreeCard key={row.contestant.id} row={row} position={index} />
        ))}
      </div>

      <div className="mt-12 rounded-2xl border border-cream-line bg-parchment p-6 text-center shadow-card sm:p-8">
        <h3 className="font-display text-xl text-forest">Congratulations to All 16 Finalists</h3>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-charcoal-muted">
          Every presentation brought glory to God and represented our districts with distinction.
          Detailed score breakdowns, judge marks, and verification sheets are archived in the
          official score desk records.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-forest-deep"
        >
          <ArrowLeft className="h-4 w-4" /> Meet all 16 finalists
        </Link>
      </div>
    </div>
  );
}

function ResultsPage() {
  const state = useDemoState();
  const isPublished = Boolean(state.results?.published);

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="inline-flex items-center gap-2 rounded-full border border-cream-line bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
          <Trophy className="h-3.5 w-3.5" /> Grand Finale · {FINALE_DATE_LABEL}
        </p>
        <h1 className="mt-4 font-display text-4xl text-forest">Results & Winners</h1>

        {isPublished && state.results ? (
          <PublicTopThree rows={state.results.rows} />
        ) : (
          <div className="mt-8 rounded-2xl border border-cream-line bg-card p-10 text-center shadow-card">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-wash text-gold">
              <Clock className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-display text-2xl text-forest">
              Results are awaiting official announcement
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-charcoal-muted">
              The Grand Finale results will be officially published here following the complete
              scoring collation, verification of all 64 scorecards, and score-desk confirmation.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-forest-deep"
              >
                Browse contestants & voting
              </Link>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
