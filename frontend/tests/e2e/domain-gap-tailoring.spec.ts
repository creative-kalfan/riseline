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
const SEED_NOC_SCRIPT = path.join(BACKEND_DIR, "scripts", "seed_noc_analyst.py");
const SEED_PASTRY_CHEF_SCRIPT = path.join(BACKEND_DIR, "scripts", "seed_pastry_chef.py");

interface SeedNocResult {
  resume_id: string;
  master_version_id: string;
  user_id: string;
}

function runSeedNoc(): SeedNocResult {
  const output = execSync(`python "${SEED_NOC_SCRIPT}"`, {
    cwd: BACKEND_DIR,
    env: { ...process.env, PYTHONPATH: BACKEND_DIR },
    encoding: "utf-8",
    timeout: 30000,
  });
  return JSON.parse(output.trim()) as SeedNocResult;
}

function runSeedPastryChef(): SeedNocResult {
  const output = execSync(`python "${SEED_PASTRY_CHEF_SCRIPT}"`, {
    cwd: BACKEND_DIR,
    env: { ...process.env, PYTHONPATH: BACKEND_DIR },
    encoding: "utf-8",
    timeout: 30000,
  });
  return JSON.parse(output.trim()) as SeedNocResult;
}

const ZERO_OVERLAP_JOB_TITLE = "Lead Python Developer";
const ZERO_OVERLAP_COMPANY = "CloudScale Inc";
const ZERO_OVERLAP_JOB_DESCRIPTION = `Lead Python Developer - Cloud Infrastructure

Requirements:
• 5+ years building microservices with Python and FastAPI.
• Deep hands-on experience with PostgreSQL, Docker, and Kubernetes.
• Strong background in distributed systems and cloud architecture.`;

const TARGET_JOB_TITLE = "Finance Associate - Client Accounting";
const TARGET_COMPANY = "ZS Associates";
const TARGET_JOB_DESCRIPTION = `ZS Associates - Finance Associate - Client Accounting

What You'll Do:
• Execute billing and client invoicing operations in SAP ERP.
• Perform monthly account reconciliation and contract-to-cash workflows.
• Maintain strict SOP adherence and comprehensive audit trail & documentation for all financial transactions.
• Prepare weekly operational reporting & metrics on billing status and revenue recognition.
• Drive cross-functional collaboration with client teams and corporate accounting.

What You'll Bring:
• Bachelor's degree in Finance, Accounting, or related field.
• Proficiency in SAP ERP and Microsoft Excel.
• Commitment to process compliance & governance and operational discipline.`;

