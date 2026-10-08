import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots");
fs.mkdirSync(screenshotsDir, { recursive: true });

test.describe("CareerOS Authenticated Visual Smoke Test", () => {
  test("session restores and loads Dashboard without redirect to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Must not redirect to /login
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify key command center / dashboard elements
    await expect(page.locator("header").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Your career, at a glance")).toBeVisible({ timeout: 10000 });

    // Wait a brief moment for dashboard to settle
    await page.waitForTimeout(2000);

    // Capture dashboard screenshot
    const ssDashboard = path.join(screenshotsDir, "01-dashboard.png");
    await page.screenshot({ path: ssDashboard, fullPage: false });
  });

  test("loads Resumes Index and opens Resume Setup / Studio", async ({ page }) => {
    await page.goto("/resumes");
    await page.waitForLoadState("domcontentloaded");

    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/resumes/);

    // Wait for main intent cards or heading
    await expect(page.getByRole("heading", { name: "Your Resumes" })).toBeVisible({
      timeout: 10000,
    });
    await page.waitForTimeout(1500);

    // Capture resumes index screenshot
    const ssResumes = path.join(screenshotsDir, "02-resumes-index.png");
    await page.screenshot({ path: ssResumes, fullPage: false });

    // Look for existing resumes on page or test resume link
    const resumeLinks = page.locator('a[href*="/resumes/"]');
    const count = await resumeLinks.count();

    let targetHref: string | null = null;
    for (let i = 0; i < count; i++) {
      const href = await resumeLinks.nth(i).getAttribute("href");
      if (
        href &&
        href !== "/resumes" &&
        href !== "/resumes/" &&
        !href.includes("/setup") &&
        href.match(/\/resumes\/[a-zA-Z0-9_-]+/)
      ) {
        targetHref = href;
        break;
      }
    }

    if (targetHref) {
      await page.goto(targetHref);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(/\/resumes\/.+/);
      await page.waitForTimeout(2000);

      // Capture Resume Studio screenshot
      const ssStudio = path.join(screenshotsDir, "03-resume-studio.png");
      await page.screenshot({ path: ssStudio, fullPage: false });
    } else {
      // Navigate to setup/studio route
      await page.goto("/resumes/setup");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.getByRole("heading", { name: "Upload Existing Resume" })).toBeVisible({
        timeout: 10000,
      });
      await page.waitForTimeout(1500);

      const ssSetup = path.join(screenshotsDir, "03-resume-setup.png");
      await page.screenshot({ path: ssSetup, fullPage: false });
    }
  });

  test("Jobs Intelligence workstation loads with 3-pane layout", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("domcontentloaded");

    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).toHaveURL(/\/jobs/);

    await expect(page.getByRole("heading", { name: "Job Intelligence" })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /Filters/i })).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);

    const ssJobs = path.join(screenshotsDir, "04-jobs-workspace.png");
    await page.screenshot({ path: ssJobs, fullPage: false });
  });
});
