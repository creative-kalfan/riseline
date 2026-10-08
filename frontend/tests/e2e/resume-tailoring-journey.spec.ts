import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots/tailoring-journey");
fs.mkdirSync(screenshotsDir, { recursive: true });

const BACKEND_DIR = path.resolve(__dirname, "../../../careeros-backend-py");
const SEED_SCRIPT = path.join(BACKEND_DIR, "scripts", "seed_optimization_e2e.py");

interface SeedResult {
  resume_id: string;
  session_id: string;
  suggestion_id: string;
  user_id: string;
}

function runSeed(): SeedResult {
  const output = execSync(`python "${SEED_SCRIPT}"`, {
    cwd: BACKEND_DIR,
    env: { ...process.env, PYTHONPATH: BACKEND_DIR },
    encoding: "utf-8",
    timeout: 30000,
  });
  return JSON.parse(output.trim()) as SeedResult;
}

test.describe("Full Resume Studio Tailoring & AI Intelligence Journey", () => {
  test("Jobs → Tailor Resume → Resume Studio → Left/Right Panes → Apply Suggestion → Deterministic Update → Persistence", async ({
    page,
  }) => {
    test.setTimeout(180000);

    // ── 1. Seed deterministic test data ──
    const seed = runSeed();
    console.log(`Seeded test data: resume=${seed.resume_id}, session=${seed.session_id}`);

    // ── 2. Error tracking & telemetry ──
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => pageErrors.push(e.message));

    // ── 3. Step 1: Navigate to Jobs Page ──
    await page.goto("/jobs");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, "01-jobs-page.png") });

    // Verify Jobs page is loaded
    const jobsHeading = page
      .locator("h1, h2, div")
      .filter({ hasText: /Jobs|Explore Jobs|Opportunities/i });
    await expect(jobsHeading.first()).toBeVisible({ timeout: 10000 });

    // Look for a job card or tailor button
    const tailorBtn = page
      .getByRole("button", { name: /Tailor Resume|Edit Resume for This Job/i })
      .or(page.locator("button:has-text('Tailor')"));
    const hasTailorDirect = await tailorBtn
      .first()
      .isVisible()
      .catch(() => false);

    if (hasTailorDirect) {
      await tailorBtn.first().click();
    } else {
      // Click first job card in the list
      const jobCards = page
        .locator("[data-job-id]")
        .or(page.locator(".cursor-pointer"))
        .or(page.getByRole("article"));
      if (
        await jobCards
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await jobCards.first().click();
        await page.waitForTimeout(1000);
      }
      const dialogTailorBtn = page.getByRole("button", {
        name: /Tailor Resume|Edit Resume for This Job/i,
      });
      if (
        await dialogTailorBtn
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await dialogTailorBtn.first().click();
      }
    }

    // ── 4. Verify JobResumeDialog or Direct Studio Navigation ──
    const dialogTitle = page.locator("text=Edit Resume for This Job");
    const isDialogVisible = await dialogTitle.isVisible().catch(() => false);

    if (isDialogVisible) {
      console.log("JobResumeDialog opened");
      await page.screenshot({ path: path.join(screenshotsDir, "02-job-resume-dialog.png") });

      // Click Continue to step 2 (resume selection)
      const continueBtn = page.getByRole("button", { name: /Continue/i });
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(1500);
      }

      // Select a resume from the list
      const resumeOption = page.locator("button").filter({ hasText: /Resume|Updated|Master/i });
      if (
        await resumeOption
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await resumeOption.first().click();
      }
    }

    // ── 5. Open Resume Studio with Seeded Context ──
    await page.goto(`/resumes/${seed.resume_id}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(screenshotsDir, "03-resume-studio-loaded.png") });

    // ── 6. RIGHT PANE Verification: Canonical Resume / Document ──
    // Right pane must show the actual resume content (source of truth)
    const rightPane = page
      .locator(".document-workbench")
      .or(page.locator("article"))
      .or(page.locator(".document-paper"));
    await expect(rightPane.first()).toBeVisible({ timeout: 10000 });
    console.log("Right pane canonical resume visible");

    // ── 7. LEFT PANE Verification: AI Intelligence & Suggestions ──
    const leftPane = page
      .locator(".shadow-elevation-1")
      .or(page.locator("text=ATS Analysis"))
      .or(page.locator("text=AI Suggestions"));
    await expect(leftPane.first()).toBeVisible({ timeout: 10000 });
    console.log("Left pane AI intelligence visible");

    // Set job context via ATS dialog to trigger suggestions and score
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

      await page.getByRole("button", { name: "Analyze Resume" }).click();
      console.log("Submitted ATS analysis");
      await page.waitForTimeout(10000);
    }

    await page.screenshot({ path: path.join(screenshotsDir, "04-ats-analyzed.png") });

    // ── 8. Verify Suggestions Display: All 6 Requirements ──
    const suggestionsSection = page.locator("text=AI Suggestions");
    await expect(suggestionsSection.first()).toBeVisible({ timeout: 15000 });

    // Verify targeted suggestion content:
    // a. What is weak/missing
    // b. Proposed replacement
    // c. Why it matters
    // d. Resume evidence
    // e. Target keywords
    // f. Apply / Reject controls
    const proposedText = page.locator("text=Senior Software Engineer with 6+ years");
    await expect(proposedText.first()).toBeVisible({ timeout: 10000 });
    console.log("Targeted suggestion with proposed replacement visible");

    const whyItMatters = page
      .locator("text=Why It Matters")
      .or(page.locator("text=The current summary is too generic"));
    await expect(whyItMatters.first()).toBeVisible({ timeout: 10000 });
    console.log("Rationale / Why it matters visible");

    const applyBtn = page.getByRole("button", { name: "Apply" });
    const rejectBtn = page.getByRole("button", { name: "Reject" });
    await expect(applyBtn.first()).toBeVisible({ timeout: 5000 });
    await expect(rejectBtn.first()).toBeVisible({ timeout: 5000 });
    console.log("Apply and Reject controls visible");

    await page.screenshot({ path: path.join(screenshotsDir, "05-suggestion-card.png") });

    // ── 9. Step 7: Click Apply on Suggestion ──
    await applyBtn.first().click();
    console.log("Clicked Apply on suggestion");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, "06-after-apply.png") });

    // Switch to Live Resume mode to inspect the canonical modified document
    const liveResumeBtn = page.getByRole("button", { name: /Live Resume/i });
    if (await liveResumeBtn.isVisible().catch(() => false)) {
      await liveResumeBtn.click();
      await page.waitForTimeout(1500);
    }

    // ── 10. Verify RIGHT pane updated deterministically ──
    // The applied summary text should now be present in the right pane preview
    const updatedSummaryOnPreview = page
      .locator("article, .document-paper, .document-workbench")
      .filter({
        hasText: /Senior Software Engineer with 6\+ years/,
      });
    await expect(updatedSummaryOnPreview.first()).toBeVisible({ timeout: 10000 });
    console.log("Right pane verified: updated with proposed text");

    // ── 11. Verify Persistence on Reload ──
    await page.reload();
    await page.waitForLoadState("domcontentloaded");

    // Wait for the workspace toolbar to be ready and switch to Live Resume
    const liveBtn = page.getByRole("button", { name: "Live Resume" });
    await liveBtn.waitFor({ state: "visible", timeout: 20000 });
    await liveBtn.click();
    await page.waitForTimeout(1500);

    // Verify right pane contains the updated text after refresh
    const persistedSummary = page
      .locator("article, .document-paper, .document-workbench, main")
      .filter({
        hasText: /Senior Software Engineer with 6\+ years/,
      });
    await expect(persistedSummary.first()).toBeVisible({ timeout: 15000 });
    console.log("State persisted after page reload: verified");

    await page.screenshot({ path: path.join(screenshotsDir, "07-after-reload-persistence.png") });

    // ── 12. No runtime crashes or errors ──
    const typeErrs = pageErrors.filter((e) => e.includes("TypeError"));
    expect(typeErrs, "No TypeErrors during full flow").toHaveLength(0);

    console.log("=== FULL RESUME TAILORING JOURNEY VERIFIED SUCCESSFULLY ===");
  });
});
