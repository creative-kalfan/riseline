import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, "../../playwright/screenshots/reconstructed");
fs.mkdirSync(outputDir, { recursive: true });

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

test.describe("CareerOS Reconstructed Visual & Interaction Verification", () => {
  for (const r of routes) {
    test(`Verify & capture desktop ${r.name}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(r.path);
      await page.waitForLoadState("domcontentloaded");

      // Verify app header / topbar is rendered
      await expect(page.locator("header").first()).toBeVisible({ timeout: 25000 });
      await page.waitForTimeout(1500);

      const filePath = path.join(outputDir, `${r.name}_desktop.png`);
      await page.screenshot({ path: filePath, fullPage: false });
    });
  }

  test("Verify & capture mobile 375px views", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("header").first()).toBeVisible({ timeout: 25000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outputDir, "09_dashboard_mobile_375.png") });

    await page.goto("/jobs");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("header").first()).toBeVisible({ timeout: 25000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outputDir, "10_jobs_mobile_375.png") });
  });

  test("Verify Resume Setup choice paths and interaction", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/resumes/setup");
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByText("Create Your Resume Document")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("[PATH // 01]")).toBeVisible();
    await expect(page.getByText("[PATH // 02]")).toBeVisible();
    await expect(page.getByText("[PATH // 03]")).toBeVisible();

    const filePath = path.join(outputDir, "11_resume_setup_interactive.png");
    await page.screenshot({ path: filePath });
  });
});
