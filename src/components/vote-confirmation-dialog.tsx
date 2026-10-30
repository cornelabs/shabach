import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Vote } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { castVote } from "@/lib/demo/store";
import { typeLabel } from "@/lib/demo/labels";
import type { Contestant } from "@/lib/demo/types";

interface Props {
  contestant: Contestant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoteCast?: () => void;
}

export function VoteConfirmationDialog({ contestant, open, onOpenChange, onVoteCast }: Props) {
  const [submitting, setSubmitting] = React.useState(false);

  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Simulate minor async processing to prevent double taps and allow honest UI state
      await new Promise((resolve) => setTimeout(resolve, 300));
      const res = castVote(contestant.id);

      if (res.ok) {
        toast.success(`Vote confirmed for ${contestant.name}!`, {
          description: `Your single vote for the SHABACH 2026 Grand Finale has been recorded.`,
        });
        onOpenChange(false);
        onVoteCast?.();
      } else {
        if (res.reason === "already_voted") {
          toast.error("You have already voted", {
            description: "Each voter receives only one final vote across the entire competition.",
          });
        } else if (res.reason === "not_open") {
          toast.info("Voting is not open yet.", {
            description: "Voting will open officially during the Grand Finale.",
          });
        } else if (res.reason === "closed") {
          toast.info("Voting has closed.", {
            description: "Public voting is closed for official score verification.",
          });
        } else {
          toast.error("Contestant not found", {
            description: "Unable to cast vote for this contestant entry.",
          });
        }
        onOpenChange(false);
      }
    } catch {
      toast.error("Something went wrong while casting your vote. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(val) => !submitting && onOpenChange(val)}>
      <AlertDialogContent className="border-cream-line bg-card sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest text-gold sm:mx-0">
            <Vote className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="font-display text-2xl text-forest">
            Confirm your vote
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-charcoal-muted">
            Please verify your selected contestant before confirming. You get{" "}
            <strong className="text-forest">one final vote</strong> across the entire Grand Finale.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-xl border border-cream-line bg-ivory p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-display text-lg text-forest">{contestant.name}</h4>
            <span className="font-mono text-xs font-bold text-gold-soft bg-forest px-2 py-0.5 rounded">
              {contestant.code}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-charcoal italic">“{contestant.title}”</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs">
              {typeLabel(contestant.type)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {contestant.district}
            </Badge>
          </div>
        </div>

        <div className="rounded-lg bg-gold-wash border border-gold/30 p-3 text-xs leading-relaxed text-forest">
          <p className="flex items-start gap-2 font-medium">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>
              <strong>One-vote rule:</strong> Once cast, your vote cannot be cancelled, transferred,
              or changed to another contestant.
            </span>
          </p>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={submitting} className="border-cream-line">
            Cancel
          </AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={submitting}
            className="bg-forest text-ivory hover:bg-forest-deep"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recording vote...
              </>
            ) : (
              <>Confirm Vote</>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
