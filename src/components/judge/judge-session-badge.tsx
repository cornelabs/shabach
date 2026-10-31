import { Link } from "@tanstack/react-router";
import { Gavel, ShieldCheck, UserCheck, ArrowRightLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { JudgeId } from "@/lib/demo/types";
import { useActiveJudgeSession } from "./use-active-judge";

interface JudgeSessionBadgeProps {
  currentSeatId?: JudgeId;
  showSwitchAction?: boolean;
}

export function JudgeSessionBadge({
  currentSeatId,
  showSwitchAction = true,
}: JudgeSessionBadgeProps) {
  const { staffSession, activeJudge } = useActiveJudgeSession();

  const isAssignedSeat =
    staffSession?.assignedSeat && currentSeatId
      ? staffSession.assignedSeat === currentSeatId
      : false;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-cream-line bg-card px-3.5 py-2 text-xs shadow-sm">
      <div className="flex items-center gap-1.5 text-forest font-semibold">
        <Gavel className="h-3.5 w-3.5 text-gold" />
        <span>Active Seat: {activeJudge?.name ?? currentSeatId ?? "Not selected"}</span>
      </div>

      {staffSession ? (
        <Badge variant="outline" className="gap-1 border-forest/30 bg-forest/5 text-forest">
          <ShieldCheck className="h-3 w-3 text-forest" />
          <span>
            {staffSession.displayName || staffSession.fullName}
            {isAssignedSeat ? " (Verified)" : ""}
          </span>
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1 text-[11px]">
          <UserCheck className="h-3 w-3 text-forest-soft" />
          <span>Independent Judge</span>
        </Badge>
      )}

      {showSwitchAction && (
        <Link
          to="/judges"
          className="ml-auto inline-flex items-center gap-1 font-semibold text-gold-deep hover:text-forest hover:underline"
        >
          <ArrowRightLeft className="h-3 w-3" />
          <span>Switch Seat</span>
        </Link>
      )}
    </div>
  );
}
