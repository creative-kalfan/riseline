import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Browser-level check for the landing hero carousel (anonymous, no auth).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../playwright/screenshots/hero_carousel");
fs.mkdirSync(outDir, { recursive: true });

const frontIndex = (page: Page) =>
  page.locator('[aria-roledescription="slide"][data-offset="0"]').getAttribute("aria-label");

for (const vp of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 375, height: 812 },
  { name: "narrow", width: 320, height: 640 },
]) {
  test(`hero carousel ${vp.name} ${vp.width}x${vp.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/");
    await page.waitForLoadState("networkidle"); // wait for hydration
    const carousel = page.locator('[aria-roledescription="carousel"]');
    await carousel.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);

    // No horizontal overflow.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);

    // Primary CTA visible and not covered by cards.
    const cta = page.getByRole("link", { name: "Try Free" }).first();
    await expect(cta).toBeVisible();
    const ctaBox = (await cta.boundingBox())!;
    const stageBox = (await carousel.boundingBox())!;
    expect(stageBox.y).toBeGreaterThan(ctaBox.y + ctaBox.height);

    // Autoplay: advances within ~4.5s.
    const first = await frontIndex(page);
    await page.screenshot({ path: path.join(outDir, `${vp.name}.png`), fullPage: false });
    await page.waitForTimeout(5200);
    expect(await frontIndex(page)).not.toBe(first);

    // Hover pauses.
    await page.locator('[aria-roledescription="slide"][data-offset="0"]').hover();
    const held = await frontIndex(page);
    await page.waitForTimeout(5500);
    expect(await frontIndex(page)).toBe(held);

    // Next / Previous.
    await page.getByRole("button", { name: "Next slide" }).click();
    await page.waitForTimeout(900);
    expect(await frontIndex(page)).not.toBe(held);
    await page.getByRole("button", { name: "Previous slide" }).click();
    await page.waitForTimeout(900);
    expect(await frontIndex(page)).toBe(held);
    await page.screenshot({ path: path.join(outDir, `${vp.name}-after-nav.png`) });

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("404") &&
        !e.includes("Download the React DevTools") &&
        !e.includes("ERR_CONNECTION_REFUSED") &&
        !e.includes("Failed to fetch") &&
        !e.includes("ApiClientError"),
    );
    expect(criticalErrors).toEqual([]);
  });
}

test("keyboard focus pauses; Enter on Next advances", async ({ page }) => {
  await page.goto("/");
    await page.waitForLoadState("networkidle"); // wait for hydration
  await page.mouse.move(0, 0);
  const next = page.getByRole("button", { name: "Next slide" });
  await next.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab"); // keyboard-originated focus => :focus-visible
  const held = await frontIndex(page);
  await page.waitForTimeout(5500);
  expect(await frontIndex(page)).toBe(held);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(900);
  expect(await frontIndex(page)).not.toBe(held);
});

test("pause button stops autoplay for touch users", async ({ page }) => {
  await page.goto("/");
    await page.waitForLoadState("networkidle"); // wait for hydration
  await page.getByRole("button", { name: "Pause slideshow" }).click();
  await page.mouse.move(0, 0);
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  const held = await frontIndex(page);
  await page.waitForTimeout(5500);
  expect(await frontIndex(page)).toBe(held);
  await expect(page.getByRole("button", { name: "Play slideshow" })).toBeVisible();
});

test.describe("reduced motion", () => {
  test("no autoplay, no transition, flat tilt", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.waitForLoadState("networkidle"); // wait for hydration
    await page.mouse.move(0, 0);
    expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
    const held = await frontIndex(page);
    await page.waitForTimeout(5500);
    expect(await frontIndex(page)).toBe(held);
    await expect(page.getByRole("button", { name: "Pause slideshow" })).toHaveCount(0);
    const dur = await page
      .locator('[aria-roledescription="slide"]')
      .first()
      .evaluate((el) => getComputedStyle(el).transitionProperty);
    expect(dur).toBe("none");
    await page.getByRole("button", { name: "Next slide" }).click();
    expect(await frontIndex(page)).not.toBe(held);
  });
});
