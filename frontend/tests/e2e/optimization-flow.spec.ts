import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots/optimization");
fs.mkdirSync(screenshotsDir, { recursive: true });

test.describe("Resume Optimization Flow", () => {
  test("full flow: resume → two-pane → job context → run optimization → suggestions", async ({
    page,
  }) => {
    test.setTimeout(120000);

    // ── Collect diagnostics ──
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => pageErrors.push(e.message));

    const optimizationRequests: { url: string; status: number; body: string }[] = [];
    page.on("response", async (res) => {
      if (res.url().includes("/api/optimization/generate")) {
        let body = "";
        try {
          body = await res.text();
        } catch {}
        optimizationRequests.push({ url: res.url(), status: res.status(), body });
      }
    });

    const apiErrors: { url: string; status: number }[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/") && res.status() >= 400) {
        apiErrors.push({ url: res.url(), status: res.status() });
      }
    });

    // ── Step 1: Find and open a resume ──
    await page.goto("/resumes");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const resumeLinks = page.locator('a[href*="/resumes/"]');
    const count = await resumeLinks.count();
    let studioUrl: string | null = null;
    for (let i = 0; i < count; i++) {
      const href = await resumeLinks.nth(i).getAttribute("href");
      if (href && href.match(/\/resumes\/[a-f0-9-]{36}/) && !href.includes("setup")) {
        studioUrl = href;
        break;
      }
    }
    expect(studioUrl, "Must find an existing resume").toBeTruthy();
    console.log(`Opening resume: ${studioUrl}`);

    // ── Step 2: Open studio, verify two panes ──
    await page.goto(studioUrl!);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, "01-studio-loaded.png") });

    // Verify left pane (has "No job target set" or job context)
    const leftPaneContent = page
      .locator("text=No job target set")
      .or(page.locator("text=Run Optimization"));
    await expect(leftPaneContent.first()).toBeVisible({ timeout: 10000 });

    // Verify right pane (has PDF preview controls)
    const pdfControls = page.locator("text=Original PDF").or(page.locator("text=Live Resume"));
    await expect(pdfControls.first()).toBeVisible({ timeout: 10000 });
    console.log("Two-pane workspace verified");

    await page.screenshot({ path: path.join(screenshotsDir, "02-two-pane.png") });

    // ── Step 3: Set job context via ATS dialog ──
    const hasJobContext = await page
      .locator("text=Run Optimization")
      .isVisible()
      .catch(() => false);

    if (!hasJobContext) {
      console.log("Setting job context via ATS dialog");

      // Click "Add job description" or "Set Target Job" in the left pane
      const addJobBtn = page.getByRole("button", { name: /Add job description|Set Target Job/i });
      await expect(addJobBtn.first()).toBeVisible({ timeout: 5000 });
      await addJobBtn.first().click();
      await page.waitForTimeout(1000);

      // Dialog should be open — fill using the known IDs
      await expect(page.locator("#ats-job-title")).toBeVisible({ timeout: 5000 });
      await page.fill("#ats-job-title", "Software Engineer");
      await page.fill("#ats-company", "Acme Corp");
      await page.fill(
        "#ats-job-description",
        "We are looking for a Software Engineer with experience in TypeScript, React, Node.js, Python, SQL, REST APIs, Git, AWS, Docker, and agile methodologies.",
      );

      await page.screenshot({ path: path.join(screenshotsDir, "03-dialog-filled.png") });

      // Submit
      await page.getByRole("button", { name: "Analyze Resume" }).click();

      // Wait for analysis to complete (ATS analysis runs, left pane updates)
      await page.waitForTimeout(8000);
      console.log("Job context submitted, waiting for analysis");
    }

    await page.screenshot({ path: path.join(screenshotsDir, "04-job-set.png") });

    // ── Step 4: Verify Run Optimization button appears ──
    const runOptBtn = page.getByRole("button", { name: /Run Optimization/i });
    await expect(runOptBtn).toBeVisible({ timeout: 15000 });
    console.log("Run Optimization button is visible");

    await page.screenshot({ path: path.join(screenshotsDir, "05-ready-to-run.png") });

    // ── Step 5: Click and track ──
    optimizationRequests.length = 0;
    apiErrors.length = 0;

    await runOptBtn.click();
    console.log("Clicked Run Optimization");

    // ── Step 6: Wait for generation ──
    let waited = 0;
    while (optimizationRequests.length === 0 && waited < 90000) {
      await page.waitForTimeout(1000);
      waited += 1000;
      if (waited % 10000 === 0) {
        console.log(`Waiting... ${waited}s`);
        await page.screenshot({ path: path.join(screenshotsDir, `06-waiting-${waited}s.png`) });
      }
    }

    await page.screenshot({ path: path.join(screenshotsDir, "07-after-gen.png") });

    // ── Step 7: Assert exactly one request ──
    expect(
      optimizationRequests.length,
      `Expected 1 optimization request, got ${optimizationRequests.length}`,
    ).toBe(1);

    const req = optimizationRequests[0];
    console.log(`Status: ${req.status}`);

    // ── Step 8: Assert 2xx ──
    expect(req.status, "Must return 2xx").toBeGreaterThanOrEqual(200);
    expect(req.status).toBeLessThan(300);

    // ── Step 9: Assert no 401 ──
    const auth401 = apiErrors.find((e) => e.status === 401);
    expect(auth401, "No 401 on optimization request").toBeUndefined();

    // ── Step 10: Validate response structure ──
    const parsed = JSON.parse(req.body);
    expect(parsed.session_id || parsed.sessionId, "Must have session ID").toBeTruthy();

    const suggestions = parsed.suggestions || [];
    expect(Array.isArray(suggestions), "Suggestions must be array").toBe(true);
    console.log(`Suggestions: ${suggestions.length}`);

    // Validate evidence is array for each suggestion
    for (const s of suggestions) {
      if (s.evidence !== undefined && s.evidence !== null) {
        expect(Array.isArray(s.evidence), `evidence must be array, got ${typeof s.evidence}`).toBe(
          true,
        );
      }
    }

    // ── Step 11: Both panes still visible ──
    await expect(leftPaneContent.first()).toBeVisible({ timeout: 5000 });
    await expect(pdfControls.first()).toBeVisible({ timeout: 5000 });
    console.log("Both panes still visible after generation");

    // ── Step 12: No runtime crashes ──
    const evCrash = consoleErrors.find((e) => e.includes("evidence.map"));
    expect(evCrash, "No evidence.map error").toBeUndefined();

    const typeErrs = pageErrors.filter((e) => e.includes("TypeError"));
    expect(typeErrs, "No TypeError").toHaveLength(0);

    const errorBoundary = await page
      .getByText("This page didn't load")
      .isVisible()
      .catch(() => false);
    expect(errorBoundary, "No error boundary").toBe(false);

    await page.screenshot({ path: path.join(screenshotsDir, "08-final.png") });

    // ── Summary ──
    console.log("=== PASSED ===");
    console.log(`Requests: ${optimizationRequests.length}, Suggestions: ${suggestions.length}`);
    console.log(`Console errors: ${consoleErrors.length}, Page errors: ${pageErrors.length}`);
    if (consoleErrors.length > 0) console.log("Console errors:", consoleErrors);
    if (pageErrors.length > 0) console.log("Page errors:", pageErrors);
    console.log("Response body:", req.body.substring(0, 1000));
  });
});
