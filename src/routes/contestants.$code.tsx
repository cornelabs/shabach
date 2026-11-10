import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as React from "react";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, Check, Copy, QrCode, Share2, Vote } from "lucide-react";

import { Monogram } from "@/components/monogram";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VoteConfirmationDialog } from "@/components/vote-confirmation-dialog";
import { useDemoState } from "@/hooks/use-demo";
import { getDataAdapter } from "@/lib/db/adapter";
import { refreshFromSupabase } from "@/lib/demo/store";
import { typeLabel, formatSeconds } from "@/lib/demo/labels";
import { buildContestants } from "@/lib/demo/seed";
import { rubricFor } from "@/lib/demo/rubrics";
import type { Contestant } from "@/lib/demo/types";

type Rubric = ReturnType<typeof rubricFor>;

async function resolveContestant(code: string): Promise<Contestant | null> {
  const cleanCode = code.trim().toUpperCase();
  try {
    const adapter = getDataAdapter();
    const contestant = await adapter.getContestantByCode(cleanCode);
    if (contestant) return contestant;
  } catch (err) {
    console.warn("Error loading contestant from adapter:", err);
  }

  // Graceful fallback to demo seed
  const fallback = buildContestants().find((c) => c.code.toUpperCase() === cleanCode);
  return fallback ?? null;
}

