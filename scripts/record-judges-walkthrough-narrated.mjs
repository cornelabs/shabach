import { chromium } from "playwright";
import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";

const FFMPEG_PATH = path.resolve(
  process.cwd(),
  "node_modules/@ffmpeg-installer/darwin-arm64/ffmpeg"
);

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304) return true;
    } catch {
      // ignore
    }
    await sleep(400);
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
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

function generateSpeechClip(text, outputPath) {
  const aiffPath = outputPath.replace(/\.wav$/, ".aiff");
  // Use macOS 'say' with Samantha voice
  execSync(`say -v Samantha "${text.replace(/"/g, '\\"')}" -o "${aiffPath}"`);
  execSync(`afconvert "${aiffPath}" "${outputPath}" -d LEI16 -c 1 -r 44100`);
  try {
    fs.unlinkSync(aiffPath);
  } catch {
    /* ignore */
  }
  return getAudioDuration(outputPath);
}

async function main() {
  console.log("=== 1. Preparing Voice Narration Clips ===");
  const audioDir = path.resolve(process.cwd(), "public/videos/audio");
  fs.mkdirSync(audioDir, { recursive: true });

  const narrationClips = [
    {
      id: "clip01_home",
      text: "Welcome to the SHABACH 2026 Grand Finale portal. As an appointed judge, navigate to the homepage and select Card 3: Judging Panel.",
    },
    {
      id: "clip02_hub",
      text: "On the Judging Panel hub, all adjudicators score independently with complete privacy. Click your personal profile card to authenticate. Here, Head Judge Mrs. Priscillia Fayomi selects her seat.",
    },
    {
      id: "clip03_pin",
      text: "Enter your confidential six-character passcode. Notice that your passcode remains securely masked for complete privacy. Then click Unlock Seat to enter your workspace.",
    },
    {
      id: "clip04_workspace",
      text: "You are now inside your private scoring workspace. All sixteen Grand Finale acts are arranged in performance order, showing each contestant's title, district, category, and allocated stage time.",
    },
    {
      id: "clip05_scoring",
      text: "When a contestant begins their performance, click on their card to open their evaluation scorecard. Each act is scored across five criteria out of ninety-five points: Musicality, Biblical Depth, Stage Craft, Originality, and Audience Ministry.",
    },
    {
      id: "clip06_notes",
      text: "Enter your scores for each criterion. The raw subtotal calculates dynamically in real time. You can also write constructive observations in the Judge's Notes field to assist the score desk.",
    },
    {
      id: "clip07_draft",
      text: "Click Save Draft to store your preliminary scores safely. You can return and update your scores at any time while the performance is underway.",
    },
    {
      id: "clip08_submit",
      text: "When the act finishes and your evaluation is complete, click Review and Submit. Verify your raw subtotal, then click Confirm Submission to lock your scorecard.",
    },
    {
      id: "clip09_conflict",
      text: "If you have a personal, pastoral, or coaching relationship with a contestant, you can declare a conflict of interest, which the Chief Judge and Score Desk will review before final collation.",
    },
    {
      id: "clip10_lock",
      text: "Whenever you step away from your device, click Lock Seat in the top navigation bar to keep your workspace protected. Thank you for serving with excellence.",
    },
  ];

  const audioFiles = [];
  for (const clip of narrationClips) {
    const filePath = path.join(audioDir, `${clip.id}.wav`);
    console.log(`Generating audio for ${clip.id}...`);
    const duration = generateSpeechClip(clip.text, filePath);
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
  console.log(`Master narration generated! Total audio duration: ${totalAudioDuration.toFixed(2)}s`);

  console.log("=== 2. Starting Vite Dev Server ===");
  const devServer = spawn("npx", ["vite", "dev", "--port", "4321"], {
    stdio: "inherit",
    env: { ...process.env, PORT: "4321" },
  });

  const stopServer = () => {
    try {
      devServer.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  };

  process.on("exit", stopServer);
  process.on("SIGINT", stopServer);
  process.on("SIGTERM", stopServer);

  const baseUrl = "http://localhost:4321";
  await waitForServer(baseUrl);
  console.log("Vite server is ready at", baseUrl);

  const rawVideoDir = path.resolve(process.cwd(), "public/videos/raw");
  fs.mkdirSync(rawVideoDir, { recursive: true });
  for (const f of fs.readdirSync(rawVideoDir)) {
    if (f.endsWith(".webm")) fs.unlinkSync(path.join(rawVideoDir, f));
  }

  console.log("=== 3. Launching Chromium with Playwright Video Recording ===");
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

  // Inject visual cursor overlay
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const cursor = document.createElement("div");
      cursor.id = "playwright-visual-cursor";
      cursor.style.position = "fixed";
      cursor.style.width = "22px";
      cursor.style.height = "22px";
      cursor.style.border = "2px solid #d4af37";
      cursor.style.backgroundColor = "rgba(14, 61, 48, 0.8)";
      cursor.style.borderRadius = "50%";
      cursor.style.pointerEvents = "none";
      cursor.style.zIndex = "999999";
      cursor.style.transition = "transform 0.12s ease-out, background-color 0.15s ease";
      cursor.style.transform = "translate(-50%, -50%)";
      cursor.style.display = "none";
      cursor.style.boxShadow = "0 0 12px rgba(212, 175, 55, 0.75)";

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
        cursor.style.backgroundColor = "rgba(14, 61, 48, 0.8)";
      });
    });
  });

  const screenshotsDir = path.resolve(process.cwd(), "public/screenshots/judges_walkthrough");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  async function smoothMoveTo(selector) {
    const el = await page.$(selector);
    if (!el) return;
    const box = await el.boundingBox();
    if (!box) return;
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;
    await page.mouse.move(targetX, targetY, { steps: 16 });
    await sleep(200);
  }

  // Clear localStorage before recording to ensure pristine demo state
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  console.log("=== Scene 1: Homepage & Card 3 Selection ===");
  // Duration: ~9.5s
  await page.mouse.move(640, 360, { steps: 10 });
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, "01_home_page.png") });

  // Move directly to Card 3: "3. Judging Panel"
  const card3 = await page.$('a[href="/judges"]');
  if (card3) {
    await smoothMoveTo('a[href="/judges"]');
    await sleep(2500);
    await card3.click();
  } else {
    await page.goto(`${baseUrl}/judges`, { waitUntil: "networkidle" });
  }
  await sleep(narrationClips[0].duration * 1000 - 4500);

  console.log("=== Scene 2: Judging Panel Hub & Head Judge Selection ===");
  // Duration: ~10.5s
  await sleep(1500);
  await page.screenshot({ path: path.join(screenshotsDir, "02_judges_panel_home.png") });

  // Select Mrs. Priscillia Fayomi (first card)
  const firstJudgeCard = await page.$('div[role="button"]:first-of-type');
  if (firstJudgeCard) {
    await smoothMoveTo('div[role="button"]:first-of-type');
    await sleep(2000);
    await firstJudgeCard.click();
  }
  await sleep(narrationClips[1].duration * 1000 - 3500);

  console.log("=== Scene 3: Passcode Authentication (Masked, No Eye Click) ===");
  // Duration: ~8.5s
  await sleep(1000);
  await page.screenshot({ path: path.join(screenshotsDir, "03_seat_auth_modal.png") });

  const pinInput = await page.$("#seat-code");
  if (pinInput) {
    await smoothMoveTo("#seat-code");
    await pinInput.click();
    await sleep(400);

    // Type the 6-character random passcode: P 7 X 2 M 9
    // USER EXPLICIT RULE: DO NOT click the eye icon. Keep code masked!
    for (const char of "P7X2M9") {
      await page.keyboard.type(char, { delay: 260 });
      await sleep(120);
    }
    await sleep(800);
    await page.screenshot({ path: path.join(screenshotsDir, "04_pin_entered_masked.png") });

    const unlockBtn = await page.$('button[type="submit"]');
    if (unlockBtn) {
      await smoothMoveTo('button[type="submit"]');
      await unlockBtn.click();
    } else {
      await page.keyboard.press("Enter");
    }
  }
  await sleep(narrationClips[2].duration * 1000 - 4000);

  console.log("=== Scene 4: Judge Workspace Overview ===");
  // Duration: ~10s
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, "05_judge_workspace.png") });

  await smoothMoveTo("h1");
  await sleep(2000);
  await page.evaluate(() => window.scrollBy({ top: 180, behavior: "smooth" }));
  await sleep(narrationClips[3].duration * 1000 - 4000);

  console.log("=== Scene 5: Open First Contestant Scorecard & Review Rubric ===");
  // Duration: ~12s
  const firstContestant = await page.$(".grid button:first-child");
  if (firstContestant) {
    await smoothMoveTo(".grid button:first-child");
    await sleep(1500);
    await firstContestant.click();
  }
  await sleep(2500);
  await page.screenshot({ path: path.join(screenshotsDir, "06_scorecard_dialog_opened.png") });
  await sleep(narrationClips[4].duration * 1000 - 4000);

  console.log("=== Scene 6: Enter Scores & Constructive Feedback Notes ===");
  // Duration: ~9s
  const scoreInputs = await page.$$('input[inputmode="numeric"]');
  const scoresToEnter = ["18", "19", "18", "17", "14"];
  for (let i = 0; i < scoreInputs.length && i < scoresToEnter.length; i++) {
    const input = scoreInputs[i];
    const box = await input.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
      await input.click();
      await page.keyboard.press("Meta+A");
      await page.keyboard.press("Backspace");
      await page.keyboard.type(scoresToEnter[i], { delay: 150 });
      await sleep(200);
    }
  }

  const notesTextarea = await page.$("#judge-notes");
  if (notesTextarea) {
    const box = await notesTextarea.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + 30, { steps: 10 });
      await notesTextarea.click();
      await sleep(200);
      const feedback =
        "Inspiring vocal control, profound spiritual depth, and captivating stage presence.";
      await page.keyboard.type(feedback, { delay: 40 });
      await sleep(500);
    }
  }
  await page.screenshot({ path: path.join(screenshotsDir, "07_scores_and_notes_filled.png") });
  await sleep(narrationClips[5].duration * 1000 - 4000);

  console.log("=== Scene 7: Save Draft Demonstration ===");
  // Duration: ~8s
  const saveDraftBtn = await page.$('button:has-text("Save draft")');
  if (saveDraftBtn) {
    await smoothMoveTo('button:has-text("Save draft")');
    await sleep(1000);
    await saveDraftBtn.click();
    await sleep(2500);
  }
  await sleep(narrationClips[6].duration * 1000 - 3500);

  console.log("=== Scene 8: Review & Submit Scorecard ===");
  // Duration: ~10s
  const reviewBtn = await page.$('button:has-text("Review & submit")');
  if (reviewBtn) {
    await smoothMoveTo('button:has-text("Review & submit")');
    await sleep(1200);
    await reviewBtn.click();
    await sleep(2000);

    const confirmBtn = await page.$('button:has-text("Confirm submission")');
    if (confirmBtn) {
      await smoothMoveTo('button:has-text("Confirm submission")');
      await sleep(1500);
      await confirmBtn.click();
      await sleep(2500);
    }
  }
  await page.screenshot({ path: path.join(screenshotsDir, "08_scorecard_submitted.png") });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(narrationClips[7].duration * 1000 - 7200);

  console.log("=== Scene 9: Conflict of Interest Demonstration ===");
  // Duration: ~9s
  const secondContestant = await page.$(".grid button:nth-of-type(2)");
  if (secondContestant) {
    await smoothMoveTo(".grid button:nth-of-type(2)");
    await secondContestant.click();
    await sleep(2000);

    const conflictCheckbox = await page.$("#conflict");
    if (conflictCheckbox) {
      await smoothMoveTo("#conflict");
      await conflictCheckbox.click();
      await sleep(1800);
      await page.screenshot({ path: path.join(screenshotsDir, "09_conflict_declared.png") });

      await conflictCheckbox.click();
      await sleep(800);
    }

    const closeBtn = await page.$('button:has-text("Close")');
    if (closeBtn) {
      await smoothMoveTo('button:has-text("Close")');
      await closeBtn.click();
      await sleep(1200);
    }
  }
  await sleep(narrationClips[8].duration * 1000 - 5800);

  console.log("=== Scene 10: Lock Seat Security & Outro ===");
  // Duration: ~8.5s
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(1500);

  const lockBtn = await page.$('button:has-text("Lock Seat")');
  if (lockBtn) {
    await smoothMoveTo('button:has-text("Lock Seat")');
    await sleep(1200);
    await lockBtn.click();
    await sleep(2500);
  }
  await page.screenshot({ path: path.join(screenshotsDir, "10_seat_locked.png") });
  await sleep(narrationClips[9].duration * 1000 - 5200);

  console.log("=== 4. Finalizing Video Recording ===");
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
    "public/videos/shabach-judges-walkthrough.webm"
  );
  const finalMp4Path = path.resolve(
    process.cwd(),
    "public/videos/shabach-judges-walkthrough.mp4"
  );

  console.log("=== 5. Muxing Video and Voice Narration with FFmpeg ===");
  // Mux into WebM (Opus audio)
  execSync(
    `"${FFMPEG_PATH}" -y -i "${rawVideoPath}" -i "${masterAudioPath}" -c:v copy -c:a libopus -b:a 128k -shortest "${finalWebmPath}"`
  );
  console.log(`WebM Video with Voice Narration saved to: ${finalWebmPath}`);

  // Also mux into universal MP4 (H.264 + AAC)
  execSync(
    `"${FFMPEG_PATH}" -y -i "${rawVideoPath}" -i "${masterAudioPath}" -c:v libx264 -preset fast -crf 22 -c:a aac -b:a 160k -shortest -movflags +faststart "${finalMp4Path}"`
  );
  console.log(`MP4 Video with Voice Narration saved to: ${finalMp4Path}`);

  const webmStat = fs.statSync(finalWebmPath);
  const mp4Stat = fs.statSync(finalMp4Path);
  console.log(`Final WebM Size: ${(webmStat.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Final MP4 Size: ${(mp4Stat.size / 1024 / 1024).toFixed(2)} MB`);

  console.log("Stopping Vite server...");
  stopServer();
  console.log("Video recording and audio synchronization successfully completed!");
}

main().catch((err) => {
  console.error("Narrated walkthrough recording failed:", err);
  process.exit(1);
});
