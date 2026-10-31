import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { typeLabel, formatSeconds } from "@/lib/demo/labels";
import { buildContestants } from "@/lib/demo/seed";
import { rubricFor } from "@/lib/demo/rubrics";
import type { Contestant } from "@/lib/demo/types";

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
  head: ({ loaderData, params }) => {
    const contestant = loaderData?.contestant;
    return {
      meta: [
        {
          title: contestant ? `${contestant.name} — SHABACH 2026` : "Contestant — SHABACH 2026",
        },
        {
          name: "description",
          content: contestant
            ? `${contestant.name} (${contestant.district}) performs "${contestant.title}" at the SHABACH 2026 Grand Finale. Meet the act and cast your public vote.`
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

function VotePanel({ contestant }: { contestant: Contestant }) {
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);
  const state = useDemoState();
  const myVote = state.browserVote?.contestantId ?? null;
  const votedForThis = myVote === contestant.id || myVote === contestant.code;

  return (
    <>
      <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
        <h2 className="font-display text-xl text-forest">Public vote</h2>
        {state.votingStatus === "open" ? (
          votedForThis ? (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-forest-soft">
              <BadgeCheck className="h-5 w-5" />
              Your vote for {contestant.name} is recorded.
            </p>
          ) : myVote ? (
            <p className="mt-3 text-sm text-charcoal-muted">
              You've already voted for another contestant in this browser — one vote per person, and
              it can't be changed.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm text-charcoal-muted">
                One vote per person. Your vote contributes to the official audience score.
              </p>
              <Button
                className="mt-4 w-full bg-forest text-ivory hover:bg-forest-deep"
                onClick={() => setVoteDialogOpen(true)}
              >
                <Vote className="h-4 w-4 mr-2" /> Vote for {contestant.name}
              </Button>
            </>
          )
        ) : (
          <p className="mt-3 text-sm text-charcoal-muted">
            {state.votingStatus === "closed"
              ? "Voting is closed. Follow the verified results on the results page."
              : "Voting opens at the Grand Finale."}
          </p>
        )}
      </div>

      <VoteConfirmationDialog
        contestant={contestant}
        open={voteDialogOpen}
        onOpenChange={setVoteDialogOpen}
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
    <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-xl text-forest">
        <QrCode className="h-5 w-5 text-gold" /> Share this profile
      </h2>
      <p className="mt-2 text-sm text-charcoal-muted">
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
            className="h-[220px] w-[220px]"
          />
        ) : (
          <div className="h-[220px] w-[220px] animate-pulse rounded bg-parchment" aria-hidden />
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
              to="/"
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
  const loaderData = Route.useLoaderData();
  const code = loaderData?.code || "";
  const loaderContestant = loaderData?.contestant;
  const state = useDemoState();
  const contestant =
    state.contestants.find((c) => c.code.toUpperCase() === code.toUpperCase()) ?? loaderContestant;
  if (!contestant) return <ContestantNotFound />;
  const rubric = rubricFor(contestant.type);

  return (
    <div className="min-h-screen bg-ivory">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-muted hover:text-forest"
        >
          <ArrowLeft className="h-4 w-4" /> All contestants
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="flex items-center gap-4">
              <Monogram name={contestant.name} hue={contestant.hue} size="xl" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gold">
                  Running order № {contestant.order} · {contestant.code}
                </p>
                <h1 className="mt-1 font-display text-4xl text-forest">{contestant.name}</h1>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="secondary">{typeLabel(contestant.type)}</Badge>
                  <Badge variant="outline">{contestant.district}</Badge>
                  <Badge variant="outline">Time limit {formatSeconds(rubric.timeLimitSec)}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-cream-line bg-card p-6 shadow-card">
              <h2 className="font-display text-xl text-forest">Performance</h2>
              <p className="mt-2 text-lg font-semibold text-charcoal">“{contestant.title}”</p>
              <p className="mt-3 leading-relaxed text-charcoal-muted">{contestant.bio}</p>
            </div>

            <div className="mt-4 rounded-2xl border border-cream-line bg-card p-6 shadow-card">
              <h2 className="font-display text-xl text-forest">
                How {contestant.name} will be scored
              </h2>
              <p className="mt-2 text-sm text-charcoal-muted">
                {typeLabel(contestant.type)} rubric — five criteria, 95 raw points, plus up to 5
                points from the public vote.
              </p>
              <ul className="mt-4 space-y-3">
                {rubric.criteria.map((criterion) => (
                  <li key={criterion.key} className="flex items-start justify-between gap-4">
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

          <div className="space-y-4">
            <VotePanel contestant={contestant} />
            <SharePanel code={contestant.code} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
