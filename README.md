# SHABACH 2026 Grand Finale — Adjudication & Live Public Voting Platform

> **"A Joyful Noise — Talent for Christ"**  
> Official adjudication, live audience voting, and verified collation platform for the **SHABACH 2026 Grand Finale**, organized by the **Youth Affairs Fellowship (YAF)**.

---

## 1. System Architecture

The SHABACH 2026 platform is engineered for high integrity, blind judging isolation, rapid live audience participation, and immutable results collation.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                            │
│                 (TanStack Start • React 19 • Tailwind v4)              │
│                                                                        │
│   ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│   │   Public Portal   │  │  Judge Workspace  │  │ Organiser Desktop │  │
│   │  • Contestants    │  │  • 4 Judge Seats  │  │  • Collation Desk │  │
│   │  • Profile QR     │  │  • Blind Rubrics  │  │  • Verification   │  │
│   │  • OTP Voting     │  │  • Fresh Submits  │  │  • Results Lock   │  │
│   │  • Top 3 Winners  │  │  • Conflict Decl. │  │  • Audit Trail    │  │
│   └─────────┬─────────┘  └─────────┬─────────┘  └─────────┬─────────┘  │
└─────────────┼──────────────────────┼──────────────────────┼────────────┘
              │                      │                      │
              ▼                      ▼                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA & SECURITY LAYER                           │
│               (Supabase PostgreSQL • Row Level Security)               │
│                                                                        │
│   • Anonymous (Public) : Read events/contestants; RPC-only OTP & votes │
│   • Four Judges        : Blind isolation; read/write ONLY own seat     │
│   • Organiser / Desk   : Full governance, scorecard reopens, locking   │
│   • Database Triggers  : Prevents self-reopen, self-conflict resolve   │
│   • Results Projection : get_public_top_three (no private marks leak)  │
└────────────────────────────────────────────────────────────────────────┘
```

### 100-Point Scoring Model & Category Rubrics

Each performance is evaluated against a 100-point total:

- **95 Raw Judge Points**: Collated from 4 independent judges across five discipline-specific criteria (spiritual depth, technical skill, creativity, presentation, engagement).
- **5 Public Audience Points**: Derived from verified audience votes using relative scaling:  
  $$\text{Audience Points} = 5.0 \times \frac{\text{Contestant Votes}}{\text{Highest Contestant Votes}}$$
- **Overtime Penalty Deductions**: Enforced server-side per category:
  - Music, Dance, Spoken Word, Mono Drama: 240s limit (4 min), 2 points deducted per 15s overtime interval.
  - Visual Arts: 600s limit (10 min), 2 points deducted per 60s overtime interval.

### Multi-Tier Tie-Break Ladder

Ties are resolved deterministically before manual intervention:

1. **Spiritual Depth Subtotal** (across all 4 judges)
2. **Technical Excellence Subtotal** (vocal/choreography/acting/execution)
3. **Creativity / Originality Subtotal**
4. **Audience Vote Count**
5. **Score Desk / Judges' Collective Determination** (requires recorded reason)

---

## 2. Getting Started & Development

### Prerequisites

- [Bun runtime](https://bun.sh) (v1.1+ recommended) or Node.js v20+

### Installation & Local Run

```bash
# 1. Clone the repository
git clone <repository-url>
cd shabach

# 2. Install dependencies with Bun
bun install

# 3. Copy environment configuration
cp .env.example .env

# 4. Start local development server
bun run dev
```

### Verification Scripts

Ensure all checks pass before pushing or deploying:

```bash
# Run unit, regression, and component tests
bun run test

# Run TypeScript typechecks
bun run typecheck

# Run ESLint validation
bun run lint
```

---

## 3. Environment Variables Configuration

The project includes a clean template in `.env.example` with zero hardcoded secrets:

| Variable                        | Scope               | Description                                                    |
| ------------------------------- | ------------------- | -------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Client / SSR        | Public Supabase project URL (e.g. `https://<ref>.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client / SSR        | Public anon publishable key (safe for browser distribution)    |
| `SUPABASE_URL`                  | Server Runtime      | Supabase backend URL                                           |
| `SUPABASE_PUBLISHABLE_KEY`      | Server Runtime      | Public publishable key for SSR fallback                        |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server Secrets ONLY | Service role key bypassing RLS for admin maintenance tasks     |
| `NODE_ENV`                      | Build / Runtime     | Environment mode (`development`, `production`, `test`)         |

