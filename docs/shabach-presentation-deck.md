# SHABACH 2026 Grand Finale — Slide Deck & Review Presentation

> **Presentation Deck for Project Review Call, Stakeholder Briefings, and Crew Orientation**  
> **Topic**: SHABACH 2026 Competition Platform Architecture, Scoring Model & User Journeys  
> **Interactive HTML Version**: [`docs/shabach-2026-presentation.html`](./shabach-2026-presentation.html)  
> **Target Audience**: Event Directors, Technical Crew, Presiding Bishops, Adjudicators, and Operations Staff

---

## Slide 1: Welcome & Executive Overview

### Slide Title
**SHABACH 2026 Competition Platform — Talent for Christ**

### Key Bullets
- **Purpose**: A rock-solid, digital competition platform designed for live adjudication, verified audience voting, and automated error-free score collation.
- **Scale**: 16 Finalists across 8 Lagos Districts competing in 4 categories (Music, Spoken Word, Drama, Dance).
- **Core Adjudication**: 4 Independent Judge Seats (`judge1`–`judge4`) scoring on customized category rubrics.
- **Public Voting**: Real-time voter verification via 6-digit email One-Time Passwords (OTP).
- **Privacy First**: Strictly Top 3 Champions announced publicly; marks and lower placements remain confidential.

> **🗣️ Speaker Note**:  
> *"Welcome everyone! Today we are reviewing the SHABACH 2026 platform. It was built to solve the three biggest headaches in live talent competitions: slow manual paper collation, disputed scores, and leaked marks. In the next 10 minutes, you'll see exactly how simple and secure it is for every person in the room."*

---

## Slide 2: The "Explain Like I'm 5" Analogy (The 100-Point Cake)

### Slide Title
**How We Pick the Winner: The 100-Point Formula**

### Visual Formula
$$\text{Final Score (100 Max)} = \text{Judge Average (95)} + \text{Audience Bonus (5)} - \text{Overtime Penalty}$$

