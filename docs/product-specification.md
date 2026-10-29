# SHABACH 2026 — Original Product Specification

Build a polished, functional web application demo for **SHABACH 2026**, a church youth talent competition organised by Youth Alive Fellowship (YAF), Living Faith Church, Lagos State.

Theme: **Talent for Christ**  
Grand Finale: **Saturday, 14 November 2026**  
Timezone: **Africa/Lagos**

The platform serves only the **16 Grand Finale contestants**, who may be individuals or groups. It connects three experiences:

1. Public audience voting.
2. Independent scoring by three judges.
3. An organiser’s dashboard for administration, score collation, and results.

Create a working interactive application, not just a landing page.

## 1. Scope and competition structure

All 16 contestants compete in **one overall ranking**, with one set of first, second, and third places.

Performance types determine the appropriate judging rubric and time limit. They must not create separate competitions, voting pools, leaderboards, or category winners.

The five performance types are:

- Music.
- Dance.
- Spoken Word/Poetry.
- Mono-Drama.
- Visual Arts.

Use fictional, editable contestant names, group names, performance titles, biographies, and profile images or tasteful monogram placeholders. Clearly identify the data as demo content.

Create two contestants from each district:

- Epe District.
- Ijede District.
- Iranwo District.
- Igbogbo District.
- Badagry District.
- Magbon District.
- Morogbo District.
- State Church.

Do not build registration, auditions, district selection, contestant accounts, paid voting, payments, livestreaming, or social feeds.

## 2. Design direction

Create a clean, classy, contemporary event platform. It should feel premium, warm, and celebratory, while remaining easy to use during a live event.

Use:

- Warm ivory backgrounds: #F8F6F0.
- Deep forest green: #123D35.
- Charcoal text: #202A27.
- Restrained champagne-gold accents: #C4A56A.
- An elegant display serif such as DM Serif Display for major headings.
- A readable modern sans serif such as Manrope for the interface.

Use strong typography, balanced spacing, subtle shadows, thin borders, approximately 14px card corners, and restrained animation.

Avoid oversized empty hero sections, excessive whitespace, neon effects, heavy gradients, glassmorphism, generic purple dashboard styling, and invented church logos.

Use a tasteful SHABACH wordmark. Public pages should feel like a beautiful event experience. Staff pages should use the same design system with more compact, practical layouts.

Design mobile-first. The voting page must work beautifully at 360px width. Use a two-column contestant grid where readable, with a single-column fallback when needed, and up to four columns on desktop.

Provide accessible contrast, keyboard navigation, visible focus states, reduced-motion support, and touch targets of at least 44px.

## 3. Routes and demo access

Create these routes:

- `/`: Public voting home.
- `/contestant/:code`: Shareable contestant profile.
- `/results`: Published winners or results-pending screen.
- `/judge`: Judge workspace.
- `/admin`: Organiser dashboard.
- `/demo`: Demo launcher.

The demo launcher should let reviewers enter the public view, Judge 1, Judge 2, Judge 3, or admin.

Role switching is demo simulation, not real authentication or security. Show a discreet persistent “Demo preview” notice. Use fictional data only.

Build frontend-first using React, TypeScript, Tailwind CSS, reusable components, and local persistence. Do not provision a backend, enable paid services, or implement real authentication in this first version.

## 4. Public voting experience

The public home page should contain:

- Compact branded header.
- “Talent for Christ” theme and finale date.
- Clear voting-status indicator.
- A short headline such as “16 finalists. One unforgettable finale.”
- A prominent search box accepting a contestant name or code.
- All 16 contestant cards in performance order.

Each contestant card shows:

- Photo or polished monogram placeholder.
- Contestant or group name.
- District.
- A prominent unique six-character uppercase alphanumeric code.
- Clear view/vote action.

Performance type may appear as a small descriptive label, but do not create category tabs or separate leaderboards.

Generate codes containing letters and numbers, such as **SB7K2M**. Avoid easily confused characters such as I, L, O, 0, and 1. Search should ignore case and surrounding spaces.

A contestant code identifies the contestant. It does not identify or authenticate a voter.

The contestant profile page should show the contestant’s identity, biography, district, performance title, code, and voting action. Include working copy-code and copy-link buttons, plus a working QR code linking to the actual profile URL.

Opening a link or scanning a QR code must never automatically cast a vote.

Voting flow:

