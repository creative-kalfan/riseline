import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots/prod-repro");
fs.mkdirSync(screenshotsDir, { recursive: true });

const RESUME_ID = "8194099d-a36e-4b5c-9900-f0ecf30c0e03";

const TARGET_JOB = {
  title: "Incident Manager / NOC Analyst",
  company: "DMX Technologies",
  description: `Role: Incident Manager / NOC Analyst
Responsibilities:
- Manage live production incidents and drive cross-functional triage.
- Execute SOPs, monitor system alerts, and ensure SLAs.
- Comfortable working in 24x7 operational environments with Python automation.
- Coordinate with application reliability engineers and infrastructure teams.
Requirements:
- Strong incident management and troubleshooting experience.
- Experience with JIRA, monitoring tools, and service reliability.`
};

test("Reproduce production Resume Studio flow", async ({ page }) => {
  test.setTimeout(240000);

  const consoleLogs: string[] = [];
  const networkLogs: { method: string; url: string; status: number; requestBody?: string; responseBody?: string }[] = [];

  page.on("console", (msg) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/")) {
      networkLogs.push({
        method: req.method(),
        url,
        status: 0,
        requestBody: req.postData() || undefined,
      });
    }
  });

  page.on("response", async (res) => {
    const url = res.url();
    if (url.includes("/api/")) {
      const entry = networkLogs.find((l) => l.url === url && l.status === 0);
      if (entry) {
        entry.status = res.status();
        try {
          const text = await res.text();
          entry.responseBody = text.substring(0, 1000);
        } catch {
          entry.responseBody = "<failed to read response>";
        }
        console.log(`[API RESPONSE] ${entry.method} ${url} -> ${entry.status}: ${entry.responseBody?.substring(0, 300)}`);
      }
    }
  });

  console.log(`1. Navigating to /resumes/${RESUME_ID}`);
  await page.goto(`/resumes/${RESUME_ID}`);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(screenshotsDir, "01-initial-load.png"), fullPage: true });

  // Verify candidate name in preview
  const candidateName = page.locator("text=Pathan Mohammad Kalfan");
  const isNameVisible = await candidateName.first().isVisible({ timeout: 10000 }).catch(() => false);
  console.log(`Candidate name visible: ${isNameVisible}`);

  // Check whether canvas preview or HTML preview is active
  const pdfCanvas = page.locator("canvas");
  const canvasCount = await pdfCanvas.count();
  console.log(`Canvas count: ${canvasCount}`);

  // Check if job context is already present or if we need to add it
  const hasJob = await page.locator(`text=${TARGET_JOB.title}`).first().isVisible({ timeout: 3000 }).catch(() => false);
  if (!hasJob) {
    console.log("Setting job context via URL query params...");
    const urlWithJob = `/resumes/${RESUME_ID}?jobTitle=${encodeURIComponent(TARGET_JOB.title)}&company=${encodeURIComponent(TARGET_JOB.company)}&jobDescription=${encodeURIComponent(TARGET_JOB.description)}`;
    console.log(`Navigating with params: ${urlWithJob}`);
    await page.goto(urlWithJob);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);
  }

  await page.screenshot({ path: path.join(screenshotsDir, "02-with-job-context.png"), fullPage: true });

  // Look for Run Optimization button if suggestions are not present
  const runOptBtn = page.getByRole("button", { name: /Run Optimization|Generate Suggestions/i });
  if (await runOptBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log("Clicking Run Optimization button...");
    await runOptBtn.first().click();
    console.log("Waiting for suggestions to generate...");
    await page.waitForTimeout(25000);
  }

  await page.screenshot({ path: path.join(screenshotsDir, "03-after-run-opt.png"), fullPage: true });

  // Check for suggestions in LeftPane
  const replaceSummaryBtn = page.getByRole("button", { name: "Replace Summary" });
  const isReplaceSummaryVisible = await replaceSummaryBtn.first().isVisible({ timeout: 10000 }).catch(() => false);
  console.log(`Replace Summary button visible: ${isReplaceSummaryVisible}`);

  if (isReplaceSummaryVisible) {
    console.log("Clicking 'Replace Summary' button...");
    await replaceSummaryBtn.first().click();
    console.log("Clicked 'Replace Summary'. Waiting for reaction...");
    await page.waitForTimeout(8000);
  } else {
    // Check if there are other suggestion buttons
    const anyApplyBtn = page.getByRole("button", { name: /Replace Bullet|Add to Skills|Apply/i });
    const applyCount = await anyApplyBtn.count();
    console.log(`Other apply buttons count: ${applyCount}`);
    if (applyCount > 0) {
      const firstLabel = await anyApplyBtn.first().innerText();
      console.log(`Clicking first apply button: '${firstLabel}'...`);
      await anyApplyBtn.first().click();
      await page.waitForTimeout(8000);
    }
  }

  await page.screenshot({ path: path.join(screenshotsDir, "04-after-click.png"), fullPage: true });

  // Check toasts
  const toastLoc = page.locator("[data-sonner-toast], [role=status], [role=alert], .toast, [data-toast]");
  const toastCount = await toastLoc.count();
  for (let i = 0; i < toastCount; i++) {
    const text = await toastLoc.nth(i).innerText();
    console.log(`[TOAST ${i}] ${text}`);
  }

  // Dump network logs
  fs.writeFileSync(
    path.join(screenshotsDir, "network-logs.json"),
    JSON.stringify(networkLogs, null, 2),
    "utf-8"
  );
  fs.writeFileSync(
    path.join(screenshotsDir, "console-logs.txt"),
    consoleLogs.join("\n"),
    "utf-8"
  );
});