```
  ┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
  │   1. The Cake Base   │  +  │ 2. The Sweet Frosting│  −  │ 3. The Overtime Cut  │
  │     95.00 Points     │     │     5.00 Points      │     │  -2.00 Pts / 30 Sec  │
  │  Mean of 4 Adjudicator│     │ Scaled Public Votes  │     │ Stopwatch Penalty    │
  │      Scorecards      │     │    via Email OTP     │     │ Past Category Limit  │
  └──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

### Key Takeaways
- **95 Points from the Judges**: 4 main criteria (20 pts each = 80 pts) + 15 pts for judge-assessed Audience Impact = **95 Raw Points**.
- **Up to 5 Points from Audience**: Scaled relative to the highest-voted finalist: $\frac{5 \times \text{Votes}}{\text{MaxVotes}}$.
- **$-2$ Points per 30-Second Overtime**: Automatic boundary deduction calculated by the computer from official stopwatch slips.

> **🗣️ Speaker Note**:  
> *"Think of every act's score like baking a 100-point cake. The judges bake the 95-point cake base with spiritual depth and technical skill. The audience adds 5 points of sweet frosting with their votes. And if an act stays on stage too long, the timekeeper cuts off 2 points for every 30 seconds of overtime. That's it!"*

---

## Slide 3: The 5 People / Entities in the Room

### Slide Title
**Who Uses What? Role Segregation on Event Day**

| Entity / Role | Primary Device | Screen / Route | Main Responsibility |
| :--- | :--- | :--- | :--- |
| **1. The Audience** | Smartphone | Public Portal (`/`) | Browse acts, search by name/code, verify email via OTP, cast 1 single vote. |
| **2. The 4 Judges** | iPad / Tablet | Judge Desks (`/judges/judge[1-4]`) | Score each act across 5 criteria, save drafts, and submit locked cards. |
| **3. The Timekeeper** | Digital Stopwatch | Physical Slips | Start on first note, stop on bow, hand physical slip to Score Desk. |
| **4. The Score Desk** | Laptop / Workstation | Command Center (`/organiser`) | Control voting window, enter times, clear 6 Gates, lock and publish results. |
| **5. The Stage MC & Bishop** | Paper Master Sheet | Public Portal (`/results`) | Receive signed paper sheets and read official Top 3 Champions. |

> **🗣️ Speaker Note**:  
> *"Each role has its own lane. Judges can't see what other judges scored. The audience can't see backend marks. The score desk holds the master keys, and nobody can alter scores once they are locked."*

---

## Slide 4: Persona 1 — The Audience Voter Journey

### Slide Title
**Audience Voting: Fast, Mobile, and One-Person-One-Vote**

### 3-Step Voting Experience
1. **Discover**: Fans scan the QR code projected on stage screens or visit `shabach.vercel.app` and search by contestant name or 6-character code (e.g. `B6F4PT`).
2. **Verify Identity**: Tap **"Vote for this Contestant"**, enter email address, and receive a 6-digit OTP code in their inbox within seconds.
3. **Confirm Ballot**: Type the 6-digit code and tap **"Confirm Vote"**. The screen updates to: *"Your vote is recorded for this finale"*.

### Built-in Security Safeguards
- **1-Vote-Per-Person Policy**: If a voter tries to vote twice (even for another finalist), the system rejects the ballot with a security notice.
- **15-Minute Window**: Voting is permanently locked until Act 16 ends. The director opens the window for 15 minutes and closes it before collation.

> **🗣️ Speaker Note**:  
> *"For audience members, it takes 30 seconds. Scan QR, type email, enter 6-digit code, done! And because it requires verified email OTP, nobody can sit in the audience and spam hundreds of fake votes."*

---

## Slide 5: Persona 2 — The 4 Judges' Workspace

### Slide Title
**The Judges' Adjudication Console (`/judges`)**

### Core Features on the Judges' Tablets
- **Isolated Seats**: 4 distinct seats (`judge1` to `judge4`). A session badge always displays: *"Judge 1 · Seat A"*.
- **Category-Specific Rubrics**:
  - **Music**: Vocal Technique (20), Pitch & Intonation (20), Stage Presence (20), Biblical Relevance (20), Impact (15).
  - **Spoken Word**: Diction (20), Flow (20), Poetic Structure (20), Scriptural Depth (20), Impact (15).
  - **Drama**: Characterization (20), Voice Projection (20), Timing (20), Message Clarity (20), Impact (15).
  - **Dance**: Choreography (20), Technique (20), Stage Craft (20), Biblical Relevance (20), Impact (15).
- **Gold "Unsaved Edits" Indicator**: Live visual dot alerts the judge that changes are pending.
- **Draft Saving**: Judges can tap **"Save draft"** anytime to persist work locally with a timestamp.
- **Pre-Submission Review**: Tapping **"Review & submit"** brings up an amber summary card showing the exact raw subtotal (e.g. `87 / 95`) before final lock.

> **🗣️ Speaker Note**:  
> *"Our 4 judges have dedicated iPads with big stepper buttons. They cannot accidentally submit an incomplete card—the system blocks it until all 5 criteria have scores. Once confirmed, it locks so scores can't accidentally be altered."*

---

## Slide 6: Persona 3 — The Timekeeper & Overtime Penalty

### Slide Title
**Precision Timing: Automated Overtime Deductions**

### Category Time Limits
- **Music**: 4 minutes (240s)
- **Dance**: 4 minutes (240s)
- **Drama**: 5 minutes (300s)
- **Spoken Word**: 3 minutes 30 seconds (210s)

### The Deduction Formula
$$\text{Penalty} = 2.00\text{ pts} \times \left\lfloor\frac{\text{Actual Seconds} - \text{Allowed Seconds}}{30}\right\rfloor$$

- **Grace Zone**: Any overtime under 30 seconds incurs **0 penalty** (e.g., 4:15 on a 4-minute act = 0 pts).
- **Threshold**: Exceeding the limit by 30 full seconds incurs **$-2$ points**.
- **Example**: An act finishes in 4:35 (35 seconds over limit). 1 full 30s interval = **$-2$ points deduction**.

> **🗣️ Speaker Note**:  
> *"The timekeeper doesn't need to do any mental math on stage. They simply write '04:35' on the stopwatch slip and give it to the score desk. The computer calculates the exact deduction automatically."*

---

## Slide 7: Persona 4 — The Score Desk & The 6 Verification Gates

### Slide Title
**The Organiser Command Center (`/organiser`)**

Before results can be frozen or published, the system enforces **Six Verification Gates**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SIX VERIFICATION GATES                            │
├────────────────────────────────────────────────────────────────────────┤
│  [✓] Gate 1: Voting Window Closed   (Director closed audience voting) │
│  [✓] Gate 2: All 64 Scorecards Done (4 judges × 16 acts submitted)    │
│  [✓] Gate 3: All Durations Verified (16 stopwatch logs verified)      │
│  [✓] Gate 4: No Unresolved Conflicts(0 open conflict declarations)    │
│  [✓] Gate 5: No Unresolved Ties    (All rank ties cleared)            │
│  [✓] Gate 6: Score Desk Sign-off   (Lead officer manual confirmation) │
└────────────────────────────────────────────────────────────────────────┘
```