1. Select a contestant.
2. Show a confirmation dialog containing their name, district, and code.
3. Explain that each voter gets one final vote across the entire competition.
4. Record the vote only after explicit confirmation.
5. Show a success state identifying the selected contestant.
6. Prevent another vote in this browser’s demo state, including after refresh or visiting another contestant.

Support these states:

- Voting not open yet.
- Voting open.
- Voting closed.
- Already voted.

Use one common voting window, intended to open after all 16 performances and close when the organiser decides.

Do not show public vote counts, popularity ordering, provisional scores, or live rankings.

State honestly that browser-based duplicate-vote prevention is only a demo simulation. Do not collect real phone numbers or pretend to perform real OTP verification.

## 5. Scoring model

Use this proposed revised scoring model for the demo:

- Four main judging criteria worth 20 points each: 80 points.
- Judge-assessed audience engagement/connection/impact: 15 points.
- Public voting contribution: up to 5 points.
- Overall maximum before time deductions: 100 points.

Each judge therefore submits a raw subtotal **out of 95**.

Important context: the original competition document gives all five criteria 20 points each and excludes public voting. This demo revises the audience-impact component to 15 judge-assessed points plus 5 public-voting points.

Do not calculate this as 95% of the original judge score. Change the audience-impact criterion itself from 20 to 15.

Use the following exact scorecard templates.

### Music

- Vocal Quality & Pitch Control: 20.
- Creativity/Originality in Rendition: 20.
- Stage Presence & Confidence: 20.
- Spiritual Depth: 20.
- Audience Engagement & Impact: 15.

### Dance

- Choreography & Creativity: 20.
- Synchronization/Coordination: 20.
- Stage Presence & Energy: 20.
- Spiritual Alignment: 20.
- Audience Engagement & Impact: 15.

### Spoken Word/Poetry

- Content Depth & Scriptural Relevance: 20.
- Delivery: 20.
- Creativity/Originality of Composition: 20.
- Stage Presence & Confidence: 20.
- Audience Connection & Impact: 15.

### Mono-Drama

- Storyline: 20.
- Acting Skills: 20.
- Spiritual Message & Alignment: 20.
- Stage Use/Props/Costume: 20.
- Audience Connection & Impact: 15.

### Visual Arts

- Creativity & Originality of Concept: 20.
- Technical Skill & Execution: 20.
- Message/Interpretation: 20.
- Presentation: 20.
- Audience Appeal/Impact: 15.

Include brief, useful guidance beside each criterion, adapted to the discipline. Audience impact means meaningful communication and connection, rather than applause volume alone.

Calculate the public-voting contribution as:

`audiencePoints = 5 × contestantValidVotes / highestEligibleVoteCount`

If no votes have been recorded, audiencePoints must be zero for everyone.

Examples:

- Highest contestant vote count of 400: that contestant receives 5 points.
- A contestant with 200 votes receives 2.5 points.
- A contestant with 100 votes receives 1.25 points.
- Zero votes receives zero points.
- Contestants tied for the highest vote count each receive 5 points.

For contestants with three valid submitted scorecards:

`judgeAverage = (judge1Subtotal + judge2Subtotal + judge3Subtotal) / 3`

`finalScore = max(0, judgeAverage + audiencePoints - timePenalty)`

Apply the time penalty exactly once.

Keep full precision for calculations and ranking. Display totals to two decimal places.

Missing scorecards must remain incomplete. Do not treat them as zero or silently average fewer than three judges.

All results remain provisional until voting closes and the organiser verifies and locks the results.

## 6. Judge workspace

Create a calm interface suitable for a tablet during a live event.

Show:

- Selected demo judge.
- Progress such as “5 of 16 submitted”.
- Contestants in performance order.
- Not started, Draft, and Submitted states.

Selecting a contestant automatically loads their assigned scorecard.

The scorecard should display:

- Contestant identity and performance title.
- Five rubric rows with maximum points.
- Short judging guidance.
- Numeric score inputs.
- Optional notes.
- Live subtotal out of 95.

Accept whole numbers from zero to the maximum for each criterion. Leave unscored fields blank. Reject missing, fractional, negative, and excessive scores.

Autosave drafts locally with an honest saved indicator. Require a review and confirmation step before final submission.

Submitted scorecards become read-only. An organiser must explicitly reopen a scorecard and record a reason before it can be edited.

Judges must see only their own scorecards. Their workspace must not expose audience counts, audience points, other judges’ scores, or rankings.

