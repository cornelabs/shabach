import { chromium } from "playwright";
import fs from "fs";
import path from "path";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 794, height: 1123 } // A4 at 96 DPI
  });
  
  await page.goto("file://" + path.resolve("public/documents/shabach-2026-judges-bios.html"), {
    waitUntil: "networkidle"
  });

  const containers = await page.$$(".page-container");
  console.log(`Found ${containers.length} page containers`);

  fs.mkdirSync("public/screenshots/judges_dossier", { recursive: true });

  for (let i = 0; i < containers.length; i++) {
    const shotPath = `public/screenshots/judges_dossier/page_${i + 1}.png`;
    await containers[i].screenshot({ path: shotPath });
    console.log(`Saved screenshot: ${shotPath}`);
  }

  await browser.close();
})();
