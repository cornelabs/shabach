import { Link, useMatchRoute } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import * as React from "react";

import { useDemoState } from "@/hooks/use-demo";
import { VOTING_STATUS_LABEL } from "@/lib/demo/labels";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/" as const, label: "Home" },
  { to: "/contestants" as const, label: "Contestants" },
  { to: "/results" as const, label: "Results" },
  { to: "/judges/meet" as const, label: "Meet Judges" },
  { to: "/judges" as const, label: "Judges Panel" },
  { to: "/organiser" as const, label: "Admin Space" },
  { to: "/program" as const, label: "Program" },
];

const MOBILE_NAV = [
  { to: "/" as const, label: "Home" },
  { to: "/contestants" as const, label: "Contestants" },
  { to: "/results" as const, label: "Results" },
  { to: "/judges/meet" as const, label: "Meet the Judges" },
  { to: "/judges" as const, label: "Judges Panel" },
  { to: "/organiser" as const, label: "Admin Space" },
  { to: "/program" as const, label: "Program" },
];

function StatusDot() {
  const state = useDemoState();
  const tone =
    state.votingStatus === "open"
      ? "bg-forest-soft"
      : state.votingStatus === "closed"
        ? "bg-charcoal-muted"
        : "bg-gold";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-cream-line bg-card px-3 py-1 text-xs font-semibold text-charcoal shadow-xs">
      <span
        className={cn("h-2 w-2 rounded-full", tone, state.votingStatus === "open" && "live-dot")}
      />
      {VOTING_STATUS_LABEL[state.votingStatus]}
    </span>
  );
}

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  let isRouteMatched = (_opts: { to: string; fuzzy?: boolean }) => false;
  try {
    const matchRoute = useMatchRoute();
    if (typeof matchRoute === "function") {
      isRouteMatched = (opts) => Boolean(matchRoute(opts));
    }
  } catch {
    // Graceful fallback when rendered in isolated test contexts without RouterProvider
  }

  // Close mobile menu on Escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-cream-line bg-ivory/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        {/* Brand logo */}
        <Link
          to="/"
          className="flex items-baseline gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest rounded-sm"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="font-display text-xl text-forest font-bold">SHABACH 2026</span>
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-gold sm:inline">
            Talent for Christ
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5" aria-label="Main Navigation">
          {NAV.map((item) => {
            const active =
              item.to === "/judges"
                ? isRouteMatched({ to: "/judges", fuzzy: false })
                : isRouteMatched({ to: item.to, fuzzy: true });
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs lg:text-sm font-medium transition-colors",
                  active
                    ? "bg-forest text-ivory font-semibold shadow-xs"
                    : "text-charcoal-muted hover:bg-parchment hover:text-forest",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="ml-1.5 hidden lg:inline-flex">
            <StatusDot />
          </span>
        </nav>

        {/* Mobile Status Dot & Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <StatusDot />
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cream-line bg-card text-charcoal hover:bg-parchment hover:text-forest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-forest" />
            ) : (
              <Menu className="h-5 w-5 text-forest" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-cream-line bg-ivory/98 px-4 py-4 md:hidden shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-1.5" aria-label="Mobile Navigation">
            {MOBILE_NAV.map((item) => {
              const active =
                item.to === "/judges"
                  ? isRouteMatched({ to: "/judges", fuzzy: false })
                  : isRouteMatched({ to: item.to, fuzzy: true });
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-forest text-ivory font-semibold shadow-xs"
                      : "text-charcoal hover:bg-parchment hover:text-forest",
                  )}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 pt-3 border-t border-cream-line flex items-center justify-between">
            <span className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider">
              Voting Status
            </span>
            <StatusDot />
          </div>
        </div>
      )}
    </header>
  );
}
