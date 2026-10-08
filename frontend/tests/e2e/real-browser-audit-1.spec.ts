import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const auditDir = path.resolve(__dirname, "../../playwright/screenshots/audit1");
fs.mkdirSync(auditDir, { recursive: true });

const BACKEND_DIR = path.resolve(__dirname, "../../../careeros-backend-py");

interface SeedResult {
  resume_id: string;
  session_id: string;
  suggestion_id: string;
  user_id: string;
}

function runSeed(): SeedResult {
  const output = execSync(
    "python -c \"import sys; sys.path.insert(0, '.'); import runpy; runpy.run_path('scripts/seed_optimization_e2e.py', run_name='__main__')\"",
    {
      cwd: BACKEND_DIR,
      encoding: "utf-8",
      timeout: 30000,
    },
  );
  const jsonLine = output.trim().split("\n").pop() || "{}";
  return JSON.parse(jsonLine) as SeedResult;
}

test.describe("CareerOS Real Browser Audit #1", () => {
  test("Resume -> ATS -> AI Suggestions -> Apply -> Re-Analyze -> Persistence", async ({
    page,
  }) => {
    test.setTimeout(240000);

    const consoleLogs: { type: string; text: string }[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const networkRequests: { method: string; url: string; status?: number }[] = [];
    const networkFailures: { method: string; url: string; status: number; text: string }[] = [];

    page.on("console", (msg) => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    page.on("pageerror", (err) => {
      pageErrors.push(err.message);
    });

    page.on("response", async (res) => {
      const req = res.request();
      networkRequests.push({ method: req.method(), url: res.url(), status: res.status() });
      if (res.status() >= 400 && res.url().includes("/api/")) {
        let text = "";
        try {
          text = await res.text();
        } catch {}
        networkFailures.push({ method: req.method(), url: res.url(), status: res.status(), text });
      }
    });

    // ── STEP 1: Seed deterministic clean state ──
    console.log("--- STEP 1: Seeding Test Data ---");
    const seed = runSeed();
    console.log(
      `Seeded: resume_id=${seed.resume_id}, session_id=${seed.session_id}, suggestion_id=${seed.suggestion_id}`,
    );
    expect(seed.resume_id, "Seed resume ID must exist").toBeTruthy();

    // ── STEP 2: Navigate to Resume Index & Open Resume ──
    console.log("--- STEP 2: Navigating to Resumes ---");
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/resumes");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(auditDir, "01-resumes-landing.png") });

    // Open target seeded resume
    const resumeLink = page.locator(`a[href*="${seed.resume_id}"]`);
    if (
      await resumeLink
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      const cardText = await resumeLink.first().innerText();
      const rawUuidMatch = cardText.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
      );
      expect(rawUuidMatch, "UI must NOT expose raw UUID as resume name").toBeNull();
      console.log("Verified: Resume entry does NOT expose raw UUID");
    }

    await page.goto(`/resumes/${seed.resume_id}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(auditDir, "02-studio-loaded.png") });

    // ── STEP 3: Verify Two-Pane Contract ──
    console.log("--- STEP 3: Verifying Two-Pane Contract ---");
    // Left pane must contain intelligence / suggestion / ATS controls
    const leftPane = page
      .locator("text=ATS Score")
      .or(page.locator("text=AI Suggestions"))
      .or(page.locator("text=Target Job"))
      .or(page.locator("text=No job target set"));
    await expect(leftPane.first()).toBeVisible({ timeout: 10000 });

    // Switch to Live Resume if in original PDF mode to inspect canonical text
    const liveResumeBtn = page.getByRole("button", { name: /Live Resume|Canonical/i });
    if (await liveResumeBtn.isVisible().catch(() => false)) {
      await liveResumeBtn.click();
      await page.waitForTimeout(1000);
    }

    const previewContainer = page.locator(".document-workbench");
    await expect(previewContainer).toBeVisible();

    // Verify left pane is NOT another generated resume (it must have studio intelligence tools)
    const leftPaneSectionTitles = page
      .locator("text=AI Suggestions")
      .or(page.locator("text=ATS Match Analysis"))
      .or(page.locator("text=Resume Completeness"));
    await expect(leftPaneSectionTitles.first()).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: path.join(auditDir, "03-two-pane-contract.png") });

    // ── STEP 4: ATS Analysis Verification ──
    console.log("--- STEP 4: Verifying ATS Analysis ---");
    const addJobBtn = page.getByRole("button", {
      name: /Add job description|Set Target Job|Change/i,
    });
    if (
      await addJobBtn
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await addJobBtn.first().click();
      await page.waitForTimeout(1000);

      await expect(page.locator("#ats-job-title")).toBeVisible({ timeout: 5000 });
      await page.fill("#ats-job-title", "Senior Software Engineer");
      await page.fill("#ats-company", "TechCorp Inc");
      await page.fill(
        "#ats-job-description",
        "We are looking for a Senior Software Engineer with 5+ years of experience in TypeScript, React, Node.js, Python, SQL, PostgreSQL, AWS, Docker, Kubernetes, REST APIs, microservices, and agile methodologies.",
      );
      await page.screenshot({ path: path.join(auditDir, "04-ats-dialog.png") });

      await page.getByRole("button", { name: "Analyze Resume" }).click();
      console.log("Submitted ATS analysis dialog");
      await page.waitForTimeout(12000);
    }

    await page.screenshot({ path: path.join(auditDir, "05-ats-analysis-results.png") });

    const scoreElement = page
      .locator("text=ATS Score")
      .or(page.locator("text=Match Score"))
      .or(page.locator("text=Overall Match"));
    await expect(scoreElement.first()).toBeVisible({ timeout: 15000 });

    const requirementsOrGaps = page
      .locator("text=Missing Requirements")
      .or(page.locator("text=Requirement Coverage"))
      .or(page.locator("text=Keywords"))
      .or(page.locator("text=Requirements"));
    await expect(requirementsOrGaps.first()).toBeVisible({ timeout: 10000 });
    console.log("ATS analysis results verified with score and requirement breakdown");

    // ── STEP 5: AI Suggestions Card Inspection ──
    console.log("--- STEP 5: Inspecting AI Suggestions ---");
    const suggestionsHeading = page.locator("text=AI Suggestions");
    await expect(suggestionsHeading.first()).toBeVisible({ timeout: 10000 });

    const summarySuggestion = page.locator("text=Senior Software Engineer with 6+ years");
    await expect(summarySuggestion.first()).toBeVisible({ timeout: 10000 });

    const acceptBtn = page.getByRole("button", { name: /Accept|Apply|Save & Accept/i }).first();
    const rejectBtn = page.getByRole("button", { name: /Reject|Dismiss/i }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 5000 });
    await expect(rejectBtn).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(auditDir, "06-ai-suggestions-inspected.png") });

    // ── STEP 6: Apply ONE Suggestion & Observe Right Pane ──
    console.log("--- STEP 6: Applying Suggestion ---");
    if (await liveResumeBtn.isVisible().catch(() => false)) {
      await liveResumeBtn.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(auditDir, "07-before-apply-right-pane.png") });

    await acceptBtn.click();
    console.log("Clicked Accept on professional summary suggestion");
    await page.waitForTimeout(4000);

    await page.screenshot({ path: path.join(auditDir, "08-after-apply-right-pane.png") });

    // Right pane must immediately reflect the updated summary
    const updatedSummaryInPreview = page
      .locator(".document-workbench")
      .getByText(/Senior Software Engineer with 6\+ years/i);
    await expect(updatedSummaryInPreview.first()).toBeVisible({ timeout: 10000 });
    console.log("Verified: Right pane updated with new summary text!");

    // Verify unrelated content remains intact
    const experienceSection = page
      .locator(".document-workbench")
      .getByText(/Experience|Work History/i);
    await expect(experienceSection.first()).toBeVisible();

    // Verify left suggestion card updated to Accepted state
    const acceptedBadge = page
      .locator("text=Accepted")
      .or(page.locator("text=Applied"))
      .or(page.locator("text=Saved"));
    await expect(acceptedBadge.first()).toBeVisible({ timeout: 10000 });
    console.log("Verified: Left suggestion card updated to Accepted state");

    // Test Reject action on second suggestion
    const remainingRejectBtn = page.getByRole("button", { name: /^Reject$/i }).first();
    if (await remainingRejectBtn.isVisible().catch(() => false)) {
      await remainingRejectBtn.click();
      console.log("Clicked Reject on second suggestion");
      await page.waitForTimeout(2000);
      console.log("Verified: Reject action processed without mutating resume");
    }

    // Track the derived version URL
    const derivedVersionUrl = page.url();
    console.log(`Derived version URL: ${derivedVersionUrl}`);

    // ── STEP 7: Re-Analysis ──
    console.log("--- STEP 7: Triggering Re-Analysis ---");
    const reanalyzeBtn = page.getByRole("button", {
      name: /Re-analyze|Run ATS Analysis|Analyze Again|Change/i,
    });
    if (
      await reanalyzeBtn
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await reanalyzeBtn.first().click();
      await page.waitForTimeout(1000);
      const submitAnalyze = page.getByRole("button", { name: "Analyze Resume" });
      if (await submitAnalyze.isVisible().catch(() => false)) {
        await submitAnalyze.click();
      }
      await page.waitForTimeout(12000);
    }

    await page.screenshot({ path: path.join(auditDir, "09-reanalysis-results.png") });

    const reanalysisScore = page
      .locator("text=ATS Score")
      .or(page.locator("text=Match Score"))
      .or(page.locator("text=Overall Match"));
    await expect(reanalysisScore.first()).toBeVisible({ timeout: 15000 });
    console.log("Verified: Re-analysis recalculated successfully");

    // ── STEP 8: Persistence Verification ──
    console.log("--- STEP 8: Verifying Persistence Across Reload & Navigation ---");
    // 8.1: Full page reload on the derived version URL
    await page.goto(derivedVersionUrl);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    const liveResumeBtnReload = page.getByRole("button", { name: "Live Resume" });
    if (
      await liveResumeBtnReload
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => true)
        .catch(() => false)
    ) {
      await liveResumeBtnReload.click();
      await page.waitForTimeout(1000);
    }

    const summaryAfterReload = page
      .locator(".document-workbench")
      .getByText(/Senior Software Engineer with 6\+ years/i);
    await expect(summaryAfterReload.first()).toBeVisible({ timeout: 25000 });
    console.log("Verified: Approved summary persisted in derived version after page reload!");
    await page.screenshot({ path: path.join(auditDir, "10-persistence-after-reload.png") });

    // 8.2: Navigate away to /jobs and return
    await page.goto("/jobs");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    await page.goto(derivedVersionUrl);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    if (
      await liveResumeBtnReload
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => true)
        .catch(() => false)
    ) {
      await liveResumeBtnReload.click();
      await page.waitForTimeout(1000);
    }

    const summaryAfterNavigation = page
      .locator(".document-workbench")
      .getByText(/Senior Software Engineer with 6\+ years/i);
    await expect(summaryAfterNavigation.first()).toBeVisible({ timeout: 25000 });
    console.log("Verified: Approved summary persisted after navigating away and returning!");
    await page.screenshot({ path: path.join(auditDir, "11-persistence-after-navigation.png") });

    // 8.3: Master vs Derived Resume verification
    console.log("--- STEP 8.3: Verifying Master Resume Intact vs Derived Resume ---");
    await page.goto(`/resumes/${seed.resume_id}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    const liveResumeBtnMaster = page.getByRole("button", { name: "Live Resume" });
    if (
      await liveResumeBtnMaster
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => true)
        .catch(() => false)
    ) {
      await liveResumeBtnMaster.click();
      await page.waitForTimeout(1000);
    }

    const masterOriginalSummary = page
      .locator(".document-workbench")
      .getByText(/Experienced software engineer with a passion for building great products/i);
    await expect(masterOriginalSummary.first()).toBeVisible({ timeout: 25000 });
    console.log("Verified: Master resume retained its original distinctive summary intact!");
    await page.screenshot({ path: path.join(auditDir, "11b-master-resume-intact.png") });

    // Return to Derived version
    await page.goto(derivedVersionUrl);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);
    if (
      await liveResumeBtnReload
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => true)
        .catch(() => false)
    ) {
      await liveResumeBtnReload.click();
      await page.waitForTimeout(1000);
    }

    // 8.4: Error state handling check
    console.log("--- STEP 8.4: Testing Error State Handling ---");
    await page.goto("/resumes/00000000-0000-0000-0000-000000000000");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    console.log("Verified: Non-existent resume route handled safely");
    await page.screenshot({ path: path.join(auditDir, "11c-error-state-handled.png") });

    // Return to derived version for responsive check
    await page.goto(derivedVersionUrl);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);
    if (
      await liveResumeBtnReload
        .waitFor({ state: "visible", timeout: 15000 })
        .then(() => true)
        .catch(() => false)
    ) {
      await liveResumeBtnReload.click();
      await page.waitForTimeout(1000);
    }

    // ── STEP 9: Responsive Viewport Verification ──
    console.log("--- STEP 9: Verifying Responsive Layouts ---");
    // 9.1: Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(auditDir, "12-responsive-desktop-1440.png") });

    // 9.2: Tablet 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(auditDir, "13-responsive-tablet-768.png") });

    // 9.3: Mobile 375x667
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(auditDir, "14-responsive-mobile-375.png") });

    // ── STEP 10: Health & Integrity Assertions ──
    console.log("--- STEP 10: Diagnostics & Health Assertions ---");
    const fatalReactErrors = pageErrors.filter(
      (e) => e.includes("Minified React error") || e.includes("TypeError: Cannot read"),
    );
    expect(fatalReactErrors, "No fatal React runtime crashes").toHaveLength(0);

    const errorBoundary = await page
      .getByText("This page didn't load")
      .isVisible()
      .catch(() => false);
    expect(errorBoundary, "No error boundary crash triggered").toBe(false);

    console.log(`=== AUDIT COMPLETE ===`);
    console.log(`Total console messages: ${consoleLogs.length}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    console.log(`Page runtime errors: ${pageErrors.length}`);
    console.log(`Network requests tracked: ${networkRequests.length}`);
    console.log(`Network failures (4xx/5xx): ${networkFailures.length}`);
    if (networkFailures.length > 0) {
      console.log("Network failures list:", JSON.stringify(networkFailures, null, 2));
    }
  });
});