> [!WARNING]
> Never prefix `SUPABASE_SERVICE_ROLE_KEY` with `VITE_`. It must only ever be configured in secure server runtimes (e.g., Cloudflare Workers, Vercel Environment Variables).

---

## 4. Exact Migration Order & Execution Steps

Database migrations are located in `supabase/migrations/` and must be applied in sequential order:

```bash
# Order of execution:
# 1. Core database schema, constraints, and RPC definitions
supabase/migrations/20261030000001_shabach_schema.sql

# 2. Row Level Security (RLS) policies & blind judging enforcement triggers
supabase/migrations/20261030000002_rls_policies.sql

# 3. Seed data: 16 finalists, 5 rubric templates, event settings
supabase/migrations/20261030000003_seed_data.sql

# 4. Client persistence policies for direct Supabase connectivity
supabase/migrations/20261030000004_client_persistence_policies.sql
```

### Single-Run Execution

For clean environments or Supabase Dashboard SQL Editor, a pre-validated combined script is provided:

```sql
-- Open Supabase Dashboard > SQL Editor
-- Paste and run the entire contents of:
supabase/combined_migration.sql
```

### Local Supabase CLI

```bash
# Reset local database with all migrations
bunx supabase db reset

# Push migrations to connected remote project
bunx supabase db push
```

---

## 5. Staff Credentials Bootstrap

To provision real accounts for the 4 judges, organiser, and score desk in a live environment:

### Step 1: Create Supabase Auth Users

In **Supabase Dashboard > Authentication > Users**, invite or create the staff users:

- `judge1@shabach.org`
- `judge2@shabach.org`
- `judge3@shabach.org`
- `judge4@shabach.org`
- `organiser@shabach.org`
- `scoredesk@shabach.org`

### Step 2: Link Auth IDs to `staff_roles` Table

Execute the following SQL in the Supabase SQL Editor to map their auth UUIDs:

```sql
DO $$
DECLARE
    v_event_id UUID := '00000000-0000-0000-0000-000000002026';
    v_uid_j1 UUID;
    v_uid_j2 UUID;
    v_uid_j3 UUID;
    v_uid_j4 UUID;
    v_uid_org UUID;
BEGIN
    -- Retrieve UUIDs from auth.users
    SELECT id INTO v_uid_j1 FROM auth.users WHERE email = 'judge1@shabach.org';
    SELECT id INTO v_uid_j2 FROM auth.users WHERE email = 'judge2@shabach.org';
    SELECT id INTO v_uid_j3 FROM auth.users WHERE email = 'judge3@shabach.org';
    SELECT id INTO v_uid_j4 FROM auth.users WHERE email = 'judge4@shabach.org';
    SELECT id INTO v_uid_org FROM auth.users WHERE email = 'organiser@shabach.org';

    -- Assign staff roles
    INSERT INTO staff_roles (event_id, user_id, role_type, full_name, email)
    VALUES
        (v_event_id, v_uid_j1, 'judge_1', 'Judge 1 (Music)', 'judge1@shabach.org'),
        (v_event_id, v_uid_j2, 'judge_2', 'Judge 2 (Choreography)', 'judge2@shabach.org'),
        (v_event_id, v_uid_j3, 'judge_3', 'Judge 3 (Drama & Spoken Word)', 'judge3@shabach.org'),
        (v_event_id, v_uid_j4, 'judge_4', 'Judge 4 (Visual Arts & Impact)', 'judge4@shabach.org'),
        (v_event_id, v_uid_org, 'organiser', 'Lead Organiser', 'organiser@shabach.org')
    ON CONFLICT (event_id, role_type, email) DO UPDATE
    SET user_id = EXCLUDED.user_id, active = true;
END $$;
```

---

## 6. Email OTP Delivery for Live Audience Voting

Live public voting uses single-vote OTP verification (`src/lib/auth/voter-verification.ts`):

1. **Voter Input**: Audience member navigates to a contestant's direct link (e.g. `/contestants/SB7K2M`) or scans their seat QR code.
2. **OTP Dispatch**: Voter enters their email. The server generates a single-use 6-digit numeric token with a 15-minute TTL.
3. **Rate Limiting**: Strictly capped at 3 requests per 10-minute window per email.
4. **Brute-Force & Replay Defense**: Code is invalidated immediately upon successful verification or after 5 incorrect attempts.
5. **Database Single-Vote Invariant**: When the vote is cast, `uq_voter_single_vote UNIQUE (event_id, voter_id)` guarantees that no voter can cast more than one ballot.

