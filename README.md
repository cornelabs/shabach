# SHABACH 2026 — Competition & Collation Platform

**SHABACH 2026** is the official competition and collation platform for the Grand Finale of the Youth Alive Fellowship (YAF) talent competition (Living Faith Church, Lagos State).

- **Theme**: Talent for Christ
- **Grand Finale**: Saturday, 14 November 2026
- **Timezone**: `Africa/Lagos` (WAT / UTC+1)
- **Scope**: 16 Grand Finale Finalists representing 8 ecclesiastical districts competing in **one overall ranking** across 5 disciplines (Music, Dance, Spoken Word/Poetry, Mono-Drama, and Visual Arts).

---

## 1. System Architecture

The platform connects three core user experiences built on a unified, type-safe foundation:

1. **Public Audience Experience (`/`, `/contestants/$code`, `/results`)**:
   - Mobile-first, responsive showcase of all 16 finalists in performance order.
   - Case-insensitive search across names, codes, districts, and performance titles.
   - One-final-vote confirmation gate with debounce and replay protection.
   - QR code generation and shareable profile links (`/contestants/$code`).
   - Exclusive top-three winners showcase on public `/results` (protecting private scores, judge notes, and audience vote tallies from unreleased publication).

2. **Judge Workspace (`/judges` & `/judge`)**:
   - Role switcher for Judge 1, Judge 2, and Judge 3.
   - Discipline-specific rubrics loaded dynamically per contestant.
   - Numeric score validation (0 to criterion maximum, whole numbers only, raw subtotal out of 95).
   - Draft autosave with visual indicators.
   - Formal submission review modal with lock-after-submit semantics.
   - Blind judging isolation (judges cannot view other judges' marks or audience vote tallies).
   - Conflict-of-interest declarations with mandatory organiser determination.

3. **Organiser & Score Desk Dashboard (`/organiser` & `/admin`)**:
   - **Overview**: Real-time stats, voting window controls (`not_open`, `open`, `closed`), and audit activity log.
   - **Contestants**: Profile editing, share code management, and guarded rubric category changes.
   - **Scoring**: 48-scorecard progress matrix, scorecard reopening with mandatory recorded reason, conflict resolution, and stopwatch duration entry & verification.
   - **Results & Collation**: Master collation table with 6 verification gates, collective judges' tie resolution desk, idempotent locking to frozen snapshots, idempotent publication, CSV export, and print view.

4. **Interactive Demo Launcher (`/demo`)**:
   - Role cards to evaluate the platform as Public, Judge 1, Judge 2, Judge 3, or Organiser.
   - Fast-track sample score generation (48 unique submitted scorecards and verified durations).
   - Sandboxed browser storage isolation with clean reset modal.

---

## 2. Competition Scoring Rules & Engine

All 16 finalists compete in **one overall ranking** across all performance types.

### The Scoring Formula

$$\text{Judge Average} = \frac{\text{Judge}_1 + \text{Judge}_2 + \text{Judge}_3}{3}$$

$$ \text{Audience Points} = \begin{cases}
5 \times \frac{\text{Contestant Valid Votes}}{\text{Highest Eligible Vote Count}}, & \text{if Highest Eligible Vote Count} > 0 \\
0, & \text{otherwise}
\end{cases}$$

$$\text{Final Score} = \max(0, \text{Judge Average} + \text{Audience Points} - \text{Time Penalty})$$

- Maximum Judge Raw Subtotal: **95 points** (4 criteria @ 20 pts + 1 audience connection criterion @ 15 pts).
- Maximum Combined Score: **100 points** (95 judge average + 5 audience points).
- Maximum Precision: Floating-point precision preserved internally; formatted to 2 decimal places for display.

### Performance Time Limits & Penalty Deductions
- **Music, Dance, Spoken Word/Poetry**: 240 seconds (4 minutes). Deduct 2 points per completed 15-second overtime period.
- **Mono-Drama**: 300 seconds (5 minutes). Deduct 2 points per completed 15-second overtime period.
- **Visual Arts**: 600 seconds (10 minutes). Deduct 2 points per completed 60-second overtime period.
- *Rule*: Partial overtime intervals do not incur additional penalties. The time penalty is deducted exactly once from the final score.

### Deterministic Cross-Discipline Tie-Break Ladder
When two contestants tie on `finalScore`, their average scores on core criteria are compared across disciplines:
1. **Spiritual Criterion**:
   - Music: *Spiritual Depth & Biblical Fidelity*
   - Dance: *Thematic Clarity & Spiritual Message*
   - Spoken Word: *Theological Substance & Scriptural Depth*
   - Mono-Drama: *Biblical Truth & Narrative Substance*
   - Visual Arts: *Sacred Symbolism & Divine Reflection*
2. **Technical / Performance Criterion**:
   - Music: *Vocal Technique & Pitch Accuracy*
   - Dance: *Technical Execution & Sync*
   - Spoken Word: *Enunciation, Voice & Pacing*
   - Mono-Drama: *Characterization & Voice Acting*
   - Visual Arts: *Medium Mastery & Composition*
3. **Creativity / Originality Criterion**:
   - Music: *Artistic Originality & Arrangement*
   - Dance: *Choreographic Originality*
   - Spoken Word: *Poetic Craft & Metaphorical Ingenuity*
   - Mono-Drama: *Script Structure & Dramatic Pacing*
   - Visual Arts: *Originality of Concept*
4. **Collective Judges' Decision**:
   - If still tied after the 3 criteria, the score desk records the collective judges' reviewed winner and rationale. Resolved ties are assigned distinct sequential ranks (e.g. 1st and 2nd).

---

## 3. Local Development & Testing

The project uses [Bun](https://bun.sh) (or Node 20+) with Vite and TanStack Start.

### Prerequisites
- Node.js 20+ or Bun 1.2+
- Git

### Installation
```bash
# Clone the repository
git clone https://github.com/cornelabs/shabach.git
cd shabach

# Install dependencies
bun install
# or: npm install
```

### Development Server
```bash
bun dev
# or: npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Running Test Suites
```bash
# Run all Vitest unit and regression tests
bun test
# or: npm test

# Type checking
bun x tsc --noEmit
# or: npx tsc --noEmit

# Linting & Formatting
bun run lint
bun run format
```

---

## 4. Backend Setup (Supabase / PostgreSQL)

The platform includes a typed data access layer (`src/lib/db/adapter.ts`) that operates seamlessly in both **Demo Mode** (in-browser sandbox) and **Live Mode** (Supabase Postgres with Row Level Security).

### Database Migrations
Migrations are located in `supabase/migrations/`:
1. `20261029000001_shabach_schema.sql`: Core schema (events, event_settings, contestants, staff_roles, rubric_versions, scorecards, durations, verified_voters, votes, results_snapshots, audit_events) and atomic RPC functions.
2. `20261029000002_rls_policies.sql`: Row Level Security policies enforcing blind judging, voter isolation, and organiser privileges.
3. `20261029000003_seed_data.sql`: Canonical SHABACH 2026 event, 5 rubric definitions, 16 finalists across the 8 districts, and initial staff roles.

### Applying Migrations Locally
```bash
# Start local Supabase container (optional)
npx supabase start

# Apply migrations
npx supabase db reset
```

### Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your credentials:
```env
# Set to 'live' to connect to Supabase; leave 'demo' for local sandbox
VITE_APP_MODE=demo

# Supabase Credentials (when VITE_APP_MODE=live)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Voter OTP Verification Dispatcher ('mock' in dev, or 'resend')
VOTER_EMAIL_PROVIDER=mock
RESEND_API_KEY=
```

---

## 5. Staff Bootstrapping & Live Roles

In live deployment, user accounts are authenticated via Supabase Auth:
- **Organiser / Score Desk**: Staff members with `role_type IN ('organiser', 'score_desk')` in `staff_roles`. Organisers have full authority to open/close voting, resolve conflicts, reopen scorecards, verify durations, lock snapshots, and publish results.
- **Judges 1, 2, 3**: Staff members with `role_type IN ('judge_1', 'judge_2', 'judge_3')`. Row Level Security ensures judges can only view and mutate their own assigned scorecard.

*Security Notice*: Ordinary public sign-up is strictly forbidden from granting judge or organiser capabilities. Staff accounts must be provisioned by the Lead Organiser or via the service role migration.

---

## 6. Event Day Rehearsal & Contingency Runbook

### Pre-Event Checklist (T-2 Hours)
- [ ] Verify score desk connectivity and active staff accounts for Judge 1, Judge 2, and Judge 3.
- [ ] Confirm all 16 contestant details, running order, and assigned performance rubrics.
- [ ] Confirm the voting window status is set to `not_open`.
- [ ] Verify stopwatch devices and assign the official timekeeper.

### Live Event Execution Phase
1. **Performances 1 through 16**:
   - Judges score each presentation in real time.
   - Timekeeper records the duration in seconds on the official sheet.
   - Score desk enters durations in the `/organiser` Scoring tab and verifies them against the official timekeeper sheet.
2. **Voting Window**:
   - Once all 16 performances conclude, the Lead Organiser opens voting via the Overview tab.
   - Audience scans contestant QR codes or navigates to `/` and casts their single verified vote.
   - Once the voting window concludes, the Lead Organiser closes voting (`closed`).
3. **Collation & Verification Gates**:
   - Score desk inspects the 6 mandatory gates in `/organiser`:
     1. Voting window is closed.
     2. All 48 scorecards are submitted and valid (no open drafts or unresolved conflicts).
     3. All 16 performance durations are verified.
     4. No unresolved conflicts remain.
     5. No unresolved ties remain (use the tie resolution desk if collective judges' determination is needed).
     6. Score desk collation confirmation is checked.
4. **Locking & Publication**:
   - Click **Verify & Lock Results** to freeze the immutable snapshot.
   - Export official CSV backup and generate the print collation sheet.
   - Click **Publish Official Winners** to make the top-three showcase live at `/results`.

### Contingency Procedures
- **Score Reopening**: If a judge makes a clerical error, the organiser reopens the specific card with a mandatory recorded reason. The card returns to draft mode for the judge to amend and resubmit.
- **Judge Conflict**: If a judge declares a conflict of interest, the organiser reviews the declaration and records an official determination note.
- **Offline Fallback**: In the event of venue network disruption, the platform continues to run locally via in-browser storage (`DemoDataAdapter`). The score desk can collate and generate the official CSV and print summary directly from the local machine.

---

## 7. Project Specification Archive

The original design and feature specification has been archived in [`docs/product-specification.md`](docs/product-specification.md).

---

## 8. Development & Contribution Policies

<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting published git history — force pushing, or rebasing/amending/squashing commits that are already pushed — as it rewrites history on Lovable's side and the user will likely lose their project history.
>
> Commits pushed to the connected branch sync back to Lovable and show up in the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
