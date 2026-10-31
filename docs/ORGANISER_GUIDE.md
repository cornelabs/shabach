# SHABACH 2026 Grand Finale — Organiser & Score Desk Operations Guide

> **Official Operating Manual for Event Directors, Score Desk Officers, Adjudicators, and Technical Crew**  
> **Event Date**: November 2026 · Grand Finale: Talent for Christ  
> **Platform Version**: 1.0.0-production-hardened  
> **Venue**: Main Auditorium / Live Broadcast Stream  
> **Screenshot Evidence Directory**: `qa/screenshots/`

---

## Table of Contents

1. [Platform Overview & Roles](#1-platform-overview--roles)
2. [Pre-Event Preparation Checklist](#2-pre-event-preparation-checklist)
3. [Staff Sign-In & Access Control](#3-staff-sign-in--access-control)
4. [Reviewing Contestants, Codes, Direct Links & Running Order](#4-reviewing-contestants-codes-direct-links--running-order)
5. [Sharing Audience Voting Instructions & QR Codes](#5-sharing-audience-voting-instructions--qr-codes)
6. [Opening and Closing the Audience Voting Window](#6-opening-and-closing-the-audience-voting-window)
7. [Judges Entering, Saving Drafts, Reviewing & Submitting Scorecards](#7-judges-entering-saving-drafts-reviewing--submitting-scorecards)
8. [Declaring & Resolving Conflicts of Interest; Reopening Scorecards](#8-declaring--resolving-conflicts-of-interest-reopening-scorecards)
9. [Recording Performance Durations & Verifying Overtime Deductions](#9-recording-performance-durations--verifying-overtime-deductions)
10. [Resolving Ties (The 5-Step Tie-Break Ladder)](#10-resolving-ties-the-5-step-tie-break-ladder)
11. [Verification Gates, Locking Results & Publishing Official Top-3 Winners](#11-verification-gates-locking-results--publishing-official-top-3-winners)
12. [Exporting & Printing Master CSV and Score-Desk Reports](#12-exporting--printing-master-csv-and-score-desk-reports)
13. [Common Problems & Verified Recovery Steps](#13-common-problems--verified-recovery-steps)
14. [One-Page Event-Day Quick Reference Checklist](#14-one-page-event-day-quick-reference-checklist)

---

## 1. Platform Overview & Roles

The SHABACH 2026 Grand Finale platform is designed with role segregation, cryptographic auditability, and zero public data leakage.

```
                                 ┌─────────────────────────────────┐
                                 │    SHABACH 2026 Score Engine    │
                                 └────────────────┬────────────────┘
                                                  │
                  ┌───────────────────────────────┴───────────────────────────────┐
                  ▼                                                               ▼
     ┌────────────────────────┐                                      ┌────────────────────────┐
     │ 4 Adjudicator Seats    │                                      │ Verified Audience Vote │
     │ 4 × 16 = 64 Scorecards │                                      │ One-Time Password (OTP)│
     │ 95 Raw Judge Points    │                                      │ Max +5.00 Scaled Pts   │
     └────────────┬───────────┘                                      └────────────┬───────────┘
                  │                                                               │
                  └───────────────────────────────┬───────────────────────────────┘
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │ Timekeeper Overtime Deductions  │
                                 │ -2 pts per interval over limit  │
                                 └────────────────┬────────────────┘
                                                  ▼
                                 ┌─────────────────────────────────┐
                                 │ Final Score = Mean(Judges) +    │
                                 │ Audience(max 5) - Penalty       │
                                 │ (Maximum: 100.00 pts)           │
                                 └────────────────┬────────────────┘
                                                  │
                  ┌───────────────────────────────┴───────────────────────────────┐
                  ▼                                                               ▼
     ┌────────────────────────┐                                      ┌────────────────────────┐
     │ Score Desk / Organiser │                                      │ Public Results Portal  │
     │ (/organiser)           │                                      │ (/results)             │
     │ 6 Verification Gates,  │                                      │ Strictly Top 3 Ranks   │
     │ Full CSV & Audit Logs  │                                      │ 4th-16th & Marks Sealed│
     └────────────────────────┘                                      └────────────────────────┘
```

### Application Routes & Role Responsibilities

| URL Path                 | Primary User / Role                | Description & Permissions                                                                                                                                                      |
| :----------------------- | :--------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`/`**                  | General Public & Audience          | Public homepage showing all 16 finalists, search by name/code/district, act bio, and live voting link.                                                                         |
| **`/contestants/$code`** | Public Voters                      | Direct finalist profile, 6-character shareable link, SVG QR code, and 3-step OTP voter verification dialog.                                                                    |
| **`/judges`**            | Judging Panel                      | Seat selection portal displaying the 4 adjudicator seats with direct, isolated workspace links.                                                                                |
| **`/judges/$judgeId`**   | Assigned Judge (`judge1`–`judge4`) | Adjudicator evaluation workspace for scoring 16 acts on category-specific rubrics. Supports draft saving, conflict declaration, and final lock.                                |
| **`/organiser`**         | Event Director & Score Desk        | Authoritative event command center: contestant management, voting window toggles, stopwatch entries, tie resolutions, verification gates, CSV export, and results publication. |
| **`/results`**           | General Public & Broadcast MC      | Public results presentation. Displays holding banner during collation; reveals strictly the official **Top 3 Winners** upon authorized publication.                            |

📸 _Screenshot References_:

- `qa/screenshots/01_public_home_desktop.png` (Desktop 1440×900 Home)
- `qa/screenshots/05_judges_seat_selector_desktop.png` (Judges' Seat Portal)
- `qa/screenshots/07_organiser_dashboard_overview.png` (Organiser Command Center)
- `qa/screenshots/08_public_results_official_top3_desktop.png` (Official Public Results)

---

## 2. Pre-Event Preparation Checklist

### T-Minus 120 Minutes (Infrastructure & Power)

- [ ] **Dedicated Isolated Network**: Connect the 4 judging tablets and 2 score-desk laptops to a private, password-protected 5GHz Wi-Fi network (`SHABACH-OFFICIAL`). Never allow audience access to this SSID.
- [ ] **Backup Cellular Hotspot**: Turn on and test an LTE/5G cellular hotspot (`SHABACH-BACKUP`) in the sound booth.
- [ ] **Physical Tablets Configuration**:
  - Tablet 1: Open Chrome/Safari to `https://shabach.vercel.app/judges/judge1`. Set Guided Access (iOS) or App Pinning (Android) ON. Screen timeout set to **Never**.
  - Tablet 2: Open to `https://shabach.vercel.app/judges/judge2`.
  - Tablet 3: Open to `https://shabach.vercel.app/judges/judge3`.
  - Tablet 4: Open to `https://shabach.vercel.app/judges/judge4`.
  - Verify all tablet batteries are at 100% and connected to continuous power banks.
- [ ] **Score Desk Hardware**:
  - Primary workstation running Chrome at `/organiser`.
  - Secondary backup laptop on standby.
  - Local USB/Network laser printer loaded with paper for score backup sheets.
  - Official digital stopwatch synchronized with broadcast stream time.

### T-Minus 60 Minutes (Platform Seed & Sanity Checks)

- [ ] **Verify Finalists Roster**: Open `/organiser` > **Contestants** tab. Confirm all 16 acts match the final official program.
- [ ] **Verify Rubric Category Allocations**:
  - Music: 4 acts (№ 1 Grace Adeyemi, № 2 David Balogun, № 9 Daniel Akpan, № 10 Praise Olawale)
  - Spoken Word: 4 acts (№ 3 Emmanuel Ojo, № 4 Mary Danladi, № 11 Abigail Bassey, № 12 Samuel Kalu)
  - Drama: 4 acts (№ 5 Caleb Okoh, № 6 Joy Eze, № 13 Blessing Sunday, № 14 Tobi Odukoya)
  - Dance: 4 acts (№ 7 Favour Adebayo, № 8 Victor Nwachukwu, № 15 Joshua Bello, № 16 Esther Omotosho)
- [ ] **Verify Codes and QR Destinations**: Test scanning two sample contestant badges with a mobile phone. Verify that `https://shabach.vercel.app/contestants/{CODE}` opens the correct finalist profile without 404 errors.
- [ ] **Confirm Initial Voting State**: On `/organiser` > **Overview**, ensure the **Voting window** is currently `closed` (or click **Close Voting Window** if opened during sound check).

### T-Minus 30 Minutes (Judge Briefing)

- [ ] Conduct a 5-minute briefing with all 4 adjudicators at the judges' table:
  - Demonstrate entering marks using the numeric inputs and stepper buttons.
  - Explain the gold **"Unsaved edits"** badge vs. green **"Saved"** draft badge.
  - Review the conflict of interest checkbox policy.
  - Reiterate that clicking **Confirm submission** permanently locks the scorecard.

---

## 3. Staff Sign-In & Access Control

Access to evaluation workspaces is strictly role-gated:

```
               ┌────────────────────────────────────────────────────────┐
               │              SHABACH Role-Based Access                 │
               └──────────────────────────┬─────────────────────────────┘
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     ┌────────────────────────┐                      ┌────────────────────────┐
     │      Judges Panel      │                      │    Score Desk Lead     │
     ├────────────────────────┤                      ├────────────────────────┤
     │ Seat 1: Judge 1 (A)    │                      │ Access to /organiser   │
     │ Seat 2: Judge 2 (B)    │                      │ Full event settings    │
     │ Seat 3: Judge 3 (C)    │                      │ Duration verification  │
     │ Seat 4: Judge 4 (D)    │                      │ Scorecard re-openings  │
     │ Scopes: Own scorecards │                      │ Results lock & publish │
     └────────────────────────┘                      └────────────────────────┘
```

### Accessing Judge Workspaces

1. Navigate to `/judges`.
2. Adjudicators click their designated seat:
   - **Judge 1 (Seat A)**: `/judges/judge1`
   - **Judge 2 (Seat B)**: `/judges/judge2`
   - **Judge 3 (Seat C)**: `/judges/judge3`
   - **Judge 4 (Seat D)**: `/judges/judge4`
3. The top banner displays the active seat identity via `<JudgeSessionBadge />` (e.g., _"Judge 1 · Seat A"_).
4. Adjudicators can switch seats only from the `/judges` portal if a tablet swap is necessary.

### Accessing Organiser Command Desk

1. Navigate to `/organiser`.
2. When Supabase Authentication is active, sign in using authorized staff credentials (`admin@shabach.org`).
3. The dashboard provides tabs:
   - **Overview**: Real-time KPI cards (Votes Cast, Submitted Scorecards, Voting Status) and master action buttons.
   - **Contestants**: Running order, biography, category, and direct link audits.
   - **Scoring & Durations**: Live 64-card matrix, duration entries, overtime deductions, and scorecard reopen controls.
   - **Results & Verification**: Six Verification Gates, tie resolution console, snapshot freeze, and public release button.

📸 _Screenshot References_:

- `qa/screenshots/05_judges_seat_selector_desktop.png` (Judges' Seat Selector)
- `qa/screenshots/14_organiser_overview_desktop.png` (Organiser Overview)

---

## 4. Reviewing Contestants, Codes, Direct Links & Running Order

The finale features 16 finalists representing the 8 districts of Lagos:

```
┌───────┬───────────────────┬───────────────┬──────────────┬──────────┬──────────────┐
│ Order │ Finalist Name     │ District      │ Category     │ Code     │ Time Limit   │
├───────┼───────────────────┼───────────────┼──────────────┼──────────┼──────────────┤
│ № 1   │ Grace Adeyemi     │ Lagos Central │ Music        │ B6F4PT   │ 4:00 (240s)  │
│ № 2   │ David Balogun     │ Ikeja         │ Music        │ K9M2WX   │ 4:00 (240s)  │
│ № 3   │ Emmanuel Ojo      │ Surulere      │ Spoken Word  │ R3T7YQ   │ 3:30 (210s)  │
│ № 4   │ Mary Danladi      │ Yaba          │ Spoken Word  │ H4V8NJ   │ 3:30 (210s)  │
│ № 5   │ Caleb Okoh        │ Ikorodu       │ Drama        │ W2P5LK   │ 5:00 (300s)  │
│ № 6   │ Joy Eze           │ Lekki         │ Drama        │ N7D3FS   │ 5:00 (300s)  │
│ № 7   │ Favour Adebayo    │ Badagry       │ Dance        │ Q8X1CV   │ 4:00 (240s)  │
│ № 8   │ Victor Nwachukwu  │ Epe           │ Dance        │ Z5M9RT   │ 4:00 (240s)  │
│ № 9   │ Daniel Akpan      │ Lagos Central │ Music        │ J2L6HP   │ 4:00 (240s)  │
│ № 10  │ Praise Olawale    │ Ikeja         │ Music        │ C9V3BN   │ 4:00 (240s)  │
│ № 11  │ Abigail Bassey    │ Surulere      │ Spoken Word  │ T4K8MW   │ 3:30 (210s)  │
│ № 12  │ Samuel Kalu       │ Yaba          │ Spoken Word  │ P6R2XJ   │ 3:30 (210s)  │
│ № 13  │ Blessing Sunday   │ Ikorodu       │ Drama        │ F7Y4QS   │ 5:00 (300s)  │
│ № 14  │ Tobi Odukoya      │ Lekki         │ Drama        │ L3W9VK   │ 5:00 (300s)  │
│ № 15  │ Joshua Bello      │ Badagry       │ Dance        │ M8N2TH   │ 4:00 (240s)  │
│ № 16  │ Esther Omotosho   │ Epe           │ Dance        │ X5B7CF   │ 4:00 (240s)  │
└───────┴───────────────────┴───────────────┴──────────────┴──────────┴──────────────┘
```

### Auditing Direct Links and QR Destinations

1. Open `/organiser` > **Contestants** tab.
2. For each act, click **Copy Public Link** or inspect the displayed 6-character code.
3. Verify that pasting the URL directly into an incognito window (`/contestants/B6F4PT`) immediately resolves to the finalist's page without landing on 404.

📸 _Screenshot References_:

- `qa/screenshots/02_contestant_profile_desktop.png` (Direct Finalist Profile)
- `qa/screenshots/03_contestant_qr_share.png` (Contestant QR Share Panel)
- `qa/screenshots/15_organiser_contestants_tab.png` (Contestants Roster Management)

---

## 5. Sharing Audience Voting Instructions & QR Codes

Audience voting is completely mobile-optimized and verified via email One-Time Passwords (OTP).

### Audience Voting Instructions for MC & Video Screens

> _"Ladies and gentlemen, to vote for your favourite finalist:_
>
> 1. _Scan the QR code displayed on the stage screen or visit **shabach.vercel.app**._
> 2. _Select your contestant and tap **Vote for this Contestant**._
> 3. _Enter your email address to receive your 6-digit verification code._
> 4. _Enter the code and tap **Confirm Vote**._  
>    _Note: Each voter may cast only ONE verified vote across the entire Grand Finale!"_

### 3-Step Voter Verification Journey

1. **Step 1: Enter Email**: User enters email address. Clicking **Send Code** triggers an OTP dispatch.
2. **Step 2: Enter 6-Digit Code**: User inputs the OTP received. Upon verification, the dialog displays an **Email verified** badge.
3. **Step 3: Confirm Ballot**: User reviews the finalist name and clicks **Confirm Vote**. The dialog confirms receipt and displays: _"Your vote is recorded for this finale"_.

### Single-Vote Policy Defense

If a voter attempts to vote a second time (for the same or another act), the system halts the transaction and presents a prominent security notice:

> _"You have already cast your single vote for this Grand Finale. Each voter identity is permitted exactly one official ballot."_

📸 _Screenshot References_:

- `qa/screenshots/04_voter_dialog_step1_email.png` (Email Input Step)
- `qa/screenshots/04_voter_dialog_step2_otp_verified.png` (Verified Email Badge)
- `qa/screenshots/04_voter_dialog_step3_confirmed.png` (Confirmed Ballot Receipt)
- `qa/screenshots/04_voter_duplicate_rejected.png` (Duplicate Vote Defense Notice)

---

## 6. Opening and Closing the Audience Voting Window

The audience voting window is authoritative and server-enforced:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   VOTING WINDOW LIFECYCLE CONTROLS                     │
├────────────────────────────────────────────────────────────────────────┤
│  Pre-Event:     [ CLOSED ]  — Public buttons disabled                  │
│  Post-Act 16:   [ OPEN ]    — Organiser clicks "Open Voting Window"    │
│  T+15 Minutes:  [ CLOSED ]  — Organiser clicks "Close Voting Window"   │
│  Post-Close:    [ IMMUTABLE]— Late votes rejected by backend RPC       │
└────────────────────────────────────────────────────────────────────────┘
```

### Procedure:

1. **Opening Voting Window**:
   - As Finalist № 16 steps off the stage, the Event Director calls: _"Open Voting Window"_.
   - On `/organiser` > **Overview** tab, click **Open Voting Window**.
   - The indicator updates to green: **"Voting window: OPEN"**.
   - Public contestant pages instantly enable the **"Vote for this Contestant"** button.
2. **Closing Voting Window**:
   - When the 15-minute countdown clock reaches `00:00`, the Event Director calls: _"Close Voting Window"_.
   - On `/organiser` > **Overview** tab, click **Close Voting Window**.
   - Public buttons are immediately replaced with an amber badge: **"Voting is closed"**.
   - Any late submissions from stale browser tabs fail authoritatively with a server error.

📸 _Screenshot References_:

- `qa/screenshots/07_organiser_dashboard_overview.png` (Voting Controls on Dashboard)
- `qa/screenshots/09_error_closed_voting.png` (Public View With Voting Closed)

---

## 7. Judges Entering, Saving Drafts, Reviewing & Submitting Scorecards

### The Deterministic Scoring Engine

Every finalist is scored out of **100 total maximum points**, composed of:

$$\text{Final Score} = \overline{\text{Judge Subtotals}} + \text{Audience Points} - \text{Time Penalty}$$

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     100-POINT SCORING ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│  1. Four Adjudicator Scorecards (95.00 Raw Pts Max per Judge):         │
│     • 4 Category-Specific Criteria × 20 pts          = 80 pts           │
│     • Audience Engagement / Impact (Judge-Assessed) = 15 pts           │
│     • Raw Judge Subtotal Max                        = 95 pts           │
│     • Combined Judge Average: Mean of 4 Judges       = Up to 95.00 pts  │
│                                                                         │
│  2. Public Audience Voting Contribution:                                │
│     • Scaled relative to highest vote count:                            │
│       Audience Points = 5.00 × (Valid Votes / Highest Valid Votes)      │
│     • Maximum Contribution                          = Up to 5.00 pts   │
│                                                                         │
│  3. Theoretical Maximum Overall Total               = 100.00 pts        │
│                                                                         │
│  4. Overtime Boundary Deduction:                                        │
│     • -2.00 pts per full interval exceeded beyond allowed limit        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Category Rubric Specifications

| Category        | Criterion 1 (20)   | Criterion 2 (20)      | Criterion 3 (20)  | Criterion 4 (20)   | Criterion 5 (15)    | Allowed Time | Penalty Rate |
| :-------------- | :----------------- | :-------------------- | :---------------- | :----------------- | :------------------ | :----------- | :----------- |
| **Music**       | Vocal Technique    | Pitch & Intonation    | Stage Presence    | Biblical Relevance | Impact & Engagement | 4:00 (240s)  | −2 pts / 30s |
| **Spoken Word** | Diction & Delivery | Flow & Rhyme Dynamics | Poetic Structure  | Scriptural Depth   | Audience Impact     | 3:30 (210s)  | −2 pts / 30s |
| **Drama**       | Characterization   | Voice Projection      | Timing & Blocking | Message Clarity    | Emotional Resonance | 5:00 (300s)  | −2 pts / 30s |
| **Dance**       | Choreography       | Technique & Precision | Stage Craft       | Biblical Relevance | Impact & Energy     | 4:00 (240s)  | −2 pts / 30s |

### Judge Step-by-Step Evaluation Workflow

1. Select the performing act from the left sidebar on `/judges/judge[1-4]`.
2. Input scores (0 to maximum) for each of the 5 criteria using the `+` / `−` buttons or direct typing.
3. Observe the gold **"Unsaved edits"** badge alerting that input changes are pending.
4. **Saving Drafts**: Click **Save draft**. The badge turns green: **"Saved"** with a timestamp. Judges may safely navigate away or refresh.
5. **Reviewing & Submitting**:
   - When all 5 criteria are entered, click **Review & submit**.
   - An amber review card displays the exact raw subtotal (e.g., `87 / 95`) and notes.
   - Click **Confirm submission**.
   - The card locks immediately; inputs are disabled, and the status changes to green: **"Submitted"**.

📸 _Screenshot References_:

- `qa/screenshots/06_judge1_scorecard_rubric.png` (Rubric Scoring Inputs)
- `qa/screenshots/06_judge1_unsaved_edits_indicator.png` (Unsaved Edits Gold Badge)
- `qa/screenshots/06_judge1_draft_saved_state.png` (Draft Saved Confirmation)
- `qa/screenshots/06_judge1_review_submit_panel.png` (Pre-Submission Review Panel)
- `qa/screenshots/06_judge1_scorecard_submitted.png` (Locked Submitted Scorecard)

---

## 8. Declaring & Resolving Conflicts of Interest; Reopening Scorecards

### Conflict of Interest Protocol

If a judge has a personal, familial, or pastoral relationship with an act:

1. Judge ticks **"I declare a conflict of interest"** on the scorecard.
2. The card displays a red warning: **"Conflict of interest declared"**.
3. Submission is blocked until resolved.
4. The Organiser reviews the declaration on the **Scoring & Durations** tab and records an authorized resolution (e.g., recusal or approved independent scoring).

### Reopening a Submitted Scorecard (Mandatory Audit Trail)

If an honest clerical mistake occurs (e.g., entered 2 instead of 20):

1. The judge informs the Chief Judge and Score Desk.
2. On `/organiser` > **Scoring & Durations**, locate the contestant and click the **Reopen** circular icon.
3. A modal titled **"Reopen Scorecard"** appears.
4. Enter the **Mandatory Reopen Reason** (e.g., _"Clerical typo in choreography score corrected with Chief Judge consent"_). Reopening without a reason is rejected by the system.
5. Click **Confirm Reopen**.
6. The judge's tablet displays a gold banner: **"Scorecard reopened by the organiser"**.
7. The judge updates the score, clicks **Review & submit**, and re-locks the card.

📸 _Screenshot References_:

- `qa/screenshots/06_judge1_conflict_declared.png` (Conflict Declared Banner)
- `qa/screenshots/13_scorecard_reopened_banner.png` (Reopened Banner on Judge Tablet)
- `qa/screenshots/07_organiser_scoring_durations.png` (Score Desk Reopen Trigger)

---

## 9. Recording Performance Durations & Verifying Overtime Deductions

The score desk maintains the official digital log of all performance timings:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   OVERTIME BOUNDARY FORMULA                            │
├────────────────────────────────────────────────────────────────────────┤
│  Actual Time ≤ Category Limit:        Penalty = 0.00 pts               │
│  Actual Time > Category Limit:                                         │
│    Periods Exceeded = floor((Actual Seconds - Allowed Seconds) / 30)   │
│    Time Penalty     = 2.00 pts × Periods Exceeded                      │
│                                                                        │
│  Example (Music Limit 4:00 / 240s):                                    │
│    4:15 (255s) -> 15s over  -> 0 intervals ->  0.00 pts deduction      │
│    4:35 (275s) -> 35s over  -> 1 interval  -> -2.00 pts deduction      │
│    5:05 (305s) -> 65s over  -> 2 intervals -> -4.00 pts deduction      │
└────────────────────────────────────────────────────────────────────────┘
```

### Logging Steps:

1. Receive the physical stopwatch slip from the official timekeeper.
2. Open `/organiser` > **Scoring & Durations** tab.
3. Enter duration in `mm:ss` format into the contestant's row (e.g. `04:35`).
4. Tab out of the input. The system automatically computes and displays the penalty in red (e.g. `−2 pts`).
5. Tick the **Verified** checkbox (or click **Verify All Entered** once all 16 acts conclude).

📸 _Screenshot References_:

- `qa/screenshots/07_organiser_durations_overtime.png` (Overtime Penalty Display)

---

## 10. Resolving Ties (The 5-Step Tie-Break Ladder)

The SHABACH 2026 scoring engine resolves ties using a strict, automated 5-step ladder:

```
                  ┌──────────────────────────────────────────────┐
                  │               TIE DETECTED                   │
                  │   (Identical Final Combined Score / 100)     │
                  └──────────────────────┬───────────────────────┘
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │ 1. Spiritual Criterion Average               │
                  │    (Biblical Relevance / Scriptural Depth)   │
                  └──────────────────────┬───────────────────────┘
                                         ▼ (If Still Tied)
                  ┌──────────────────────────────────────────────┐
                  │ 2. Technical Criterion Average               │
                  │    (Vocal Technique / Diction / Technique)   │
                  └──────────────────────┬───────────────────────┘
                                         ▼ (If Still Tied)
                  ┌──────────────────────────────────────────────┐
                  │ 3. Creativity Criterion Average              │
                  │    (Stage Presence / Poetic Flow / Blocking) │
                  └──────────────────────┬───────────────────────┘
                                         ▼ (If Still Tied)
                  ┌──────────────────────────────────────────────┐
                  │ 4. Collective Judges' Panel Decision         │
                  │    (Recorded in Organiser Console)           │
                  └──────────────────────────────────────────────┘
```

### Executing a Collective Judges' Tie Decision

If acts remain tied through criteria 1, 2, and 3:

1. The **Results & Verification** tab flags the tie: **"Judges' review required"**.
2. A highlighted card appears: **"Collective Judges' Tie Resolution"**.
3. The 4 judges convene in executive session and vote to break the tie.
4. Score Desk Officer selects the winner from the dropdown.
5. Officer enters the unanimous reasoning (e.g. _"Unanimous panel decision on harmonic complexity and tonal discipline"_).
6. Click **Record Tie Decision**. The tie is permanently resolved.

📸 _Screenshot References_:

- `qa/screenshots/07_organiser_tiebreak_resolution.png` (Collective Judges' Tie Resolution Card)

---

## 11. Verification Gates, Locking Results & Publishing Official Top-3 Winners

Before results can be frozen, the system enforces **Six Verification Gates**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      SIX VERIFICATION GATES                            │
├────────────────────────────────────────────────────────────────────────┤
│  [✓] 1. Voting window closed       (Audience voting shut)              │
│  [✓] 2. All 64 scorecards submitted (4 judges × 16 acts complete)       │
│  [✓] 3. All durations verified     (16 stopwatch logs verified)        │
│  [✓] 4. No unresolved conflicts    (0 open conflict declarations)      │
│  [✓] 5. No unresolved ties         (All rank ties cleared)             │
│  [✓] 6. Score desk confirmation    (Lead officer manual confirmation)  │
└────────────────────────────────────────────────────────────────────────┘
```

### Freezing and Publishing Steps:

1. Open `/organiser` > **Results & Verification** tab.
2. Verify that all 6 items show green checkmarks.
3. Tick **"I confirm that the score desk has verified all entries"** (Gate 6).
4. The button **"Lock Results & Freeze Snapshot"** turns active.
5. Click **Lock Results & Freeze Snapshot**. The standings are cryptographically frozen with a timestamp. Scorecards and durations become 100% read-only.
6. When the MC is on stage ready to announce the winners, click **Publish Results to Public**.
7. The public page at `/results` switches instantly from the collation holding banner to the **Official Top 3 Winners**:
   - 🏆 **1st Place · Winner**: Crowned Champion
   - 🥈 **2nd Place · First Runner-Up**
   - 🥉 **3rd Place · Second Runner-Up**
8. **Privacy Guarantee**: Ranks 4th through 16th, individual judge marks, and vote tallies remain strictly sealed and are never leaked to public routes or network responses.

📸 _Screenshot References_:

- `qa/screenshots/07_organiser_lock_gates_checklist.png` (Verification Gates Checklist)
- `qa/screenshots/07_organiser_results_locked.png` (Results Locked Confirmation)
- `qa/screenshots/07_organiser_results_published.png` (Results Published Confirmation)
- `qa/screenshots/08_public_results_official_top3_desktop.png` (Public Top 3 Presentation)

---

## 12. Exporting & Printing Master CSV and Score-Desk Reports

### Exporting Master CSV

1. Navigate to `/organiser` > **Results & Verification** tab.
2. Click **Export Master CSV**.
3. A complete CSV file (`shabach-2026-master-results.csv`) downloads immediately, containing:
   - Contestant ID, Name, District, and Category
   - Judge 1, 2, 3, 4 Subtotals (/95) and Combined Judge Average
   - Valid Audience Vote Count and Audience Points (/5.00)
   - Performance Duration, Overtime Deduction, and Final Overall Score (/100)
   - Official Ranks (1 to 16) and Tie-Break Notes

### Printing Physical Master Sheets

1. Click **Print Master Sheet** from the Results tab.
2. The print CSS formats a clean, multi-column paper report with official headers.
3. Print 4 copies:
   - Copy 1: Presiding Bishop / Event Director
   - Copy 2: Chief Judge (for official signing)
   - Copy 3: Stage MC / Presenter
   - Copy 4: Permanent Score Desk Archive

---

## 13. Common Problems & Verified Recovery Steps

| Problem Observed                                          | Probable Cause                | Verified Recovery Procedure                                                                                                                                         |
| :-------------------------------------------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Judge tablet displays "Disconnected" or fails to save** | Local Wi-Fi drop              | Switch tablet to `SHABACH-BACKUP` LTE hotspot. Any active scores remain preserved in component state; click **Retry save**.                                         |
| **Judge accidentally submitted incomplete scorecard**     | Premature tap on Review       | Score Desk reopens card via `/organiser` > **Scoring & Durations** with reason _"Clerical reopen for uncompleted criteria"_.                                        |
| **Audience voter claims verification email not received** | Email delay or spam folder    | Advise voter to check Spam/Junk folder. In demo/rehearsal mode, provide the local verification bypass code.                                                         |
| **Duplicate vote attempt rejected**                       | Voter already voted           | Explain the single-vote policy politely. No action needed; the system's duplicate rejection protects integrity.                                                     |
| **Timekeeper missed the start time**                      | Distraction                   | Obtain exact elapsed time from the official video recording desk or broadcast stream playback.                                                                      |
| **Tie appears between top finalists**                     | Identical final points        | Follow Section 10: convene the 4 judges for a 2-minute executive session, select the winner in the console, and record the panel reason.                            |
| **"Lock Results" button remains disabled**                | Uncompleted verification gate | Check the 6 Gates checklist on the Results tab. Click the highlighted amber gate link to complete the missing item (e.g., close voting window or verify durations). |

---

## 14. One-Page Event-Day Quick Reference Checklist

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
