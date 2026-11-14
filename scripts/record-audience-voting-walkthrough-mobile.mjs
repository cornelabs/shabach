import { chromium } from "playwright";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const FFMPEG_PATH = path.resolve(
  process.cwd(),
  "node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg"
);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAudioDuration(filePath) {
  try {
    const out = execSync(`afinfo "${filePath}"`, { encoding: "utf-8" });
    const match = out.match(/estimated duration:\s+([0-9.]+)\s+sec/);
    if (match) return parseFloat(match[1]);
  } catch {
    /* fallback */
  }
  return 8.0;
}

async function main() {
  console.log("=== 1. Checking Master Narration Audio ===");
  const audioDir = path.resolve(process.cwd(), "public/videos/audience_audio");
  const masterAudioPath = path.join(audioDir, "master_narration.wav");

  if (!fs.existsSync(masterAudioPath)) {
    throw new Error(`Master narration audio not found at ${masterAudioPath}`);
  }

  const narrationClips = [
    { id: "voter_clip01_intro", duration: 15.55 },
    { id: "voter_clip02_finalists", duration: 19.78 },
    { id: "voter_clip03_email", duration: 16.01 },
    { id: "voter_clip04_otp", duration: 11.71 },
    { id: "voter_clip05_confirm", duration: 14.45 },
    { id: "voter_clip06_protection_outro", duration: 16.27 },
  ];

  const totalAudioDuration = getAudioDuration(masterAudioPath);
  console.log(`Master Nigerian audio duration: ${totalAudioDuration.toFixed(2)}s`);

  const rawVideoDir = path.resolve(process.cwd(), "public/videos/raw_audience_mobile");
  fs.mkdirSync(rawVideoDir, { recursive: true });
  for (const f of fs.readdirSync(rawVideoDir)) {
    if (f.endsWith(".webm")) fs.unlinkSync(path.join(rawVideoDir, f));
  }

  console.log("=== 2. Launching Chromium in Mobile Viewport (390x844) ===");
  const browser = await chromium.launch({
    headless: true,
  });

  // Modern Smartphone portrait viewport: iPhone 14/15 (390 x 844)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 390, height: 844 },
    },
  });

  const page = await context.newPage();

  // Route intercepts for instant, clean, reliable UI flow
  await page.route("**/rpc/request_voter_otp", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, ttl: 900 }),
    });
  });

  await page.route("**/_serverFn/dispatchVoterEmailOtpServerFn*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        message: "Verification code dispatched to your inbox.",
        dispatchedVia: "zeptomail",
      }),
    });
  });

  await page.route("**/rpc/verify_voter_email_otp", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        voter_token: "voter_live_audience_demo_token_742918",
      }),
    });
  });

  await page.route("**/rpc/cast_audience_vote", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        vote_id: "vote_audience_742918",
      }),
    });
  });

  // Inject Mobile Touch Indicator (translucent gold tap indicator with pulse)
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const touch = document.createElement("div");
      touch.id = "mobile-touch-indicator";
      touch.style.position = "fixed";
      touch.style.width = "32px";
      touch.style.height = "32px";
      touch.style.borderRadius = "50%";
      touch.style.border = "2px solid rgba(212, 175, 55, 0.9)";
      touch.style.backgroundColor = "rgba(18, 61, 53, 0.75)";
      touch.style.pointerEvents = "none";
      touch.style.zIndex = "999999";
      touch.style.transition = "transform 0.14s ease-out, background-color 0.15s ease, opacity 0.2s ease";
      touch.style.transform = "translate(-50%, -50%) scale(1)";
      touch.style.display = "none";
      touch.style.boxShadow = "0 0 16px rgba(212, 175, 55, 0.85)";

      const inner = document.createElement("div");
      inner.style.width = "8px";
      inner.style.height = "8px";
      inner.style.backgroundColor = "#D4AF37";
      inner.style.borderRadius = "50%";
      inner.style.position = "absolute";
      inner.style.top = "50%";
      inner.style.left = "50%";
      inner.style.transform = "translate(-50%, -50%)";
      touch.appendChild(inner);

      document.body.appendChild(touch);

      window.addEventListener("mousemove", (e) => {
        touch.style.display = "block";
        touch.style.left = `${e.clientX}px`;
        touch.style.top = `${e.clientY}px`;
      });

      window.addEventListener("mousedown", () => {
        touch.style.transform = "translate(-50%, -50%) scale(0.72)";
        touch.style.backgroundColor = "rgba(212, 175, 55, 0.95)";
      });

      window.addEventListener("mouseup", () => {
        touch.style.transform = "translate(-50%, -50%) scale(1)";
        touch.style.backgroundColor = "rgba(18, 61, 53, 0.75)";
      });
    });
  });

  const screenshotsDir = path.resolve(process.cwd(), "public/screenshots/audience_walkthrough_mobile");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  async function touchMoveTo(selector, steps = 20) {
    const el = await page.$(selector);
    if (!el) return;
    const box = await el.boundingBox();
    if (!box) return;
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;
    await page.mouse.move(targetX, targetY, { steps });
    await sleep(150);
  }

  async function touchMoveToCoords(targetX, targetY, steps = 20) {
    await page.mouse.move(targetX, targetY, { steps });
    await sleep(150);
  }

  // Clear storage and load homepage on mobile
  const siteUrl = "https://shabach.vercel.app";
  await page.goto(siteUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  // =========================================================================
  // SCENE 1: Welcome & Mobile Homepage Entry (Target: narrationClips[0].duration)
  // =========================================================================
  console.log(`=== Scene 1: Mobile Homepage & Welcome (Target: ${narrationClips[0].duration.toFixed(2)}s) ===`);
  const scene1Start = Date.now();
  await touchMoveToCoords(195, 200, 18); // Header & logo
  await sleep(3500);

  // Glide down across "Talent for Christ" and hero badge
  await touchMoveToCoords(195, 300, 20);
  await sleep(2500);

  // Scroll down slightly to showcase Card 1: "1. Vote Contestant"
  await page.evaluate(() => window.scrollBy({ top: 120, behavior: "smooth" }));
  await sleep(1500);

  const card1Selector = 'a[href="/contestants"]';
  await touchMoveTo(card1Selector, 20);
  await sleep(1800);
  await page.screenshot({ path: path.join(screenshotsDir, "01_mobile_home.png") });

  // Tap Card 1 to open contestants page
  await page.click(card1Selector);
  await page.waitForURL("**/contestants", { timeout: 8000 });
  await page.waitForSelector("button:has-text(\"Vote\")", { state: "visible", timeout: 8000 });

  const scene1Remaining = Math.max(0, narrationClips[0].duration * 1000 - (Date.now() - scene1Start));
  await sleep(scene1Remaining);

  // =========================================================================
  // SCENE 2: Mobile 16 Finalists Directory (Target: narrationClips[1].duration)
  // =========================================================================
  console.log(`=== Scene 2: Mobile Finalists Directory (Target: ${narrationClips[1].duration.toFixed(2)}s) ===`);
  const scene2Start = Date.now();

  // Glide over header badge: "1 Vote Per Person"
  await touchMoveToCoords(240, 225, 18);
  await sleep(2000);

  // Mobile swipe/scroll down to show finalists in running order
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: "smooth" }));
  await sleep(2500);

  // Touch over Min. Blessing & Elijah Victor
  await touchMoveToCoords(195, 360, 18);
  await sleep(2000);

  // Scroll back up to Contestant 1 (Favour Chukwudi)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2000);

  // Move to Contestant 1's Vote button
  const firstVoteBtnSelector = 'article:first-child button:has-text("Vote"), .grid > div:first-child button:has-text("Vote"), button:has-text("Vote")';
  await touchMoveTo(firstVoteBtnSelector, 18);
  await sleep(1800);
  await page.screenshot({ path: path.join(screenshotsDir, "02_mobile_finalists.png") });

  // Tap Vote button to open dialog
  const firstVoteBtn = await page.$(firstVoteBtnSelector);
  await firstVoteBtn.click();
  await page.waitForSelector("#voter-email", { state: "visible", timeout: 8000 });
  await sleep(600); // Allow Radix fade-in animation to settle

  const scene2Remaining = Math.max(0, narrationClips[1].duration * 1000 - (Date.now() - scene2Start));
  await sleep(scene2Remaining);

  // =========================================================================
  // SCENE 3: Enter Email & Request OTP (Target: narrationClips[2].duration)
  // =========================================================================
  console.log(`=== Scene 3: Mobile Email Input & Request OTP (Target: ${narrationClips[2].duration.toFixed(2)}s) ===`);
  const scene3Start = Date.now();

  // Touch on Contestant card in modal
  await touchMoveToCoords(195, 270, 16);
  await sleep(2200);

  // Touch Email input field
  await touchMoveTo("#voter-email", 18);
  await sleep(1000);
  await page.click("#voter-email");

  // Type email with natural cadence
  const testEmail = "voter@shabach.org";
  for (const char of testEmail) {
    await page.keyboard.type(char);
    await sleep(75);
  }
  await sleep(1200);

  // Touch Send Code button
  const sendCodeSelector = 'button:has-text("Send Code")';
  await touchMoveTo(sendCodeSelector, 16);
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotsDir, "03_mobile_email_entered.png") });

  // Tap Send Code
  await page.click(sendCodeSelector);
  await page.waitForSelector("#voter-otp", { state: "visible", timeout: 8000 });

  const scene3Remaining = Math.max(0, narrationClips[2].duration * 1000 - (Date.now() - scene3Start));
  await sleep(scene3Remaining);

  // =========================================================================
  // SCENE 4: Enter 6-Digit OTP & Verify (Target: narrationClips[3].duration)
  // =========================================================================
  console.log(`=== Scene 4: Mobile 6-Digit OTP & Verification (Target: ${narrationClips[3].duration.toFixed(2)}s) ===`);
  const scene4Start = Date.now();

  // Touch OTP input field
  await touchMoveTo("#voter-otp", 18);
  await sleep(1000);
  await page.click("#voter-otp");

  // Type 6-digit OTP
  const demoCode = "742918";
  for (const digit of demoCode) {
    await page.keyboard.type(digit);
    await sleep(110);
  }
  await sleep(1000);

  // Touch Verify button
  const verifyBtnSelector = 'button:has-text("Verify")';
  await touchMoveTo(verifyBtnSelector, 16);
  await sleep(800);
  await page.screenshot({ path: path.join(screenshotsDir, "04_mobile_otp_entered.png") });

  // Tap Verify
  await page.click(verifyBtnSelector);
  await sleep(1500); // Allow verified checkmark badge to show

  const scene4Remaining = Math.max(0, narrationClips[3].duration * 1000 - (Date.now() - scene4Start));
  await sleep(scene4Remaining);

  // =========================================================================
  // SCENE 5: Confirm Vote & Instant Recorded Receipt (Target: narrationClips[4].duration)
  // =========================================================================
  console.log(`=== Scene 5: Confirm Vote & Recorded Modal (Target: ${narrationClips[4].duration.toFixed(2)}s) ===`);
  const scene5Start = Date.now();

  // Touch "Confirm Vote" primary button
  const confirmBtnSelector = 'button:has-text("Confirm Vote")';
  await touchMoveTo(confirmBtnSelector, 18);
  await sleep(1500);

  // Tap Confirm Vote
  await page.click(confirmBtnSelector);
  await sleep(1500);

  // Modal transitions to "Your vote has been recorded"
  await page.screenshot({ path: path.join(screenshotsDir, "05_mobile_vote_recorded_modal.png") });

  // Touch gently moves over the confirmation badge and contestant card
  await touchMoveToCoords(195, 230, 18); // Header checkmark & title
  await sleep(2500);
  await touchMoveToCoords(195, 340, 18); // Official Vote Cast badge
  await sleep(3000);

  const scene5Remaining = Math.max(0, narrationClips[4].duration * 1000 - (Date.now() - scene5Start));
  await sleep(scene5Remaining);

  // =========================================================================
  // SCENE 6: Single-Vote Protection Banner & Outro (Target: narrationClips[5].duration)
  // =========================================================================
  console.log(`=== Scene 6: Single-Vote Protection & Outro (Target: ${narrationClips[5].duration.toFixed(2)}s) ===`);
  const scene6Start = Date.now();

  // Tap Close button on dialog
  const closeBtnSelector = 'button:has-text("Close")';
  await touchMoveTo(closeBtnSelector, 16);
  await sleep(800);
  await page.click(closeBtnSelector);
  await sleep(1200);

  // On mobile list, card 1 shows "Your vote is here", other cards show "You voted already"
  // Touch moves to Card 2: Min. Blessing
  const cards = await page.$$("article, [class*=\"rounded-2xl border\"]");
  if (cards.length > 1) {
    const secondCardBtn = await cards[1].$('button:has-text("You voted already")');
    if (secondCardBtn) {
      const box = await secondCardBtn.boundingBox();
      if (box) {
        await touchMoveToCoords(box.x + box.width / 2, box.y + box.height / 2, 20);
        await sleep(1200);
        await secondCardBtn.click();
        await sleep(1000);
        await page.screenshot({ path: path.join(screenshotsDir, "06_mobile_single_vote_protection.png") });

        // Hover over amber advisory banner
        await touchMoveToCoords(195, 450, 18);
        await sleep(3500);

        // Tap Close button
        const modalCloseBtn = await page.$('button:has-text("Close")');
        if (modalCloseBtn) {
          await modalCloseBtn.click();
          await sleep(1000);
        }
      }
    }
  }

  // Scroll back to top navigation smoothly
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await touchMoveToCoords(195, 30, 18);
  const scene6Remaining = Math.max(0, narrationClips[5].duration * 1000 - (Date.now() - scene6Start));
  await sleep(scene6Remaining);

  console.log("=== 3. Finalizing Mobile Video Recording ===");
  await page.close();
  await context.close();
  await browser.close();

  const rawVideoFiles = fs.readdirSync(rawVideoDir).filter((f) => f.endsWith(".webm"));
  if (rawVideoFiles.length === 0) {
    throw new Error("No raw mobile video recorded by Playwright!");
  }

  const rawVideoPath = path.join(rawVideoDir, rawVideoFiles[0]);
  const finalWebmPath = path.resolve(
    process.cwd(),
    "public/videos/shabach-audience-voting-guide-mobile.webm"
  );
  const finalMp4Path = path.resolve(
    process.cwd(),
    "public/videos/shabach-audience-voting-guide-mobile.mp4"
  );

  console.log("=== 4. Muxing Mobile Video and Nigerian Voice Narration with FFmpeg ===");
  // Mux into WebM (Opus audio)
  execSync(
    `"${FFMPEG_PATH}" -y -i "${rawVideoPath}" -i "${masterAudioPath}" -c:v copy -c:a libopus -b:a 128k -shortest "${finalWebmPath}"`
  );
  console.log(`WebM Mobile Video saved to: ${finalWebmPath}`);

  // Also mux into universal MP4 (H.264 + AAC, faststart for instant streaming)
  execSync(
    `"${FFMPEG_PATH}" -y -i "${rawVideoPath}" -i "${masterAudioPath}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 160k -shortest -movflags +faststart "${finalMp4Path}"`
  );
  console.log(`MP4 Mobile Video saved to: ${finalMp4Path}`);

  const webmStat = fs.statSync(finalWebmPath);
  const mp4Stat = fs.statSync(finalMp4Path);
  console.log(`Final Mobile WebM Size: ${(webmStat.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Final Mobile MP4 Size: ${(mp4Stat.size / 1024 / 1024).toFixed(2)} MB`);

  // Copy to conversation artifacts media folder
  const artifactMediaDir = "/Users/Goodness/.gemini/antigravity/brain/ce3901d2-7870-4321-af5e-dd8f3fe5260d/media";
  fs.mkdirSync(artifactMediaDir, { recursive: true });
  fs.copyFileSync(finalWebmPath, path.join(artifactMediaDir, "shabach-audience-voting-guide-mobile.webm"));
  fs.copyFileSync(finalMp4Path, path.join(artifactMediaDir, "shabach-audience-voting-guide-mobile.mp4"));
  console.log("Copied mobile videos to conversation artifact directory!");

  console.log("Mobile audience explainer video generation successfully completed!");
}

main().catch((err) => {
  console.error("Mobile audience explainer recording failed:", err);
  process.exit(1);
});
