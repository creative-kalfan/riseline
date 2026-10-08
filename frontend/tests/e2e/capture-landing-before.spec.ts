import { test } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, "../../playwright/screenshots/landing_redesign");
fs.mkdirSync(outDir, { recursive: true });

test.describe("Landing Page Before Capture", () => {
  test("Capture desktop landing page at 1440px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "before_desktop_1440.png"), fullPage: true });
  });

  test("Capture mobile landing page at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "before_mobile_375.png"), fullPage: true });
  });
});
