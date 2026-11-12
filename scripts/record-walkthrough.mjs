import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 20000) {
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

async function main() {
  console.log("Starting Vite dev server on port 4321...");
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

  const videoDir = path.resolve(process.cwd(), "public/videos/raw");
  fs.mkdirSync(videoDir, { recursive: true });
  // clean up old raw videos
  for (const f of fs.readdirSync(videoDir)) {
    if (f.endsWith(".webm")) fs.unlinkSync(path.join(videoDir, f));
  }

  console.log("Launching Chromium with video recording...");
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  // Inject an elegant visual cursor overlay so the viewer can follow mouse movements clearly
  await page.addInitScript(() => {
    window.addEventListener("DOMContentLoaded", () => {
      const cursor = document.createElement("div");
      cursor.id = "playwright-visual-cursor";
      cursor.style.position = "fixed";
      cursor.style.width = "22px";
      cursor.style.height = "22px";
      cursor.style.border = "2px solid #d4af37";
      cursor.style.backgroundColor = "rgba(14, 61, 48, 0.75)";
      cursor.style.borderRadius = "50%";
      cursor.style.pointerEvents = "none";
      cursor.style.zIndex = "999999";
      cursor.style.transition = "transform 0.12s ease-out, background-color 0.15s ease";
      cursor.style.transform = "translate(-50%, -50%)";
      cursor.style.display = "none";
      cursor.style.boxShadow = "0 0 12px rgba(212, 175, 55, 0.7)";

      // Inner dot
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
        cursor.style.backgroundColor = "rgba(14, 61, 48, 0.75)";
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

  console.log("=== Scene 1: Home Page ===");
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.mouse.move(640, 360, { steps: 8 });
  await sleep(1500);
  await page.screenshot({ path: path.join(screenshotsDir, "01_home_page.png") });

  console.log("=== Scene 2: Meet the Judges ===");
  const meetJudgesLink = await page.$('a[href="/judges/meet"]');
  if (meetJudgesLink) {
    await smoothMoveTo('a[href="/judges/meet"]');
    await meetJudgesLink.click();
  } else {
    await page.goto(`${baseUrl}/judges/meet`, { waitUntil: "networkidle" });
  }
  await sleep(2200);
  await page.screenshot({ path: path.join(screenshotsDir, "02_meet_the_judges.png") });

  // Hover over Head Judge Mrs. Priscillia Fayomi
  await smoothMoveTo("article:first-child");
  await sleep(1800);

  // Scroll down to show other judges
  await page.evaluate(() => window.scrollBy({ top: 380, behavior: "smooth" }));
  await sleep(2000);

  // Scroll to bottom callout
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: "smooth" }));
  await sleep(1500);

  console.log("=== Scene 3: Navigate to Judging Panel ===");
  const panelBtn = await page.$('a[href="/judges"] button');
  if (panelBtn) {
    await smoothMoveTo('a[href="/judges"] button');
    await panelBtn.click();
  } else {
    await page.goto(`${baseUrl}/judges`, { waitUntil: "networkidle" });
  }
  await sleep(2500);
  await page.screenshot({ path: path.join(screenshotsDir, "03_judges_panel_home.png") });

  console.log("=== Scene 4: Select Head Judge Mrs. Priscillia Fayomi ===");
  // Locate the first judge card (Mrs. Priscillia Fayomi)
  const judgeCards = await page.$$('div[role="button"]');
  console.log(`Found ${judgeCards.length} judge cards`);
  if (judgeCards.length > 0) {
    await smoothMoveTo('div[role="button"]:first-of-type');
    await judgeCards[0].click();
  }
  await sleep(1800);
  await page.screenshot({ path: path.join(screenshotsDir, "04_seat_auth_modal.png") });

  console.log("=== Scene 5: Enter Assigned PIN (7103) ===");
  const pinInput = await page.$("#seat-code");
  if (pinInput) {
    await smoothMoveTo("#seat-code");
    await pinInput.click();
    await sleep(400);

    // Type PIN with deliberate cadence: 7 - 1 - 0 - 3
    for (const char of "7103") {
      await page.keyboard.type(char, { delay: 280 });
      await sleep(150);
    }
    await sleep(600);

    // Click show/hide password toggle to reveal PIN
    const eyeBtn = await page.$('button[aria-label="Show code"], button[aria-label="Hide code"]');
    if (eyeBtn) {
      await smoothMoveTo('button[aria-label="Show code"], button[aria-label="Hide code"]');
      await eyeBtn.click();
      await sleep(1200);
    }

    await page.screenshot({ path: path.join(screenshotsDir, "05_pin_entered.png") });

    // Submit form / Click Unlock Seat
    const unlockBtn = await page.$('button[type="submit"]');
    if (unlockBtn) {
      await smoothMoveTo('button[type="submit"]');
      await unlockBtn.click();
    } else {
      await page.keyboard.press("Enter");
    }
  }

  await sleep(2800);
  await page.screenshot({ path: path.join(screenshotsDir, "06_judge_workspace.png") });

  console.log("=== Scene 6: Judge Workspace (/judges/judge1) ===");
  await smoothMoveTo("h1");
  await sleep(1500);

  // Scroll down slightly to view contestant cards
  await page.evaluate(() => window.scrollBy({ top: 180, behavior: "smooth" }));
  await sleep(1200);

  console.log("=== Scene 7: Open Contestant Scorecard ===");
  // Find first contestant button in the grid
  const firstContestant = await page.$(".grid button");
  if (firstContestant) {
    console.log("Found first contestant button, clicking...");
    await smoothMoveTo(".grid button");
    await firstContestant.click();
  }
  await sleep(2500);
  await page.screenshot({ path: path.join(screenshotsDir, "07_scorecard_dialog_opened.png") });

  console.log("=== Scene 8: Enter Scores Across 5 Criteria ===");
  const scoreInputs = await page.$$('input[inputmode="numeric"]');
  console.log(`Found ${scoreInputs.length} score criteria inputs`);

  const scoresToEnter = ["18", "19", "18", "17", "14"];
  for (let i = 0; i < scoreInputs.length && i < scoresToEnter.length; i++) {
    const input = scoreInputs[i];
    const box = await input.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
      await input.click();
      await page.keyboard.press("Meta+A");
      await page.keyboard.press("Backspace");
      await sleep(100);
      await page.keyboard.type(scoresToEnter[i], { delay: 180 });
      await sleep(350);
    }
  }
  await sleep(1200);

  // Enter Notes
  const notesTextarea = await page.$("#judge-notes");
  if (notesTextarea) {
    const box = await notesTextarea.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + 30, { steps: 12 });
      await notesTextarea.click();
      await sleep(300);
      const feedback =
        "Inspiring vocal execution and deep spiritual ministry. Commendable stage presence.";
      await page.keyboard.type(feedback, { delay: 45 });
      await sleep(800);
    }
  }

  await page.screenshot({ path: path.join(screenshotsDir, "08_scores_and_notes_filled.png") });

  console.log("=== Scene 9: Save Draft Demonstration ===");
  const saveDraftBtn = await page.$('button:has-text("Save draft")');
  if (saveDraftBtn) {
    await smoothMoveTo('button:has-text("Save draft")');
    await saveDraftBtn.click();
    await sleep(2000);
  }

  console.log("=== Scene 10: Submit Scorecard ===");
  const reviewBtn = await page.$('button:has-text("Review & submit")');
  if (reviewBtn) {
    await smoothMoveTo('button:has-text("Review & submit")');
    await reviewBtn.click();
    await sleep(1800);

    // Confirm submission
    const confirmBtn = await page.$('button:has-text("Confirm submission")');
    if (confirmBtn) {
      await smoothMoveTo('button:has-text("Confirm submission")');
      await confirmBtn.click();
      await sleep(2800);
    }
  }

  await page.screenshot({ path: path.join(screenshotsDir, "09_scorecard_submitted.png") });

  console.log("=== Scene 11: Workspace Overview with Updated Progress ===");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, "10_workspace_progress_updated.png") });

  console.log("=== Scene 12: Demonstrate Conflict of Interest Declaration ===");
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
      await page.screenshot({ path: path.join(screenshotsDir, "11_conflict_declared.png") });

      // Uncheck and close
      await conflictCheckbox.click();
      await sleep(1000);
    }

    const closeBtn = await page.$('button:has-text("Close")');
    if (closeBtn) {
      await smoothMoveTo('button:has-text("Close")');
      await closeBtn.click();
      await sleep(1500);
    }
  }

  console.log("=== Scene 13: Lock Seat Security ===");
  const lockBtn = await page.$('button:has-text("Lock Seat")');
  if (lockBtn) {
    await smoothMoveTo('button:has-text("Lock Seat")');
    await lockBtn.click();
    await sleep(2500);
  }
  await page.screenshot({ path: path.join(screenshotsDir, "12_seat_locked.png") });

  await sleep(1500);

  console.log("Closing browser and finalizing video recording...");
  await page.close();
  await context.close();
  await browser.close();

  // Locate the generated video file
  const videoFiles = fs.readdirSync(videoDir).filter((f) => f.endsWith(".webm"));
  if (videoFiles.length > 0) {
    const rawVideoPath = path.join(videoDir, videoFiles[0]);
    const finalVideoPath = path.resolve(process.cwd(), "public/videos/shabach-judges-walkthrough.webm");
    fs.copyFileSync(rawVideoPath, finalVideoPath);
    console.log(`Video successfully recorded and saved to: ${finalVideoPath}`);
    const stat = fs.statSync(finalVideoPath);
    console.log(`Video size: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
  }

  console.log("Stopping Vite server...");
  stopServer();
  console.log("Walkthrough recording complete!");
}

main().catch((err) => {
  console.error("Walkthrough recording failed:", err);
  process.exit(1);
});
