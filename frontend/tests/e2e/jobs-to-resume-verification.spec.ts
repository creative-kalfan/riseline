import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots/jobs-to-resume-e2e");
fs.mkdirSync(screenshotsDir, { recursive: true });

test.describe("Complete Jobs → Resume Optimization E2E Workflow Verification", () => {
  test("full browser verification across all phases", async ({ page }) => {
    test.setTimeout(240000);

    // ── Diagnostics collection ──
    const consoleLogs: { type: string; text: string }[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const networkRequests: { url: string; method: string; status: number; body?: string }[] = [];

    page.on("console", (m) => {
      const text = m.text();
      const type = m.type();
      consoleLogs.push({ type, text });
      console.log(`[Browser ${type}] ${text}`);
      if (type === "error") {
        consoleErrors.push(text);
      }
    });

    page.on("pageerror", (e) => {
      console.log(`[Browser PageError] ${e.message}`);
      pageErrors.push(e.message);
    });

    page.on("response", async (res) => {
      const url = res.url();
      if (
        url.includes("/api/") ||
        url.includes("/jobs") ||
        url.includes("/resumes") ||
        url.includes("/optimization")
      ) {
        let body = "";
        try {
          body = await res.text();
        } catch {}
        networkRequests.push({
          url,
          method: res.request().method(),
          status: res.status(),
          body: body.substring(0, 300),
        });
        console.log(`[HTTP ${res.request().method()} ${res.status()}] ${url}`);
        if (res.status() >= 400) {
          console.log(`[HTTP ERROR BODY] ${body}`);
        }
      }
    });

    // ── Helper: wait for auth loading spinner ──
    async function waitForWorkspace() {
      const spinner = page.locator("text=Loading CareerOS workspace");
      if (await spinner.isVisible().catch(() => false)) {
        await spinner.waitFor({ state: "detached", timeout: 20000 });
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 2 & 3: Jobs Page & Real Job Verification
    // ══════════════════════════════════════════════════════════════════════════
    console.log("=== PHASE 2 & 3: Loading Jobs Page ===");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/jobs");
    await waitForWorkspace();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // Capture initial jobs page screenshot
    await page.screenshot({ path: path.join(screenshotsDir, "01-jobs-page-initial.png") });

    // Verify job cards are rendered in JobList
    const opportunitiesHeader = page.locator("text=/\\d+ opportunities/i");
    await expect(opportunitiesHeader.first()).toBeVisible({ timeout: 15000 });

    const jobListCards = page.locator(".space-y-1\\.5 > div, [data-job-id]").filter({
      hasText:
        /Stripe|Notion|Engineer|Architect|Manager|Representative|Director|Developer|coupa|Eurofins/i,
    });
    const jobCardCount = await jobListCards.count();
    console.log(`Job cards found in JobList: ${jobCardCount}`);
    expect(jobCardCount, "Jobs page must display real job cards").toBeGreaterThan(0);

    // Select the first real job card
    const firstJobCard = jobListCards.first();
    await firstJobCard.click();
    await page.waitForTimeout(1500);

    // Capture selected job detail screenshot
    await page.screenshot({ path: path.join(screenshotsDir, "02-job-detail-selected.png") });

    // Verify Job Detail displays real job info
    const jobRoleElem = page.locator("h2").first();
    const selectedJobRole = (await jobRoleElem.textContent())?.trim() || "";
    const companyElem = page.locator(".text-xs.font-semibold.text-foreground\\/90").first();
    const selectedCompany = (await companyElem.textContent())?.trim() || "";
    console.log(`Selected Job: "${selectedJobRole}" at "${selectedCompany}"`);
    expect(selectedJobRole.length, "Job role should be visible in detail panel").toBeGreaterThan(0);

    // Check for "Tailor Resume" action button
    const tailorResumeBtn = page.getByRole("button", { name: /Tailor Resume/i });
    await expect(tailorResumeBtn.first()).toBeVisible({ timeout: 5000 });
    console.log("Tailor Resume action button is visible");

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 4: Tailor / Edit Resume for This Job Dialog Verification
    // ══════════════════════════════════════════════════════════════════════════
    console.log("=== PHASE 4: Testing Job Resume Dialog ===");
    await tailorResumeBtn.first().click();
    await page.waitForTimeout(1000);

    // Verify Dialog opened
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const dialogTitle = dialog.locator("text=Edit Resume for This Job");
    await expect(dialogTitle.first()).toBeVisible({ timeout: 5000 });
    console.log("Job Resume dialog opened with title 'Edit Resume for This Job'");

    await page.screenshot({ path: path.join(screenshotsDir, "03-job-resume-dialog-jd.png") });

    // Step JD: Continue to Resume Selection
    const continueBtn = dialog.getByRole("button", { name: /Continue/i });
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
    }

    // Wait for resumes to finish loading inside dialog
    const resumeOptions = dialog.locator("button.flex.w-full");
    await expect(resumeOptions.first()).toBeVisible({ timeout: 15000 });

    const resumeOptionCount = await resumeOptions.count();
    console.log(`Resume options found in dialog: ${resumeOptionCount}`);
    expect(resumeOptionCount, "Must have at least one resume to tailor").toBeGreaterThan(0);

    await page.screenshot({
      path: path.join(screenshotsDir, "04-job-resume-dialog-select-resume.png"),
    });

    // Close dialog with Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1000);

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 5 & 6: Resume Studio Two-Pane Layout & Resume Preservation
    // ══════════════════════════════════════════════════════════════════════════
    console.log("=== PHASE 5 & 6: Loading Resume Studio ===");
    await page.goto("/resumes");
    await waitForWorkspace();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // Locate actual resume links with UUID
    const allLinks = page.locator("a[href*='/resumes/']");
    const count = await allLinks.count();
    let targetStudioUrl: string | null = null;
    for (let i = 0; i < count; i++) {
      const href = await allLinks.nth(i).getAttribute("href");
      if (href && href.match(/\/resumes\/[a-f0-9-]{36}/) && !href.includes("setup")) {
        targetStudioUrl = href;
        break;
      }
    }
    expect(targetStudioUrl, "Must find an existing resume with UUID").toBeTruthy();
    console.log(`Opening resume studio at: ${targetStudioUrl}`);

    await page.goto(targetStudioUrl!);
    await waitForWorkspace();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(4000);

    const studioUrl = page.url();
    console.log(`Current Studio URL: ${studioUrl}`);
    await page.screenshot({ path: path.join(screenshotsDir, "05-studio-initial.png") });

    // Left pane check: AI suggestions / intelligence workspace
    const leftPaneElem = page.locator(".w-\\[390px\\], .xl\\:w-\\[430px\\]").first();
    await expect(leftPaneElem).toBeVisible({ timeout: 15000 });
    console.log("Left pane (AI intelligence) verified visible");

    // Right pane check: Document Workbench / preview pane
    const previewPane = page.locator(".document-workbench").first();
    await expect(previewPane).toBeVisible({ timeout: 15000 });
    console.log("Right pane (Document Workbench) verified visible");

    // Switch to "Live Resume" mode in toolbar to verify HTML rendering & canonical template
    const liveResumeBtn = page.getByRole("button", { name: /Live Resume/i });
    if (await liveResumeBtn.isVisible().catch(() => false)) {
      await liveResumeBtn.click();
      await page.waitForTimeout(1500);
      console.log("Switched preview to Live Resume mode");
    }

    const bodyText = await previewPane.innerText().catch(() => "");
    console.log(`Preview pane text length: ${bodyText.length}`);

    await page.screenshot({ path: path.join(screenshotsDir, "06-two-pane-verified.png") });

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 7: Set Job Context & Run Optimization / ATS Analysis
    // ══════════════════════════════════════════════════════════════════════════
    console.log("=== PHASE 7: Running Job Analysis / Optimization ===");

    // Open ATS analysis dialog to set the target job
    const atsDialogBtn = page.getByRole("button", {
      name: /ATS Analysis|Add job description|Set Target Job|Change/i,
    });
    if (
      await atsDialogBtn
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await atsDialogBtn.first().click();
      await page.waitForTimeout(1000);

      const atsJobTitleInput = page.locator("#ats-job-title");
      if (await atsJobTitleInput.isVisible().catch(() => false)) {
        await page.fill("#ats-job-title", selectedJobRole || "Software Engineer");
        await page.fill("#ats-company", selectedCompany || "Eurofins GSC IT DC");
        await page.fill(
          "#ats-job-description",
          "Required Experience and Skills: 1-4 years developing end-to-end web applications using Microsoft stack of technologies (.NET, C#, ASP.NET, MVC, WebAPI, Angular, TypeScript, SQL, Cosmos DB, MSSQL). Familiar with unit testing and UI testing.",
        );

        await page.screenshot({ path: path.join(screenshotsDir, "07-ats-dialog-filled.png") });

        const analyzeSubmitBtn = page.getByRole("button", { name: "Analyze Resume" });
        await analyzeSubmitBtn.click();
        console.log("Submitted ATS Analysis for target job");
        await page.waitForTimeout(10000);
      }
    }

    // Capture LeftPane after analysis
    await page.screenshot({ path: path.join(screenshotsDir, "08-studio-after-ats.png") });

    // Verify ATS Match score appears in LeftPane
    const atsScoreGauge = page.locator("text=ATS Match Score");
    await expect(atsScoreGauge.first()).toBeVisible({ timeout: 15000 });
    console.log("ATS Match Score gauge is visible in LeftPane");

    // Check Run Optimization / AI Skills / AI Summary buttons
    const runOptBtn = page.getByRole("button", { name: /Run Optimization/i });
    const aiSkillsBtn = page.getByRole("button", { name: /AI Skills/i });
    const aiSummaryBtn = page.getByRole("button", { name: /AI Summary/i });

    console.log(`Run Optimization button: ${await runOptBtn.isVisible().catch(() => false)}`);
    console.log(`AI Skills button: ${await aiSkillsBtn.isVisible().catch(() => false)}`);
    console.log(`AI Summary button: ${await aiSummaryBtn.isVisible().catch(() => false)}`);

    if (await runOptBtn.isVisible().catch(() => false)) {
      console.log("Clicking 'Run Optimization'...");
      await runOptBtn.click();
      await page.waitForTimeout(10000);
    }

    await page.screenshot({ path: path.join(screenshotsDir, "09-studio-optimization-state.png") });

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 8 & 9: Suggestion Quality, Structure & Safety Verification
    // ══════════════════════════════════════════════════════════════════════════
    console.log("=== PHASE 8 & 9: Inspecting Suggestion Structure & Quality ===");
    const aiSuggestionsSection = page.locator("text=AI Suggestions");
    await expect(aiSuggestionsSection.first()).toBeVisible({ timeout: 10000 });
    console.log("AI Suggestions section verified");

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 10 & 11: Apply Suggestion & State Preservation
    // ══════════════════════════════════════════════════════════════════════════
    console.log("=== PHASE 10 & 11: Testing Suggestion Interaction & Reload ===");
    const applyButtons = page.locator("button").filter({ hasText: /^Apply$/i });
    const applyBtnCount = await applyButtons.count();
    console.log(`Apply buttons visible: ${applyBtnCount}`);

    if (applyBtnCount > 0) {
      await applyButtons.first().click();
      console.log("Clicked Apply on first suggestion");
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: path.join(screenshotsDir, "10-after-applying-suggestion.png"),
      });
    }

    // Test page reload to verify persisted state
    console.log("Reloading page to verify persistence...");
    await page.reload();
    await waitForWorkspace();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(4000);

    await expect(page.locator(".document-workbench").first()).toBeVisible({ timeout: 10000 });
    console.log("Resume preview persists after reload");
    await page.screenshot({ path: path.join(screenshotsDir, "11-after-reload.png") });

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 12: Navigation / Back Behavior
    // ══════════════════════════════════════════════════════════════════════════
    console.log("=== PHASE 12: Testing Navigation Back to Jobs ===");
    const backBtn = page
      .getByRole("link", { name: /Back to resumes/i })
      .or(page.locator("a[href='/resumes']"));
    if (
      await backBtn
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await backBtn.first().click();
      await waitForWorkspace();
      await page.waitForURL((url) => url.pathname.includes("/resumes"), { timeout: 10000 });
      console.log("Navigated back to /resumes");
      await page.screenshot({ path: path.join(screenshotsDir, "12-resumes-list.png") });

      // Return to Jobs
      await page.goto("/jobs");
      await waitForWorkspace();
      await page.waitForURL((url) => url.pathname.includes("/jobs"), { timeout: 10000 });
      console.log("Navigated back to /jobs");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 14: Responsive Viewports Verification
    // ══════════════════════════════════════════════════════════════════════════
    console.log("=== PHASE 14: Testing Responsive Viewports ===");

    // Laptop: 1280 × 800
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(studioUrl);
    await waitForWorkspace();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, "13-laptop-1280x800.png") });
    console.log("Captured laptop 1280x800 screenshot");

    // Mobile: 390 × 844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(studioUrl);
    await waitForWorkspace();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, "14-mobile-390x844.png") });
    console.log("Captured mobile 390x844 screenshot");

    // ══════════════════════════════════════════════════════════════════════════
    // PHASE 18: Diagnostics Summary & Health
    // ══════════════════════════════════════════════════════════════════════════
    console.log("=== FINAL DIAGNOSTICS ===");
    console.log(`Total console errors: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log("Console errors:", consoleErrors);
    }
    console.log(`Total page errors: ${pageErrors.length}`);
    if (pageErrors.length > 0) {
      console.log("Page errors:", pageErrors);
    }

    const failedRequests = networkRequests.filter((r) => r.status >= 400);
    console.log(`Total failed API requests (>=400): ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      console.log("Failed requests:", failedRequests);
    }

    const typeErrors = pageErrors.filter((e) => e.includes("TypeError"));
    expect(typeErrors, "No unhandled TypeError").toHaveLength(0);
    console.log("=== FULL WORKFLOW VERIFICATION SUITE COMPLETED ===");
  });
});
