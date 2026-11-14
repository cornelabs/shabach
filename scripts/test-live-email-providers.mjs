import { chromium } from "playwright";

(async () => {
  console.log("Launching headless browser to test email providers on production...");
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("[BROWSER CONSOLE]", msg.type(), msg.text()));

  const url = "https://shabach.vercel.app/email-test";
  console.log("Navigating to:", url);
  await page.goto(url, { waitUntil: "networkidle" });

  console.log("Page loaded. Checking title...");
  const title = await page.title();
  console.log("Page title:", title);

  // Click 'Test All 3 Providers'
  console.log("Clicking 'Test All 3 Providers' button...");
  const testAllBtn = page.getByRole("button", { name: /Test All 3 Providers/i });
  await testAllBtn.click();

  console.log("Waiting for results to populate...");
  // Wait up to 30s for the results section to appear
  await page.waitForSelector(".space-y-4", { timeout: 35000 });

  // Wait a moment for rendering
  await page.waitForTimeout(2000);

  // Take a screenshot of the results
  await page.screenshot({ path: "public/screenshots/live_email_providers_test_result.png", fullPage: true });
  console.log("Saved screenshot: public/screenshots/live_email_providers_test_result.png");

  // Extract result cards text
  const results = await page.$$eval(".space-y-4 > div > div", (cards) => {
    return cards.map((c) => c.innerText);
  });

  console.log("--- RESULTS SUMMARY ---");
  results.forEach((r, i) => {
    console.log(`[Result ${i + 1}]:\n${r}\n`);
  });

  await browser.close();
})();