Include a conflict-of-interest declaration. Declared conflicts require organiser resolution and must not silently count as valid submitted scorecards. Unresolved conflicts block finalisation.

## 7. Organiser dashboard

Create compact navigation for Overview, Contestants, Scoring, and Results.

Useful summary cards include:

- Demo votes received.
- Submitted scorecards out of 48.
- Voting status.
- Verification progress.

Provide working controls to:

- Edit contestant names, profile details, district, performance title, performance order, and assigned rubric.
- Copy contestant codes and share links.
- Open and close voting.
- Inspect vote totals and audience points.
- Review judge submission progress.
- Reopen submitted scorecards with a required reason.
- Enter actual performance durations.
- Verify time deductions.
- Review the master results table.
- Verify, lock, export, and publish results.

Keep contestant codes stable. Prevent changing a contestant’s rubric after scores have been entered, rather than silently reinterpreting existing scores.

The master results table should show:

- Contestant and district.
- Performance type.
- Three individual judge subtotals out of 95.
- Judge average.
- Valid vote count.
- Audience points out of 5.
- Time deduction.
- Combined score out of 100.
- Completion and verification status.
- Rank.

Use readable cards on narrow screens.

### Time limits and deductions

Allowed durations:

- Music: 240 seconds.
- Dance: 240 seconds.
- Spoken Word/Poetry: 240 seconds.
- Mono-Drama: 300 seconds.
- Visual Arts: 600 seconds.

For Music, Dance, Spoken Word/Poetry, and Mono-Drama, deduct 2 points for each completed 15-second period beyond the limit.

For Visual Arts, deduct 2 points for each completed 60-second period beyond the limit.

Formula:

`timePenalty = 2 × floor(max(0, actualSeconds - allowedSeconds) / penaltyIntervalSeconds)`

Partial intervals do not attract another deduction.

### Tie-break rules

For equal final scores, compare the three judges’ averaged relevant criterion scores in this order:

1. Spiritual criterion.
2. Technical/performance criterion.
3. Creativity/originality criterion.
4. If still tied, flag “Judges’ review required”.

Map those criteria as follows:

- Music: Spiritual Depth; Vocal Quality & Pitch Control; Creativity/Originality in Rendition.
- Dance: Spiritual Alignment; Synchronization/Coordination; Choreography & Creativity.
- Spoken Word/Poetry: Content Depth & Scriptural Relevance; Delivery; Creativity/Originality of Composition.
- Mono-Drama: Spiritual Message & Alignment; Acting Skills; Storyline.
- Visual Arts: Message/Interpretation; Technical Skill & Execution; Creativity & Originality of Concept.

Do not resolve remaining ties randomly, alphabetically, by district, or with extra audience-vote comparisons.

### Verification and publication

Before results can be locked, require:

- Voting closed.
- Three valid submitted scorecards per contestant.
- All performance durations verified.
- No unresolved conflicts or ties.
- Explicit score-desk confirmation.

Record a small demo activity history for voting-status changes, reopened scorecards, verification, locking, and publication.

Locking creates a frozen results snapshot. Publication must be a separate deliberate action.

The public results page should display only the top three contestants’ names, profile placeholders, districts, and placements.

Keep judges’ scores, notes, vote totals, and numeric final scores internal.

Before publication, show “Results are awaiting official announcement”.

Provide a working CSV export of internal results and a print-friendly results view. Exporting must not publish results.

## 8. Functional demo behaviour

Seed all 16 fictional contestants, a mix of performance types, simulated vote counts, and a mixture of draft, submitted, and incomplete scorecards.

Use Judge 1, Judge 2, and Judge 3 as sample labels. Do not imply real officials have submitted scores.

Include an admin-only demo control to load complete sample scores so reviewers can demonstrate verification and publication without manually entering 48 scorecards.

Clearly label generated votes and scores as simulated. Include a reset-demo action requiring confirmation.

Use one shared local demo data store with a replaceable data-access layer. Keep the interface synchronised within a tab and between tabs using the same browser storage.

Local browser storage is not a shared multi-user database.

Implement real demo interactions, including navigation, search, vote confirmation, duplicate-vote state, score validation, draft persistence, submission, admin controls, calculations, CSV export, and results publication.

Do not show success messages for actions that do nothing.

Include clear invalid-code, empty-search, incomplete-score, closed-voting, and results-pending states.

