# SHABACH 2026 Grand Finale — Browser E2E Simulation & Verification Report

**Date**: Saturday, 31 October 2026
**Environment**: Isolated Test Harness (`http://127.0.0.1:3333`)
**Tested Browsers**: Chromium 156.0.8078.4, WebKit 27.2 (Safari Engine)
**Tested Viewports**:

- Desktop: 1440 × 900
- Tablet: 768 × 1024
- Mobile Modern: 390 × 844
- Mobile Small: 360 × 800

## Scenario Verification Matrix

| Category                   | Scenario / Stage                                        | Status  | Verification Details                                                                                           |
| :------------------------- | :------------------------------------------------------ | :-----: | :------------------------------------------------------------------------------------------------------------- |
| **Visual & Multi-browser** | Public home page (Desktop 1440x900)                     | ✅ PASS | Header, hero banner, search bar, and 16 finalist cards rendered crisply.                                       |
| **Visual & Multi-browser** | Public home page (Mobile Modern 390x844)                | ✅ PASS | Single column stack, mobile navigation, touchable finalist cards.                                              |
| **Visual & Multi-browser** | Public home page (Mobile Small 360x800)                 | ✅ PASS | No horizontal overflow, readable typography at 360px viewport width.                                           |
| **Audience**               | Contestant name search filtering                        | ✅ PASS | Search filtered specifically to Grace Adeyemi; others hidden.                                                  |
| **Audience**               | Direct contestant link loading (/contestants/B6F4PT)    | ✅ PASS | Direct URL resolved accurately without navigation state dependency.                                            |
| **Visual & Multi-browser** | Contestant profile (Mobile 390x844)                     | ✅ PASS | Clean mobile view with large action buttons and responsive bio.                                                |
| **Audience**               | Contestant share panel with QR code and code copy       | ✅ PASS | Displays 6-char code B6F4PT, SVG QR code, and copy link action.                                                |
| **Audience**               | Voter verification dialog trigger                       | ✅ PASS | Alert dialog opened with contestant name, email input, and cancel option.                                      |
| **Audience**               | Voter dialog dismissal via Cancel                       | ✅ PASS | Dialog dismissed cleanly without recording vote.                                                               |
| **Security & Recovery**    | Invalid OTP rejection & error feedback                  | ✅ PASS | Displays validation error and keeps dialog accessible for retry.                                               |
| **Audience**               | Email OTP verified identity badge                       | ✅ PASS | Email verified badge and 'Ready to confirm' badge displayed.                                                   |
| **Audience**               | Official ballot persistence with confirmed status       | ✅ PASS | Vote confirmed and notice updated to 'Your vote is recorded for this finale'.                                  |
| **Security & Recovery**    | Single-vote policy enforcement across acts              | ✅ PASS | Duplicate vote from identical email blocked with security notice.                                              |
| **Judge**                  | Judges' seat selector (/judges) across viewports        | ✅ PASS | 4 distinct judge seats displayed with direct workspace links.                                                  |
| **Judge**                  | Scorecard rubric loading for category (Dance)           | ✅ PASS | Loaded 5 category criteria: Choreography, Technique, Stage Craft, Biblical Relevance, Impact.                  |
| **Judge**                  | Reactive 'Unsaved edits' gold badge indicator           | ✅ PASS | Visual badge alerts judge that changes have not yet been committed.                                            |
| **Judge**                  | Draft saving with timestamp & 'Saved' badge             | ✅ PASS | Draft stored with subtotal 86/100 and reactive status indication.                                              |
| **Judge**                  | Pre-submission review banner (subtotal 87/100)          | ✅ PASS | Review banner reflects newly modified score (19) immediately.                                                  |
| **Judge**                  | Authoritative scorecard submission & lock               | ✅ PASS | Scorecard locked, status marked 'Submitted', mutations disabled.                                               |
| **Judge**                  | Conflict of interest declaration & submission lock      | ✅ PASS | Declared conflict locks submission and flags act for organiser review.                                         |
| **Results**                | Public results pending banner prior to publication      | ✅ PASS | Friendly collation state shown; no leaked marks or raw counts.                                                 |
| **Score-desk**             | Organiser overview dashboard metrics                    | ✅ PASS | Real-time summary of votes, submitted scorecards, and window controls.                                         |
| **Score-desk**             | Performance duration entry & overtime boundary penalty  | ✅ PASS | Overtime calculation enforces -5 pts penalty accurately.                                                       |
| **Score-desk**             | Six verification gates completion checklist             | ✅ PASS | All 6 gates cleared: voting closed, 64 cards valid, durations verified, no conflicts, no ties, desk confirmed. |
| **Score-desk**             | Idempotent results lock & frozen snapshot creation      | ✅ PASS | Immutable results snapshot created with timestamp.                                                             |
| **Score-desk**             | Official public results publication trigger             | ✅ PASS | Results released to public viewer routes.                                                                      |
| **Results**                | Public top-3 winners display & strict privacy isolation | ✅ PASS | Strictly ranks 1, 2, and 3 shown. Ranks 4-16, raw judge marks, and tally counts are excluded.                  |
| **Security & Recovery**    | Server-enforced closed voting window on profile         | ✅ PASS | Vote button replaced with 'Voting is closed' banner.                                                           |
| **Security & Recovery**    | Judge workspace locked against post-collation edits     | ✅ PASS | Scorecard reflects immutable locked state after organiser results freeze.                                      |
| **Visual & Multi-browser** | WebKit engine rendering on Tablet (768x1024)            | ✅ PASS | Flawless Safari/WebKit rendering on iPad resolution.                                                           |
| **Visual & Multi-browser** | WebKit engine rendering on Desktop & Mobile             | ✅ PASS | Safari engine parity verified with zero rendering defects.                                                     |

