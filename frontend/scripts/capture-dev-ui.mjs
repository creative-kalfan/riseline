// scripts/capture-dev-ui.mjs — screenshot /dev/ui in both themes (D1 gate evidence).
// Uses system Chrome (no browser download). Output: playwright/screenshots (gitignored).
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const outDir = fileURLToPath(new URL("../playwright/screenshots/d1/", import.meta.url));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
for (const theme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript((t) => window.localStorage.setItem("careeros-theme", t), theme);
  await page.goto("http://localhost:8080/dev/ui", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const applied = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.screenshot({ path: join(outDir, `dev-ui-${theme}-1440.png`), fullPage: true });
  console.log(`${theme}: data-theme=${applied}`);
  await page.close();
}
await browser.close();
console.log("captured.");
