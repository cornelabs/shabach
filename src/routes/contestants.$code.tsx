import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, BadgeCheck, QrCode, Vote } from "lucide-react";

import { Monogram } from "@/components/monogram";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoState } from "@/hooks/use-demo";
import { castVote } from "@/lib/demo/store";
import { typeLabel } from "@/lib/demo/labels";
import { buildContestants } from "@/lib/demo/seed";
import { rubricFor } from "@/lib/demo/rubrics";
import { formatSeconds } from "@/lib/demo/labels";

export const Route = createFileRoute("/contestants/$code")({
  loader: ({ params }) => {
    const code = params.code.toUpperCase();
    const contestant = buildContestants().find((c) => c.code === code);
    if (!contestant) throw notFound();
    return { code };
  },
  head: ({ params }) => {
    const contestant = buildContestants().find((c) => c.code === params.code.toUpperCase());
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

function VotePanel({ contestantId, name }: { contestantId: string; name: string }) {
  const state = useDemoState();
  const myVote = state.browserVote?.contestantId ?? null;
  const votedForThis = myVote === contestantId;

  function handleVote() {
    const result = castVote(contestantId);
    if (result.ok) {
      toast.success(`Vote recorded for ${name} (demo)`, {
        description: "One vote per person — thank you for voting.",
      });
    } else if (result.reason === "already_voted") {
      toast.error("You've already voted in this browser", {
        description: "One vote per person across the whole competition.",
      });
    } else if (result.reason === "not_open") {
      toast.info("Voting hasn't opened yet.");
    } else {
      toast.info("Voting is closed.");
    }
  }

  return (
    <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
      <h2 className="font-display text-xl text-forest">Public vote</h2>
      {state.votingStatus === "open" ? (
        votedForThis ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-forest-soft">
            <BadgeCheck className="h-5 w-5" />
            Your vote for {name} is recorded (demo).
          </p>
        ) : myVote ? (
          <p className="mt-3 text-sm text-charcoal-muted">
            You've already voted for another contestant in this browser — one vote per person, and
            it can't be changed.
          </p>
        ) : (
          <>
            <p className="mt-3 text-sm text-charcoal-muted">
              One vote per person. Your vote is stored only in this demo browser.
            </p>
            <Button className="mt-4 w-full" onClick={handleVote}>
              <Vote className="h-4 w-4" /> Vote for {name}
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
  );
}

function SharePanel({ code }: { code: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(window.location.href);
  }, []);
  const qr = useQrDataUrl(url);
  return (
    <div className="rounded-2xl border border-cream-line bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 font-display text-xl text-forest">
        <QrCode className="h-5 w-5 text-gold" /> Share this profile
      </h2>
      <p className="mt-2 text-sm text-charcoal-muted">
        Share code <span className="font-mono font-semibold text-charcoal">{code}</span> — scan or
        send the link so others can read the profile and vote.
      </p>
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

function ContestantProfile() {
  const { code } = Route.useParams();
  const state = useDemoState();
  const contestant = state.contestants.find((c) => c.code === code.toUpperCase());
  if (!contestant) return null;
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
            <VotePanel contestantId={contestant.id} name={contestant.name} />
            <SharePanel code={contestant.code} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
