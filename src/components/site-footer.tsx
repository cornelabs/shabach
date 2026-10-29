import { Link } from "@tanstack/react-router";
import { FINALE_DATE_LABEL, TIMEZONE_LABEL } from "@/lib/demo/labels";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-cream-line bg-forest-deep text-ivory/80 print:hidden">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg text-ivory">SHABACH 2026</p>
          <p className="mt-1 text-sm">Talent for Christ — Grand Finale</p>
          <p className="mt-1 text-sm">{FINALE_DATE_LABEL}</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-ivory">Organised by</p>
          <p className="mt-1">Youth Alive Fellowship (YAF)</p>
          <p>Living Faith Church, Lagos State</p>
          <p className="mt-2 text-ivory/60">All times shown in {TIMEZONE_LABEL}.</p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-ivory">Explore</p>
          <ul className="mt-1 space-y-1">
            <li>
              <Link to="/" className="hover:text-gold">
                Contestants & voting
              </Link>
            </li>
            <li>
              <Link to="/results" className="hover:text-gold">
                Results
              </Link>
            </li>
            <li>
              <Link to="/judges" className="hover:text-gold">
                Judges' workspace
              </Link>
            </li>
            <li>
              <Link to="/organiser" className="hover:text-gold">
                Organiser dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10 px-4 py-4">
        <p className="mx-auto max-w-6xl text-xs text-ivory/60">
          Demo build — contestants, votes, scores and durations are simulated sample data for
          reviewing the voting and scoring journey. No real votes are recorded and no production
          backend is connected.
        </p>
      </div>
    </footer>
  );
}
