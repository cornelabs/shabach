import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Gavel, Lock, Sparkles, UserCheck } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FINALE_DATE_LABEL } from "@/lib/demo/labels";
import { JUDGES, type JudgeProfile } from "@/lib/demo/types";

export const Route = createFileRoute("/judges/meet")({
  head: () => ({
    meta: [
      { title: "Meet the Grand Finale Judges — SHABACH 2026" },
      {
        name: "description",
        content:
          "Meet the 4 Grand Finale adjudicators of SHABACH 2026: Mrs. Priscillia Fayomi (Head Judge), Rex Omoigberale, David O. Umoru, and Sochi Daniel-Onuoha.",
      },
      { property: "og:title", content: "Meet the Grand Finale Judges — SHABACH 2026" },
      {
        property: "og:description",
        content:
          "Meet the 4 Grand Finale adjudicators of SHABACH 2026: Mrs. Priscillia Fayomi (Head Judge), Rex Omoigberale, David O. Umoru, and Sochi Daniel-Onuoha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeetTheJudgesPage,
});

function JudgeCard({ judge }: { judge: JudgeProfile }) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-cream-line bg-card shadow-card transition-all hover:-translate-y-1 hover:border-gold hover:shadow-lg">
      <div className="relative aspect-[4/5] sm:aspect-[4/3] w-full overflow-hidden bg-forest-deep">
        {!imgError ? (
          <img
            src={judge.avatarUrl}
            alt={`Portrait of ${judge.name}`}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-ivory">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-gold">
              <UserCheck className="h-8 w-8" />
            </div>
            <p className="mt-3 font-display text-xl">{judge.name}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <Badge className="bg-gold text-forest-deep font-bold text-xs shadow-sm">
            {judge.seatTitle}
          </Badge>
          <span className="rounded-full bg-forest-deep/80 px-2.5 py-1 text-[11px] font-semibold text-ivory backdrop-blur-sm">
            {judge.id === "judge1" ? "Head Adjudicator" : "Adjudicator"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="font-display text-2xl font-bold text-forest transition-colors group-hover:text-gold-deep">
          {judge.name}
        </h2>

        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-gold-deep">
          {judge.roleTitle}
        </p>

        <p className="mt-1 text-xs font-medium text-charcoal-muted italic">
          {judge.label}
        </p>

        <div className="mt-3 border-t border-cream-line pt-3">
          <p className="text-sm leading-relaxed text-charcoal">
            {judge.bio}
          </p>
        </div>
      </div>
    </article>
  );
}

export function MeetTheJudgesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Navigation & breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
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

      {/* Header section */}
      <div className="border-b border-cream-line pb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-wash px-3 py-1 text-xs font-semibold text-forest">
          <Sparkles className="h-3.5 w-3.5 text-gold" /> Grand Finale Adjudication Panel
        </div>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-forest">
          Meet the 4 Grand Finale Judges
        </h1>
        <p className="mt-2 max-w-3xl text-sm sm:text-base leading-relaxed text-charcoal-muted">
          Four distinguished creative visionaries, technical leaders, and ministerial directors
          appointed to evaluate the 16 Grand Finale finalists across Music, Spoken Word, Dance,
          Drama, and Visual Arts.
        </p>
      </div>

      {/* 4 Judges Showcase Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
        {JUDGES.map((judge) => (
          <JudgeCard key={judge.id} judge={judge} />
        ))}
      </div>

      {/* Callout Link to Judges Panel */}
      <div className="mt-12 rounded-2xl border-2 border-gold/40 bg-gradient-to-br from-card to-parchment p-6 sm:p-8 shadow-card">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-deep">
              <Gavel className="h-4 w-4 text-gold" />
              <span>Authorized Access</span>
            </div>
            <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-forest">
              Official Judges' Workspace & Scoring Desk
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm text-charcoal-muted leading-relaxed">
              Are you an appointed judge? Access the confidential scoring desk with your assigned PIN
              to score finalists on official rubrics and submit verified tallies.
            </p>
          </div>

          <Link to="/judges">
            <Button className="shrink-0 bg-forest text-ivory hover:bg-forest-deep gap-2 text-xs sm:text-sm">
              <Lock className="h-3.5 w-3.5 text-gold" /> Access Judges' Panel
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
