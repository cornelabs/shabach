import * as React from "react";
import { Link } from "@tanstack/react-router";

import { Monogram } from "@/components/monogram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VoteConfirmationDialog } from "@/components/vote-confirmation-dialog";
import { typeLabel } from "@/lib/demo/labels";
import type { Contestant, VotingStatus } from "@/lib/demo/types";

interface Props {
  contestant: Contestant;
  votingStatus: VotingStatus;
  /** The contestant this browser already voted for, if any. */
  myVote: string | null;
}

export function ContestantCard({ contestant, votingStatus, myVote }: Props) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const votedForThis = myVote === contestant.id;
  const votingDisabled = votingStatus !== "open" || myVote !== null;

  return (
    <>
      <div className="group flex flex-col rounded-2xl border border-cream-line bg-card p-4 shadow-card transition-shadow hover:shadow-lift">
        <Link
          to="/contestants/$code"
          params={{ code: contestant.code }}
          className="flex items-start gap-3"
        >
          <Monogram name={contestant.name} hue={contestant.hue} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-display text-lg text-forest">{contestant.name}</h3>
              <span className="shrink-0 text-xs font-semibold text-charcoal-muted">
                № {contestant.order}
              </span>
            </div>
            <p className="truncate text-sm text-charcoal-muted">{contestant.title}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="font-medium">
                {typeLabel(contestant.type)}
              </Badge>
              <Badge variant="outline" className="font-medium">
                {contestant.district}
              </Badge>
            </div>
          </div>
        </Link>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-cream-line pt-3">
          {votedForThis ? (
            <span className="text-sm font-semibold text-forest-soft">✓ Your vote is here</span>
          ) : (
            <Button
              size="sm"
              disabled={votingDisabled}
              onClick={() => setConfirmOpen(true)}
              className="bg-forest text-ivory hover:bg-forest-deep"
            >
              Vote
            </Button>
          )}
          <Link
            to="/contestants/$code"
            params={{ code: contestant.code }}
            className="text-xs font-semibold text-charcoal-muted hover:text-forest"
          >
            Profile · {contestant.code}
          </Link>
        </div>
      </div>

      <VoteConfirmationDialog
        contestant={contestant}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
      />
    </>
  );
}
