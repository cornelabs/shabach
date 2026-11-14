import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { ArrowLeft, CheckCircle2, Flame, Loader2, Mail, RefreshCw, Send, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  testEmailProviderServerFn,
  type TestProviderItemResult,
} from "@/server-fns/voter-otp";

export const Route = createFileRoute("/email-test")({
  head: () => ({
    meta: [{ title: "Email Provider Live Diagnostics — SHABACH 2026" }],
  }),
  component: EmailDiagnosticsPage,
});

export function EmailDiagnosticsPage() {
  const [email, setEmail] = React.useState("ifejesugoodness97@gmail.com");
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<TestProviderItemResult[]>([]);

  const runTest = async (provider: "brevo" | "resend" | "zeptomail" | "all") => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid recipient email address.");
      return;
    }
    setLoadingProvider(provider);
    try {
      const res = await testEmailProviderServerFn({
        data: { provider, email: email.trim().toLowerCase() },
      });
      setResults(res.results);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Dispatch test execution failed: ${msg}`);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <main className="min-h-screen bg-ivory px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-forest transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <span className="text-xs font-mono font-medium text-charcoal-muted">
            Live Diagnostics · Brevo | Resend | ZeptoMail
          </span>
        </div>

        {/* Header */}
        <div className="rounded-2xl border border-cream-line bg-card p-6 sm:p-8 shadow-card">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-wash px-3 py-1 text-xs font-semibold text-forest">
            <Mail className="h-3.5 w-3.5 text-gold" /> Transactional Email Subsystem
          </div>
          <h1 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-forest">
            Live Email Providers Diagnostics
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-charcoal-muted leading-relaxed max-w-2xl">
            Test and verify each of the three transactional email engines deployed on Vercel:
            <strong> Brevo (Primary)</strong>, <strong>Resend (Secondary)</strong>, and <strong>Zoho ZeptoMail (Final Fallback)</strong>.
          </p>

          {/* Email input & actions */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1">
              <label htmlFor="test-email" className="block text-xs font-bold uppercase tracking-wider text-charcoal-muted mb-1">
                Recipient Test Email
              </label>
              <Input
                id="test-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="bg-ivory/60 border-cream-line text-sm"
              />
            </div>
            <div className="sm:self-end">
              <Button
                onClick={() => runTest("all")}
                disabled={Boolean(loadingProvider)}
                className="w-full sm:w-auto bg-forest text-ivory hover:bg-forest-deep text-xs font-bold gap-2 shadow-sm"
              >
                {loadingProvider === "all" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                ) : (
                  <Send className="h-4 w-4 text-gold" />
                )}
                Test All 3 Providers
              </Button>
            </div>
          </div>

          {/* Individual Provider Buttons */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => runTest("brevo")}
              disabled={Boolean(loadingProvider)}
              className="border-cream-line text-forest hover:bg-gold-wash text-xs font-semibold gap-1.5 justify-start"
            >
              {loadingProvider === "brevo" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              )}
              Test Brevo (Primary)
            </Button>

            <Button
              variant="outline"
              onClick={() => runTest("resend")}
              disabled={Boolean(loadingProvider)}
              className="border-cream-line text-forest hover:bg-gold-wash text-xs font-semibold gap-1.5 justify-start"
            >
              {loadingProvider === "resend" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-blue-500" />
              )}
              Test Resend (Secondary)
            </Button>

            <Button
              variant="outline"
              onClick={() => runTest("zeptomail")}
              disabled={Boolean(loadingProvider)}
              className="border-cream-line text-forest hover:bg-gold-wash text-xs font-semibold gap-1.5 justify-start"
            >
              {loadingProvider === "zeptomail" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-500" />
              )}
              Test ZeptoMail (Fallback)
            </Button>
          </div>
        </div>

        {/* Results Showcase */}
        {results.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="font-display text-lg font-bold text-forest flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold" /> Live Dispatch Execution Results
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {results.map((res) => (
                <div
                  key={res.provider}
                  className={`rounded-xl border p-5 shadow-sm transition-all ${
                    res.ok
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-red-200 bg-red-50/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {res.ok ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <h3 className="font-display text-base font-bold text-forest capitalize">
                          {res.provider === "zeptomail" ? "Zoho ZeptoMail" : res.provider}
                        </h3>
                        <p className="text-xs text-charcoal-muted">
                          {res.provider === "brevo"
                            ? "Tier 1: Primary Dispatch (v3 API)"
                            : res.provider === "resend"
                            ? "Tier 2: Secondary Fallback (v1 API)"
                            : "Tier 3: High-Volume Fallback (v1.1 API, 10k Capacity)"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-charcoal-muted">
                        {res.latencyMs} ms
                      </span>
                      <Badge
                        className={`text-xs font-bold ${
                          res.ok
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {res.ok ? "DISPATCHED" : "FAILED"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border-t border-cream-line/60 pt-3">
                    {res.id && (
                      <div>
                        <span className="font-bold text-charcoal">Message ID: </span>
                        <code className="rounded bg-white px-1.5 py-0.5 font-mono text-emerald-800 border border-emerald-200">
                          {res.id}
                        </code>
                      </div>
                    )}
                    {res.senderEmail && (
                      <div>
                        <span className="font-bold text-charcoal">Sender: </span>
                        <span className="text-charcoal-muted">{res.senderEmail}</span>
                      </div>
                    )}
                    {res.error && (
                      <div className="sm:col-span-2 text-red-700 bg-red-100/70 p-2.5 rounded-lg border border-red-200 mt-1 font-mono text-xs">
                        <strong>Error: </strong> {res.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