export const Route = createFileRoute("/contestants/$code")({
  loader: async ({ params }) => {
    const code = params.code.trim().toUpperCase();
    const contestant = await resolveContestant(code);
    if (!contestant) {
      throw notFound();
    }
    return { code, contestant };
  },
  head: ({ loaderData }) => {
    const contestant = loaderData?.contestant;
    return {
      meta: [
        {
          title: contestant ? `${contestant.name} — SHABACH 2026` : "Contestant — SHABACH 2026",
        },
        {
          name: "description",
          content: contestant
            ? `${contestant.name} (${contestant.district}) competing at the SHABACH 2026 Grand Finale. Meet the act and cast your public vote.`
            : "Meet the contestants of SHABACH 2026.",
        },
        {
          property: "og:title",
          content: contestant ? `${contestant.name} — SHABACH 2026` : "Contestant — SHABACH 2026",
        },
        {
          property: "og:description",
          content: contestant ? contestant.bio : "Meet the contestants of SHABACH 2026.",
        },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ContestantNotFound,
  component: ContestantProfile,
});

function useQrDataUrl(url: string | null) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    void import("qrcode").then((qrcode) =>
      qrcode.toDataURL(url, { margin: 1, width: 220 }).then((qr) => {
        if (!cancelled) setDataUrl(qr);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [url]);
  return dataUrl;
}

function ContestantHero({ contestant, rubric }: { contestant: Contestant; rubric: Rubric }) {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className="rounded-2xl border border-cream-line bg-card p-5 sm:p-6 shadow-card">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
        {/* Prominent Portrait Hero Image */}
        <div className="relative aspect-[4/5] w-full max-w-[240px] sm:w-56 sm:max-w-none shrink-0 overflow-hidden rounded-2xl border-2 border-gold/40 bg-forest-deep shadow-md">
          {contestant.avatarUrl && !imgError ? (
            <img
              src={contestant.avatarUrl}
              alt={`${contestant.name} contestant portrait`}
              className="h-full w-full object-cover object-top"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-ivory">
              <Monogram name={contestant.name} hue={contestant.hue} size="xl" className="h-28 w-28 text-3xl" />
              <p className="mt-3 font-display text-lg text-gold-soft">{contestant.code}</p>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <Badge className="bg-forest-deep/90 text-ivory text-[10px] font-mono border border-cream-line/20 backdrop-blur-xs">
              № {contestant.order}
            </Badge>
            <Badge className="bg-gold text-forest-deep text-[10px] font-bold shadow-xs">
              {contestant.code}
            </Badge>
          </div>
        </div>

        {/* Hero Details */}
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-deep">
            Running order № {contestant.order} · {contestant.code}
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-forest">
            {contestant.name}
          </h1>
          <p className="mt-2 text-sm text-charcoal font-medium">
            "{contestant.title || `${typeLabel(contestant.type)} Performance`}"
          </p>

          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
            <Badge className="bg-forest text-ivory text-xs font-semibold">
              {typeLabel(contestant.type)}
            </Badge>
            <Badge variant="outline" className="text-xs font-medium border-forest/30 text-forest">
              {contestant.district}
            </Badge>
            <Badge variant="secondary" className="text-xs font-mono">
              Time limit: {formatSeconds(rubric.timeLimitSec)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function VotePanel({ contestant }: { contestant: Contestant }) {
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);
  const state = useDemoState();
  const myVote = state.browserVote?.contestantId ?? null;
  const votedForThis = myVote === contestant.id || myVote === contestant.code;
  const hasVoted = Boolean(myVote);

  return (
    <>
      <div className="rounded-2xl border-2 border-gold/40 bg-card p-5 sm:p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl sm:text-2xl text-forest font-bold">Public vote</h2>
          {hasVoted ? (
            <Badge className="bg-forest-soft text-ivory text-xs font-semibold gap-1">
              <BadgeCheck className="h-3.5 w-3.5" />
              {votedForThis ? "Verified Vote Recorded" : "Vote Recorded"}
            </Badge>
          ) : (
            <Badge variant="outline" className="border-gold/60 text-gold-deep text-xs font-medium">
              1 Vote Per Person
            </Badge>
          )}
        </div>

        {state.votingStatus === "open" ? (
          hasVoted ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs sm:text-sm font-medium text-charcoal">
                {votedForThis
                  ? `Your official verified vote for ${contestant.name} has been recorded.`
                  : "You have already cast your single vote across the competition in this browser."}
              </p>
              <Button
                disabled
                className="w-full bg-forest/40 text-ivory/70 cursor-not-allowed font-medium text-sm gap-2"
              >
                <Check className="h-4 w-4" /> You voted already
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                Cast your vote for {contestant.name}. Each voter receives exactly one verified vote
                across the entire Grand Finale.
              </p>
              <Button
                className="w-full bg-forest text-ivory hover:bg-forest-deep shadow-sm text-sm font-semibold gap-2 py-2.5"
                onClick={() => setVoteDialogOpen(true)}
              >
                <Vote className="h-4 w-4 text-gold" /> Vote for {contestant.name}
              </Button>
            </div>
          )
        ) : (
          <div className="mt-4 space-y-3">
            <p className="text-xs sm:text-sm text-charcoal-muted">
              {state.votingStatus === "closed"
                ? "Public voting is closed. Follow the verified results on the results page."
                : "Public voting opens officially during the Grand Finale live broadcast."}
            </p>
            {hasVoted && (
              <Button disabled className="w-full bg-forest/40 text-ivory/70 cursor-not-allowed text-sm">
                You voted already
              </Button>
            )}
          </div>
        )}
      </div>

      <VoteConfirmationDialog
        contestant={contestant}
        open={voteDialogOpen}
        onOpenChange={setVoteDialogOpen}
        onVoteCast={() => {
          void refreshFromSupabase();
        }}
      />
    </>
  );
}

async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
    }
  }
  if (typeof document !== "undefined") {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }
  return false;
}

function SharePanel({ code }: { code: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const qr = useQrDataUrl(url);

  async function copyCode() {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedCode(true);
      toast.success(`Copied code ${code} to clipboard`);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      toast.error(`Could not copy code ${code}`);
    }
  }

  async function copyLink() {
    const targetUrl = url || (typeof window !== "undefined" ? window.location.href : "");
    if (!targetUrl) return;
    const ok = await copyToClipboard(targetUrl);
    if (ok) {
      setCopiedLink(true);
      toast.success("Profile link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      toast.error("Could not copy profile link");
    }
  }

  return (
    <div className="rounded-2xl border border-cream-line bg-card p-5 sm:p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-xl text-forest font-bold">
        <QrCode className="h-5 w-5 text-gold" /> Share this profile
      </h2>
      <p className="mt-2 text-xs sm:text-sm text-charcoal-muted">
        Share code <span className="font-mono font-semibold text-charcoal">{code}</span> — scan or
        send the link so others can read the profile and vote.
      </p>

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={copyCode}>
          {copiedCode ? (
            <Check className="mr-1 h-3.5 w-3.5 text-forest" />
          ) : (
            <Copy className="mr-1 h-3.5 w-3.5" />
          )}
          {copiedCode ? "Code Copied" : "Copy Code"}
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={copyLink}>
          {copiedLink ? (
            <Check className="mr-1 h-3.5 w-3.5 text-forest" />
          ) : (
            <Share2 className="mr-1 h-3.5 w-3.5" />
          )}
          {copiedLink ? "Link Copied" : "Copy Link"}
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-center rounded-xl border border-cream-line bg-ivory p-3">
        {qr ? (
          <img
            src={qr}
            alt={`QR code linking to contestant profile ${code}`}
            className="h-[200px] w-[200px]"
          />
        ) : (
          <div className="h-[200px] w-[200px] animate-pulse rounded bg-parchment" aria-hidden />
        )}
      </div>
    </div>
  );
}

function ContestantNotFound() {
  let code = "";
  try {
    const params = Route.useParams();
    code = params?.code ? params.code.toUpperCase() : "";
  } catch {
    // Outside router context
  }

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="rounded-2xl border border-cream-line bg-card p-8 shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-wash text-gold">
            <Vote className="h-7 w-7" />
          </div>
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-widest text-gold">
            404 · Finalist Not Found
          </p>
          <h1 className="mt-2 font-display text-3xl text-forest">
            {code ? `No finalist with code “${code}”` : "Contestant not found"}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-charcoal-muted">
            We couldn't find an official SHABACH 2026 finalist matching this code. Please check that
            you entered the correct 6-character code, or explore all 16 finalists below.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/contestants"
              className="inline-flex items-center gap-2 rounded-lg bg-forest px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-forest-deep"
            >
              <ArrowLeft className="h-4 w-4" /> All contestants
            </Link>
            <Link
              to="/results"
              className="inline-flex items-center gap-2 rounded-lg border border-cream-line bg-card px-5 py-2.5 text-sm font-semibold text-forest hover:bg-parchment"
            >
              View results
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ContestantProfile() {
  let code = "";
  let loaderContestant: Contestant | undefined;
  try {
    const params = Route.useParams();
    if (params?.code) code = params.code;
  } catch {
    // Outside router context
  }
  if (!code) {
    try {
      const loaderData = Route.useLoaderData();
      code = loaderData?.code || "";
      loaderContestant = loaderData?.contestant;
    } catch {
      // Outside router context
    }
  }
  const state = useDemoState();
  const contestant =
    (code ? state.contestants.find((c) => c.code.toUpperCase() === code.toUpperCase()) : null) ??
    loaderContestant ??
    state.contestants[0];
  if (!contestant) return <ContestantNotFound />;
  const rubric = rubricFor(contestant.type as any) ?? rubricFor("music");

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <Link
          to="/contestants"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-charcoal-muted hover:text-forest transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All contestants
        </Link>

        {/* Responsive Grid: Single column on mobile with Vote card right after Hero, 2-column with sidebar on desktop */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* 1. Hero Presentation */}
          <div className="lg:col-start-1 lg:row-start-1">
            <ContestantHero contestant={contestant} rubric={rubric} />
          </div>

          {/* 2. Public Vote Panel — Directly after Hero on mobile, Top of sidebar on desktop */}
          <div className="lg:col-start-2 lg:row-start-1">
            <VotePanel contestant={contestant} />
          </div>

          {/* 3. Contestant Profile Card — Below Vote on mobile, Below Hero on desktop */}
          <div className="lg:col-start-1 lg:row-start-2">
            <div className="rounded-2xl border border-cream-line bg-card p-5 sm:p-6 shadow-card">
              <h2 className="font-display text-xl sm:text-2xl text-forest font-bold">
                Contestant Profile
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                <div className="rounded-xl border border-cream-line bg-ivory p-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                    District Representation
                  </span>
                  <p className="mt-1 font-display text-lg text-forest font-bold">{contestant.district}</p>
                </div>
                <div className="rounded-xl border border-cream-line bg-ivory p-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
                    Competition Category
                  </span>
                  <p className="mt-1 font-display text-lg text-forest font-bold">{typeLabel(contestant.type)}</p>
                </div>
              </div>
              <p className="mt-4 text-xs sm:text-sm text-charcoal-muted leading-relaxed">
                {contestant.bio ||
                  `Official finalist representing ${contestant.district} in the ${typeLabel(contestant.type)} category at the SHABACH 2026 Grand Finale. Adjudicated live by the panel of 4 judges and public audience vote.`}
              </p>
            </div>
          </div>

          {/* 4. Share Panel — Below Vote Panel on desktop */}
          <div className="lg:col-start-2 lg:row-start-2">
            <SharePanel code={contestant.code} />
          </div>

          {/* 5. How Contestant will be scored (Rubrics) */}
          <div className="lg:col-start-1 lg:row-start-3">
            <div className="rounded-2xl border border-cream-line bg-card p-5 sm:p-6 shadow-card">
              <h2 className="font-display text-xl sm:text-2xl text-forest font-bold">
                How {contestant.name} will be scored
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-charcoal-muted">
                {typeLabel(contestant.type)} rubric — five criteria, 95 raw points, plus up to 5
                points from the public vote.
              </p>
              <ul className="mt-4 space-y-3">
                {rubric.criteria.map((criterion) => (
                  <li
                    key={criterion.key}
                    className="flex items-start justify-between gap-4 border-b border-cream-line/50 pb-2.5 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-charcoal">{criterion.name}</p>
                      <p className="text-xs text-charcoal-muted">{criterion.guidance}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-parchment px-2 py-0.5 text-xs font-semibold text-forest">
                      /{criterion.max}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
