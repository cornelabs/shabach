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

function generateNigerianSpeechClip(text, outputPath) {
  const mp3Path = outputPath.replace(/\.wav$/, ".mp3");
  // Authentic Nigerian English Neural Voice (en-NG-EzinneNeural) at -10% rate for clear, warm, deliberate instructional pace
  execSync(
    `python3 -m edge_tts --voice "en-NG-EzinneNeural" --rate="-10%" --text "${text.replace(/"/g, '\\"')}" --write-media "${mp3Path}"`
  );
  // Convert MP3 to high-grade 44.1kHz 16-bit mono WAV using FFmpeg
  execSync(
    `"${FFMPEG_PATH}" -y -i "${mp3Path}" -ar 44100 -ac 1 "${outputPath}"`
  );
  return getAudioDuration(outputPath);
}

async function main() {
  console.log("=== 1. Preparing Nigerian Voice Narration Clips (en-NG-EzinneNeural) ===");
  const audioDir = path.resolve(process.cwd(), "public/videos/audience_audio");
  fs.mkdirSync(audioDir, { recursive: true });

  const narrationClips = [
    {
      id: "voter_clip01_intro",
      text: "Welcome to the SHABACH 2026 Grand Finale. Public voting is officially open, and every single vote counts toward crowning tonight's champion. You can vote right now from your phone or mobile device.",
    },
    {
      id: "voter_clip02_finalists",
      text: "From the homepage, select Meet the 16 Finalists. Here, all sixteen contestants are presented in performance order across Music, Spoken Word, and Dance. Remember, each attendee receives exactly one official vote across the entire competition.",
    },
    {
      id: "voter_clip03_email",
      text: "Find your preferred contestant and click the Vote button. On the confirmation screen, enter your active email address and click Send Code. An instant six-digit verification code will be sent straight to your inbox.",
    },
    {
      id: "voter_clip04_otp",
      text: "Open your email to find your code, enter the six digits into the verification box, and click Verify. Your voter identity is instantly confirmed.",
    },
    {
      id: "voter_clip05_confirm",
      text: "Once verified, click Confirm Vote. Your vote is immediately secured and recorded in the competition database. Your official confirmation screen confirms that your vote has been recorded.",
    },
    {
      id: "voter_clip06_protection_outro",
      text: "Because each person has only one vote, all other contestants will now show that you voted already. Your vote remains safely locked for your chosen act. Thank you for voting, and enjoy the rest of SHABACH 2026!",
    },
  ];

  const audioFiles = [];
  for (const clip of narrationClips) {
    const filePath = path.join(audioDir, `${clip.id}.wav`);
    console.log(`Synthesizing Nigerian voice audio for ${clip.id}...`);
    const duration = generateNigerianSpeechClip(clip.text, filePath);
    clip.duration = duration;
    clip.path = filePath;
    audioFiles.push(filePath);
    console.log(`- ${clip.id}: ${duration.toFixed(2)}s`);
  }

  // Create concatenated master audio track
  const concatListPath = path.join(audioDir, "concat.txt");
  const concatContent = audioFiles.map((f) => `file '${f}'`).join("\n");
  fs.writeFileSync(concatListPath, concatContent);

  const masterAudioPath = path.join(audioDir, "master_narration.wav");
  execSync(
    `"${FFMPEG_PATH}" -y -f concat -safe 0 -i "${concatListPath}" -c:a pcm_s16le "${masterAudioPath}"`
  );
  const totalAudioDuration = getAudioDuration(masterAudioPath);
  console.log(`Master Nigerian narration generated! Total audio duration: ${totalAudioDuration.toFixed(2)}s`);

  const rawVideoDir = path.resolve(process.cwd(), "public/videos/raw_audience");
  fs.mkdirSync(rawVideoDir, { recursive: true });
  for (const f of fs.readdirSync(rawVideoDir)) {
    if (f.endsWith(".webm")) fs.unlinkSync(path.join(rawVideoDir, f));
  }

  console.log("=== 2. Launching Chromium with Playwright Video Recording ===");
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: rawVideoDir,
      size: { width: 1280, height: 720 },
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
        dispatchedVia: "brevo",
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

  // Inject visual cursor overlay with gold indicator
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const cursor = document.createElement("div");
      cursor.id = "playwright-visual-cursor";
      cursor.style.position = "fixed";
      cursor.style.width = "22px";
      cursor.style.height = "22px";
      cursor.style.border = "2px solid #d4af37";
      cursor.style.backgroundColor = "rgba(14, 61, 48, 0.85)";
      cursor.style.borderRadius = "50%";
      cursor.style.pointerEvents = "none";
      cursor.style.zIndex = "999999";
      cursor.style.transition = "transform 0.12s ease-out, background-color 0.15s ease";
      cursor.style.transform = "translate(-50%, -50%)";
      cursor.style.display = "none";
      cursor.style.boxShadow = "0 0 14px rgba(212, 175, 55, 0.8)";

      const dot = document.createElement("div");
      dot.style.width = "6px";
      dot.style.height = "6px";
      dot.style.backgroundColor = "#d4af37";
      dot.style.borderRadius = "50%";
      dot.style.position = "absolute";
      dot.style.top = "50%";
      dot.style.left = "50%";
      dot.style.transform = "translate(-50%, -50%)";
      cursor.appendChild(dot);

      document.body.appendChild(cursor);

      window.addEventListener("mousemove", (e) => {
        cursor.style.display = "block";
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top = `${e.clientY}px`;
      });

      window.addEventListener("mousedown", () => {
        cursor.style.transform = "translate(-50%, -50%) scale(0.75)";
        cursor.style.backgroundColor = "rgba(212, 175, 55, 0.95)";
      });

      window.addEventListener("mouseup", () => {
        cursor.style.transform = "translate(-50%, -50%) scale(1)";
        cursor.style.backgroundColor = "rgba(14, 61, 48, 0.85)";
      });
    });
  });

  const screenshotsDir = path.resolve(process.cwd(), "public/screenshots/audience_walkthrough");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  async function smoothMoveTo(selector, steps = 24) {
    const el = await page.$(selector);
    if (!el) return;
    const box = await el.boundingBox();
    if (!box) return;
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;
    await page.mouse.move(targetX, targetY, { steps });
    await sleep(150);
  }

  async function smoothMoveToCoords(targetX, targetY, steps = 24) {
    await page.mouse.move(targetX, targetY, { steps });
    await sleep(150);
  }

  // Clear storage and load homepage
  const siteUrl = "https://shabach.vercel.app";
  await page.goto(siteUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  // =========================================================================
  // SCENE 1: Welcome & Homepage Entry (Target: narrationClips[0].duration)
  // =========================================================================
  console.log(`=== Scene 1: Homepage & Welcome (Target: ${narrationClips[0].duration.toFixed(2)}s) ===`);
  const scene1Start = Date.now();
  await smoothMoveToCoords(640, 260, 20);
  await sleep(3500);

  // Hover over the hero title and badge
  await smoothMoveToCoords(640, 360, 25);
  await sleep(2500);

  // Move down to "Meet the 16 Finalists" CTA / Card 1
  const card1Selector = 'a[href="/contestants"]';
  await smoothMoveTo(card1Selector, 25);
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, "01_homepage_hero.png") });

  // Click to open contestants page
  await page.click(card1Selector);
  await page.waitForURL("**/contestants", { timeout: 8000 });
  await page.waitForSelector("button:has-text(\"Vote\")", { state: "visible", timeout: 8000 });

  const scene1Remaining = Math.max(0, narrationClips[0].duration * 1000 - (Date.now() - scene1Start));
  await sleep(scene1Remaining);

  // =========================================================================
  // SCENE 2: Browse Finalists & Select Contestant (Target: narrationClips[1].duration)
  // =========================================================================
  console.log(`=== Scene 2: 16 Finalists Directory (Target: ${narrationClips[1].duration.toFixed(2)}s) ===`);
  const scene2Start = Date.now();

  // Hover over the header badge: "1 Vote Per Person"
  await smoothMoveToCoords(1100, 140, 20);
  await sleep(2000);

  // Smooth scroll down to showcase contestants
  await page.evaluate(() => window.scrollBy({ top: 420, behavior: "smooth" }));
  await sleep(2500);

  // Move cursor across a couple of finalists (Min. Lizzy, The Painters)
  await smoothMoveToCoords(400, 350, 20);
  await sleep(2000);

  // Smooth scroll back to top to Contestant 1 (Favour Chukwudi)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2000);

  // Move to Contestant 1's Vote button
  const firstVoteBtnSelector = 'article:first-child button:has-text("Vote"), .grid > div:first-child button:has-text("Vote"), button:has-text("Vote")';
  await smoothMoveTo(firstVoteBtnSelector, 20);
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, "02_finalists_grid.png") });

  // Click Vote button to open dialog
  const firstVoteBtn = await page.$(firstVoteBtnSelector);
  await firstVoteBtn.click();
  await page.waitForSelector("#voter-email", { state: "visible", timeout: 8000 });

  const scene2Remaining = Math.max(0, narrationClips[1].duration * 1000 - (Date.now() - scene2Start));
  await sleep(scene2Remaining);

  // =========================================================================
  // SCENE 3: Enter Email & Request OTP (Target: narrationClips[2].duration)
  // =========================================================================
  console.log(`=== Scene 3: Email Input & Request OTP (Target: ${narrationClips[2].duration.toFixed(2)}s) ===`);
  const scene3Start = Date.now();

  // Move to contestant details inside modal
  await smoothMoveToCoords(640, 280, 18);
  await sleep(2200);

  // Move to Email input
  await smoothMoveTo("#voter-email", 20);
  await sleep(1000);
  await page.click("#voter-email");

  // Type email with natural cadence
  const testEmail = "voter@shabach.org";
  for (const char of testEmail) {
    await page.keyboard.type(char);
    await sleep(75);
  }
  await sleep(1200);

  // Move to Send Code button
  const sendCodeSelector = 'button:has-text("Send Code")';
  await smoothMoveTo(sendCodeSelector, 18);
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotsDir, "03_email_entered.png") });

  // Click Send Code
  await page.click(sendCodeSelector);
  await page.waitForSelector("#voter-otp", { state: "visible", timeout: 8000 });

  const scene3Remaining = Math.max(0, narrationClips[2].duration * 1000 - (Date.now() - scene3Start));
  await sleep(scene3Remaining);

  // =========================================================================
  // SCENE 4: Enter 6-Digit OTP & Verify (Target: narrationClips[3].duration)
  // =========================================================================
  console.log(`=== Scene 4: 6-Digit OTP & Verification (Target: ${narrationClips[3].duration.toFixed(2)}s) ===`);
  const scene4Start = Date.now();

  // Move cursor to OTP input field
  await smoothMoveTo("#voter-otp", 20);
  await sleep(1000);
  await page.click("#voter-otp");

  // Type 6-digit OTP
  const demoCode = "742918";
  for (const digit of demoCode) {
    await page.keyboard.type(digit);
    await sleep(110);
  }
  await sleep(1000);

  // Move to Verify button
  const verifyBtnSelector = 'button:has-text("Verify")';
  await smoothMoveTo(verifyBtnSelector, 18);
  await sleep(800);
  await page.screenshot({ path: path.join(screenshotsDir, "04_otp_entered.png") });

  // Click Verify
  await page.click(verifyBtnSelector);
  await sleep(1500); // Allow verified badge to show

  const scene4Remaining = Math.max(0, narrationClips[3].duration * 1000 - (Date.now() - scene4Start));
  await sleep(scene4Remaining);

  // =========================================================================
  // SCENE 5: Confirm Vote & Instant Recorded Receipt (Target: narrationClips[4].duration)
  // =========================================================================
  console.log(`=== Scene 5: Confirm Vote & Recorded Modal (Target: ${narrationClips[4].duration.toFixed(2)}s) ===`);
  const scene5Start = Date.now();

  // Move cursor to "Confirm Vote" button
  const confirmBtnSelector = 'button:has-text("Confirm Vote")';
  await smoothMoveTo(confirmBtnSelector, 20);
  await sleep(1500);

  // Click Confirm Vote
  await page.click(confirmBtnSelector);
  await sleep(1500);

  // Modal transitions to "Your vote has been recorded"
  await page.screenshot({ path: path.join(screenshotsDir, "05_vote_recorded_modal.png") });

  // Move cursor gently across the confirmation badge and contestant card
  await smoothMoveToCoords(640, 310, 20); // Title
  await sleep(2500);
  await smoothMoveToCoords(640, 470, 20); // Official Vote Cast badge
  await sleep(3000);

  const scene5Remaining = Math.max(0, narrationClips[4].duration * 1000 - (Date.now() - scene5Start));
  await sleep(scene5Remaining);

  // =========================================================================
  // SCENE 6: Single-Vote Protection Banner & Outro (Target: narrationClips[5].duration)
  // =========================================================================
  console.log(`=== Scene 6: Single-Vote Protection & Outro (Target: ${narrationClips[5].duration.toFixed(2)}s) ===`);
  const scene6Start = Date.now();

  // Click Close button on dialog
  const closeBtnSelector = 'button:has-text("Close")';
  await smoothMoveTo(closeBtnSelector, 18);
  await sleep(800);
  await page.click(closeBtnSelector);
  await sleep(1200);

  // Notice all cards show "You voted already"
  // Move cursor to Card 2: Min. Blessing
  const cards = await page.$$("article, [class*=\"rounded-2xl border\"]");
  if (cards.length > 1) {
    const secondCardBtn = await cards[1].$('button:has-text("You voted already")');
    if (secondCardBtn) {
      const box = await secondCardBtn.boundingBox();
      if (box) {
        await smoothMoveToCoords(box.x + box.width / 2, box.y + box.height / 2, 22);
        await sleep(1200);
        await secondCardBtn.click();
        await sleep(1000);
        await page.screenshot({ path: path.join(screenshotsDir, "06_single_vote_protection.png") });

        // Hover over amber advisory banner
        await smoothMoveToCoords(640, 580, 20);
        await sleep(3500);

        // Close dialog
        const modalCloseBtn = await page.$('button:has-text("Close")');
        if (modalCloseBtn) {
          await modalCloseBtn.click();
          await sleep(1000);
        }
      }
    }
  }

  // Float up to header navigation and rest
  await smoothMoveToCoords(640, 25, 20);
  const scene6Remaining = Math.max(0, narrationClips[5].duration * 1000 - (Date.now() - scene6Start));
  await sleep(scene6Remaining);

  console.log("=== 3. Finalizing Video Recording ===");
  await page.close();
  await context.close();
  await browser.close();

  const rawVideoFiles = fs.readdirSync(rawVideoDir).filter((f) => f.endsWith(".webm"));
  if (rawVideoFiles.length === 0) {
    throw new Error("No raw video recorded by Playwright!");
  }

  const rawVideoPath = path.join(rawVideoDir, rawVideoFiles[0]);
  const finalWebmPath = path.resolve(
    process.cwd(),
    "public/videos/shabach-audience-voting-guide.webm"
  );
  const finalMp4Path = path.resolve(
    process.cwd(),
    "public/videos/shabach-audience-voting-guide.mp4"
  );

  console.log("=== 4. Muxing Video and Nigerian Voice Narration with FFmpeg ===");
  // Mux into WebM (Opus audio)
  execSync(
    `"${FFMPEG_PATH}" -y -i "${rawVideoPath}" -i "${masterAudioPath}" -c:v copy -c:a libopus -b:a 128k -shortest "${finalWebmPath}"`
  );
  console.log(`WebM Video with Nigerian Voice Narration saved to: ${finalWebmPath}`);

  // Also mux into universal MP4 (H.264 + AAC)
  execSync(
    `"${FFMPEG_PATH}" -y -i "${rawVideoPath}" -i "${masterAudioPath}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 160k -shortest -movflags +faststart "${finalMp4Path}"`
  );
  console.log(`MP4 Video with Nigerian Voice Narration saved to: ${finalMp4Path}`);

  const webmStat = fs.statSync(finalWebmPath);
  const mp4Stat = fs.statSync(finalMp4Path);
  console.log(`Final WebM Size: ${(webmStat.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Final MP4 Size: ${(mp4Stat.size / 1024 / 1024).toFixed(2)} MB`);

  // Copy to artifacts media folder for easy access and viewing
  const artifactMediaDir = "/Users/Goodness/.gemini/antigravity/brain/ce3901d2-7870-4321-af5e-dd8f3fe5260d/media";
  fs.mkdirSync(artifactMediaDir, { recursive: true });
  fs.copyFileSync(finalWebmPath, path.join(artifactMediaDir, "shabach-audience-voting-guide.webm"));
  fs.copyFileSync(finalMp4Path, path.join(artifactMediaDir, "shabach-audience-voting-guide.mp4"));
  console.log("Copied videos to conversation artifact directory!");

  console.log("Audience explainer video generation successfully completed!");
}

main().catch((err) => {
  console.error("Audience explainer recording failed:", err);
  process.exit(1);
});
