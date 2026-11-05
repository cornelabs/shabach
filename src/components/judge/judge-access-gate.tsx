import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  grantJudgeAccess,
  verifyJudgeCode,
} from "@/lib/auth/judge-access";
import { JUDGES, type JudgeId } from "@/lib/demo/types";

interface Props {
  requiredSeatId?: JudgeId;
  onUnlocked?: (seatId: JudgeId | "all") => void;
}

export function JudgeAccessGate({ requiredSeatId, onUnlocked }: Props) {
  const [code, setCode] = React.useState("");
  const [showCode, setShowCode] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const seatJudge = requiredSeatId ? JUDGES.find((j) => j.id === requiredSeatId) : null;

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = verifyJudgeCode(code);
      if (!result.valid) {
        setError(result.message || "Invalid access code.");
        toast.error("Access denied", { description: result.message });
        setLoading(false);
        return;
      }

      // If specific seat required, ensure either master code or matching seat PIN
      if (requiredSeatId && result.seatId !== "all" && result.seatId !== requiredSeatId) {
        setError(`This access code is for a different seat. Please enter the PIN for ${seatJudge?.name || "this seat"}.`);
        toast.error("Seat mismatch", {
          description: `Access code does not grant access to ${seatJudge?.name || "this seat"}.`,
        });
        setLoading(false);
        return;
      }

      const grantedSeat = result.seatId || "all";
      grantJudgeAccess(grantedSeat);
      toast.success("Workspace unlocked", {
        description:
          grantedSeat === "all"
            ? "Full judging panel unlocked."
            : `Unlocked seat for ${seatJudge?.name || grantedSeat}.`,
      });
      onUnlocked?.(grantedSeat);
    } catch {
      setError("An error occurred during verification. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto my-12 max-w-md px-4">
      <div className="rounded-3xl border border-cream-line bg-card p-6 shadow-card sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-gold shadow-sm">
          <Lock className="h-7 w-7" />
        </div>

        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-forest">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Protected Judges Zone
          </div>
          <h2 className="mt-3 font-display text-2xl text-forest sm:text-3xl">
            {seatJudge ? `${seatJudge.name}'s Workspace` : "Judges' Workspace Access"}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-charcoal-muted sm:text-sm">
            {seatJudge
              ? "Enter your confidential 4-digit seat PIN or the Panel Access Code to open this scorecard desk."
              : "Scoring is restricted to appointed competition judges. Please enter your confidential Panel Access Code or 4-digit seat PIN."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="judge-code" className="text-xs font-semibold text-forest">
              Access Code or Seat PIN
            </Label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-charcoal-muted">
                <KeyRound className="h-4 w-4" />
              </div>
              <Input
                id="judge-code"
                type={showCode ? "text" : "password"}
                placeholder="Enter access code or 4-digit PIN..."
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                autoFocus
                disabled={loading}
                className="pl-9 pr-10 text-sm font-mono tracking-wider bg-ivory border-cream-line"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-charcoal-muted hover:text-forest"
                aria-label={showCode ? "Hide code" : "Show code"}
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}

          <Button
            type="submit"
            disabled={!code.trim() || loading}
            className="w-full bg-forest text-ivory hover:bg-forest-deep gap-2 h-10"
          >
            Unlock Workspace <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-6 rounded-2xl border border-cream-line bg-ivory/60 p-3 text-center text-xs text-charcoal-muted">
          Need access? Seat PINs and access codes are distributed privately to appointed judges by the score desk.
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-medium text-charcoal-muted hover:text-forest hover:underline"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
