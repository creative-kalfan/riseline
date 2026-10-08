import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots/apply-tailoring");
fs.mkdirSync(screenshotsDir, { recursive: true });

const BACKEND_DIR = path.resolve(__dirname, "../../../careeros-backend-py");
const SEED_SCRIPT = path.join(BACKEND_DIR, "scripts", "seed_real_resume_copy.py");

function runSeed(): { resume_id: string; master_version_id: string; user_id: string } {
  const output = execSync(`python "${SEED_SCRIPT}"`, {
    cwd: BACKEND_DIR,
    env: { ...process.env, PYTHONPATH: BACKEND_DIR },
    encoding: "utf-8",
    timeout: 30000,
  });
  return JSON.parse(output.trim());
}

const JOB_TITLE = "Finance Associate - Client Accounting";
const COMPANY = "ZS Associates";
const JOB_DESCRIPTION = `ZS Associates - Finance Associate - Client Accounting

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

test("apply-tailoring persists a real tailored version in the live Resume Studio", async ({ page }) => {
  test.setTimeout(180000);

  const seed = runSeed();
  console.log(`Seeded repro resume: ${seed.resume_id}`);

  const studioUrl = `/resumes/${seed.resume_id}?jobTitle=${encodeURIComponent(
    JOB_TITLE
  )}&company=${encodeURIComponent(COMPANY)}&jobDescription=${encodeURIComponent(JOB_DESCRIPTION)}`;
  await page.goto(studioUrl);
  await page.waitForLoadState("domcontentloaded");

  // LeftPane detects the target job context and runs tailoring
  await expect(page.locator(`text=${JOB_TITLE}`).first()).toBeVisible({ timeout: 20000 });

  // Transferable-skills plan output (preview works)
  await expect(
    page.locator("text=Elevated 2 verified transferable skills to the front of technical skills section.")
  ).toBeVisible({ timeout: 90000 });
  await expect(
    page.locator("text=Reframed summary highlighting transferable competencies")
  ).toBeVisible({ timeout: 30000 });
  console.log("Transferable preview verified (plan items visible)");

  // Auto-apply: compilation indicator must clear and a real tailored version must appear
  const compiling = page.locator("text=Compiling executive artifact…");
  await expect(compiling).toBeVisible({ timeout: 60000 }).catch(() => {});
  await expect(compiling).not.toBeVisible({ timeout: 90000 });

  // A new version item containing the job title must exist in the version list
  const versionItems = page.locator(".truncate.text-\\[13px\\]");
  const count = await versionItems.count();
  let found = false;
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = await versionItems.nth(i).innerText();
    names.push(t.trim());
    if (t.includes("Finance Associate")) found = true;
  }
  console.log("Version list:", JSON.stringify(names));
  expect(found, `Expected a saved tailored version. Got: ${JSON.stringify(names)}`).toBe(true);

  // Success toast from handleApplyTailoring
  await expect(
    page.locator("text=Tailored resume compiled and new version created!")
  ).toBeVisible({ timeout: 15000 }).catch(() => {});

  await page.waitForTimeout(2500);
  const shot = path.join(screenshotsDir, "apply-tailoring-saved-version.png");
  await page.screenshot({ path: shot, fullPage: false });
  console.log(`Saved screenshot: ${shot}`);
  expect(fs.existsSync(shot)).toBe(true);
});