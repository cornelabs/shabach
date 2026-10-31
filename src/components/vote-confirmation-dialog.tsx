import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Mail, Vote } from "lucide-react";

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
import { getDataAdapter } from "@/lib/db/adapter";
import { isValidEmail, requestVoterOtp, verifyVoterOtp } from "@/lib/auth/voter-verification";
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
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpSending, setOtpSending] = React.useState(false);
  const [otpVerifying, setOtpVerifying] = React.useState(false);
  const [verifiedEmail, setVerifiedEmail] = React.useState<string | null>(null);
  const [voterToken, setVoterToken] = React.useState<string | null>(null);
  const [mockCode, setMockCode] = React.useState<string | null>(null);
  const [verificationError, setVerificationError] = React.useState<string | null>(null);

  // Reset dialog verification state when opened for a new vote session
  React.useEffect(() => {
    if (open) {
      setVerificationError(null);
    }
  }, [open]);

  async function handleSendOtp() {
    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      setVerificationError("Please enter a valid email address.");
      return;
    }

    setOtpSending(true);
    setVerificationError(null);

    try {
      const res = await requestVoterOtp(cleanEmail);
      if (res.success) {
        setOtpSent(true);
        if (res.mockCode) {
          setMockCode(res.mockCode);
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

    if (!cleanCode) {
      setVerificationError("Please enter the 6-digit verification code.");
      return;
    }

    setOtpVerifying(true);
    setVerificationError(null);

    try {
      const res = await verifyVoterOtp(cleanEmail, cleanCode);
      if (res.success) {
        setVerifiedEmail(res.voterEmail || cleanEmail);
        setVoterToken(res.voterToken || null);
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
    if (submitting) return;

    // If voter entered an email and 6-digit code but hasn't verified yet, verify first
    let activeToken = voterToken;
    if (!activeToken && email.trim() && code.trim().length === 6) {
      setSubmitting(true);
      try {
        const verifyRes = await verifyVoterOtp(email.trim(), code.trim());
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

    setSubmitting(true);

    try {
      const adapter = getDataAdapter();
      const voterId = activeToken || `audience_browser_${Date.now()}`;

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
        toast.success(`Vote confirmed for ${contestant.name}!`, {
          description: "Your single vote for the SHABACH 2026 Grand Finale has been recorded.",
        });
        onOpenChange(false);
        onVoteCast?.();
      } else {
        const msg = res.message.toLowerCase();
        if (msg.includes("already") || msg.includes("single vote")) {
          toast.error("You have already voted", {
            description: "Each voter receives only one final vote across the entire competition.",
          });
        } else if (msg.includes("not open") || msg.includes("not_open")) {
          toast.info("Voting is not open yet.", {
            description: "Voting will open officially during the Grand Finale.",
          });
        } else if (msg.includes("closed")) {
          toast.info("Voting has closed.", {
            description: "Public voting is closed for official score verification.",
          });
        } else {
          toast.error("Could not record vote", {
            description: res.message || "Unable to cast vote for this contestant entry.",
          });
        }
        onOpenChange(false);
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
              <span className="text-[11px] text-charcoal-muted">Optional in demo</span>
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
                    {mockCode && (
                      <button
                        type="button"
                        onClick={() => setCode(mockCode)}
                        className="text-[11px] text-gold hover:underline font-mono"
                      >
                        Use demo code ({mockCode})
                      </button>
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
