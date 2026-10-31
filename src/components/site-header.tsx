import { Link, useMatchRoute } from "@tanstack/react-router";
import { useDemoState } from "@/hooks/use-demo";
import { VOTING_STATUS_LABEL } from "@/lib/demo/labels";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/" as const, label: "Home" },
  { to: "/results" as const, label: "Results" },
  { to: "/judges" as const, label: "Judges" },
  { to: "/organiser" as const, label: "Organiser" },
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
    <span className="inline-flex items-center gap-2 rounded-full border border-cream-line bg-card px-3 py-1 text-xs font-semibold text-charcoal">
      <span
        className={cn("h-2 w-2 rounded-full", tone, state.votingStatus === "open" && "live-dot")}
      />
      {VOTING_STATUS_LABEL[state.votingStatus]}
    </span>
  );
}

export function SiteHeader() {
  let isRouteMatched = (_opts: { to: string; fuzzy?: boolean }) => false;
  try {
    const matchRoute = useMatchRoute();
    if (typeof matchRoute === "function") {
      isRouteMatched = (opts) => Boolean(matchRoute(opts));
    }
  } catch {
    // Graceful fallback when rendered in isolated test contexts without RouterProvider
  }

  return (
    <header className="sticky top-0 z-40 border-b border-cream-line bg-ivory/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl text-forest">SHABACH 2026</span>
          <span className="hidden text-xs font-semibold uppercase tracking-widest text-gold sm:inline">
            Talent for Christ
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map((item) => {
            const active = isRouteMatched({ to: item.to, fuzzy: true });
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-forest text-ivory"
                    : "text-charcoal-muted hover:bg-parchment hover:text-forest",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="ml-1 hidden md:inline-flex">
            <StatusDot />
          </span>
        </nav>
      </div>
    </header>
  );
}