test.describe("Domain-Gap Tailoring: NOC Analyst to ZS Associates Finance Associate", () => {
  test("Autonomous tailoring reframes summary, elevates transferable skills, prevents fabrication, and updates preview", async ({
    page,
  }) => {
    test.setTimeout(120000);

    // ── 1. Seed deterministic NOC Analyst resume ──
    const seed = runSeedNoc();
    console.log(`Seeded NOC Analyst resume: id=${seed.resume_id}, user=${seed.user_id}`);
    expect(seed.resume_id).toBeTruthy();

    // ── 2. Error tracking & telemetry ──
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => pageErrors.push(e.message));

    // ── 3. Navigate to Resume Studio with Job Context ──
    const studioUrl = `/resumes/${seed.resume_id}?jobTitle=${encodeURIComponent(
      TARGET_JOB_TITLE
    )}&company=${encodeURIComponent(TARGET_COMPANY)}&jobDescription=${encodeURIComponent(
      TARGET_JOB_DESCRIPTION
    )}`;
    
    console.log(`Navigating to Resume Studio: ${studioUrl}`);
    await page.goto(studioUrl);
    await page.waitForLoadState("domcontentloaded");

    // ── 4. Verify LeftPane detects Target Job Context ──
    const targetHeader = page.locator("text=Finance Associate - Client Accounting");
    await expect(targetHeader.first()).toBeVisible({ timeout: 15000 });

    const companyHeader = page.locator("text=ZS Associates");
    await expect(companyHeader.first()).toBeVisible({ timeout: 10000 });

    // ── 5. Verify Executive Diagnostic Audit and Autonomous Tailoring Execution ──
    const auditTitle = page.locator("text=Executive Diagnostic Audit");
    await expect(auditTitle.first()).toBeVisible({ timeout: 10000 });

    // Wait for the tailoring and compilation pass to complete
    const verifiedBadge = page.locator("text=Verified Candidate Facts Only");
    await expect(verifiedBadge.first()).toBeVisible({ timeout: 60000 });
    console.log("Tailoring completed successfully: 'Verified Candidate Facts Only' badge visible");

    // Wait for compile & version application to finish
    const compilingIndicator = page.locator("text=Compiling executive artifact…");
    await expect(compilingIndicator).not.toBeVisible({ timeout: 45000 });
    console.log("Compilation finished, tailored version applied to PreviewPane");

    // ── 6. Verify LeftPane: Tailoring Plan, ATS Score Badges, Keyword Metrics ──
    const projectedScoreLabel = page.locator("text=Projected ATS Score");
    await expect(projectedScoreLabel.first()).toBeVisible({ timeout: 10000 });

    const tailoringAudit = page.locator("text=Tailoring Audit");
    await expect(tailoringAudit.first()).toBeVisible({ timeout: 10000 });

    // Verify tailoring plan items describe domain-gap bridging
    const skillsPlan = page.locator("text=Elevated 2 verified transferable skills to the front of technical skills section.");
    await expect(skillsPlan.first()).toBeVisible({ timeout: 10000 });

    const summaryPlan = page.locator("text=Reframed summary highlighting transferable competencies");
    await expect(summaryPlan.first()).toBeVisible({ timeout: 10000 });

    // ── 7. Verify RightPane / PreviewPane Document & Tailoring Plan ──
    // The tailored summary reframing is present in the plan card and document stage
    const tailoredSummaryCard = page.locator("text=Operations professional with 4 years of experience");
    await expect(tailoredSummaryCard.first()).toBeVisible({ timeout: 15000 });

    const tailoredSummaryText = await tailoredSummaryCard.first().innerText();
    console.log(`Tailored Summary Verified:\n${tailoredSummaryText}`);

    // Requirement 1: Summary is reframed into a coherent sentence with transferable competencies
    const hasTransferableSummary =
      /Operations professional with 4 years of experience/i.test(tailoredSummaryText) &&
      /SOP-driven process execution/i.test(tailoredSummaryText) &&
      /cross-functional coordination/i.test(tailoredSummaryText);
    expect(
      hasTransferableSummary,
      `Summary must be reframed highlighting transferable competencies. Got: ${tailoredSummaryText}`
    ).toBe(true);

    // Requirement 2: Skills section surfaces overlapping transferable skills
    // In LeftPane plan: keywords addressed contain SOP Adherence and Process Documentation
    const sopChip = page.locator(".space-y-2").locator("text=SOP Adherence");
    await expect(sopChip.first()).toBeVisible({ timeout: 10000 });

    const processDocChip = page.locator(".space-y-2").locator("text=Process Documentation");
    await expect(processDocChip.first()).toBeVisible({ timeout: 10000 });

    // In RightPane PDF Stage: matched evidence buttons appear for transferable competencies
    const sopEvidence = page.getByRole("button", { name: /Matched evidence for SOP Adherence/i })
      .or(page.locator('[aria-label*="Matched evidence for SOP Adherence"]'));
    await expect(sopEvidence.first()).toBeVisible({ timeout: 10000 });

    const crossCollabEvidence = page.getByRole("button", { name: /Matched evidence for Cross-Functional Collaboration/i })
      .or(page.locator('[aria-label*="Matched evidence for Cross-Functional Collaboration"]'));
    await expect(crossCollabEvidence.first()).toBeVisible({ timeout: 10000 });

    const opReportingEvidence = page.getByRole("button", { name: /Matched evidence for Operational Reporting & Metrics/i })
      .or(page.locator('[aria-label*="Matched evidence for Operational Reporting & Metrics"]'));
    await expect(opReportingEvidence.first()).toBeVisible({ timeout: 10000 });

    console.log("Verified transferable skills surfaced in both plan and PDF interactive evidence");

    // Requirement 3: Strictly ZERO fabrication
    // Verify no fake SAP, ASC 606, or Financial Modeling are claimed as candidate skills
    // Candidate skills list / plan should never list SAP, ASC 606, or Financial Modeling as candidate's own skills
    // (They may only appear in ATS missing requirements list under "No evidence found")
    const planKeywords = await page.locator(".space-y-2").first().innerText();
    expect(planKeywords).not.toContain("SAP");
    expect(planKeywords).not.toContain("ASC 606");
    expect(planKeywords).not.toContain("Financial Modeling");

    // Verify candidate's tailored summary does not claim SAP or ASC 606
    expect(tailoredSummaryText).not.toContain("SAP");
    expect(tailoredSummaryText).not.toContain("ASC 606");
    expect(tailoredSummaryText).not.toContain("Financial Modeling");

    // ── 8. Capture Full Screenshots ──
    const successScreenshotPath = path.join(
      screenshotsDir,
      "domain-gap-tailoring-success.png"
    );

    // Give render a moment to settle
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: successScreenshotPath,
      fullPage: false,
    });
    console.log(`Saved primary screenshot: ${successScreenshotPath}`);

    // Verify screenshot file was generated on disk
    expect(fs.existsSync(successScreenshotPath)).toBe(true);
    const stats = fs.statSync(successScreenshotPath);
    expect(stats.size).toBeGreaterThan(10000);

    // ── 9. Verify No Runtime Errors ──
    const typeErrs = pageErrors.filter((e) => e.includes("TypeError"));
    expect(typeErrs, "No TypeErrors during domain-gap tailoring").toHaveLength(0);

    console.log("=== DOMAIN-GAP TAILORING E2E VERIFIED SUCCESSFULLY ===");
  });

  test("Genuine zero-overlap (Pastry Chef targeting Lead Python Developer) displays role fit advisory and prevents auto-creating tailored version", async ({
    page,
  }) => {
    test.setTimeout(120000);

    // ── 1. Seed deterministic Pastry Chef resume ──
    const seed = runSeedPastryChef();
    console.log(`Seeded Pastry Chef resume: id=${seed.resume_id}, user=${seed.user_id}`);
    expect(seed.resume_id).toBeTruthy();

    // ── 2. Error tracking & telemetry ──
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => pageErrors.push(e.message));

    // ── 3. Navigate to Resume Studio with Zero-Overlap Job Context ──
    const studioUrl = `/resumes/${seed.resume_id}?jobTitle=${encodeURIComponent(
      ZERO_OVERLAP_JOB_TITLE
    )}&company=${encodeURIComponent(ZERO_OVERLAP_COMPANY)}&jobDescription=${encodeURIComponent(
      ZERO_OVERLAP_JOB_DESCRIPTION
    )}`;

    console.log(`Navigating to Resume Studio with zero-overlap context: ${studioUrl}`);
    await page.goto(studioUrl);
    await page.waitForLoadState("domcontentloaded");

    // ── 4. Verify LeftPane detects Target Job Context ──
    const targetHeader = page.locator("text=Lead Python Developer");
    await expect(targetHeader.first()).toBeVisible({ timeout: 15000 });

    // ── 5. Verify limited-alignment-advisory is visible in UI ──
    const advisory = page.locator('[data-testid="limited-alignment-advisory"]');
    await expect(advisory.first()).toBeVisible({ timeout: 60000 });
    await expect(advisory.first()).toContainText(
      "Limited alignment found; consider whether this resume is a strong fit for this role."
    );
    console.log("Verified limited-alignment-advisory is visible in UI");

    // ── 6. Verify No new tailored version is auto-created ──
    await page.waitForTimeout(3000);

    // Compilation indicator never appears
    const compilingIndicator = page.locator("text=Compiling executive artifact…");
    await expect(compilingIndicator).not.toBeVisible();

    // Verify version items in LeftPane do not include tailored versions
    const versionItems = page.locator(".truncate.text-\\[13px\\]");
    const count = await versionItems.count();
    for (let i = 0; i < count; i++) {
      const vText = await versionItems.nth(i).innerText();
      expect(vText).not.toContain("Lead Python Developer");
      expect(vText).not.toContain("Tailored Version");
    }

    // Verify Master Version is the only version shown
    const masterBadge = page.locator("text=Master");
    await expect(masterBadge.first()).toBeVisible({ timeout: 10000 });

    // ── 7. Capture Screenshot ──
    const advisoryScreenshotPath = path.join(
      screenshotsDir,
      "zero-overlap-advisory.png"
    );
    await page.screenshot({
      path: advisoryScreenshotPath,
      fullPage: false,
    });
    console.log(`Saved advisory screenshot: ${advisoryScreenshotPath}`);

    // ── 8. Verify No Runtime Errors ──
    const typeErrs = pageErrors.filter((e) => e.includes("TypeError"));
    expect(typeErrs, "No TypeErrors during zero-overlap advisory").toHaveLength(0);

    console.log("=== ZERO-OVERLAP ROLE FIT ADVISORY E2E VERIFIED SUCCESSFULLY ===");
  });
});
