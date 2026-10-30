# SHABACH 2026 — roadmap

1. [x] Data layer: types, rubrics, scoring engine, seed, store (typecheck clean)
2. [x] Public experience: home + voting, contestant profiles, results page
3. [ ] Judges workspace: judge picker, scorecard editor, conflict declaration
4. [ ] Organiser dashboard: contestants, voting, durations, conflicts, lock & publish, activity
5. [ ] Tests: scoring rules, one-vote-per-browser, routing
6. [ ] README + end-to-end browser verification
7. User connected external Supabase project `shabach` (ref mmdwhtvpemktzncyjrjh) — demo stays
   frontend-only by design; wiring votes/scorecards/results into it (with real staff auth,
   server-enforced voting windows and atomic vote protection) is the production stage after the
   demo is approved.
