import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Lock, Printer, ScrollText } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { useDemoState } from "@/hooks/use-demo";
import { resultsToCsv } from "@/lib/demo/csv";
import { fmt2 } from "@/lib/demo/scoring";
import { typeLabel, formatLagos, FINALE_DATE_LABEL } from "@/lib/demo/labels";
import { JUDGES } from "@/lib/demo/types";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Results — SHABACH 2026" },
      {
        name: "description",
        content:
          "Verified results of the SHABACH 2026 Grand Finale — judges' scores, public vote, time penalties and final rankings, published only after every verification gate is cleared.",
      },
      { property: "og:title", content: "Results — SHABACH 2026" },
      {
        property: "og:description",
        content:
          "Verified results of the SHABACH 2026 Grand Finale — judges' scores, public vote, time penalties and final rankings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

function downloadCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "shabach-2026-results.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function ResultsTable() {
  const state = useDemoState();
  const results = state.results;
  if (!results) return null;

  const ranked = results.rows.filter((r) => r.finalScore !== null);
  const incomplete = results.rows.filter((r) => r.finalScore === null);
  const csv = resultsToCsv(results.rows);

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-charcoal-muted">
          Locked {formatLagos(results.lockedAt)} · Published{" "}
          {results.publishedAt ? formatLagos(results.publishedAt) : "—"} ·{" "}
          {JUDGES.length} judges · ties resolved by a fixed ladder
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => downloadCsv(csv)}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cream-line bg-card shadow-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-cream-line bg-parchment text-left text-xs uppercase tracking-wide text-charcoal-muted">
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Contestant</th>
              {JUDGES.map((judge) => (
                <th key={judge.id} className="px-3 py-3 text-center">
                  {judge.name.replace("Judge ", "J")}
                </th>
              ))}
              <th className="px-3 py-3 text-center">Judges' avg</th>
              <th className="px-3 py-3 text-center">Audience</th>
              <th className="px-3 py-3 text-center">Penalty</th>
              <th className="px-4 py-3 text-right">Final</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row) => (
              <tr
                key={row.contestant.id}
                className="border-b border-cream-line last:border-0 hover:bg-ivory/60"
              >
                <td className="px-4 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-forest font-display text-sm text-ivory">
                    {row.rank}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to="/contestants/$code"
                    params={{ code: row.contestant.code }}
                    className="font-semibold text-forest hover:underline"
                  >
                    {row.contestant.name}
                  </Link>
                  <p className="text-xs text-charcoal-muted">
                    {typeLabel(row.contestant.type)} · {row.contestant.district}
                  </p>
                  {row.tieFlags.length > 0 && (
                    <p className="mt-1 text-xs font-semibold text-gold">{row.tieFlags.join(" · ")}</p>
                  )}
                </td>
                {JUDGES.map((judge) => (
                  <td key={judge.id} className="px-3 py-3 text-center text-charcoal-muted">
                    {row.judgeSubtotals[judge.id] ?? "—"}
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-medium">{fmt2(row.judgeAverage)}</td>
                <td className="px-3 py-3 text-center text-charcoal-muted">
                  +{fmt2(row.audiencePoints)}
                </td>
                <td className="px-3 py-3 text-center text-charcoal-muted">
                  {row.timePenalty > 0 ? `−${row.timePenalty}` : "0"}
                </td>
                <td className="px-4 py-3 text-right font-display text-lg text-forest">
                  {fmt2(row.finalScore)}
                </td>
              </tr>
            ))}
            {incomplete.map((row) => (
              <tr key={row.contestant.id} className="border-b border-cream-line last:border-0 opacity-60">
                <td className="px-4 py-3 text-charcoal-muted">—</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-charcoal">{row.contestant.name}</p>
                  <p className="text-xs text-charcoal-muted">
                    Incomplete scorecards — not ranked
                  </p>
                </td>
                <td className="py-3 text-center" colSpan={JUDGES.length + 4}>
                  <span className="text-xs text-charcoal-muted">Awaiting valid submissions</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultsPage() {
  const state = useDemoState();

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <p className="inline-flex items-center gap-2 rounded-full border border-cream-line bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
          <ScrollText className="h-3.5 w-3.5" /> Grand Finale · {FINALE_DATE_LABEL}
        </p>
        <h1 className="mt-4 font-display text-4xl text-forest">Results</h1>

        {state.results?.published ? (
          <ResultsTable />
        ) : state.results ? (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-wash p-6">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div>
              <h2 className="font-display text-xl text-forest">Results are locked</h2>
              <p className="mt-1 text-sm text-charcoal-muted">
                The score desk collated and locked the results at {formatLagos(state.results.lockedAt)}.
                They will appear here as soon as the organiser publishes them.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-cream-line bg-card p-6 shadow-card">
            <h2 className="font-display text-xl text-forest">Results aren't published yet</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal-muted">
              Results appear here only after the full verification journey is complete: voting
              closed, all 48 judge scorecards submitted, every duration entered and verified, all
              conflicts of interest resolved, the score desk's confirmation recorded, and the
              collated results locked. Nothing partial is ever shown.
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
            >
              Browse the contestants in the meantime
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
