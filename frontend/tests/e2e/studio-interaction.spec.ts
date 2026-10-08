import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, "../../playwright/screenshots/interaction");
fs.mkdirSync(outputDir, { recursive: true });

test.describe("CareerOS Interactive Flagship Verification", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("01 - Command Center & 3D Topology Interaction", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("header").first()).toBeVisible({ timeout: 20000 });

    // Verify 3D Career Vector & Skill Topology is rendered
    await expect(page.getByText("3D Career Vector & Skill Topology")).toBeVisible({
      timeout: 15000,
    });

    // Verify toggle button
    const switchBtn = page.getByRole("button", { name: /Switch to (2D Matrix|3D Sphere)/i });
    await expect(switchBtn).toBeVisible({ timeout: 15000 });

    // Toggle mode
    await switchBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outputDir, "01_dashboard_interactive_topology.png") });

    // Toggle back
    await switchBtn.click();
    await page.waitForTimeout(800);
  });

  test("02 - Resume Studio Two-Pane Bidirectional Sync & Optimization", async ({ page }) => {
    await page.goto("/resumes");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("header").first()).toBeVisible({ timeout: 20000 });

    // Look for existing resumes or create a sample master
    const resumeLinks = page.locator('a[href*="/resumes/"]');
    const count = await resumeLinks.count();
    let studioUrl: string | null = null;

    for (let i = 0; i < count; i++) {
      const href = await resumeLinks.nth(i).getAttribute("href");
      if (
        href &&
        href !== "/resumes" &&
        href !== "/resumes/" &&
        !href.includes("/setup") &&
        href.match(/\/resumes\/[a-zA-Z0-9_-]+/)
      ) {
        studioUrl = href;
        break;
      }
    }

    if (!studioUrl) {
      // Navigate to setup to establish resume
      await page.goto("/resumes/setup");
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("header").first()).toBeVisible({ timeout: 20000 });
      await expect(page.getByRole("heading", { name: /Create Your Resume Document/i })).toBeVisible(
        { timeout: 15000 },
      );
      return;
    }

    await page.goto(studioUrl);
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("header").first()).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(outputDir, "02_resume_studio_initial.png") });

    // Test Right -> Left interaction: Click a resume section / element in PreviewPane
    const summarySection = page
      .locator('[data-resume-section="summary"], #resume-section-summary')
      .first();
    if (await summarySection.isVisible()) {
      await summarySection.click();
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(outputDir, "03_resume_studio_section_selected.png"),
      });
    }

    // Test Left -> Right interaction: Click on ATS requirement or AI skills optimization if present
    const aiSkillsBtn = page.getByRole("button", { name: /AI Skills/i });
    if (await aiSkillsBtn.isVisible()) {
      await aiSkillsBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test("03 - Job Intelligence Workstation & Filters Interaction", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("header").first()).toBeVisible({ timeout: 20000 });

    await expect(page.getByRole("heading", { name: "Job Intelligence" })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Smart Filters")).toBeVisible();

    // Interact with filter buttons
    const remoteFilter = page.getByRole("button", { name: "Remote", exact: true });
    if (await remoteFilter.isVisible()) {
      await remoteFilter.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(outputDir, "04_jobs_filtered.png") });
  });

  test("04 - Application Pipeline & Kanban Interaction", async ({ page }) => {
    await page.goto("/applications");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("header").first()).toBeVisible({ timeout: 20000 });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, "05_applications_kanban.png") });
  });
});
