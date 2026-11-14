import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const PRISCILLIA_IMG = fs.readFileSync("public/judges/priscillia-fayomi.jpeg").toString("base64");
const REX_IMG = fs.readFileSync("public/judges/rex-omoigberale.jpeg").toString("base64");
const DAVID_IMG = fs.readFileSync("public/judges/david-umoru.jpeg").toString("base64");
const SOCHI_IMG = fs.readFileSync("public/judges/sochi-daniel-onuoha.jpeg").toString("base64");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SHABACH 2026 — Grand Finale Adjudication Panel Dossier</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1a231f;
      background-color: #ffffff;
      line-height: 1.35;
      font-size: 8.8pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page-container {
      height: 277mm;
      max-height: 277mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }
    .page-container:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* HEADER BANNER */
    .header-banner {
      background: linear-gradient(135deg, #07271e 0%, #0e3d30 65%, #165342 100%);
      color: #ffffff;
      padding: 12px 16px;
      border-radius: 7px;
      border-left: 5px solid #d4af37;
      margin-bottom: 8px;
    }
    .header-badge {
      display: inline-block;
      background-color: rgba(212, 175, 55, 0.22);
      border: 1px solid rgba(212, 175, 55, 0.5);
      color: #f6ecc6;
      font-size: 7.2pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 1px 7px;
      border-radius: 10px;
      margin-bottom: 3px;
    }
    .header-title {
      font-family: Georgia, "Playfair Display", "Times New Roman", serif;
      font-size: 16.5pt;
      font-weight: 700;
      letter-spacing: -0.2px;
      margin: 0;
      color: #ffffff;
      line-height: 1.15;
    }
    .header-title span {
      color: #d4af37;
    }
    .header-subtitle {
      font-size: 9.5pt;
      font-weight: 500;
      color: #f3e5ab;
      margin-top: 2px;
      line-height: 1.25;
    }
    .header-meta {
      font-size: 7.5pt;
      color: rgba(255, 255, 255, 0.88);
      margin-top: 5px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .header-meta span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* FOOTER */
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 5px;
      margin-top: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #6b7280;
    }
    .footer-left {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .footer-tag {
      background: #f3f4f6;
      padding: 1px 5px;
      border-radius: 3px;
      font-weight: 600;
      color: #0e3d30;
    }
    .footer-right {
      font-weight: 700;
      color: #0e3d30;
      letter-spacing: 0.3px;
    }

    /* SECTION STYLES */
    .section-heading {
      font-family: Georgia, serif;
      font-size: 9.6pt;
      font-weight: 700;
      color: #0e3d30;
      border-bottom: 1.5px solid #d4af37;
      padding-bottom: 2px;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      letter-spacing: 0.2px;
    }

    /* COVER PAGE SPECIFIC */
    .cover-intro {
      background: #fdfbf7;
      border: 1px solid #ebd9a8;
      border-left: 4px solid #d4af37;
      border-radius: 6px;
      padding: 9px 13px;
      margin-bottom: 8px;
    }
    .cover-intro p {
      font-size: 8.6pt;
      line-height: 1.42;
      color: #2b3832;
    }

    .roster-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 8px;
    }
    .roster-card {
      background: #ffffff;
      border: 1px solid #e8e3d8;
      border-radius: 6px;
      padding: 8px 10px;
      display: flex;
      gap: 10px;
      align-items: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .roster-card.head-judge {
      border: 1.5px solid #d4af37;
      background: #fffdf9;
    }
    .roster-photo {
      width: 48px;
      height: 60px;
      border-radius: 5px;
      object-fit: cover;
      object-position: top;
      border: 1.5px solid #d4af37;
      flex-shrink: 0;
    }
    .roster-info {
      flex: 1;
      min-width: 0;
    }
    .roster-badge {
      display: inline-block;
      font-size: 6.8pt;
      font-weight: 700;
      background: #0e3d30;
      color: #f3e5ab;
      padding: 1px 5px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .roster-badge.head {
      background: #997a15;
      color: #ffffff;
    }
    .roster-name {
      font-family: Georgia, serif;
      font-size: 9.6pt;
      font-weight: 700;
      color: #0e3d30;
      line-height: 1.15;
      margin-bottom: 2px;
    }
    .roster-role {
      font-size: 7.4pt;
      font-weight: 600;
      color: #92690d;
      line-height: 1.22;
      margin-bottom: 2px;
    }
    .roster-desc {
      font-size: 7.2pt;
      color: #55625b;
      line-height: 1.25;
    }

    .criteria-box {
      background: #f8faf9;
      border: 1px solid #d2deda;
      border-radius: 6px;
      padding: 8px 11px;
      margin-bottom: 7px;
    }
    .criteria-title {
      font-size: 8.2pt;
      font-weight: 700;
      color: #0e3d30;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .criteria-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 7px;
    }
    .criteria-item {
      background: #ffffff;
      border: 1px solid #e1e9e6;
      border-radius: 5px;
      padding: 5px 7px;
    }
    .criteria-item-name {
      font-size: 7.6pt;
      font-weight: 700;
      color: #0e3d30;
      margin-bottom: 1px;
    }
    .criteria-item-pts {
      font-size: 6.9pt;
      font-weight: 800;
      color: #92690d;
      margin-bottom: 2px;
    }
    .criteria-item-desc {
      font-size: 6.8pt;
      color: #55625b;
      line-height: 1.22;
    }

    .panel-pledge-box {
      background: #faf9f6;
      border: 1px solid #e2dac9;
      border-left: 3.5px solid #0e3d30;
      border-radius: 5px;
      padding: 7px 11px;
    }
    .panel-pledge-title {
      font-size: 7.7pt;
      font-weight: 700;
      color: #0e3d30;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .panel-pledge-text {
      font-size: 7.4pt;
      color: #3b4640;
      line-height: 1.35;
    }

    /* JUDGE DEDICATED PAGE LAYOUT */
    .judge-page-body {
      display: grid;
      grid-template-columns: 58mm 1fr;
      gap: 13px;
      flex: 1;
      margin-top: 4px;
    }

    /* LEFT SIDEBAR */
    .judge-sidebar {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .judge-portrait-wrapper {
      position: relative;
      width: 58mm;
      height: 72mm;
      border-radius: 7px;
      overflow: hidden;
      border: 2.5px solid #d4af37;
      box-shadow: 0 4px 10px rgba(0,0,0,0.12);
      background: #0e3d30;
      flex-shrink: 0;
    }
    .judge-portrait-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: top;
      display: block;
    }
    .judge-portrait-tag {
      position: absolute;
      bottom: 6px;
      left: 6px;
      right: 6px;
      background: rgba(14, 61, 48, 0.92);
      color: #f3e5ab;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 3px 6px;
      border-radius: 4px;
      text-align: center;
      backdrop-filter: blur(2px);
      border: 1px solid rgba(212, 175, 55, 0.4);
    }
    .judge-quick-facts {
      background: #fbf9f5;
      border: 1px solid #e7ded0;
      border-radius: 6px;
      padding: 7px 9px;
      font-size: 7.3pt;
      line-height: 1.32;
    }
    .fact-row {
      margin-bottom: 4px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f0eae1;
    }
    .fact-row:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .fact-label {
      font-size: 6.7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #92690d;
      margin-bottom: 1px;
    }
    .fact-value {
      font-weight: 600;
      color: #1a231f;
    }

    .judge-lenses-box {
      background: #f3f6f4;
      border: 1px solid #d2ded7;
      border-radius: 6px;
      padding: 6px 8px;
    }
    .judge-lenses-title {
      font-size: 6.7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #0e3d30;
      margin-bottom: 3px;
    }
    .judge-lenses-list {
      list-style: none;
      font-size: 6.9pt;
      color: #2c3a33;
      line-height: 1.35;
    }
    .judge-lenses-list li {
      position: relative;
      padding-left: 10px;
      margin-bottom: 2px;
    }
    .judge-lenses-list li::before {
      content: "•";
      color: #d4af37;
      position: absolute;
      left: 1px;
      font-weight: bold;
    }

    .judge-callout-quote {
      background: #0e3d30;
      color: #f6ecc6;
      border-radius: 6px;
      padding: 7px 9px;
      border-left: 3.5px solid #d4af37;
      font-size: 7.2pt;
      font-style: italic;
      line-height: 1.35;
    }

    /* RIGHT CONTENT AREA */
    .judge-main {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 7px;
    }
    .bio-box {
      background: #ffffff;
      border: 1px solid #e8e3d8;
      border-radius: 6px;
      padding: 10px 13px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .bio-header-pill {
      display: inline-block;
      font-size: 7pt;
      font-weight: 700;
      background: #fdf6e2;
      border: 1px solid #e0c878;
      color: #855f05;
      padding: 2px 7px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 8px;
    }
    .bio-paragraph {
      font-size: 8.6pt;
      line-height: 1.44;
      color: #26322b;
      margin-bottom: 8px;
      text-align: justify;
    }
    .bio-paragraph.longer {
      font-size: 9.0pt;
      line-height: 1.50;
      margin-bottom: 10px;
    }
    .bio-paragraph.medium {
      font-size: 8.85pt;
      line-height: 1.47;
      margin-bottom: 9px;
    }
    .bio-paragraph:last-child {
      margin-bottom: 0;
    }
    .bio-paragraph strong {
      color: #0e3d30;
    }

    .key-competencies-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-top: 2px;
    }
    .competency-card {
      background: #f8faf9;
      border: 1px solid #dbe6e2;
      border-radius: 5px;
      padding: 6px 8px;
    }
    .competency-title {
      font-size: 7.2pt;
      font-weight: 700;
      color: #0e3d30;
      margin-bottom: 1px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .competency-desc {
      font-size: 6.9pt;
      color: #55625b;
      line-height: 1.25;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1: COVER & EXECUTIVE OVERVIEW ==================== -->
  <div class="page-container">
    <div>
      <div class="header-banner">
        <div class="header-badge">OFFICIAL DOSSIER · LIVING FAITH CHURCH WORLDWIDE · YOUTH ALIVE MINISTRY</div>
        <h1 class="header-title">SHABACH 2026 <span>· Grand Finale Adjudication Panel</span></h1>
        <div class="header-subtitle">Official Biographies, Professional Profiles & Adjudication Framework</div>
        <div class="header-meta">
          <span>🏛 Living Faith Church Worldwide</span>
          <span>🌟 Youth Alive Ministry (YAM)</span>
          <span>🏆 16 Grand Finalists</span>
          <span>📅 Grand Finale · Lagos, Nigeria</span>
        </div>
      </div>

      <div class="cover-intro">
        <p>
          The <strong>SHABACH 2026 Grand Finale</strong> convenes an exceptional adjudication panel comprising accomplished creative directors, seasoned recording artists, acclaimed audio producers, digital media architects, and ministers of the Gospel. Charged with evaluating 16 outstanding finalists across Vocal Performance, Technical Mastery, Stage Presence, and Spiritual Depth, the panel ensures impeccable standards of excellence, fairness, and generational inspiration for the glory of Christ.
        </p>
      </div>

      <div class="section-heading">
        <span>DISTINGUISHED ADJUDICATION PANEL · EXECUTIVE ROSTER</span>
        <span style="font-size: 7.5pt; font-weight: normal; color: #92690d;">4 Distinguished Adjudicators · Single Unified Standard</span>
      </div>

      <div class="roster-grid">
        <!-- Roster 1: Priscillia Fayomi -->
        <div class="roster-card head-judge">
          <img class="roster-photo" src="data:image/jpeg;base64,${PRISCILLIA_IMG}" alt="Mrs. Priscillia Fayomi">
          <div class="roster-info">
            <span class="roster-badge head">Seat 1 · Head Judge</span>
            <div class="roster-name">Mrs. Priscillia Fayomi</div>
            <div class="roster-role">Global Creativity Director · TV Producer · Lead Vocalist</div>
            <div class="roster-desc">Living Faith Church Worldwide YAM; celebrated TV producer, filmmaker & Faith Tabernacle Choir lead vocalist.</div>
          </div>
        </div>

        <!-- Roster 2: Rex Omoigberale -->
        <div class="roster-card">
          <img class="roster-photo" src="data:image/jpeg;base64,${REX_IMG}" alt="Rex Omoigberale">
          <div class="roster-info">
            <span class="roster-badge">Seat 2 · Adjudicator</span>
            <div class="roster-name">Rex Omoigberale</div>
            <div class="roster-role">Music Artist · Music Producer · Vocal Coach</div>
            <div class="roster-desc">Versatile music professional, recording artist, producer & vocal instructor; HND Statistics, Fed Poly Auchi.</div>
          </div>
        </div>

        <!-- Roster 3: David O. Umoru -->
        <div class="roster-card">
          <img class="roster-photo" src="data:image/jpeg;base64,${DAVID_IMG}" alt="David O. Umoru">
          <div class="roster-info">
            <span class="roster-badge">Seat 3 · Adjudicator</span>
            <div class="roster-name">David O. Umoru</div>
            <div class="roster-role">Digital Media Strategist · State ICT Director</div>
            <div class="roster-desc">Founder Hebron Media; Convener Creators Experience; State ICT/Media Director, Living Faith Church Ondo State.</div>
          </div>
        </div>

        <!-- Roster 4: Sochi Daniel-Onuoha -->
        <div class="roster-card">
          <img class="roster-photo" src="data:image/jpeg;base64,${SOCHI_IMG}" alt="Sochi Daniel-Onuoha">
          <div class="roster-info">
            <span class="roster-badge">Seat 4 · Adjudicator</span>
            <div class="roster-name">Sochi Daniel-Onuoha</div>
            <div class="roster-role">Architect · Entrepreneur · Music Evangelist</div>
            <div class="roster-desc">Principal SD Universal (Hand of God Cathedral); MBA Covenant University; Visionary Radiate Ministries.</div>
          </div>
        </div>
      </div>

      <div class="criteria-box">
        <div class="criteria-title">
          <span>⚖️ Unified Adjudication Rubric · Core Performance Evaluation Pillars</span>
        </div>
        <div class="criteria-grid">
          <div class="criteria-item">
            <div class="criteria-item-name">Vocal & Technical Prowess</div>
            <div class="criteria-item-pts">25 Points (Weight: 25%)</div>
            <div class="criteria-item-desc">Pitch accuracy, tone quality, vocal range, control, breathing technique, diction and articulation.</div>
          </div>
          <div class="criteria-item">
            <div class="criteria-item-name">Spiritual Depth & Message</div>
            <div class="criteria-item-pts">25 Points (Weight: 25%)</div>
            <div class="criteria-item-desc">Biblical soundness, lyrical richness, spiritual gravity, sincerity and the capacity to stir worship.</div>
          </div>
          <div class="criteria-item">
            <div class="criteria-item-name">Stage Presence & Poise</div>
            <div class="criteria-item-pts">25 Points (Weight: 25%)</div>
            <div class="criteria-item-desc">Audience connection, confidence, body language, emotional authenticity and commanding stage craft.</div>
          </div>
          <div class="criteria-item">
            <div class="criteria-item-name">Musicality & Originality</div>
            <div class="criteria-item-pts">25 Points (Weight: 25%)</div>
            <div class="criteria-item-desc">Arrangement, rhythmic feel, dynamic transitions, harmony and artistic distinctiveness.</div>
          </div>
        </div>
      </div>

      <div class="panel-pledge-box">
        <div class="panel-pledge-title">Adjudication Panel Integrity & Code of Excellence</div>
        <div class="panel-pledge-text">
          Each member of the adjudication panel evaluates contestants independently according to the standardized 100-point rubric. Scores are transmitted in real time to the secure digital workspace and locked upon final submission. In the event of a score tie, composite sub-criteria and verified audience votes determine the final standings under the leadership of the Head Judge.
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <span class="footer-tag">SHABACH 2026</span>
        <span>Living Faith Church Worldwide · Youth Alive Ministry · Official Dossier</span>
      </div>
      <div class="footer-right">
        <span>Page 1 of 5</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 2: MRS. PRISCILLIA FAYOMI ==================== -->
  <div class="page-container">
    <div>
      <div class="header-banner">
        <div class="header-badge">HEAD ADJUDICATOR · SEAT 1 · GRAND FINALE PANEL</div>
        <h1 class="header-title">Mrs. Priscillia <span>Oghenerukevwe Fayomi</span></h1>
        <div class="header-subtitle">Global Creativity Director | TV Producer | Voice-over Artist | Filmmaker | Lead Vocalist</div>
        <div class="header-meta">
          <span>🏛 Living Faith Church Worldwide</span>
          <span>🌟 Youth Alive Ministry (YAM)</span>
          <span>🎤 Faith Tabernacle Choir</span>
          <span>📍 Canaanland, Ota</span>
        </div>
      </div>

      <div class="judge-page-body">
        <!-- Sidebar -->
        <div class="judge-sidebar">
          <div class="judge-portrait-wrapper">
            <img class="judge-portrait-img" src="data:image/jpeg;base64,${PRISCILLIA_IMG}" alt="Mrs. Priscillia Fayomi">
            <div class="judge-portrait-tag">Head Judge · Seat 1</div>
          </div>

          <div class="judge-quick-facts">
            <div class="fact-row">
              <div class="fact-label">Panel Designation</div>
              <div class="fact-value">Head Judge (Seat 1)</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Global Leadership</div>
              <div class="fact-value">Global Creativity Director, Youth Alive Ministry (LFCWW)</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Worship Affiliation</div>
              <div class="fact-value">Lead Vocalist, Faith Tabernacle Choir, Canaanland</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Academic & Professional Credentials</div>
              <div class="fact-value">Degree in Communication; Certifications in Filmmaking, Social Media Management & Content Creation</div>
            </div>
          </div>

          <div class="judge-lenses-box">
            <div class="judge-lenses-title">Core Adjudication Lens</div>
            <ul class="judge-lenses-list">
              <li>Creative concept & thematic clarity</li>
              <li>Anointed vocal delivery & tonal purity</li>
              <li>Stage composure, charisma & audience uplift</li>
            </ul>
          </div>

          <div class="judge-callout-quote">
            "Using one’s creative gifts to glorify God, inspire transformation, and impact the next generation of creatives for Christ."
          </div>
        </div>

        <!-- Main Content -->
        <div class="judge-main">
          <div class="bio-box">
            <div class="bio-header-pill">Complete Unabridged Professional Biography</div>

            <p class="bio-paragraph longer">
              <strong>Mrs. Priscillia Fayomi</strong> is a dynamic leader, creative visionary, and passionate minister with a heart for inspiring young people and empowering lives through faith and purposeful communication. She currently serves as the <strong>Global Creativity Director for the Youth Alive Ministry of the Living Faith Church Worldwide</strong>, where she leads innovative initiatives designed to engage, equip, and impact the next generation creatives for Christ.
            </p>

            <p class="bio-paragraph longer">
              With a degree in Communication and certifications in Filmmaking, Social Media Management, and Content Creation, Priscillia seamlessly integrates creativity and strategy to tell compelling stories that inspire transformation. Professionally, she is a tv producer, voice-over artist, scriptwriter, filmmaker, and content creator, using her diverse skill set to create uplifting and impactful media that connects with audiences on a global scale.
            </p>

            <p class="bio-paragraph longer">
              Beyond her professional responsibilities, Priscillia is deeply committed to worship and service. She serves as one of the <strong>lead vocalists in the Faith Tabernacle Choir in Canaanland</strong>, where her voice continues to bless, uplift, and stir hearts in worship.
            </p>

            <p class="bio-paragraph longer">
              A devoted wife and mother of two, Mrs. Fayomi embodies grace, excellence, and purpose in every sphere of her life. Her journey reflects an unwavering passion for creativity, leadership, and service, a true testament to using one’s gifts to glorify God and transform lives.
            </p>
          </div>

          <div class="key-competencies-grid">
            <div class="competency-card">
              <div class="competency-title">Creative Direction</div>
              <div class="competency-desc">Strategic creative leadership advancing kingdom culture globally.</div>
            </div>
            <div class="competency-card">
              <div class="competency-title">Vocal Excellence</div>
              <div class="competency-desc">Mastery in sacred worship, tonal purity, and anointed vocal delivery.</div>
            </div>
            <div class="competency-card">
              <div class="competency-title">Media Production</div>
              <div class="competency-desc">Broadcast filmmaking, scriptwriting, and high-impact storytelling.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <span class="footer-tag">SHABACH 2026</span>
        <span>Adjudication Panel · Mrs. Priscillia Fayomi · Head Judge (Seat 1)</span>
      </div>
      <div class="footer-right">
        <span>Page 2 of 5</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 3: REX OMOIGBERALE ==================== -->
  <div class="page-container">
    <div>
      <div class="header-banner">
        <div class="header-badge">PANEL ADJUDICATOR · SEAT 2 · GRAND FINALE PANEL</div>
        <h1 class="header-title">Rex <span>Omoigberale</span></h1>
        <div class="header-subtitle">Music Artist | Music Producer | Music Instructor | Vocal Coach</div>
        <div class="header-meta">
          <span>🎵 Recording Artist & Producer</span>
          <span>🎼 Vocal Pedagogy</span>
          <span>📊 HND Statistics (Auchi)</span>
          <span>📍 Edo State, Nigeria</span>
        </div>
      </div>

      <div class="judge-page-body">
        <!-- Sidebar -->
        <div class="judge-sidebar">
          <div class="judge-portrait-wrapper">
            <img class="judge-portrait-img" src="data:image/jpeg;base64,${REX_IMG}" alt="Rex Omoigberale">
            <div class="judge-portrait-tag">Judge · Seat 2</div>
          </div>

          <div class="judge-quick-facts">
            <div class="fact-row">
              <div class="fact-label">Panel Designation</div>
              <div class="fact-value">Judge (Seat 2)</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Origin</div>
              <div class="fact-value">Edo State, Nigeria</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Academic Discipline</div>
              <div class="fact-value">Higher National Diploma (HND) in Statistics, Federal Polytechnic, Auchi</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Professional Practice</div>
              <div class="fact-value">Recording Artist, Music Producer, Vocal Coach & Talent Developer</div>
            </div>
          </div>

          <div class="judge-lenses-box">
            <div class="judge-lenses-title">Core Adjudication Lens</div>
            <ul class="judge-lenses-list">
              <li>Vocal breath control, phrasing & pitch accuracy</li>
              <li>Acoustic arrangement, balance & harmonic depth</li>
              <li>Artistic consistency & technical discipline</li>
            </ul>
          </div>

          <div class="judge-callout-quote">
            "For Rex, every song tells a story, every melody carries an emotion, and every new chapter is another opportunity to share his gift with the world."
          </div>
        </div>

        <!-- Main Content -->
        <div class="judge-main">
          <div class="bio-box">
            <div class="bio-header-pill">Complete Unabridged Professional Biography</div>

            <p class="bio-paragraph medium">
              <strong>Rex Omoigberale</strong> is a passionate and versatile music professional from Edo State, Nigeria, with a deep-rooted love for creativity, musical expression, and artistic excellence. He is a Music Artist, Music Producer, Music Instructor, and Vocal Coach dedicated to using music as a powerful medium for storytelling, emotional expression, and human connection.
            </p>

            <p class="bio-paragraph medium">
              With a Higher National Diploma (HND) in Statistics from the Federal Polytechnic, Auchi, Rex brings a unique blend of analytical thinking, creativity, and discipline to his professional journey.
            </p>

            <p class="bio-paragraph medium">
              Beyond his work as a recording artist and producer, Rex has gained professional music teaching experience across various platforms, where he has shared his knowledge, developed musical talents, and helped aspiring musicians discover and refine their abilities. His expertise spans music instruction, vocal development, music production, and artistic performance.
            </p>

            <p class="bio-paragraph medium">
              As an artist, Rex believes that music goes beyond entertainment; it is a universal language capable of inspiring, influencing, and connecting people across cultures and generations. His creative vision is driven by a commitment to producing meaningful sounds, telling compelling stories, and creating music that resonates with listeners.
            </p>

            <p class="bio-paragraph medium">
              Built on hard work, consistency, continuous learning, and a desire for excellence, Rex Omoigberale remains committed to evolving as an artist and music professional while making a lasting impact in the music industry.
            </p>

            <p class="bio-paragraph medium">
              For Rex, every song tells a story, every melody carries an emotion, and every new chapter is another opportunity to share his gift with the world.
            </p>
          </div>

          <div class="key-competencies-grid">
            <div class="competency-card">
              <div class="competency-title">Vocal Coaching</div>
              <div class="competency-desc">Technical range expansion, pitch mastery, and vocal endurance.</div>
            </div>
            <div class="competency-card">
              <div class="competency-title">Music Production</div>
              <div class="competency-desc">Arrangement, sonic balance, instrumentation, and audio architecture.</div>
            </div>
            <div class="competency-card">
              <div class="competency-title">Analytical Precision</div>
              <div class="competency-desc">Statistical discipline paired with soulful artistic discernment.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <span class="footer-tag">SHABACH 2026</span>
        <span>Adjudication Panel · Rex Omoigberale · Judge (Seat 2)</span>
      </div>
      <div class="footer-right">
        <span>Page 3 of 5</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 4: DAVID O. UMORU ==================== -->
  <div class="page-container">
    <div>
      <div class="header-banner">
        <div class="header-badge">PANEL ADJUDICATOR · SEAT 3 · GRAND FINALE PANEL</div>
        <h1 class="header-title">David O. <span>Umoru</span></h1>
        <div class="header-subtitle">Digital Media Strategist | Entrepreneur | Public Speaker | Creative Visionary</div>
        <div class="header-meta">
          <span>🏢 Founder, Hebron Media & Pulse</span>
          <span>⚡ State ICT/Media Director (LFCWW Ondo)</span>
          <span>🎙 Convener, Creators Experience</span>
          <span>📍 Ondo & Lagos, Nigeria</span>
        </div>
      </div>

      <div class="judge-page-body">
        <!-- Sidebar -->
        <div class="judge-sidebar">
          <div class="judge-portrait-wrapper">
            <img class="judge-portrait-img" src="data:image/jpeg;base64,${DAVID_IMG}" alt="David O. Umoru">
            <div class="judge-portrait-tag">Judge · Seat 3</div>
          </div>

          <div class="judge-quick-facts">
            <div class="fact-row">
              <div class="fact-label">Panel Designation</div>
              <div class="fact-value">Judge (Seat 3)</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Enterprises</div>
              <div class="fact-value">Founder, Hebron Media & Hebron Pulse</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Church Leadership</div>
              <div class="fact-value">State ICT/Media Director, Living Faith Church Youth Arm (Ondo State)</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Community Initiative</div>
              <div class="fact-value">Convener, Creators Experience (Creative Mentorship & Growth)</div>
            </div>
          </div>

          <div class="judge-lenses-box">
            <div class="judge-lenses-title">Core Adjudication Lens</div>
            <ul class="judge-lenses-list">
              <li>Audience connection & broadcast resonance</li>
              <li>Brand positioning & message delivery</li>
              <li>Innovative creative storytelling</li>
            </ul>
          </div>

          <div class="judge-callout-quote">
            "Media is more than content creation; it is a tool for influence, education, transformation, and generational impact."
          </div>
        </div>

        <!-- Main Content -->
        <div class="judge-main">
          <div class="bio-box">
            <div class="bio-header-pill">Complete Unabridged Professional Biography</div>

            <p class="bio-paragraph">
              <strong>David O. Umoru</strong> is a Nigerian digital media strategist, entrepreneur, public speaker, and creative visionary passionate about using media, technology, and strategic communication to create influence and lasting impact.
            </p>

            <p class="bio-paragraph">
              He is the <strong>Founder of Hebron Media</strong>, a growing digital media and creative enterprise with specialised platforms and subsidiaries, including <strong>Hebron Pulse</strong>, which promotes events and amplifies impactful experiences. Through these initiatives, David is building a media ecosystem that connects creativity, communication, and digital innovation.
            </p>

            <p class="bio-paragraph">
              He currently serves as the <strong>State ICT/Media Director for the Youth Arm of Living Faith Church Worldwide (Winners' Chapel), Ondo State</strong>, providing leadership in media strategy, digital communications, and technical operations. He is committed to strengthening media structures, expanding digital reach, and equipping young creatives with relevant skills.
            </p>

            <p class="bio-paragraph">
              Over the years, David has worked with ministries, organisations, leaders, and businesses to strengthen their digital presence, build recognisable brands, and communicate effectively. His expertise spans digital media strategy, social media management, content creation, video production, brand positioning, and audience growth.
            </p>

            <p class="bio-paragraph">
              He is also the <strong>Convener of Creators Experience</strong>, a community of like-minded creatives seeking excellence, growth, and collaboration. The community brings together content creators, digital entrepreneurs, media professionals, and innovators through networking, training, mentorship, and conversations designed to promote professional development and opportunities within the creative industry.
            </p>

            <p class="bio-paragraph">
              As a public speaker, David speaks on digital media, entrepreneurship, creativity, personal branding, leadership, innovation, and youth development. He is passionate about inspiring young people to overcome limitations, develop valuable skills, and build meaningful careers.
            </p>

            <p class="bio-paragraph">
              Beyond his professional pursuits, David is committed to mentorship, capacity development, and empowering the next generation of creatives and entrepreneurs. His interests include emerging technologies, artificial intelligence, digital innovation, business development, leadership, and the future of the creator economy.
            </p>

            <p class="bio-paragraph">
              At the heart of his vision is the belief that media is more than content creation; it is a tool for influence, education, transformation, and generational impact. Through his businesses, leadership, and community initiatives, David continues to inspire people to create, innovate, and build lasting legacies.
            </p>
          </div>

          <div class="key-competencies-grid">
            <div class="competency-card">
              <div class="competency-title">Digital Strategy</div>
              <div class="competency-desc">Media architecture, audience growth, and brand positioning.</div>
            </div>
            <div class="competency-card">
              <div class="competency-title">Creator Economy</div>
              <div class="competency-desc">Mentorship, digital innovation, and technical broadcasting operations.</div>
            </div>
            <div class="competency-card">
              <div class="competency-title">Leadership</div>
              <div class="competency-desc">State ICT directorship and empowering next-gen entrepreneurs.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <span class="footer-tag">SHABACH 2026</span>
        <span>Adjudication Panel · David O. Umoru · Judge (Seat 3)</span>
      </div>
      <div class="footer-right">
        <span>Page 4 of 5</span>
      </div>
    </div>
  </div>

  <!-- ==================== PAGE 5: SOCHI DANIEL-ONUOHA ==================== -->
  <div class="page-container">
    <div>
      <div class="header-banner">
        <div class="header-badge">PANEL ADJUDICATOR · SEAT 4 · GRAND FINALE PANEL</div>
        <h1 class="header-title">Sochi <span>Daniel-Onuoha</span></h1>
        <div class="header-subtitle">Architect | Entrepreneur | Music Evangelist | Minister | Humanitarian</div>
        <div class="header-meta">
          <span>📐 Principal Architect, SD Universal</span>
          <span>🏛 Hand of God Cathedral</span>
          <span>🎓 MBA Marketing (Covenant Univ)</span>
          <span>🕊 Radiate Ministries & Dan Onuoha Fdn</span>
        </div>
      </div>

      <div class="judge-page-body">
        <!-- Sidebar -->
        <div class="judge-sidebar">
          <div class="judge-portrait-wrapper">
            <img class="judge-portrait-img" src="data:image/jpeg;base64,${SOCHI_IMG}" alt="Sochi Daniel-Onuoha">
            <div class="judge-portrait-tag">Judge · Seat 4</div>
          </div>

          <div class="judge-quick-facts">
            <div class="fact-row">
              <div class="fact-label">Panel Designation</div>
              <div class="fact-value">Judge (Seat 4)</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Architectural Practice</div>
              <div class="fact-value">Owner & Leader, SD UNIVERSAL LIMITED</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Landmark Project</div>
              <div class="fact-value">The Hand of God Cathedral (Interior & Landscape Architecture)</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Postgraduate Degree</div>
              <div class="fact-value">Master of Business Administration (MBA) in Marketing, Covenant University</div>
            </div>
            <div class="fact-row">
              <div class="fact-label">Kingdom & Humanitarian</div>
              <div class="fact-value">Visionary Leader, RADIATE MINISTRIES; Secretary, DAN ONUOHA FOUNDATION</div>
            </div>
          </div>

          <div class="judge-lenses-box">
            <div class="judge-lenses-title">Core Adjudication Lens</div>
            <ul class="judge-lenses-list">
              <li>Spiritual depth & Gospel expression in art</li>
              <li>Aesthetic excellence & creative harmony</li>
              <li>Purposeful leadership & generational impact</li>
            </ul>
          </div>

          <div class="judge-callout-quote">
            "Her life’s mission is simple: to Radiate God’s Glory, influence her world, and make Jesus known in every area of life."
          </div>
        </div>

        <!-- Main Content -->
        <div class="judge-main">
          <div class="bio-box">
            <div class="bio-header-pill">Complete Unabridged Professional Biography</div>

            <p class="bio-paragraph">
              <strong>Sochi Daniel-Onuoha</strong> is a multifaceted professional, architect, music evangelist, and visionary leader with a passion for excellence, creativity, ministry, and humanitarian impact.
            </p>

            <p class="bio-paragraph">
              By profession, she is an architect with a special focus on interior design and landscape architecture. She owns and leads <strong>SD UNIVERSAL LIMITED</strong>, delivering top notch designs in and outside the country. Over the years, she has contributed to several notable projects, including <strong>The Hand of God Cathedral</strong>, among other architectural and design projects that reflect her passion for creating beautiful, functional, and meaningful spaces.
            </p>

            <p class="bio-paragraph">
              She also holds a <strong>Master of Business Administration (MBA) in Marketing from Covenant University, Nigeria</strong>, combining her creative expertise with strategic business and marketing knowledge.
            </p>

            <p class="bio-paragraph">
              Beyond her professional pursuits, Sochi is a passionate music evangelist whose mission is to market Jesus in every sphere of life. Her conviction is that the Gospel should find expression in every aspect of human existence, including creativity, business, culture, music, and everyday living.
            </p>

            <p class="bio-paragraph">
              She is the visionary leader of <strong>RADIATE MINISTRIES</strong>, a ministry birthed out of divine instruction, committed to spreading the message of Christ and advancing God’s kingdom through impactful annual programmes held across different locations in Nigeria.
            </p>

            <p class="bio-paragraph">
              She is also privileged to be the secretary of the <strong>DAN ONUOHA FOUNDATION</strong>, a humanitarian initiative committed to addressing the needs of children, women, and men across the world through acts of compassion, support, and community impact.
            </p>

            <p class="bio-paragraph">
              At the intersection of faith, creativity, leadership, and service, Sochi Daniel-Onuoha continues to pursue a life of purpose, using her gifts, platforms, and influence to inspire people, transform lives, and ultimately make Jesus known.
            </p>

            <p class="bio-paragraph">
              Her life’s mission is simple: to Radiate God’s Glory, influence her world, and make Jesus known in every area of life.
            </p>
          </div>

          <div class="key-competencies-grid">
            <div class="competency-card">
              <div class="competency-title">Spatial Design</div>
              <div class="competency-desc">Sacred architecture, interior design, and monumental cathedral aesthetics.</div>
            </div>
            <div class="competency-card">
              <div class="competency-title">Music Evangelism</div>
              <div class="competency-desc">Marketing Christ across culture, sound, creativity, and business.</div>
            </div>
            <div class="competency-card">
              <div class="competency-title">Humanitarian Service</div>
              <div class="competency-desc">Philanthropic leadership and community transformation globally.</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-left">
        <span class="footer-tag">SHABACH 2026</span>
        <span>Adjudication Panel · Sochi Daniel-Onuoha · Judge (Seat 4)</span>
      </div>
      <div class="footer-right">
        <span>Page 5 of 5</span>
      </div>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync("public/documents/shabach-2026-judges-bios.html", html);
console.log("Wrote public/documents/shabach-2026-judges-bios.html");

(async () => {
  console.log("Launching Chromium for PDF generation...");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setContent(html, { waitUntil: "networkidle" });
  
  const outputPath = "public/documents/shabach-2026-judges-bios.pdf";
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "10mm",
      bottom: "10mm",
      left: "12mm",
      right: "12mm"
    }
  });
  
  console.log("Generated PDF:", outputPath);
  
  // Copy to root and artifacts dir
  fs.copyFileSync(outputPath, "shabach-2026-judges-bios.pdf");
  
  const artifactDir = "/Users/Goodness/.gemini/antigravity/brain/ce3901d2-7870-4321-af5e-dd8f3fe5260d";
  const artifactPath = path.join(artifactDir, "shabach-2026-judges-bios.pdf");
  fs.copyFileSync(outputPath, artifactPath);
  console.log("Copied to artifact path:", artifactPath);
  
  await browser.close();
})();
