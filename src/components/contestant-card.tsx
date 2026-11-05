import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

import { ContestantAvatar } from "@/components/contestant-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VoteConfirmationDialog } from "@/components/vote-confirmation-dialog";
import { typeLabel } from "@/lib/demo/labels";
import { rubricFor } from "@/lib/demo/rubrics";
import type { Contestant, VotingStatus } from "@/lib/demo/types";

interface Props {
  contestant: Contestant;
  votingStatus: VotingStatus;
  /** The contestant this browser already voted for, if any. */
  myVote: string | null;
}

export function ContestantCard({ contestant, votingStatus, myVote }: Props) {
  const [voteDialogOpen, setVoteDialogOpen] = React.useState(false);
  const votedForThis = myVote === contestant.id || myVote === contestant.code;
  const votingDisabled = votingStatus !== "open" || myVote !== null;
  const rubric = rubricFor(contestant.type);
  const allocatedMinutes = Math.round(rubric.timeLimitSec / 60);

  return (
    <>
      <div className="group flex flex-col rounded-2xl border border-cream-line bg-card p-4 shadow-card transition-shadow hover:shadow-lift">
        <Link
          to="/contestants/$code"
          params={{ code: contestant.code }}
          className="flex items-start gap-3"
        >
          <ContestantAvatar
            name={contestant.name}
            avatarUrl={contestant.avatarUrl}
            hue={contestant.hue}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-display text-lg text-forest">{contestant.name}</h3>
              <span className="shrink-0 text-xs font-semibold text-charcoal-muted">
                № {contestant.order}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-forest">
              <Clock className="h-3.5 w-3.5 text-gold shrink-0" />
              <span>Time: {allocatedMinutes} mins allocated</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="font-medium text-xs">
                {typeLabel(contestant.type)}
              </Badge>
              <Badge variant="outline" className="font-medium text-xs">
                {contestant.district}
              </Badge>
            </div>
          </div>
        </Link>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-cream-line pt-3">
          {votedForThis ? (
            <span className="text-sm font-semibold text-forest-soft">✓ Your vote is here</span>
          ) : (
            <Button size="sm" disabled={votingDisabled} onClick={() => setVoteDialogOpen(true)}>
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
        open={voteDialogOpen}
        onOpenChange={setVoteDialogOpen}
      />
    </>
  );
}