### The Freeze & Publish Sequence
1. When all 6 gates turn green, the **"Lock Results & Freeze Snapshot"** button lights up.
2. The score desk clicks it. The entire competition standings are frozen into an immutable cryptographic snapshot.
3. The score desk clicks **"Export Master CSV"** and **"Print Master Sheet"** for the Bishop and Chief Judge.
4. On cue, the director clicks **"Publish Results to Public"**.

> **🗣️ Speaker Note**:  
> *"This is our safety lock. The system will literally forbid anyone from publishing results until all 6 gates are green. No missing scores, no open voting windows, no unresolved ties."*

---

## Slide 8: Persona 5 — Stage MC, Bishop & Results Privacy

### Slide Title
**Public Presentation: Dignity & Excitement**

### The Reveal on `/results`
- **1st Place · Winner**: Crowned Grand Champion 🏆
- **2nd Place · First Runner-Up**: Silver Trophy 🥈
- **3rd Place · Second Runner-Up**: Bronze Trophy 🥉

### Strict Privacy Guarantees
- **Ranks 4th to 16th** are never displayed on public screens or network responses.
- **Judge-by-judge marks** and subjective notes are sealed permanently in score desk archives.
- **Raw audience vote counts** are hidden from public view to prevent popularity debates.

> **🗣️ Speaker Note**:  
> *"We protect our contestants. Every finalist is a champion of their district. We only display 1st, 2nd, and 3rd place on screen. The rest of the acts are honored equally without public numerical rankings."*

---

## Slide 9: Edge Case 1 — What If a Judge Makes a Clerical Typo?

### Slide Title
**Scorecard Reopening with Mandatory Audit Trail**

```
  [Judge Typo] ────> [Notify Chief Judge] ────> [Score Desk "Reopen" Click]
                                                          │
  [Card Re-locked] <──── [Judge Resubmits] <──── [Mandatory Written Reason]
```

### Protocol:
1. **Authorization**: Judge immediately notifies Chief Judge and Score Desk.
2. **Organiser Trigger**: Score desk locates the judge's row on `/organiser` and clicks the circular **Reopen** icon.
3. **Mandatory Audit Reason**: The system prompts for a reason (e.g. *"Clerical error in choreography score approved by Chief Judge"*). Reopening without a reason is rejected.
4. **Judge Resubmission**: The judge's tablet displays a gold banner: *"Scorecard reopened by the organiser"*. The judge updates the score, reviews it, and re-submits.

> **🗣️ Speaker Note**:  
> *"Nobody can quietly alter a score behind closed doors. If a card is reopened, the system requires an authorized written reason that is permanently recorded in the event log."*

---

## Slide 10: Edge Case 2 — Breaking Ties (The 5-Step Ladder)

### Slide Title
**Zero Coin Flips: The 5-Step Tie-Break Ladder**

If two acts finish with the exact same final combined score:

