import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots/resumes_hover");
fs.mkdirSync(screenshotsDir, { recursive: true });

test.describe("Resume Studio Intent Cards Hover Regression", () => {
  test("Both intent cards remain fully visible and crisp on hover in Dark and Light modes", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto("/resumes");
    await page.waitForLoadState("domcontentloaded");

    const optimizeCard = page.getByRole("link", { name: /Optimize my resume for a job/i });
    const createCard = page.getByRole("link", { name: /Create \/ Upload resume/i });

    await expect(optimizeCard).toBeVisible({ timeout: 15000 });
    await expect(createCard).toBeVisible({ timeout: 15000 });

    // --- DARK MODE ---
    // 1. Idle Dark
    await page.screenshot({
      path: path.join(screenshotsDir, "resumes_dark_idle.png"),
      fullPage: false,
    });

    // 2. Hover Optimize Card Dark
    await optimizeCard.hover();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotsDir, "resumes_dark_hover_optimize.png"),
      fullPage: false,
    });

    // 3. Hover Create / Upload Card Dark
    await createCard.hover();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotsDir, "resumes_dark_hover_create.png"),
      fullPage: false,
    });

    // Verify title and CTA are visible and not faded
    const createTitle = createCard.getByText("Create / Upload resume");
    const createCta = createCard.getByText(/Upload or create/i);
    await expect(createTitle).toBeVisible();
    await expect(createCta).toBeVisible();

    // Check opacity is not reduced
    const opacity = await createCard.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThanOrEqual(0.9);

    // --- LIGHT MODE ---
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    });
    await page.waitForTimeout(300);

    // 4. Idle Light
    await page.screenshot({
      path: path.join(screenshotsDir, "resumes_light_idle.png"),
      fullPage: false,
    });

    // 5. Hover Optimize Card Light
    await optimizeCard.hover();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotsDir, "resumes_light_hover_optimize.png"),
      fullPage: false,
    });

    // 6. Hover Create / Upload Card Light
    await createCard.hover();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotsDir, "resumes_light_hover_create.png"),
      fullPage: false,
    });

    await expect(createTitle).toBeVisible();
    await expect(createCta).toBeVisible();

    // Move cursor back and forth
    await optimizeCard.hover();
    await page.waitForTimeout(100);
    await createCard.hover();
    await page.waitForTimeout(100);

    await expect(createTitle).toBeVisible();
    await expect(optimizeCard.getByText("Optimize my resume for a job")).toBeVisible();
  });
});
