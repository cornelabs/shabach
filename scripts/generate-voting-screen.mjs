import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import { chromium } from 'playwright';

const URL_TO_ENCODE = 'https://shabach.vercel.app';

async function generateScreens() {
  console.log(`Generating QR code for ${URL_TO_ENCODE}...`);

  // Generate crisp QR code SVG
  const qrSvg = await QRCode.toString(URL_TO_ENCODE, {
    type: 'svg',
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#051810',
      light: '#ffffff',
    },
  });

  // Base64 QR code PNG for versatile embedding
  const qrPngDataUrl = await QRCode.toDataURL(URL_TO_ENCODE, {
    width: 800,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#051810',
      light: '#ffffff',
    },
  });

  // 1. Landscape (16:9 Widescreen Display: 1920x1080 / 3840x2160)
  const landscapeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SHABACH 2026 - Vote Now Screen</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1920px;
      height: 1080px;
      overflow: hidden;
      background-color: #030e0a;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #f7f9f6;
      display: flex;
      position: relative;
    }

    /* Ambient stage lighting gradients */
    .bg-canvas {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 75% 48%, rgba(212, 175, 55, 0.20) 0%, rgba(212, 175, 55, 0.04) 45%, transparent 70%),
        radial-gradient(circle at 18% 22%, rgba(28, 92, 72, 0.45) 0%, rgba(10, 40, 30, 0.1) 50%, transparent 75%),
        radial-gradient(circle at 50% 95%, rgba(18, 62, 48, 0.55) 0%, transparent 60%),
        linear-gradient(135deg, #030d09 0%, #061d15 40%, #0a2d21 75%, #04120c 100%);
      z-index: 1;
    }

    /* Subtle luxury grid pattern */
    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(212, 175, 55, 0.06) 1px, transparent 1px),
        linear-gradient(90deg, rgba(212, 175, 55, 0.06) 1px, transparent 1px);
      background-size: 72px 72px;
      opacity: 0.8;
      z-index: 2;
      mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0) 80%);
    }

    /* Luxury border accent */
    .outer-border {
      position: absolute;
      inset: 26px;
      border: 1px solid rgba(212, 175, 55, 0.32);
      border-radius: 28px;
      z-index: 3;
      pointer-events: none;
      box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.6);
    }
    .corner-ornament {
      position: absolute;
      width: 26px;
      height: 26px;
      border: 3.5px solid #d4af37;
    }
    .tl { top: 22px; left: 22px; border-right: none; border-bottom: none; border-top-left-radius: 12px; }
    .tr { top: 22px; right: 22px; border-left: none; border-bottom: none; border-top-right-radius: 12px; }
    .bl { bottom: 22px; left: 22px; border-right: none; border-top: none; border-bottom-left-radius: 12px; }
    .br { bottom: 22px; right: 22px; border-left: none; border-top: none; border-bottom-right-radius: 12px; }

    /* Main Content Container */
    .container {
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      padding: 64px 84px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Header Bar */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand-group {
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .crown-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #fce49d, #d4af37, #997825);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
      font-size: 28px;
    }
    .brand-titles {
      display: flex;
      flex-direction: column;
    }
    .brand-main {
      font-family: 'Cinzel', serif;
      font-weight: 900;
      font-size: 32px;
      letter-spacing: 2.5px;
      color: #ffffff;
      line-height: 1.1;
    }
    .brand-main span {
      background: linear-gradient(135deg, #fff1b8 0%, #d4af37 50%, #f9e29f 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .brand-sub {
      font-size: 13.5px;
      font-weight: 700;
      letter-spacing: 3.5px;
      text-transform: uppercase;
      color: #c1ded0;
    }

    .live-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(6, 34, 25, 0.9);
      border: 1.5px solid rgba(212, 175, 55, 0.55);
      border-radius: 9999px;
      padding: 11px 26px;
      box-shadow: 0 4px 22px rgba(0, 0, 0, 0.4), inset 0 0 16px rgba(212, 175, 55, 0.18);
    }
    .pulse-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 14px #10b981, 0 0 24px #10b981;
    }
    .live-text {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #ffe066;
    }

    /* Hero Center Stage */
    .stage {
      display: grid;
      grid-template-columns: 1.12fr 0.88fr;
      gap: 60px;
      align-items: center;
      margin-top: 10px;
      margin-bottom: 10px;
    }

    /* Left Side: Call to Action & Steps */
    .left-col {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .eyebrow-tag {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(212, 175, 55, 0.15);
      border: 1.5px solid rgba(212, 175, 55, 0.45);
      border-radius: 8px;
      padding: 8px 18px;
      width: fit-content;
      color: #f7e196;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .hero-title {
      font-family: 'DM Serif Display', Georgia, serif;
      font-size: 66px;
      line-height: 1.05;
      font-weight: 400;
      color: #ffffff;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    }
    .hero-title .gold-accent {
      background: linear-gradient(135deg, #fff5d6 0%, #f4d075 35%, #d4af37 75%, #b58d26 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-style: italic;
      display: block;
      margin-top: 4px;
    }
    .hero-sub {
      font-size: 20px;
      line-height: 1.55;
      color: #d6e5de;
      max-width: 680px;
      font-weight: 400;
    }

    /* Steps Cards */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      margin-top: 6px;
    }
    .step-card {
      background: rgba(6, 30, 22, 0.78);
      border: 1.5px solid rgba(212, 175, 55, 0.26);
      border-radius: 18px;
      padding: 22px 20px;
      backdrop-filter: blur(12px);
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
      position: relative;
    }
    .step-num {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #fbe7a4, #c9a444);
      color: #071f17;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 800;
      font-size: 18px;
      margin-bottom: 14px;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
    }
    .step-title {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .step-desc {
      font-size: 14px;
      line-height: 1.5;
      color: #b7d1c5;
    }
    .step-desc strong {
      color: #f7e6a7;
    }

    /* Trust Strip */
    .trust-strip {
      display: flex;
      align-items: center;
      gap: 28px;
      background: rgba(4, 18, 13, 0.85);
      border: 1px dashed rgba(212, 175, 55, 0.4);
      border-radius: 14px;
      padding: 14px 24px;
      width: fit-content;
    }
    .trust-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 700;
      color: #f0f6f2;
    }
    .trust-item svg {
      width: 20px;
      height: 20px;
      color: #e5c158;
    }

    /* Right Side: High-Impact QR Hero Card */
    .right-col {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .qr-card-wrapper {
      position: relative;
    }
    .qr-card-glow {
      position: absolute;
      inset: -20px;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.45) 0%, rgba(212, 175, 55, 0.08) 55%, transparent 75%);
      filter: blur(28px);
      z-index: 1;
    }
    .qr-card {
      position: relative;
      z-index: 2;
      width: 480px;
      background: #ffffff;
      border-radius: 34px;
      padding: 34px 34px 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      box-shadow: 
        0 28px 80px rgba(0, 0, 0, 0.7),
        0 4px 18px rgba(0, 0, 0, 0.15),
        0 0 0 5px rgba(212, 175, 55, 0.85);
    }
    .qr-badge {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: #08241b;
      color: #f7e6a7;
      padding: 9px 24px;
      border-radius: 9999px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      margin-bottom: 20px;
      box-shadow: 0 4px 14px rgba(8, 36, 27, 0.3);
    }
    .qr-badge span.camera-icon {
      font-size: 18px;
    }
    .qr-box {
      width: 350px;
      height: 350px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 20px;
      padding: 8px;
      box-shadow: inset 0 0 0 2px #edf1ee;
    }
    .qr-box img {
      width: 100%;
      height: 100%;
      display: block;
    }
    
    .url-block {
      margin-top: 22px;
      width: 100%;
      background: #f3f7f4;
      border: 1.5px solid #d7e2dc;
      border-radius: 16px;
      padding: 12px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .url-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 800;
      color: #557266;
    }
    .url-text {
      font-family: 'Space Grotesk', monospace;
      font-size: 24px;
      font-weight: 800;
      color: #062319;
      letter-spacing: 0.5px;
    }
    .qr-subhint {
      margin-top: 14px;
      font-size: 13.5px;
      font-weight: 700;
      color: #4b665a;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Footer */
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(212, 175, 55, 0.26);
      padding-top: 22px;
    }
    .category-pills {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cat-label {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #e5c158;
      margin-right: 6px;
    }
    .cat-pill {
      background: rgba(12, 42, 32, 0.75);
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 8px;
      padding: 7px 16px;
      font-size: 13.5px;
      font-weight: 700;
      color: #e6f0eb;
    }
    .footer-credits {
      font-size: 13.5px;
      font-weight: 600;
      color: #9cb5a8;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .footer-credits strong {
      color: #f7e6a7;
    }
  </style>
</head>
<body>
  <div class="bg-canvas"></div>
  <div class="grid-pattern"></div>
  <div class="outer-border">
    <div class="corner-ornament tl"></div>
    <div class="corner-ornament tr"></div>
    <div class="corner-ornament bl"></div>
    <div class="corner-ornament br"></div>
  </div>

  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="brand-group">
        <div class="crown-icon">👑</div>
        <div class="brand-titles">
          <div class="brand-main">SHABACH <span>2026</span></div>
          <div class="brand-sub">Talent for Christ • Grand Finale</div>
        </div>
      </div>

      <div class="live-pill">
        <div class="pulse-dot"></div>
        <div class="live-text">Live Audience Voting Active</div>
      </div>
    </header>

    <!-- Main Stage Content -->
    <main class="stage">
      <!-- Left Column: Guide & Action -->
      <div class="left-col">
        <div class="eyebrow-tag">
          <span>✨</span> Official Public Choice Vote
        </div>

        <h1 class="hero-title">
          Crown Your
          <span class="gold-accent">Favorite Finalist</span>
        </h1>

        <p class="hero-sub">
          Every voice counts! Scan the QR code with your smartphone camera right now to cast your official verified vote for the Shabach 2026 Champion.
        </p>

        <!-- 3 Simple Steps -->
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-num">1</div>
            <div class="step-title">Scan QR Code</div>
            <div class="step-desc">Open your camera & point it at the screen, or visit <strong>shabach.vercel.app</strong></div>
          </div>
          <div class="step-card">
            <div class="step-num">2</div>
            <div class="step-title">Choose & Enter Email</div>
            <div class="step-desc">Select your preferred contestant and enter your email address.</div>
          </div>
          <div class="step-card">
            <div class="step-num">3</div>
            <div class="step-title">Enter 6-Digit OTP</div>
            <div class="step-desc">Type the verification code sent to your inbox to lock in your vote!</div>
          </div>
        </div>

        <!-- Security & Fair Play Guarantee -->
        <div class="trust-strip">
          <div class="trust-item">
            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clip-rule="evenodd"></path></svg>
            <span>1 Verified Email = 1 Vote</span>
          </div>
          <div class="trust-item">
            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
            <span>Instant Tamper-Proof Audit</span>
          </div>
          <div class="trust-item">
            <svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"></path></svg>
            <span>Live Stage Collation</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Massive Hero QR Card -->
      <div class="right-col">
        <div class="qr-card-wrapper">
          <div class="qr-card-glow"></div>
          <div class="qr-card">
            <div class="qr-badge">
              <span class="camera-icon">📷</span> Scan with Phone Camera
            </div>

            <!-- Crisp High-Contrast QR Code -->
            <div class="qr-box">
              <img src="${qrPngDataUrl}" alt="Scan to Vote at shabach.vercel.app" />
            </div>

            <!-- Direct URL Box -->
            <div class="url-block">
              <span class="url-label">Or Type In Your Browser</span>
              <span class="url-text">shabach.vercel.app</span>
            </div>

            <div class="qr-subhint">
              <span>⚡</span> Fast, free & takes less than 30 seconds
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer Bar -->
    <footer class="footer">
      <div class="category-pills">
        <span class="cat-label">Categories:</span>
        <span class="cat-pill">🎵 Music</span>
        <span class="cat-pill">💃 Dance</span>
        <span class="cat-pill">🎭 Drama</span>
        <span class="cat-pill">🎙️ Spoken Word</span>
      </div>

      <div class="footer-credits">
        <span>Organised by <strong>RCCG Youth Ministry</strong></span>
        <span>•</span>
        <span>Audience Portal Powered by <strong>Corne Labs</strong></span>
      </div>
    </footer>
  </div>
</body>
</html>`;

  // Write HTML file
  const htmlPath169 = path.resolve('public/screen/shabach-voting-screen-16x9.html');
  fs.writeFileSync(htmlPath169, landscapeHtml, 'utf8');

  // Launch Playwright to render high-res screenshots
  console.log('Rendering screenshots with Playwright Chromium...');
  const browser = await chromium.launch();

  // 1. Capture 1080p Landscape (1920x1080)
  const page1080 = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  await page1080.setContent(landscapeHtml, { waitUntil: 'networkidle' });
  await page1080.waitForTimeout(1200);
  const path1080p = path.resolve('public/screen/shabach-2026-voting-screen-1080p.png');
  await page1080.screenshot({ path: path1080p, type: 'png' });
  console.log(`Captured 1080p Landscape screenshot: ${path1080p}`);

  // 2. Capture 4K Ultra-HD Landscape (3840x2160 via 2x scale factor)
  const page4k = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2,
  });
  await page4k.setContent(landscapeHtml, { waitUntil: 'networkidle' });
  await page4k.waitForTimeout(1200);
  const path4k = path.resolve('public/screen/shabach-2026-voting-screen-4k.png');
  await page4k.screenshot({ path: path4k, type: 'png' });
  console.log(`Captured 4K Landscape screenshot: ${path4k}`);

  await browser.close();
  console.log('Regeneration complete!');
}

generateScreens().catch(console.error);