## High-Fidelity Screenshot Evidence Index

- `01_desktop_home_search.png`: Stored under `qa/screenshots/01_desktop_home_search.png`
- `01_public_home_desktop.png`: Stored under `qa/screenshots/01_public_home_desktop.png`
- `01_public_home_mobile.png`: Stored under `qa/screenshots/01_public_home_mobile.png`
- `01_public_home_search_filtered.png`: Stored under `qa/screenshots/01_public_home_search_filtered.png`
- `01_public_home_small_mobile.png`: Stored under `qa/screenshots/01_public_home_small_mobile.png`
- `01_public_home_webkit_mobile.png`: Stored under `qa/screenshots/01_public_home_webkit_mobile.png`
- `02_contestant_profile_desktop.png`: Stored under `qa/screenshots/02_contestant_profile_desktop.png`
- `02_contestant_profile_mobile.png`: Stored under `qa/screenshots/02_contestant_profile_mobile.png`
- `02_mobile_home_360x800.png`: Stored under `qa/screenshots/02_mobile_home_360x800.png`
- `03_contestant_profile_desktop.png`: Stored under `qa/screenshots/03_contestant_profile_desktop.png`
- `03_contestant_qr_share.png`: Stored under `qa/screenshots/03_contestant_qr_share.png`
- `04_contestant_profile_mobile_390x844.png`: Stored under `qa/screenshots/04_contestant_profile_mobile_390x844.png`
- `04_voter_dialog_cancelled.png`: Stored under `qa/screenshots/04_voter_dialog_cancelled.png`
- `04_voter_dialog_invalid_otp.png`: Stored under `qa/screenshots/04_voter_dialog_invalid_otp.png`
- `04_voter_dialog_step1_email.png`: Stored under `qa/screenshots/04_voter_dialog_step1_email.png`
- `04_voter_dialog_step2_otp_verified.png`: Stored under `qa/screenshots/04_voter_dialog_step2_otp_verified.png`
- `04_voter_dialog_step3_confirmed.png`: Stored under `qa/screenshots/04_voter_dialog_step3_confirmed.png`
- `04_voter_duplicate_rejected.png`: Stored under `qa/screenshots/04_voter_duplicate_rejected.png`
- `05_judges_seat_selector_desktop.png`: Stored under `qa/screenshots/05_judges_seat_selector_desktop.png`
- `05_judges_seat_selector_mobile.png`: Stored under `qa/screenshots/05_judges_seat_selector_mobile.png`
- `05_voter_otp_dialog.png`: Stored under `qa/screenshots/05_voter_otp_dialog.png`
- `06_judge1_conflict_declared.png`: Stored under `qa/screenshots/06_judge1_conflict_declared.png`
- `06_judge1_draft_saved_state.png`: Stored under `qa/screenshots/06_judge1_draft_saved_state.png`
- `06_judge1_review_submit_panel.png`: Stored under `qa/screenshots/06_judge1_review_submit_panel.png`
- `06_judge1_scorecard_rubric.png`: Stored under `qa/screenshots/06_judge1_scorecard_rubric.png`
- `06_judge1_scorecard_submitted.png`: Stored under `qa/screenshots/06_judge1_scorecard_submitted.png`
- `06_judge1_unsaved_edits_indicator.png`: Stored under `qa/screenshots/06_judge1_unsaved_edits_indicator.png`
- `06_voter_confirmed_receipt.png`: Stored under `qa/screenshots/06_voter_confirmed_receipt.png`
- `07_judges_seat_selector.png`: Stored under `qa/screenshots/07_judges_seat_selector.png`
- `07_organiser_dashboard_overview.png`: Stored under `qa/screenshots/07_organiser_dashboard_overview.png`
- `07_organiser_durations_overtime.png`: Stored under `qa/screenshots/07_organiser_durations_overtime.png`
- `07_organiser_lock_gates_checklist.png`: Stored under `qa/screenshots/07_organiser_lock_gates_checklist.png`
- `07_organiser_reopen_modal.png`: Stored under `qa/screenshots/07_organiser_reopen_modal.png`
- `07_organiser_results_locked.png`: Stored under `qa/screenshots/07_organiser_results_locked.png`
- `07_organiser_results_published.png`: Stored under `qa/screenshots/07_organiser_results_published.png`
- `07_organiser_scoring_durations.png`: Stored under `qa/screenshots/07_organiser_scoring_durations.png`
- `07_organiser_tiebreak_resolution.png`: Stored under `qa/screenshots/07_organiser_tiebreak_resolution.png`
- `08_judge1_workspace_desktop.png`: Stored under `qa/screenshots/08_judge1_workspace_desktop.png`
- `08_public_results_official_top3_desktop.png`: Stored under `qa/screenshots/08_public_results_official_top3_desktop.png`
- `08_public_results_official_top3_mobile.png`: Stored under `qa/screenshots/08_public_results_official_top3_mobile.png`
- `08_public_results_pending.png`: Stored under `qa/screenshots/08_public_results_pending.png`
- `09_error_closed_voting.png`: Stored under `qa/screenshots/09_error_closed_voting.png`
- `09_error_locked_mutations.png`: Stored under `qa/screenshots/09_error_locked_mutations.png`
- `09_judge1_workspace_mobile_390x844.png`: Stored under `qa/screenshots/09_judge1_workspace_mobile_390x844.png`
- `10_scorecard_rubric_scoring.png`: Stored under `qa/screenshots/10_scorecard_rubric_scoring.png`
- `10_webkit_desktop_home.png`: Stored under `qa/screenshots/10_webkit_desktop_home.png`
- `10_webkit_mobile_home.png`: Stored under `qa/screenshots/10_webkit_mobile_home.png`
- `10_webkit_tablet_organiser.png`: Stored under `qa/screenshots/10_webkit_tablet_organiser.png`
- `10_webkit_tablet_results.png`: Stored under `qa/screenshots/10_webkit_tablet_results.png`
- `11_scorecard_draft_saved.png`: Stored under `qa/screenshots/11_scorecard_draft_saved.png`
- `12_conflict_of_interest_banner.png`: Stored under `qa/screenshots/12_conflict_of_interest_banner.png`
- `13_scorecard_reopened_banner.png`: Stored under `qa/screenshots/13_scorecard_reopened_banner.png`
- `14_organiser_overview_desktop.png`: Stored under `qa/screenshots/14_organiser_overview_desktop.png`
- `15_organiser_contestants_tab.png`: Stored under `qa/screenshots/15_organiser_contestants_tab.png`
- `16_organiser_durations_overtime.png`: Stored under `qa/screenshots/16_organiser_durations_overtime.png`
- `17_organiser_tiebreak_resolution.png`: Stored under `qa/screenshots/17_organiser_tiebreak_resolution.png`
- `18_organiser_locked_published.png`: Stored under `qa/screenshots/18_organiser_locked_published.png`
- `19_public_results_pending.png`: Stored under `qa/screenshots/19_public_results_pending.png`
- `20_public_results_official_top3.png`: Stored under `qa/screenshots/20_public_results_official_top3.png`
- `21_error_recovery_duplicate_vote.png`: Stored under `qa/screenshots/21_error_recovery_duplicate_vote.png`
- `22_webkit_desktop_1440x900.png`: Stored under `qa/screenshots/22_webkit_desktop_1440x900.png`
- `23_webkit_mobile_390x844.png`: Stored under `qa/screenshots/23_webkit_mobile_390x844.png`
