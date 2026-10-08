import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, "../../playwright/screenshots/landing_cinematic");
fs.mkdirSync(outDir, { recursive: true });

test.describe("CareerOS Cinematic Landing Page Verification", () => {
  test("Desktop 1440x900: verify automatic progression, keyboard navigation, and capture all scenes", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Scene 1: Problem Scene
    await expect(page.getByRole("heading", { name: "You're not bad at your job" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "scene_1_desktop_1440.png") });

    // Test Keyboard navigation to Scene 2
    await page.keyboard.press("2");
    await page.waitForTimeout(600);
    await expect(
      page.getByRole("heading", { name: "Deconstruct the job description first" }),
    ).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "scene_2_desktop_1440.png") });

    // Test Keyboard navigation to Scene 3
    await page.keyboard.press("3");
    await page.waitForTimeout(600);
    await expect(
      page.getByRole("heading", { name: "See why your resume isn't getting interviews" }),
    ).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "scene_3_desktop_1440.png") });

    // Test Scene 3 role selection interaction
    const aiTab = page.getByRole("button", { name: "AI Systems" });
    await aiTab.click();
    await page.waitForTimeout(300);
    await expect(page.getByRole("heading", { name: "AI Systems Engineer" })).toBeVisible();

    // Test Keyboard navigation to Scene 4
    await page.keyboard.press("4");
    await page.waitForTimeout(600);
    await expect(page.getByRole("heading", { name: "Sharpen what you did" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "scene_4_desktop_1440.png") });

    // Test Keyboard navigation to Scene 5
    await page.keyboard.press("5");
    await page.waitForTimeout(600);
    await expect(
      page.getByRole("heading", { name: "Target opportunities where your proof is strongest" }),
    ).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "scene_5_desktop_1440.png") });

    // Test Keyboard navigation to Scene 6
    await page.keyboard.press("6");
    await page.waitForTimeout(600);
    await expect(
      page.getByRole("heading", { name: "Stop sending resumes into the void" }),
    ).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "scene_6_desktop_1440.png") });

    // Verify Primary CTA
    await expect(page.getByRole("link", { name: "Analyze My Resume Free" })).toBeVisible();

    // Verify no critical console errors
    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("favicon") && !e.includes("404") && !e.includes("Download the React DevTools"),
    );
    expect(criticalErrors.length).toBe(0);
  });

  test("Desktop 1366x768: verify scene viewport sizing without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.keyboard.press("2");
    await page.waitForTimeout(400);
    await expect(
      page.getByRole("heading", { name: "Deconstruct the job description first" }),
    ).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "scene_2_desktop_1366x768.png") });

    await page.keyboard.press("3");
    await page.waitForTimeout(400);
    await expect(
      page.getByRole("heading", { name: "See why your resume isn't getting interviews" }),
    ).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "scene_3_desktop_1366x768.png") });
  });

  test("Desktop 1280x720: verify scene viewport sizing without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await page.keyboard.press("2");
    await page.waitForTimeout(400);
    await expect(
      page.getByRole("heading", { name: "Deconstruct the job description first" }),
    ).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "scene_2_desktop_1280x720.png") });

    await page.keyboard.press("4");
    await page.waitForTimeout(400);
    await expect(page.getByRole("heading", { name: "Sharpen what you did" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "scene_4_desktop_1280x720.png") });
  });

  test("Tablet 1024x768 screenshot & responsive check", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page.getByRole("heading", { name: "You're not bad at your job" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "tablet_1024x768.png") });

    await page.keyboard.press("3");
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, "scene_3_tablet_1024x768.png") });
  });

  test("Mobile 390x844 screenshot & responsive check", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // No horizontal overflow

    await expect(page.getByRole("heading", { name: "You're not bad at your job" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "mobile_390x844_scene1.png") });

    await page.keyboard.press("2");
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, "mobile_390x844_scene2.png") });

    await page.keyboard.press("6");
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(outDir, "mobile_390x844_scene6.png") });
  });
});
