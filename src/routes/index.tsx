import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Gavel,
  Info,
  Lock,
  ShieldCheck,
  Sparkles,
  Trophy,
  Vote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useDemoState } from "@/hooks/use-demo";
import { FINALE_DATE_LABEL, VOTING_STATUS_LABEL } from "@/lib/demo/labels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "SHABACH 2026 — Talent for Christ | Grand Finale Portal",
      },
      {
        name: "description",
        content:
          "Official Grand Finale portal for SHABACH 2026: Vote your contestant, view live results, access the judges panel, admin desk, and program guidelines.",
      },
      {
        property: "og:title",
        content: "SHABACH 2026 — Talent for Christ | Grand Finale Portal",
      },
      {
        property: "og:description",
        content:
          "Official Grand Finale portal for SHABACH 2026. Vote contestants, explore verified results, access judges panel, and check competition rubrics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { votingStatus } = useDemoState();

  return (
    <div className="flex min-h-[100dvh] flex-col justify-between overflow-y-auto lg:overflow-hidden bg-forest-deep text-ivory selection:bg-gold selection:text-forest-deep">
      {/* 1. Compact Site Header */}
      <header className="border-b border-forest/60 bg-forest/40 px-4 py-2.5 backdrop-blur-md shrink-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link to="/" className="flex items-baseline gap-2 group">
            <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-ivory group-hover:text-gold transition-colors">
              SHABACH <span className="text-gold">2026</span>
            </span>
            <span className="hidden text-[11px] font-semibold uppercase tracking-widest text-gold-soft sm:inline">
              Talent for Christ
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-forest px-2.5 py-0.5 text-[11px] font-medium text-gold-soft">
              <span
                className={`h-2 w-2 rounded-full ${
                  votingStatus === "open"
                    ? "bg-forest-soft live-dot"
                    : votingStatus === "closed"
                      ? "bg-charcoal-muted"
                      : "bg-gold"
                }`}
              />
              {VOTING_STATUS_LABEL[votingStatus]}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Viewport Content — Centered & Scaled to Fit at a Glance */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-3.5 sm:px-6 py-3 sm:py-6">
        {/* Concise Hero Title */}
        <div className="text-center shrink-0 mb-3 sm:mb-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-forest/80 px-3 py-1 text-[11px] font-semibold text-gold-soft shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            Grand Finale · {FINALE_DATE_LABEL} · Lagos
          </div>
          <h1 className="mt-1.5 sm:mt-2.5 font-display text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ivory">
            Talent for <span className="text-gold">Christ</span>
          </h1>
          <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-ivory/80 max-w-md mx-auto">
            Welcome to the Grand Finale portal. Select a section to proceed:
          </p>
        </div>

        {/* The 5 Navigation Cards — Responsive 2-col on mobile, 3-col on tablet, 5-col on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3.5 w-full">
          {/* Card 1: Vote Contestant */}
          <Link
            to="/contestants"
            className="group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border-2 border-gold/80 bg-gradient-to-br from-forest to-forest-deep p-3 sm:p-4 text-left shadow-lg transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-gold/25 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gold text-forest-deep shadow">
                <Vote className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </div>
              <Badge className="bg-gold text-forest-deep text-[10px] sm:text-[11px] font-bold px-2 py-0.5">
                {votingStatus === "open" ? "Live Vote" : "16 Finalists"}
              </Badge>
            </div>
            <div className="mt-2 sm:mt-3">
              <h2 className="font-display text-sm sm:text-base font-bold text-ivory group-hover:text-gold transition-colors flex items-center justify-between">
                <span>1. Vote Contestant</span>
                <ArrowRight className="h-4 w-4 text-gold group-hover:translate-x-1 transition-transform" />
              </h2>
              <p className="mt-0.5 text-[10px] sm:text-[11px] leading-snug text-ivory/85 line-clamp-2">
                Browse 16 acts across 8 districts, see allocated durations & cast 1 vote.
              </p>
            </div>
          </Link>

          {/* Card 2: Results */}
          <Link
            to="/results"
            className="group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border border-cream-line/25 bg-forest/70 p-3 sm:p-4 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gold/20 text-gold shadow-sm">
                <Trophy className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="border-gold/40 text-gold-soft text-[10px] px-1.5 py-0">
                Podium
              </Badge>
            </div>
            <div className="mt-2 sm:mt-3">
              <h2 className="font-display text-sm sm:text-base font-bold text-ivory group-hover:text-gold transition-colors flex items-center justify-between">
                <span>2. Results</span>
                <ArrowRight className="h-3.5 w-3.5 text-gold-soft group-hover:translate-x-1 transition-transform" />
              </h2>
              <p className="mt-0.5 text-[10px] sm:text-[11px] leading-snug text-ivory/75 line-clamp-2">
                Top 3 winners & verified final standings.
              </p>
            </div>
          </Link>

          {/* Card 3: Judging Panel */}
          <Link
            to="/judges"
            className="group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border border-cream-line/25 bg-forest/70 p-3 sm:p-4 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gold/20 text-gold shadow-sm">
                <Gavel className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="border-gold/40 text-gold-soft text-[10px] px-1.5 py-0 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> PIN
              </Badge>
            </div>
            <div className="mt-2 sm:mt-3">
              <h2 className="font-display text-sm sm:text-base font-bold text-ivory group-hover:text-gold transition-colors flex items-center justify-between">
                <span>3. Judging Panel</span>
                <ArrowRight className="h-3.5 w-3.5 text-gold-soft group-hover:translate-x-1 transition-transform" />
              </h2>
              <p className="mt-0.5 text-[10px] sm:text-[11px] leading-snug text-ivory/75 line-clamp-2">
                Confidential scoring desk for appointed panel.
              </p>
            </div>
          </Link>

          {/* Card 4: Program details */}
          <Link
            to="/program"
            className="group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border border-cream-line/25 bg-forest/70 p-3 sm:p-4 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gold/20 text-gold shadow-sm">
                <Info className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="border-gold/40 text-gold-soft text-[10px] px-1.5 py-0">
                Rules
              </Badge>
            </div>
            <div className="mt-2 sm:mt-3">
              <h2 className="font-display text-sm sm:text-base font-bold text-ivory group-hover:text-gold transition-colors flex items-center justify-between">
                <span>4. Program details</span>
                <ArrowRight className="h-3.5 w-3.5 text-gold-soft group-hover:translate-x-1 transition-transform" />
              </h2>
              <p className="mt-0.5 text-[10px] sm:text-[11px] leading-snug text-ivory/75 line-clamp-2">
                100-Point Cake, category durations & criteria.
              </p>
            </div>
          </Link>

          {/* Card 5: Admin Space */}
          <Link
            to="/organiser"
            className="group relative flex flex-col justify-between rounded-xl sm:rounded-2xl border border-cream-line/25 bg-forest/70 p-3 sm:p-4 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-gold col-span-2 md:col-span-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-destructive/30 text-destructive-foreground shadow-sm">
                <ShieldCheck className="h-4 w-4 text-gold" />
              </div>
              <Badge variant="outline" className="border-gold/40 text-gold-soft text-[10px] px-1.5 py-0 flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" /> Admin
              </Badge>
            </div>
            <div className="mt-2 sm:mt-3">
              <h2 className="font-display text-sm sm:text-base font-bold text-ivory group-hover:text-gold transition-colors flex items-center justify-between">
                <span>5. Admin Space</span>
                <ArrowRight className="h-3.5 w-3.5 text-gold-soft group-hover:translate-x-1 transition-transform" />
              </h2>
              <p className="mt-0.5 text-[10px] sm:text-[11px] leading-snug text-ivory/75 line-clamp-2">
                Score desk, duration verification & lock.
              </p>
            </div>
          </Link>
        </div>
      </main>

      {/* 3. Sleek Single-Line Footer */}
      <footer className="border-t border-forest/60 bg-forest/40 px-4 py-2 shrink-0 text-center text-[11px] text-ivory/60">
        <p>Youth Alive Fellowship · Living Faith Church, Lagos State · Africa/Lagos (WAT)</p>
      </footer>
    </div>
  );
}
