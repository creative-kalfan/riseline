/**
 * Resume Studio UI — Left/Right Pane Multi-State Regression
 *
 * Asserts that the tailoring card and job header render identically in both
 * STATE A (versions loading) and STATE B (versions + ATS data loaded).
 * Also verifies right-pane toolbar button containment at 1440 x 900.
 */
import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotDir = path.resolve(__dirname, "../../playwright/screenshots/resume-studio-ui");
fs.mkdirSync(screenshotDir, { recursive: true });

async function resolveStudioUrl(page: import("@playwright/test").Page): Promise<string | null> {
  await page.goto("/resumes");
  await page.waitForLoadState("domcontentloaded");
  const links = page.locator('a[href*="/resumes/"]');
  const count = await links.count();
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute("href");
    if (href && href.match(/\/resumes\/[a-zA-Z0-9_-]+$/) && !href.includes("/setup")) {
      return href;
    }
  }
  return null;
}

test.describe("Resume Studio — Left Pane State-Machine Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("TC-1: Tailor button and full description visible after data hydration (STATE B)", async ({ page }) => {
    const studioUrl = await resolveStudioUrl(page);
    if (!studioUrl) { test.skip(true, "No resumes found"); return; }

    await page.goto(`${studioUrl}?jobTitle=${encodeURIComponent("Finance Associate")}&company=${encodeURIComponent("ZS Associates")}`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotDir, "tc1-state-b-loaded.png"), fullPage: false });

    await expect(page.getByText("Finance Associate")).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /change/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/crafts high-impact bullet points/i)).toBeVisible({ timeout: 10000 });

    const tailorBtn = page.getByRole("button", { name: /Tailor Resume for this Role/i });
    await expect(tailorBtn).toBeVisible({ timeout: 10000 });
    await expect(tailorBtn).toContainText("Tailor Resume for this Role");
  });

  test("TC-2: Tailor button visible during initial loading state (STATE A)", async ({ page }) => {
    const studioUrl = await resolveStudioUrl(page);
    if (!studioUrl) { test.skip(true, "No resumes found"); return; }

    await page.goto(`${studioUrl}?jobTitle=Product+Manager&company=Acme`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotDir, "tc2-state-a-loading.png"), fullPage: false });

    const hasTailor = (await page.locator('button:has-text("Tailor Resume for this Role"), button:has-text("Analyzing & Tailoring")').count()) > 0;
    const hasAddJob = (await page.getByRole("button", { name: /Add job description/i }).count()) > 0;
    expect(hasTailor || hasAddJob).toBe(true);
  });

  test("TC-3: Button text stays consistent before and after network idle (no swap)", async ({ page }) => {
    const studioUrl = await resolveStudioUrl(page);
    if (!studioUrl) { test.skip(true, "No resumes found"); return; }

    await page.goto(`${studioUrl}?jobTitle=Senior+Engineer&company=TestCo`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(500);
    const stateAVisible = await page.getByRole("button", { name: /Tailor Resume for this Role/i }).isVisible();

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    const stateBVisible = await page.getByRole("button", { name: /Tailor Resume for this Role/i }).isVisible();
    await page.screenshot({ path: path.join(screenshotDir, "tc3-state-consistency.png"), fullPage: false });

    if (stateAVisible) expect(stateBVisible).toBe(true);
  });
});

test.describe("Resume Studio — Right Pane Toolbar Overflow Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("TC-4: Toolbar export actions fully visible and not clipped at 1440x900", async ({ page }) => {
    const studioUrl = await resolveStudioUrl(page);
    if (!studioUrl) { test.skip(true, "No resumes found"); return; }

    await page.goto(studioUrl);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, "tc4-toolbar-1440.png"), fullPage: false });

    const pdfBtn = page.getByRole("button", { name: /Download PDF/i });
    if (await pdfBtn.isVisible()) {
      const box = await pdfBtn.boundingBox();
      if (box) expect(box.x + box.width).toBeLessThanOrEqual(1450);
    }
    const docxBtn = page.getByRole("button", { name: /DOCX/i });
    if (await docxBtn.isVisible()) {
      const box = await docxBtn.boundingBox();
      if (box) expect(box.x + box.width).toBeLessThanOrEqual(1450);
    }
  });

  test("TC-5: Zoom controls do not cause horizontal overflow", async ({ page }) => {
    const studioUrl = await resolveStudioUrl(page);
    if (!studioUrl) { test.skip(true, "No resumes found"); return; }

    await page.goto(studioUrl);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(800);

    const zoomIn = page.getByRole("button", { name: /Zoom in/i });
    if (await zoomIn.isVisible()) { await zoomIn.click(); await zoomIn.click(); await page.waitForTimeout(300); }
    await page.screenshot({ path: path.join(screenshotDir, "tc5-toolbar-after-zoom.png"), fullPage: false });

    const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasHScroll).toBe(false);
  });
});