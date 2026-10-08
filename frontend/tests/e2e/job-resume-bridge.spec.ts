import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots/job-resume-bridge");
fs.mkdirSync(screenshotsDir, { recursive: true });

test.describe("Job → Resume Studio Bridge Real E2E Verification", () => {
  test("create job-specific resume version from real job and load in Studio", async ({ page }) => {
    test.setTimeout(120000);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    let versionCreationRequest: any = null;
    let versionCreationResponse: any = null;

    page.on("console", (m) => {
      if (m.type() === "error") {
        console.log(`[Browser console error] ${m.text()}`);
        consoleErrors.push(m.text());
      }
    });

    page.on("pageerror", (e) => {
      console.log(`[Browser pageerror] ${e.message}`);
      pageErrors.push(e.message);
    });

    // Monitor /api/resumes/*/versions POST
    page.on("request", (req) => {
      if (req.url().includes("/versions") && req.method() === "POST") {
        try {
          versionCreationRequest = {
            url: req.url(),
            method: req.method(),
            postData: req.postDataJSON(),
          };
          console.log("[E2E Version Request]", JSON.stringify(versionCreationRequest));
        } catch {}
      }
    });

    page.on("response", async (res) => {
      if (res.url().includes("/versions") && res.request().method() === "POST") {
        try {
          const body = await res.json();
          versionCreationResponse = {
            status: res.status(),
            body,
          };
          console.log("[E2E Version Response]", res.status(), JSON.stringify(body));
        } catch {}
      }
    });

    async function waitForWorkspace() {
      const spinner = page.locator("text=Loading CareerOS workspace");
      if (await spinner.isVisible().catch(() => false)) {
        await spinner.waitFor({ state: "detached", timeout: 20000 });
      }
    }

    // 1. Open /jobs
    console.log("Navigating to /jobs...");
    await page.goto("/jobs");
    await waitForWorkspace();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotsDir, "01-jobs-loaded.png") });

    // 2. Select a real job
    const opportunitiesHeader = page.locator("text=/\\d+ opportunities/i");
    await expect(opportunitiesHeader.first()).toBeVisible({ timeout: 20000 });

    const jobListCards = page.locator(".space-y-1\\.5 > div, [data-job-id]").filter({
      hasText:
        /Stripe|Notion|Engineer|Architect|Manager|Representative|Director|Developer|coupa|Eurofins/i,
    });
    await expect(jobListCards.first()).toBeVisible({ timeout: 15000 });
    const jobCount = await jobListCards.count();
    expect(jobCount, "Must have at least one job in list").toBeGreaterThan(0);

    const firstJob = jobListCards.first();
    await firstJob.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, "02-job-selected.png") });

    // 3. Click "Tailor Resume"
    const tailorResumeBtn = page.getByRole("button", { name: /Tailor Resume/i });
    await expect(tailorResumeBtn.first()).toBeVisible({ timeout: 10000 });
    await tailorResumeBtn.first().click();
    await page.waitForTimeout(1000);

    // 4. JobResumeDialog opens
    const dialog = page.locator("[role='dialog']");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(screenshotsDir, "03-tailor-dialog-jd.png") });

    // 5. Continue past JD
    const continueBtn = dialog.getByRole("button", { name: /Continue/i });
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }

    // 6. Select an existing resume
    const resumeOptions = dialog.locator("button.flex.w-full");
    await expect(resumeOptions.first()).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(screenshotsDir, "04-dialog-resume-selection.png") });

    console.log("Clicking resume option to trigger job-specific version creation...");
    await resumeOptions.first().click();

    // 7. Wait for navigation to /resumes/{id}?versionId={version_id}
    await page.waitForURL(
      (url) => url.pathname.includes("/resumes/") && url.searchParams.has("versionId"),
      {
        timeout: 20000,
      },
    );
    await waitForWorkspace();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    const studioUrl = page.url();
    console.log(`Navigated to Studio URL: ${studioUrl}`);
    await page.screenshot({ path: path.join(screenshotsDir, "05-studio-loaded-with-version.png") });

    // 8. Assertions
    expect(versionCreationRequest).not.toBeNull();
    expect(versionCreationRequest.postData.source).toBe("job_specific");

    expect(versionCreationResponse).not.toBeNull();
    expect(versionCreationResponse.status).toBe(200);
    expect(versionCreationResponse.body.success).toBe(true);

    const createdVersion = versionCreationResponse.body.data;
    expect(createdVersion.id).toBeTruthy();
    expect(createdVersion.source).toBe("job_specific");
    expect(createdVersion.target_job_title).toBeTruthy();

    expect(studioUrl).toContain(`versionId=${createdVersion.id}`);

    // Verify Studio rendered two panes
    const previewPane = page.locator(".document-workbench").first();
    await expect(previewPane).toBeVisible({ timeout: 10000 });

    const leftPane = page.locator(".w-\\[390px\\], .xl\\:w-\\[430px\\]").first();
    await expect(leftPane).toBeVisible({ timeout: 10000 });

    // Assert no Postgres 23514 or check constraint violations occurred
    const hasConstraintError = consoleErrors.some(
      (e) => e.includes("23514") || e.includes("check constraint"),
    );
    expect(hasConstraintError).toBe(false);
    expect(pageErrors.length).toBe(0);

    console.log("=== BRIDGE E2E VERIFICATION PASSED SUCCESSFULLY ===");
  });
});