1. **Step 1 — Highest Overall Combined Score**: Standard standing.
2. **Step 2 — Spiritual Depth Average**: Biblical Relevance / Scriptural Depth average breaks the tie.
3. **Step 3 — Technical Mastery Average**: Vocal / Dance / Delivery Technique average breaks the tie.
4. **Step 4 — Creativity & Stage Craft Average**: Stage presence / blocking average breaks the tie.
5. **Step 5 — Collective Judges' Panel Decision**: If still tied across all rubrics, the 4 judges convene for a 2-minute executive session. The consensus winner is selected and recorded in the console with the unanimous reason.

> **🗣️ Speaker Note**:  
> *"We never flip coins. Ties are resolved strictly by criteria: spiritual content first, then technical skill, then creativity. And if all else ties, the 4 judges vote together and the score desk logs the decision."*

---

## Slide 11: Emergency Cheat Sheet (What If?)

### Slide Title
**Venue Contingency Protocols**

| What Happened? | Why It Happened | Immediate Verified Fix |
| :--- | :--- | :--- |
| **Tablet loses Wi-Fi** | Venue interference | Switch tablet to backup cellular hotspot (`SHABACH-BACKUP`). Local draft is preserved in tablet memory. Tap **Retry save**. |
| **Voter says "No email code"** | Spam filter / delay | Ask voter to check Spam/Promotions folder or use another email. In rehearsal mode, score desk can view code. |
| **Timekeeper forgot stopwatch** | Human distraction | Obtain verified duration from official video recording playback desk. |
| **Accidental early submission** | Tap on review | Score desk reopens card with reason *"Accidental early submission"*. |
| **Venue power flicker** | Generator switch | Tablets run on built-in batteries with 100% power banks. Laptops on UPS battery backup. Zero data loss. |

> **🗣️ Speaker Note**:  
> *"We've stress-tested every surprise: Wi-Fi drops, power flickers, duplicate votes. The platform has local memory safeguards and seamless retry mechanisms."*

---

## Slide 12: Event-Day Checklist & Sign-Off

### Slide Title
**Ready for the Grand Finale**

```
══════════════════════════════════════════════════════════════════════════════
               SHABACH 2026 GRAND FINALE — EVENT DAY CHEATSHEET
══════════════════════════════════════════════════════════════════════════════

[ ] T-120 MIN: TABLETS & NETWORK
    • 4 Judge Tablets powered, auto-lock OFF, connected to SHABACH-OFFICIAL.
    • Open /judges/judge1 through /judges/judge4.

[ ] T-60 MIN: ROSTER & CODES
    • Check /organiser: 16 finalists loaded with correct categories.
    • Test one QR code scan on mobile.
    • Ensure voting window is CLOSED.

[ ] T-00 MIN: PERFORMANCES 1 TO 16
    • Timekeeper logs start to finish; hands duration slip to score desk.
    • Score desk enters duration into /organiser > Scoring & Durations.
    • All 4 judges enter marks, click "Review & submit", and confirm.

[ ] POST ACT 16: AUDIENCE VOTING (15 MINUTES)
    • Director: "Open Voting Window" -> Click "Open Voting Window".
    • Start 15-minute countdown clock.
    • At 00:00, Director: "Close Voting Window" -> Click "Close Voting Window".

[ ] COLLATION: SIX VERIFICATION GATES
    • [✓] Voting closed
    • [✓] 64 scorecards submitted
    • [✓] 16 durations verified
    • [✓] 0 conflicts open
    • [✓] Ties resolved via criterion ladder or panel decision
    • [✓] Tick "Score desk confirmation"

[ ] LOCK & PUBLISH
    • Click "Lock Results & Freeze Snapshot".
    • Click "Export Master CSV" & "Print Master Sheet" for Bishop & MC.
    • On MC cue, click "Publish Results to Public".
    • Verify /results displays Top 3 Champions.
══════════════════════════════════════════════════════════════════════════════
```

> **🗣️ Speaker Note**:  
> *"The platform is completely tested, hardened, and ready for rehearsal. Let's open up for any questions or practice walkthroughs."*