### Live SMTP / Resend Configuration

In production, enable real email dispatch in Supabase:

1. Navigate to **Project Settings > Authentication > Email**.
2. Enable custom SMTP provider (e.g. Resend, SendGrid, Amazon SES).
3. Set Sender Name to `SHABACH 2026 Collation Desk`.
4. Set OTP template message: `"Your SHABACH 2026 audience verification code is {{ .Token }}."`

---

## 7. Demo vs Live Mode Operation

The application seamlessly accommodates both rehearsals/demos and live stage production:

- **Demo / Offline Mode**:
  - Automatically activates when Supabase variables are absent or when running local tests.
  - State is managed via an in-memory reactive store (`src/lib/demo/store.ts`).
  - Includes sample score generators, tie-break simulations, and instant mock OTP codes.
  - State is tagged with `isSimulatedDemo: true` to prevent accidental overwrites of production databases.
- **Live Production Mode**:
  - Automatically activates when valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are provided.
  - Scores persist directly to PostgreSQL tables protected by Row Level Security.
  - Real-time updates push via PostgreSQL WebSockets.

---

## 8. Deployment Checklist & Event Rehearsal Guide

### T-Minus 2 Hours: Technical Dry Run

- [ ] **Database Connection Check**: Run `getSupabaseClient()` health check in staging.
- [ ] **Stopwatch Calibration**: Verify timekeeper device and sync with master stopwatch.
- [ ] **Judge Device Setup**: Ensure all 4 judge tablets connect to the venue private Wi-Fi and load `/judges`.
- [ ] **Contestant QR Code Verification**: Scan printed physical badges for all 16 acts and confirm direct profile loading.

### T-Minus 30 Minutes: Live Score Desk Rehearsal

- [ ] Verify all 16 contestants appear in correct running order (№ 1 to № 16).
- [ ] Perform a mock scorecard submission for Judge 1 and test scorecard reopen with an audit reason.
- [ ] Test conflict-of-interest declaration and organiser resolution workflow.
- [ ] Clear test data using `resetJudgeScorecard` before the grand opening.

### During Event: Show Execution

1. **Performance**: Timekeeper records actual seconds; judges enter criteria marks.
2. **Audience Voting**: Organiser sets voting status to `open`.
3. **Voting Window Close**: After the final performance, organiser sets voting status to `closed`.
4. **Verification Gates Check**:
   - [x] All 16 contestants have 4 submitted scorecards (64 total).
   - [x] All 16 performance durations verified.
   - [x] All declared conflicts resolved.
   - [x] Voting closed and verified.
   - [x] No unresolved ties flagged.
   - [x] Score desk officer confirms collation.
5. **Freeze & Lock**: Organiser triggers **Lock Results**. Snapshot is permanently frozen.
6. **Publication**: Organiser clicks **Publish Results**. Live portal `/results` reveals official 1st, 2nd, and 3rd place winners.

---

## 9. Test Suite Documentation

The automated test suite (`src/test/`) covers all aspects of competition integrity:

| Test Suite                       | Purpose                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `judge-routing.test.tsx`         | Verifies `/judges` picker and `/judges/$judgeId` scorecard workspace child routes             |
| `scorecard-freshness.test.tsx`   | Proves reviewed scores equal submitted scores without stale draft overwrites                  |
| `contestant-resolution.test.tsx` | Proves direct contestant links (`SB7K2M`, `B6F4PT`) resolve and invalid codes fail gracefully |
| `results-privacy.test.tsx`       | Proves public results expose only top 3 winners and zero internal judge marks                 |
| `rls-permissions.test.ts`        | Validates least-privilege policies for anon, voters, judges, and organisers                   |
| `voting-concurrency.test.ts`     | Tests race condition defense, duplicate vote rejection, and results locking gates             |
| `scoring.test.ts`                | Validates 95+5 point formula, overtime penalties, and 5-tier tie-break ladder                 |
| `organiser-workspace.test.ts`    | Tests 6 collation verification gates, conflict resolution, and scorecard reopening            |
| `e2e-competition-flow.test.ts`   | End-to-end simulation of the complete 16-act, 4-judge competition lifecycle                   |
| `supabase/tests/*.sql`           | SQL database test harness for pgTAP/psql verifying constraints and RLS                        |

Run the full suite anytime with:

```bash
bun run test
bun run typecheck
bun run lint
```
