import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Eye, EyeOff, Gavel, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_PANEL_CODE,
  grantJudgeAccess,
  JUDGE_SEAT_PINS,
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
  const targetPin = requiredSeatId ? JUDGE_SEAT_PINS[requiredSeatId] : null;

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

  function handleUseQuickCode(quickCode: string) {
    setCode(quickCode);
    setError(null);
  }

  return (
    <div className="mx-auto my-12 max-w-md px-4">
      <div className="rounded-3xl border border-cream-line bg-card p-6 shadow-card sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-gold shadow-sm">
          <Lock className="h-7 w-7" />
        </div>

        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-forest">
            <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Protected Staff Zone
          </div>
          <h2 className="mt-3 font-display text-2xl text-forest sm:text-3xl">
            {seatJudge ? `${seatJudge.name}'s Workspace` : "Judges' Workspace Access"}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-charcoal-muted sm:text-sm">
            {seatJudge
              ? `Enter your 4-digit seat PIN (${targetPin}) or the Chief Judge access code to open this scorecard desk.`
              : "Scoring is restricted to appointed competition judges. Please enter your Panel Access Code or 4-digit seat PIN."}
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
                placeholder={requiredSeatId ? `Enter PIN (e.g. ${targetPin})` : "Enter code or PIN..."}
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

        {/* Quick fill / Rehearsal hints */}
        <div className="mt-6 rounded-2xl border border-gold/30 bg-gold-wash/50 p-3.5 text-xs">
          <p className="font-semibold text-forest flex items-center gap-1.5">
            <Gavel className="h-3.5 w-3.5 text-gold" /> Rehearsal & Testing Access:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleUseQuickCode(DEFAULT_PANEL_CODE)}
              className="rounded-lg bg-card px-2.5 py-1 font-mono text-[11px] font-semibold text-forest border border-cream-line hover:border-gold"
            >
              Panel: {DEFAULT_PANEL_CODE}
            </button>
            {JUDGES.map((j) => (
              <button
                key={j.id}
                type="button"
                onClick={() => handleUseQuickCode(JUDGE_SEAT_PINS[j.id])}
                className="rounded-lg bg-card px-2 py-1 font-mono text-[11px] text-charcoal border border-cream-line hover:border-gold"
              >
                {j.name.split(" ")[1] || j.id}: {JUDGE_SEAT_PINS[j.id]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-medium text-charcoal-muted hover:text-forest hover:underline"
          >
            ← Return to Public Home
          </Link>
        </div>
      </div>
    </div>
  );
}
