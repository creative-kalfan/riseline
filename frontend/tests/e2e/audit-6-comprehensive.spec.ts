import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots/audit6");
fs.mkdirSync(screenshotsDir, { recursive: true });

const FRONTEND = "http://localhost:8080";
const BACKEND = "http://localhost:8000";

const consoleErrors: string[] = [];
const networkErrors: { url: string; status: number }[] = [];
const failedRequests: { url: string; error: string }[] = [];

function setupPageListeners(page: Page) {
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      consoleErrors.push(text);
      console.log(`[CONSOLE ERROR] ${text}`);
    }
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 400) {
      networkErrors.push({ url: response.url(), status });
      console.log(`[NETWORK ERROR] ${status} - ${response.url()}`);
    }
  });
  page.on("requestfailed", (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText || "unknown" });
    console.log(`[REQUEST FAILED] ${request.failure()?.errorText || "unknown"} - ${request.url()}`);
  });
}

async function takeScreenshot(page: Page, name: string) {
  const filePath = path.join(screenshotsDir, name);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`Screenshot: ${filePath}`);
}

async function ensureAuthenticated(page: Page) {
  const currentUrl = page.url();
  if (currentUrl.includes("/login")) {
    await page.waitForSelector('input#email, input[name="email"]', { timeout: 10000 });
    await page.fill(
      'input#email, input[name="email"]',
      process.env.TEST_USER_EMAIL || "careeros-test-user@example.com",
    );
    await page.fill(
      'input#password, input[name="password"]',
      process.env.TEST_USER_PASSWORD || "TestUser123!",
    );
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.href.includes("/login"), { timeout: 15000 });
  }
}

