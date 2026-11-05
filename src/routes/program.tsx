import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock, Gavel, Info, Scale, Timer, Trophy, Vote } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { FINALE_DATE_LABEL } from "@/lib/demo/labels";

export const Route = createFileRoute("/program")({
  head: () => ({
    meta: [
      {
        title: "Program Details & Competition Rules — SHABACH 2026",
      },
      {
        name: "description",
        content:
          "Official competition guidelines, 100-Point Cake scoring model, allocated category durations, and verification rules for the SHABACH 2026 Grand Finale.",
      },
      {
        property: "og:title",
        content: "Program Details & Competition Rules — SHABACH 2026",
      },
      {
        property: "og:description",
        content:
          "Official competition guidelines, 100-Point Cake scoring model, and category durations for SHABACH 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProgramDetailsPage,
});

const CATEGORY_RULES = [
  {
    category: "Music",
    time: "4 minutes",
    seconds: "240 sec",
    focus: "Vocal precision, spiritual depth, musical arrangement, biblical message",
  },
  {
    category: "Spoken Word",
    time: "4 minutes",
    seconds: "240 sec",
    focus: "Poetic meter, theological resonance, diction, vocal modulation, delivery",
  },
  {
    category: "Dance",
    time: "4 minutes",
    seconds: "240 sec",
    focus: "Choreography, synchronisation, interpretive ministry, physical stamina",
  },
  {
    category: "Drama",
    time: "7 minutes",
    seconds: "420 sec",
    focus: "Scriptural alignment, characterisation, thematic impact, stage economy",
  },
  {
    category: "Visual Arts",
    time: "10 minutes",
    seconds: "600 sec",
    focus: "Live creative execution, composition, spiritual thematic depth, finish",
  },
];

export function ProgramDetailsContent() {
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
          Grand Finale · {FINALE_DATE_LABEL} · Lagos
        </span>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-cream-line pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-wash px-3 py-1 text-xs font-semibold text-forest">
            <Info className="h-3.5 w-3.5 text-gold" /> Official Platform Details
          </div>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl text-forest">
            Program Details & Scoring Guidelines
          </h1>
          <p className="mt-1 text-sm text-charcoal-muted max-w-2xl">
            The SHABACH 2026 adjudication framework balances independent judge appraisal with verified public participation under strict time discipline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/contestants"
            className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-xs font-semibold text-ivory hover:bg-forest-deep transition-colors"
          >
            <Vote className="h-3.5 w-3.5" /> Vote Finalists
          </Link>
          <Link
            to="/results"
            className="inline-flex items-center gap-1.5 rounded-lg border border-cream-line bg-card px-4 py-2 text-xs font-semibold text-forest hover:bg-parchment transition-colors"
          >
            <Trophy className="h-3.5 w-3.5" /> Results
          </Link>
        </div>
      </div>

      {/* 100-Point Cake Cards */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-wash text-gold">
            <Gavel className="h-5 w-5" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-forest">95%</span>
            <span className="text-xs font-semibold text-charcoal-muted">Panel Adjudication</span>
          </div>
          <h3 className="mt-1 font-display text-base text-forest">Independent Judges</h3>
          <p className="mt-2 text-xs leading-relaxed text-charcoal-muted">
            Four independent judges evaluate every act on a five-criterion rubric (Musicality/Technique 20, Message & Biblical Depth 20, Originality 20, Stage Craft 20, and Audience Engagement 15). The four subtotals are averaged out of 95.
          </p>
        </div>

        <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-wash text-gold">
            <Vote className="h-5 w-5" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-forest">5%</span>
            <span className="text-xs font-semibold text-charcoal-muted">Audience Contribution</span>
          </div>
          <h3 className="mt-1 font-display text-base text-forest">Public Vote Scaling</h3>
          <p className="mt-2 text-xs leading-relaxed text-charcoal-muted">
            Audience members cast a single vote verified via 6-digit email OTP. Points are scaled proportionally: the finalist with the highest valid vote count receives the maximum 5.0 points, scaled downward for all other contestants.
          </p>
        </div>

        <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-wash text-gold">
            <Timer className="h-5 w-5" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-destructive">-2 pts</span>
            <span className="text-xs font-semibold text-charcoal-muted">Time Discipline Rule</span>
          </div>
          <h3 className="mt-1 font-display text-base text-forest">Overtime Deductions</h3>
          <p className="mt-2 text-xs leading-relaxed text-charcoal-muted">
            Discipline is paramount. Performances exceeding their allocated category duration receive an automatic deduction of 2 points from their 100-point total for each completed overtime interval.
          </p>
        </div>
      </div>

      {/* Allocated Category Durations Table */}
      <div className="mt-8 rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gold" />
          <h2 className="font-display text-xl text-forest">Allocated Category Durations</h2>
        </div>
        <p className="mt-1 text-xs text-charcoal-muted">
          All 16 finalists perform strictly within their assigned category time limits:
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-cream-line text-charcoal-muted uppercase tracking-wider font-semibold">
                <th className="py-2.5 pr-4">Category</th>
                <th className="py-2.5 px-4">Allocated Time</th>
                <th className="py-2.5 px-4 hidden sm:table-cell">Duration in Sec</th>
                <th className="py-2.5 pl-4">Primary Rubric Focus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-line">
              {CATEGORY_RULES.map((rule) => (
                <tr key={rule.category} className="hover:bg-ivory/50">
                  <td className="py-3 pr-4 font-semibold text-forest">{rule.category}</td>
                  <td className="py-3 px-4">
                    <span className="rounded-md bg-gold-wash px-2.5 py-1 font-mono font-bold text-forest">
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

      {/* Integrity & Collation Safeguards */}
      <div className="mt-8 rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <h2 className="font-display text-xl text-forest flex items-center gap-2">
          <Scale className="h-5 w-5 text-gold" /> Integrity & Collation Safeguards
        </h2>
        <p className="mt-1 text-xs text-charcoal-muted">
          Six mandatory verification gates must be cleared before official results are published:
        </p>
        <ul className="mt-4 grid gap-3 text-xs text-charcoal-muted sm:grid-cols-2">
          <li className="flex items-start gap-2.5 rounded-xl border border-cream-line bg-ivory/60 p-3">
            <span className="font-bold text-forest text-base leading-none">•</span>
            <div>
              <p className="font-semibold text-forest">1. One-Vote Enforcement</p>
              <p className="mt-0.5 text-charcoal-muted">Each audience voter is verified via 6-digit email OTP and allowed exactly 1 non-transferable vote across the entire finale.</p>
            </div>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-cream-line bg-ivory/60 p-3">
            <span className="font-bold text-forest text-base leading-none">•</span>
            <div>
              <p className="font-semibold text-forest">2. Complete 64 Scorecards</p>
              <p className="mt-0.5 text-charcoal-muted">All 4 judges must submit complete scores for every single act before results can be calculated.</p>
            </div>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-cream-line bg-ivory/60 p-3">
            <span className="font-bold text-forest text-base leading-none">•</span>
            <div>
              <p className="font-semibold text-forest">3. Duration Audit</p>
              <p className="mt-0.5 text-charcoal-muted">The score desk verifies exact stopwatch logs to calculate accurate overtime deductions.</p>
            </div>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-cream-line bg-ivory/60 p-3">
            <span className="font-bold text-forest text-base leading-none">•</span>
            <div>
              <p className="font-semibold text-forest">4. Conflict of Interest Review</p>
              <p className="mt-0.5 text-charcoal-muted">Any declared judge district conflict must be resolved by the executive committee.</p>
            </div>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-cream-line bg-ivory/60 p-3">
            <span className="font-bold text-forest text-base leading-none">•</span>
            <div>
              <p className="font-semibold text-forest">5. Deterministic Tie-Breaks</p>
              <p className="mt-0.5 text-charcoal-muted">Ties are resolved using predefined rubric criteria ladders — never random draws.</p>
            </div>
          </li>
          <li className="flex items-start gap-2.5 rounded-xl border border-cream-line bg-ivory/60 p-3">
            <span className="font-bold text-forest text-base leading-none">•</span>
            <div>
              <p className="font-semibold text-forest">6. Dual Lock & Publication</p>
              <p className="mt-0.5 text-charcoal-muted">Results remain cryptographically frozen until confirmed and published by the Chief Judge & Score Desk.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ProgramDetailsPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main>
        <ProgramDetailsContent />
      </main>
      <SiteFooter />
    </div>
  );
}
