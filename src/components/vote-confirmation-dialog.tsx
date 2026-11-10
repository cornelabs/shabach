import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Info, Loader2, Mail, Vote } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContestantAvatar } from "@/components/contestant-avatar";
import { getDataAdapter } from "@/lib/db/adapter";
import { isSupabaseConfigured } from "@/lib/db/supabase";
import { hasVoterVoted, isValidEmail, requestVoterOtp, verifyVoterOtp } from "@/lib/auth/voter-verification";
import { useDemoState } from "@/hooks/use-demo";
import { typeLabel } from "@/lib/demo/labels";
import { rubricFor } from "@/lib/demo/rubrics";
import type { Contestant } from "@/lib/demo/types";

interface Props {
  contestant: Contestant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVoteCast?: () => void;
}

export function VoteConfirmationDialog({ contestant, open, onOpenChange, onVoteCast }: Props) {
  const state = useDemoState();
  const [submitting, setSubmitting] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpSending, setOtpSending] = React.useState(false);
  const [otpVerifying, setOtpVerifying] = React.useState(false);
  const [verifiedEmail, setVerifiedEmail] = React.useState<string | null>(null);
  const [voterToken, setVoterToken] = React.useState<string | null>(null);
  const [mockCode, setMockCode] = React.useState<string | null>(null);
  const [verificationError, setVerificationError] = React.useState<string | null>(null);
  const [hasVotedToken, setHasVotedToken] = React.useState(false);
  const [justRecorded, setJustRecorded] = React.useState(false);

  // Read stored vote from localStorage if available in browser
  const storedVote = React.useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("shabach_browser_vote");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.contestantId) {
          return parsed as { contestantId: string; at?: string };
        }
      }
      const legacyId = window.localStorage.getItem("shabach_voted_contestant_id");
      if (legacyId) {
        return { contestantId: legacyId };
      }
    } catch {
      /* ignore */
    }
    return null;
  }, [open, justRecorded]);

  const votedContestantId = state.browserVote?.contestantId ?? storedVote?.contestantId ?? null;
  const hasAlreadyVoted =
    Boolean(votedContestantId) ||
    hasVotedToken ||
    justRecorded ||
    (typeof window !== "undefined" && window.localStorage.getItem("shabach_has_voted") === "true");

  // Resolve the contestant that this voter cast their single vote for
  const votedContestant = React.useMemo(() => {
    if (votedContestantId) {
      const found = state.contestants.find(
        (c) =>
          c.id === votedContestantId ||
          c.code.toUpperCase() === votedContestantId.toUpperCase(),
      );
      if (found) return found;
      if (
        contestant.id === votedContestantId ||
        contestant.code.toUpperCase() === votedContestantId.toUpperCase()
      ) {
        return contestant;
      }
    }
    if (hasAlreadyVoted) {
      return contestant;
    }
    return null;
  }, [votedContestantId, state.contestants, contestant, hasAlreadyVoted]);

  const isViewingVotedContestant =
    votedContestant &&
    (contestant.id === votedContestant.id ||
      contestant.code.toUpperCase() === votedContestant.code.toUpperCase());

  // Check voter state when opened
  React.useEffect(() => {
    if (open) {
      setVerificationError(null);
      if (typeof window !== "undefined") {
        const storedHasVoted = window.localStorage.getItem("shabach_has_voted");
        const storedToken = window.localStorage.getItem("shabach_voter_token");
        const storedEmail = window.localStorage.getItem("shabach_voter_email");
        if (storedHasVoted === "true") {
          setHasVotedToken(true);
        } else if (storedToken) {
          void hasVoterVoted(storedToken).then((voted) => {
            if (voted) setHasVotedToken(true);
          });
        }
        if (storedEmail && !email) {
          setEmail(storedEmail);
          setVerifiedEmail(storedEmail);
        }
      }
    }
  }, [open, email]);

  async function handleSendOtp() {
    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      setVerificationError("Please enter a valid email address.");
      return;
    }

    setOtpSending(true);
    setVerificationError(null);

    const isLive = isSupabaseConfigured();

    try {
      const res = await requestVoterOtp(cleanEmail, { isLive });
      if (res.success) {
        setOtpSent(true);
        if (res.mockCode) {
          setMockCode(res.mockCode);
        } else {
          setMockCode(null);
        }
        toast.success("Verification code dispatched", {
          description: res.message,
        });
      } else {
        setVerificationError(res.message);
        toast.error("Could not send code", { description: res.message });
      }
    } catch {
      setVerificationError("Verification request timed out. Please try again.");
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyOtp() {
    const cleanEmail = email.trim();
    const cleanCode = code.trim();

    if (!cleanCode || cleanCode.length !== 6) {
      setVerificationError("Please enter the 6-digit verification code.");
      return;
    }

    setOtpVerifying(true);
    setVerificationError(null);

    const isLive = isSupabaseConfigured();

    try {
      const res = await verifyVoterOtp(cleanEmail, cleanCode, { isLive });
      if (res.success) {
        const verified = res.voterEmail || cleanEmail;
        const token = res.voterToken || null;
        setVerifiedEmail(verified);
        setVoterToken(token);
        if (typeof window !== "undefined") {
          if (token) window.localStorage.setItem("shabach_voter_token", token);
          window.localStorage.setItem("shabach_voter_email", verified);
        }
        toast.success("Email verified!", {
          description: "Your identity is verified. You may now cast your official vote.",
        });
      } else {
        setVerificationError(res.message);
        toast.error("Verification failed", { description: res.message });
      }
    } catch {
      setVerificationError("Verification service error. Please try again.");
    } finally {
      setOtpVerifying(false);
    }
  }

  async function handleConfirm() {
    if (submitting || hasAlreadyVoted) return;

    // If voter entered an email and 6-digit code but hasn't verified yet, verify first
    let activeToken = voterToken;
    if (!activeToken && email.trim() && code.trim().length === 6) {
      setSubmitting(true);
      try {
        const isLive = isSupabaseConfigured();
        const verifyRes = await verifyVoterOtp(email.trim(), code.trim(), { isLive });
        if (verifyRes.success) {
          activeToken = verifyRes.voterToken || null;
          setVerifiedEmail(verifyRes.voterEmail || email.trim());
          setVoterToken(activeToken);
        } else {
          setVerificationError(verifyRes.message);
          toast.error("Verification failed", { description: verifyRes.message });
          setSubmitting(false);
          return;
        }
      } catch {
        toast.error("Verification timeout. Please try again.");
        setSubmitting(false);
        return;
      }
    }

    const isLive = isSupabaseConfigured();
    if (!activeToken) {
      if (!isLive && !email.trim()) {
        activeToken = `audience_browser_${Date.now()}`;
      } else {
        setVerificationError(
          "Email verification required: please enter your email and verify the 6-digit code sent to your inbox."
        );
        toast.error("Verification required", {
          description: "Please enter your email and verify your 6-digit code before confirming your vote.",
        });
        return;
      }
    }

    setSubmitting(true);

    try {
      const adapter = getDataAdapter();
      const voterId = activeToken;

      // 15-second timeout safeguard to prevent hanging state
      const res = await Promise.race([
        adapter.castVote(voterId, contestant.id),
        new Promise<{ success: boolean; message: string }>((_, reject) =>
          setTimeout(
            () =>
              reject(new Error("Vote request timed out. Please check your network connection.")),
            15000,
          ),
        ),
      ]);

      if (res.success) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("shabach_has_voted", "true");
          window.localStorage.setItem(
            "shabach_browser_vote",
            JSON.stringify({
              contestantId: contestant.id,
              at: new Date().toISOString(),
            }),
          );
          window.localStorage.setItem("shabach_voted_contestant_id", contestant.id);
          if (activeToken) {
            window.localStorage.setItem("shabach_voter_token", activeToken);
          }
          if (verifiedEmail) {
            window.localStorage.setItem("shabach_voter_email", verifiedEmail);
          }
        }
        setHasVotedToken(true);
        setJustRecorded(true);
        onVoteCast?.();
      } else {
        const msg = res.message.toLowerCase();
        if (msg.includes("already") || msg.includes("single vote")) {
          setHasVotedToken(true);
          setJustRecorded(true);
          if (typeof window !== "undefined") {
            window.localStorage.setItem("shabach_has_voted", "true");
          }
        } else if (msg.includes("not open") || msg.includes("not_open")) {
          toast.info("Voting is not open yet.", {
            description: "Voting will open officially during the Grand Finale.",
          });
          onOpenChange(false);
        } else if (msg.includes("closed")) {
          toast.info("Voting has closed.", {
            description: "Public voting is closed for official score verification.",
          });
          onOpenChange(false);
        } else {
          toast.error("Could not record vote", {
            description: res.message || "Unable to cast vote for this contestant entry.",
          });
          onOpenChange(false);
        }
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Something went wrong while casting your vote.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(val) => !submitting && onOpenChange(val)}>
      <AlertDialogContent className="border-cream-line bg-card sm:max-w-md">
        {hasAlreadyVoted ? (
          /* ========================================================================
             VOTER ALREADY VOTED STATE
             Clean, peaceful modal display showing that their vote is recorded.
             Never displays "Confirm Vote", email entry, or error toast.
             ======================================================================== */
          <>
            <AlertDialogHeader>
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest text-gold sm:mx-0 shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <AlertDialogTitle className="font-display text-2xl text-forest">
                Your vote has been recorded
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-charcoal-muted">
                Your single official vote for the SHABACH 2026 Grand Finale has been confirmed and saved.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Contestant who received the official vote */}
            {votedContestant ? (
              <div className="rounded-xl border-2 border-gold/40 bg-ivory p-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <ContestantAvatar
                    name={votedContestant.name}
                    avatarUrl={votedContestant.avatarUrl}
                    hue={votedContestant.hue}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-base font-bold text-forest truncate">
                        {votedContestant.name}
                      </h4>
                      <span className="font-mono text-xs font-bold text-gold-soft bg-forest px-2 py-0.5 rounded shrink-0">
                        {votedContestant.code}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-muted mt-0.5">
                      Running order № {votedContestant.order} · {votedContestant.district}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <Badge className="bg-forest text-ivory text-[10px] font-semibold">
                        {typeLabel(votedContestant.type)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-forest/30 text-forest font-semibold">
                        ✓ Official Vote Cast
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gold/40 bg-ivory p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-gold mx-auto mb-1.5" />
                <h4 className="font-display text-base font-bold text-forest">Official Vote Secured</h4>
                <p className="text-xs text-charcoal-muted mt-1">
                  Your single vote has been recorded for the SHABACH 2026 Grand Finale.
                </p>
              </div>
            )}

            {/* If opened while viewing another contestant */}
            {!isViewingVotedContestant && votedContestant && (
              <div className="rounded-lg bg-amber-50 border border-amber-200/80 p-3 text-xs leading-relaxed text-amber-900 flex items-start gap-2.5">
                <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950">
                    Viewing {contestant.name} ({contestant.code})
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Each voter receives only one vote across the entire competition. Your vote is recorded for <strong>{votedContestant.name}</strong> and cannot be changed or transferred.
                  </p>
                </div>
              </div>
            )}

            {/* If opened while viewing the voted contestant */}
            {isViewingVotedContestant && (
              <div className="rounded-lg bg-forest/5 border border-forest/20 p-3 text-xs leading-relaxed text-forest flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-forest mt-0.5" />
                <div>
                  <p className="font-semibold text-forest">Vote Confirmed</p>
                  <p className="text-[11px] text-charcoal-muted mt-0.5 leading-relaxed">
                    Thank you! Your verified vote for <strong>{contestant.name}</strong> has been secured in the competition database.
                  </p>
                </div>
              </div>
            )}

            {/* Verified email display if available */}
            {(verifiedEmail || (typeof window !== "undefined" && window.localStorage.getItem("shabach_voter_email"))) && (
              <div className="flex items-center justify-between rounded-lg border border-cream-line bg-ivory/50 px-3 py-2 text-xs">
                <span className="text-charcoal-muted">Verified voter:</span>
                <span className="font-mono font-medium text-forest text-[11px] truncate max-w-[200px]">
                  {verifiedEmail || (typeof window !== "undefined" && window.localStorage.getItem("shabach_voter_email"))}
                </span>
              </div>
            )}

            <AlertDialogFooter>
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="w-full bg-forest text-ivory hover:bg-forest-deep font-semibold text-sm py-2.5 shadow-sm"
              >
                Close
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          /* ========================================================================
             ACTIVE UNVOTED FLOW
             Enter email, verify 6-digit OTP, and confirm vote.
             ======================================================================== */
          <>
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
              <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-forest">
                <Clock className="h-3.5 w-3.5 text-gold shrink-0" />
                <span>Time: {Math.round(rubricFor(contestant.type).timeLimitSec / 60)} mins allocated</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-xs">
                  {typeLabel(contestant.type)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {contestant.district}
                </Badge>
              </div>
            </div>

            {/* Verification and Rules notice */}
            <div className="rounded-lg bg-gold-wash border border-gold/30 p-3 text-xs leading-relaxed text-forest space-y-2">
              <p className="flex items-start gap-2 font-medium">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>
                  <strong>One-vote rule:</strong> Once cast, your vote cannot be cancelled, transferred,
                  or changed to another contestant.
                </span>
              </p>
              <p className="text-[11px] text-charcoal-muted border-t border-gold/20 pt-1.5">
                Verification enforces one vote per verified email account, not proof of one unique
                human.
              </p>
            </div>

            {/* Email OTP Verification Section */}
            <div className="space-y-3 rounded-xl border border-cream-line bg-ivory/60 p-3.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="voter-email"
                  className="text-xs font-semibold text-forest flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-gold" /> Email Verification
                </Label>
                {verifiedEmail ? (
                  <Badge
                    variant="secondary"
                    className="bg-forest-soft/10 text-forest text-[11px] font-semibold gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3 text-forest" /> Verified
                  </Badge>
                ) : (
                  <span className="text-[11px] text-forest font-medium">Required · 1 vote per person</span>
                )}
              </div>

              {!verifiedEmail ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      id="voter-email"
                      type="email"
                      placeholder="Enter email to verify vote..."
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setVerificationError(null);
                      }}
                      disabled={submitting || otpSending || otpSent}
                      className="h-8 text-xs bg-card border-cream-line"
                    />
                    {!otpSent && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!email.trim() || otpSending || submitting}
                        onClick={handleSendOtp}
                        className="h-8 text-xs shrink-0 border-cream-line hover:bg-parchment"
                      >
                        {otpSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send Code"}
                      </Button>
                    )}
                  </div>

                  {otpSent && (
                    <div className="space-y-2 pt-1 border-t border-cream-line">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="voter-otp" className="text-[11px] text-charcoal-muted">
                          Enter 6-digit code
                        </Label>
                        {mockCode ? (
                          <button
                            type="button"
                            onClick={() => setCode(mockCode)}
                            className="text-[11px] text-gold hover:underline font-mono"
                          >
                            Use demo code ({mockCode})
                          </button>
                        ) : (
                          <span className="text-[10px] text-charcoal-muted italic">
                            Check your inbox
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="voter-otp"
                          type="text"
                          maxLength={6}
                          placeholder="123456"
                          value={code}
                          onChange={(e) => {
                            setCode(e.target.value);
                            setVerificationError(null);
                          }}
                          disabled={submitting || otpVerifying}
                          className="h-8 text-xs font-mono tracking-widest bg-card border-cream-line"
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={code.trim().length !== 6 || otpVerifying || submitting}
                          onClick={handleVerifyOtp}
                          className="h-8 text-xs shrink-0 bg-forest text-ivory hover:bg-forest-deep"
                        >
                          {otpVerifying ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Verify Code"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {verificationError && (
                    <p className="text-[11px] text-destructive font-medium">{verificationError}</p>
                  )}
                </>
              ) : (
                <div className="rounded bg-card p-2 text-xs text-charcoal flex items-center justify-between border border-cream-line">
                  <span className="font-mono text-[11px] text-charcoal truncate">{verifiedEmail}</span>
                  <span className="text-[11px] text-forest font-medium">Ready to confirm</span>
                </div>
              )}
            </div>

            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel disabled={submitting} className="border-cream-line">
                Cancel
              </AlertDialogCancel>
              <Button
                onClick={handleConfirm}
                disabled={submitting}
                className="bg-forest text-ivory hover:bg-forest-deep disabled:opacity-50"
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
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