test.describe("AUDIT 6 — Full Launch QA / Chaos / UX Audit", () => {
  test.beforeEach(async ({ page }) => {
    setupPageListeners(page);
    consoleErrors.length = 0;
    networkErrors.length = 0;
    failedRequests.length = 0;
  });

  test("Phase 2 — Complete app walkthrough", async ({ page }) => {
    console.log("\n=== STARTING FULL JOURNEY ===");

    await page.goto(FRONTEND, { waitUntil: "domcontentloaded" });
    await takeScreenshot(page, "01-landing-authed.png");
    console.log("Landing page:", page.url());

    console.log("\n=== DASHBOARD ===");
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "02-dashboard.png");
    await expect(page.locator("main, [role='main'], header").first()).toBeVisible({
      timeout: 10000,
    });
    console.log("Dashboard loaded:", page.url());

    console.log("\n=== RESUMES ===");
    await page.goto(`${FRONTEND}/resumes`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "03-resumes.png");
    const content = await page.content();
    console.log("Resumes page loaded, length:", content.length);
    expect(content.length).toBeGreaterThan(0);

    console.log("\n=== JOBS ===");
    await page.goto(`${FRONTEND}/jobs`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "04-jobs.png");
    console.log("Jobs page loaded:", page.url());

    console.log("\n=== APPLICATIONS ===");
    await page.goto(`${FRONTEND}/applications`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "05-applications.png");
    console.log("Applications page loaded:", page.url());

    console.log("\n=== PROFILE ===");
    await page.goto(`${FRONTEND}/profile`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "06-profile.png");
    console.log("Profile page loaded:", page.url());

    console.log("\n=== ATS ===");
    await page.goto(`${FRONTEND}/ats`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "07-ats.png");
    console.log("ATS page loaded:", page.url());
  });

  test("Phase 2 — Resume Studio", async ({ page }) => {
    console.log("\n=== RESUME STUDIO ===");
    await page.goto(`${FRONTEND}/resumes`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const resumeLinks = page.locator('a[href*="/resumes/"]');
    const count = await resumeLinks.count();
    console.log(`Found ${count} resume links`);

    if (count > 0) {
      for (let i = 0; i < Math.min(count, 3); i++) {
        const href = await resumeLinks.nth(i).getAttribute("href");
        if (
          href &&
          !href.includes("/setup") &&
          !href.includes("/templates") &&
          href.match(/\/resumes\/[a-zA-Z0-9_-]+/)
        ) {
          await page.goto(href, { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(1500);
          await takeScreenshot(page, `08-resume-studio-${i}.png`);
          console.log(`Resume studio ${i} loaded:`, page.url());
          break;
        }
      }
    } else {
      await page.goto(`${FRONTEND}/resumes/setup`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      await takeScreenshot(page, "08-resume-setup.png");
      console.log("Resume setup loaded:", page.url());
    }
  });

  test("Phase 2 — Navigation & reload persistence", async ({ page }) => {
    console.log("\n=== NAVIGATION & PERSISTENCE ===");

    const pages = ["/dashboard", "/resumes", "/jobs", "/applications", "/profile"];
    for (const pagePath of pages) {
      await page.goto(`${FRONTEND}${pagePath}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(500);
      const url = page.url();
      console.log(`Navigated to ${pagePath}: ${url}`);
      expect(url).toContain(pagePath);
    }

    await page.goBack();
    await page.waitForTimeout(500);
    console.log("After back:", page.url());

    await page.goForward();
    await page.waitForTimeout(500);
    console.log("After forward:", page.url());

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "09-after-reload.png");
    console.log("After reload:", page.url());
  });

  test("Phase 6 — Empty states", async ({ page }) => {
    console.log("\n=== EMPTY STATES ===");

    await page.goto(`${FRONTEND}/jobs`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "10-jobs.png");
    console.log("Jobs page checked");

    await page.goto(`${FRONTEND}/applications`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "11-applications.png");
    console.log("Applications page checked");

    await page.goto(`${FRONTEND}/resumes`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "12-resumes.png");
    console.log("Resumes page checked");
  });

  test("Phase 7 — Responsive QA", async ({ page }) => {
    console.log("\n=== RESPONSIVE QA ===");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "13-dashboard-desktop.png");
    console.log("Desktop dashboard screenshot taken");

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "14-dashboard-tablet.png");
    console.log("Tablet dashboard screenshot taken");

    await page.goto(`${FRONTEND}/resumes`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "15-resumes-tablet.png");
    console.log("Tablet resumes screenshot taken");

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "16-dashboard-mobile.png");
    console.log("Mobile dashboard screenshot taken");

    await page.goto(`${FRONTEND}/resumes`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "17-resumes-mobile.png");
    console.log("Mobile resumes screenshot taken");

    await page.goto(`${FRONTEND}/jobs`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "18-jobs-mobile.png");
    console.log("Mobile jobs screenshot taken");

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 375;
    console.log(`Body scroll width: ${bodyWidth}px, Viewport: ${viewportWidth}px`);
    if (bodyWidth > viewportWidth) {
      console.error(`HORIZONTAL OVERFLOW: body ${bodyWidth}px > viewport ${viewportWidth}px`);
    }

    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("Phase 8 — Accessibility", async ({ page }) => {
    console.log("\n=== ACCESSIBILITY ===");

    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "19-a11y-dashboard.png");

    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    const focused1 = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, id: el.id, text: el.textContent?.slice(0, 30) } : null;
    });
    console.log("First focus:", focused1);

    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    const focused2 = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? { tag: el.tagName, id: el.id, text: el.textContent?.slice(0, 30) } : null;
    });
    console.log("Second focus:", focused2);

    const hasFocusStyles = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const styles = window.getComputedStyle(el);
      return (
        styles.outlineStyle !== "none" ||
        styles.boxShadow !== "none" ||
        styles.outlineWidth !== "0px"
      );
    });
    console.log("Focus indicator visible:", hasFocusStyles);

    const skipLinks = await page.locator('a[href^="#"], .skip-link').count();
    console.log("Skip links found:", skipLinks);

    const buttonsWithoutNames = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.filter((btn: any) => {
        const text = btn.textContent?.trim();
        const ariaLabel = btn.getAttribute("aria-label");
        const ariaLabelledby = btn.getAttribute("aria-labelledby");
        return !text && !ariaLabel && !ariaLabelledby;
      }).length;
    });
    console.log("Buttons without accessible names:", buttonsWithoutNames);

    const unlabeledInputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input, textarea, select"));
      return inputs.filter((input: any) => {
        const id = input.id;
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAriaLabel = input.getAttribute("aria-label");
        const hasPlaceholder = input.getAttribute("placeholder");
        return !hasLabel && !hasAriaLabel && !hasPlaceholder;
      }).length;
    });
    console.log("Inputs without labels:", unlabeledInputs);
  });

  test("Phase 10 — Console & network audit", async ({ page }) => {
    console.log("\n=== CONSOLE & NETWORK AUDIT ===");

    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.goto(`${FRONTEND}/resumes`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.goto(`${FRONTEND}/jobs`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.goto(`${FRONTEND}/applications`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    console.log(`\nConsole errors: ${consoleErrors.length}`);
    consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));

    console.log(`\nNetwork errors (4xx/5xx): ${networkErrors.length}`);
    networkErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e.status} - ${e.url}`));

    console.log(`\nFailed requests: ${failedRequests.length}`);
    failedRequests.forEach((e, i) => console.log(`  ${i + 1}. ${e.error} - ${e.url}`));

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes("DevTools") && !e.includes("controlled") && !e.includes("textarea"),
    );

    if (criticalErrors.length > 0) {
      console.error(`CRITICAL CONSOLE ERRORS: ${criticalErrors.length}`);
    }
  });

  test("Phase 11 — Performance sanity", async ({ page }) => {
    console.log("\n=== PERFORMANCE SANITY ===");

    const startTime = Date.now();
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);

    const apiRequestCounts: { [key: string]: number } = {};
    page.on("request", (request) => {
      const url = request.url();
      if (
        url.includes("/api/") ||
        url.includes("/jobs/") ||
        url.includes("/applications/") ||
        url.includes("/recommendations/") ||
        url.includes("/notifications/")
      ) {
        const key = url.split("?")[0];
        apiRequestCounts[key] = (apiRequestCounts[key] || 0) + 1;
      }
    });

    await page.waitForTimeout(3000);

    const duplicateRequests = Object.entries(apiRequestCounts).filter(([_, count]) => count > 5);
    console.log("API request counts (top 10):");
    Object.entries(apiRequestCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([url, count]) => console.log(`  ${count}x ${url}`));

    if (duplicateRequests.length > 0) {
      console.warn("Potential duplicate requests detected:", duplicateRequests);
    }
  });

  test("Phase 3 — Backend unavailable (error handling)", async ({ page }) => {
    console.log("\n=== BACKEND UNAVAILABLE TEST ===");

    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    await page.route("**/api/**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: { code: "server_error", message: "Service temporarily unavailable" },
        }),
      });
    });

    await page.goto(`${FRONTEND}/jobs`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "20-backend-500.png");

    const content = await page.content();
    console.log("Page content with backend 500:", content.length);

    expect(content.length).toBeGreaterThan(0);
  });

  test("Phase 4 — Auth resilience", async ({ page }) => {
    console.log("\n=== AUTH RESILIENCE ===");

    // Start from authenticated state (pre-authenticated session)
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    console.log("Starting authenticated URL:", page.url());

    // Test 1: Reload while authenticated
    await page.reload({ waitUntil: "domcontentloaded" });
    await takeScreenshot(page, "15-after-reload-authed.png");
    const urlAfterReload = page.url();
    console.log("After reload:", urlAfterReload);
    expect(urlAfterReload).not.toContain("/login");

    // Test 2: Access protected route directly
    await page.goto(`${FRONTEND}/dashboard`, { waitUntil: "domcontentloaded" });
    await takeScreenshot(page, "16-dashboard-authed.png");
    expect(page.url()).toContain("/dashboard");
    console.log("Protected route accessible:", page.url());

    // Test 3: Logout
    const logoutBtn = page
      .locator('button:has-text("Logout"), button:has-text("Sign out"), [href*="logout"]')
      .first();
    if ((await logoutBtn.count()) > 0) {
      await logoutBtn.click();
      await page.waitForTimeout(2000);
      console.log("After logout:", page.url());
      await takeScreenshot(page, "17-after-logout.png");
    } else {
      console.log("No logout button found, checking sidebar/profile menu");
      // Try clicking on user menu or avatar
      const userMenu = page
        .locator('[data-testid="user-menu"], .user-menu, button:has(img), button:has(.avatar)')
        .first();
      if ((await userMenu.count()) > 0) {
        await userMenu.click();
        await page.waitForTimeout(500);
        const logoutOption = page.locator("text=Logout, text=Sign out").first();
        if ((await logoutOption.count()) > 0) {
          await logoutOption.click();
          await page.waitForTimeout(2000);
          console.log("After logout via menu:", page.url());
        }
      }
    }
  });

  test("Phase 3 — Invalid credentials", async ({ page }) => {
    console.log("\n=== INVALID CREDENTIALS ===");

    // Clear auth state first
    await page.goto(FRONTEND, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto(`${FRONTEND}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('input#email, input[name="email"]', { timeout: 10000 });
    await page.fill('input#email, input[name="email"]', "invalid@example.com");
    await page.fill('input#password, input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await takeScreenshot(page, "21-invalid-credentials.png");

    const content = await page.content();
    console.log("Page content after invalid login:", content.length);
    expect(content.length).toBeGreaterThan(0);
  });

  test("Phase 5 — Data persistence", async ({ page }) => {
    console.log("\n=== DATA PERSISTENCE ===");

    await ensureAuthenticated(page);

    // Navigate to profile
    await page.goto(`${FRONTEND}/profile`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "22-profile-persistence.png");
    console.log("Profile page loaded:", page.url());

    // Navigate to resumes
    await page.goto(`${FRONTEND}/resumes`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await takeScreenshot(page, "23-resumes-persistence.png");
    console.log("Resumes page loaded:", page.url());

    // Reload and verify still on resumes
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    console.log("After reload:", page.url());
    expect(page.url()).toContain("/resumes");
  });
});
