import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const auditDir = path.resolve(__dirname, "../../playwright/screenshots/audit_baseline");
fs.mkdirSync(auditDir, { recursive: true });

const routes = [
  { name: "01_dashboard", path: "/dashboard" },
  { name: "02_resumes_index", path: "/resumes" },
  { name: "03_resumes_setup", path: "/resumes/setup" },
  { name: "04_jobs", path: "/jobs" },
  { name: "05_applications", path: "/applications" },
  { name: "06_recommendations", path: "/recommendations" },
  { name: "07_ats", path: "/ats" },
  { name: "08_settings", path: "/settings" },
];

test.describe("Initial Comprehensive Visual Audit", () => {
  for (const r of routes) {
    test(`Capture desktop ${r.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(r.path);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator(".glass-topbar")).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(1200);

      const filePath = path.join(auditDir, `${r.name}_desktop.png`);
      await page.screenshot({ path: filePath, fullPage: false });
    });
  }

  test("Capture mobile dashboard and jobs at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("header").first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(auditDir, "09_dashboard_mobile_375.png") });

    await page.goto("/jobs");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("header").first()).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(auditDir, "10_jobs_mobile_375.png") });
  });
});
