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

function generateNigerianSpeechClip(text, outputPath) {
  const mp3Path = outputPath.replace(/\.wav$/, ".mp3");
  // Authentic Nigerian English Neural Voice (en-NG-EzinneNeural) at -12% rate for clear, deliberate instructional pace
  execSync(
    `python3 -m edge_tts --voice "en-NG-EzinneNeural" --rate="-12%" --text "${text.replace(/"/g, '\\"')}" --write-media "${mp3Path}"`
  );
  // Convert MP3 to high-grade 44.1kHz 16-bit mono WAV using FFmpeg
  execSync(
    `"${FFMPEG_PATH}" -y -i "${mp3Path}" -ar 44100 -ac 1 "${outputPath}"`
  );
  return getAudioDuration(outputPath);
}

async function main() {
  console.log("=== 1. Preparing Nigerian Voice Narration Clips (en-NG-EzinneNeural) ===");
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

  const screenshotsDir = path.resolve(process.cwd(), "public/screenshots/judges_walkthrough");
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

  // Clear localStorage before recording to ensure pristine demo state
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  console.log("=== Scene 1: Homepage & Card 3 Selection (Target:", narrationClips[0].duration.toFixed(2), "s) ===");
  const scene1Start = Date.now();
  await smoothMoveToCoords(640, 320, 15);
  await sleep(2500);
  await page.screenshot({ path: path.join(screenshotsDir, "01_home_page.png") });

  // Move directly to Card 3: "3. Judging Panel"
  const card3 = await page.$('a[href="/judges"]');
  if (card3) {
    await smoothMoveTo('a[href="/judges"]', 25);
    await sleep(1800);
    await card3.click();
  } else {
    await page.goto(`${baseUrl}/judges`, { waitUntil: "networkidle" });
  }
  await page.waitForURL("**/judges", { timeout: 10000 });
  const scene1Remaining = Math.max(0, narrationClips[0].duration * 1000 - (Date.now() - scene1Start));
  await sleep(scene1Remaining);

  console.log("=== Scene 2: Judging Panel Hub & Head Judge Selection (Target:", narrationClips[1].duration.toFixed(2), "s) ===");
  const scene2Start = Date.now();
  await sleep(1800);
  await page.screenshot({ path: path.join(screenshotsDir, "02_judges_panel_home.png") });

  // Voice speaks about hub and selecting personal profile. Cursor hovers across judges.
  await smoothMoveToCoords(640, 240, 20);
  await sleep(2500);

  // Select Mrs. Priscillia Fayomi (Head Judge - first card)
  const firstJudgeCard = await page.$('div[role="button"]:first-of-type');
  if (firstJudgeCard) {
    await smoothMoveTo('div[role="button"]:first-of-type', 25);
    await sleep(2000);
    await firstJudgeCard.click();
  }
  await page.waitForSelector("#seat-code", { timeout: 8000 });
  const scene2Remaining = Math.max(0, narrationClips[1].duration * 1000 - (Date.now() - scene2Start));
  await sleep(scene2Remaining);

  console.log("=== Scene 3: Passcode Authentication Masked (Target:", narrationClips[2].duration.toFixed(2), "s) ===");
  const scene3Start = Date.now();
  await sleep(800);
  await page.screenshot({ path: path.join(screenshotsDir, "03_seat_auth_modal.png") });

  const pinInput = await page.$("#seat-code");
  if (pinInput) {
    await smoothMoveTo("#seat-code", 20);
    await pinInput.click();
    await sleep(400);

    // Type the 6-character random passcode: P 7 X 2 M 9
    // USER EXPLICIT RULE: DO NOT click the eye toggle icon. Passcode strictly remains masked!
    for (const char of "P7X2M9") {
      await page.keyboard.type(char, { delay: 280 });
      await sleep(140);
    }
    await sleep(1200);
    await page.screenshot({ path: path.join(screenshotsDir, "04_pin_entered_masked.png") });

    const unlockBtn = await page.$('button[type="submit"]');
    if (unlockBtn) {
      await smoothMoveTo('button[type="submit"]', 20);
      await sleep(600);
      await unlockBtn.click();
    } else {
      await page.keyboard.press("Enter");
    }
  }
  await page.waitForURL("**/judges/judge1", { timeout: 10000 });
  const scene3Remaining = Math.max(0, narrationClips[2].duration * 1000 - (Date.now() - scene3Start));
  await sleep(scene3Remaining);

  console.log("=== Scene 4: Judge Workspace Overview (Target:", narrationClips[3].duration.toFixed(2), "s) ===");
  const scene4Start = Date.now();
  await sleep(1500);
  await page.screenshot({ path: path.join(screenshotsDir, "05_judge_workspace.png") });

  // Point to Judge Session Badge & title
  await smoothMoveTo("h1", 20);
  await sleep(2000);

  // Smoothly scroll down through the 16 acts in performance order
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: "smooth" }));
  await sleep(2800);
  await page.evaluate(() => window.scrollBy({ top: -380, behavior: "smooth" }));
  await sleep(1800);

  const scene4Remaining = Math.max(0, narrationClips[3].duration * 1000 - (Date.now() - scene4Start));
  await sleep(scene4Remaining);

  console.log("=== Scene 5: Open Scorecard & Rubric Criteria (Target:", narrationClips[4].duration.toFixed(2), "s) ===");
  const scene5Start = Date.now();
  const firstContestant = await page.$(".grid button:first-child");
  if (firstContestant) {
    await smoothMoveTo(".grid button:first-child", 20);
    await sleep(800);
    await firstContestant.click();
  }
  await page.waitForSelector("#judge-notes", { timeout: 8000 });
  await page.screenshot({ path: path.join(screenshotsDir, "06_scorecard_dialog_opened.png") });

  // Sequential point to 5 criteria in rubric as narrator lists them:
  // Musicality, Biblical Depth, Stage Craft, Originality, Audience Ministry
  const criteriaElements = await page.$$(".space-y-4 .rounded-xl");
  for (let i = 0; i < criteriaElements.length && i < 5; i++) {
    const box = await criteriaElements[i].boundingBox();
    if (box) {
      await page.mouse.move(box.x + 120, box.y + box.height / 2, { steps: 18 });
      await sleep(1800);
    }
  }

  const scene5Remaining = Math.max(0, narrationClips[4].duration * 1000 - (Date.now() - scene5Start));
  await sleep(scene5Remaining);

  console.log("=== Scene 6: Enter Scores & Feedback Notes (Target:", narrationClips[5].duration.toFixed(2), "s) ===");
  const scene6Start = Date.now();
  const scoreInputs = await page.$$('input[inputmode="numeric"]');
  const scoresToEnter = ["18", "19", "18", "17", "14"];
  for (let i = 0; i < scoreInputs.length && i < scoresToEnter.length; i++) {
    const input = scoreInputs[i];
    const box = await input.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
      await input.click();
      await page.keyboard.press("Meta+A");
      await page.keyboard.press("Backspace");
      await page.keyboard.type(scoresToEnter[i], { delay: 100 });
      await sleep(120);
    }
  }

  const notesTextarea = await page.$("#judge-notes");
  if (notesTextarea) {
    const box = await notesTextarea.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + 30, { steps: 14 });
      await notesTextarea.click();
      await sleep(200);
      const feedback =
        "Inspiring vocal control, profound spiritual depth, and captivating stage presence.";
      await page.keyboard.type(feedback, { delay: 35 });
      await sleep(400);
    }
  }
  await page.screenshot({ path: path.join(screenshotsDir, "07_scores_and_notes_filled.png") });
  const scene6Remaining = Math.max(0, narrationClips[5].duration * 1000 - (Date.now() - scene6Start));
  await sleep(scene6Remaining);

  console.log("=== Scene 7: Save Draft Demonstration (Target:", narrationClips[6].duration.toFixed(2), "s) ===");
  const scene7Start = Date.now();
  const saveDraftBtn = await page.$('button:has-text("Save draft")');
  if (saveDraftBtn) {
    await smoothMoveTo('button:has-text("Save draft")', 18);
    await sleep(800);
    await saveDraftBtn.click();
    await sleep(2000);
  }
  const scene7Remaining = Math.max(0, narrationClips[6].duration * 1000 - (Date.now() - scene7Start));
  await sleep(scene7Remaining);

  console.log("=== Scene 8: Review & Submit Scorecard (Target:", narrationClips[7].duration.toFixed(2), "s) ===");
  const scene8Start = Date.now();
  const reviewBtn = await page.$('button:has-text("Review & submit")');
  if (reviewBtn) {
    await smoothMoveTo('button:has-text("Review & submit")', 18);
    await sleep(800);
    await reviewBtn.click();
    await sleep(1800);

    const confirmBtn = await page.$('button:has-text("Confirm submission")');
    if (confirmBtn) {
      await smoothMoveTo('button:has-text("Confirm submission")', 18);
      await sleep(1200);
      await confirmBtn.click();
      await sleep(2000);
    }
  }
  await page.screenshot({ path: path.join(screenshotsDir, "08_scorecard_submitted.png") });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  const scene8Remaining = Math.max(0, narrationClips[7].duration * 1000 - (Date.now() - scene8Start));
  await sleep(scene8Remaining);

  console.log("=== Scene 9: Conflict of Interest Demonstration (Target:", narrationClips[8].duration.toFixed(2), "s) ===");
  const scene9Start = Date.now();
  const secondContestant = await page.$(".grid button:nth-of-type(2)");
  if (secondContestant) {
    await smoothMoveTo(".grid button:nth-of-type(2)", 18);
    await secondContestant.click();
    await page.waitForSelector("#conflict", { timeout: 8000 });
    await sleep(1200);

    const conflictCheckbox = await page.$("#conflict");
    if (conflictCheckbox) {
      await smoothMoveTo("#conflict", 18);
      await conflictCheckbox.click();
      await sleep(2000);
      await page.screenshot({ path: path.join(screenshotsDir, "09_conflict_declared.png") });

      await conflictCheckbox.click();
      await sleep(800);
    }

    // Close dialog
    await page.keyboard.press("Escape");
    await sleep(1200);
  }
  const scene9Remaining = Math.max(0, narrationClips[8].duration * 1000 - (Date.now() - scene9Start));
  await sleep(scene9Remaining);

  console.log("=== Scene 10: Lock Seat Security & Outro (Target:", narrationClips[9].duration.toFixed(2), "s) ===");
  const scene10Start = Date.now();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(1200);

  const lockBtn = await page.$('button:has-text("Lock Seat")');
  if (lockBtn) {
    await smoothMoveTo('button:has-text("Lock Seat")', 20);
    await sleep(1000);
    await lockBtn.click();
    await sleep(2500);
  }
  await page.screenshot({ path: path.join(screenshotsDir, "10_seat_locked.png") });
  const scene10Remaining = Math.max(0, narrationClips[9].duration * 1000 - (Date.now() - scene10Start));
  await sleep(scene10Remaining);

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

  console.log("=== 5. Muxing Video and Nigerian Voice Narration with FFmpeg ===");
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

  console.log("Stopping Vite server...");
  stopServer();
  console.log("Video recording and Nigerian audio synchronization successfully completed!");
}

main().catch((err) => {
  console.error("Narrated walkthrough recording failed:", err);
  process.exit(1);
});
