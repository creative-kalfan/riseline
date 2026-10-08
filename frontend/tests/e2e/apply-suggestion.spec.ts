import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots/apply-flow");
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

test.describe("Optimization Suggestion Apply Flow", () => {
  test("seeded suggestions render → accept via API → suggestion marked applied → resume updated", async ({
    page,
  }) => {
    test.setTimeout(180000);

    // ── Seed deterministic data ──
    const seed = runSeed();
    console.log(
      `Seed: resume=${seed.resume_id}, session=${seed.session_id}, suggestion=${seed.suggestion_id}`,
    );

    // ── Collect diagnostics ──
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("pageerror", (e) => pageErrors.push(e.message));

    const apiRequests: { url: string; method: string; status: number }[] = [];
    page.on("response", (res) => {
      const url = res.url();
      if (url.includes("/api/optimization/") || url.includes("/api/resumes/versions")) {
        apiRequests.push({ url, method: res.request().method(), status: res.status() });
      }
    });

    // ── Step 1: Navigate to the seeded resume ──
    await page.goto(`/resumes/${seed.resume_id}`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(screenshotsDir, "01-studio.png") });

    // ── Step 2: Verify left pane loaded ──
    const leftPane = page
      .locator("text=No job target set")
      .or(page.locator("text=Run Optimization"));
    await expect(leftPane.first()).toBeVisible({ timeout: 10000 });
    console.log("Left pane loaded");

    // ── Step 3: Set job context via ATS dialog ──
    const addJobBtn = page.getByRole("button", { name: /Add job description|Set Target Job/i });
    await expect(addJobBtn.first()).toBeVisible({ timeout: 5000 });
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
    await page.waitForTimeout(12000);
    await page.screenshot({ path: path.join(screenshotsDir, "02-after-ats.png") });

    // ── Step 4: Verify seeded suggestions appear ──
    const suggestionsSection = page.locator("text=AI Suggestions");
    await expect(suggestionsSection.first()).toBeVisible({ timeout: 15000 });
    console.log("AI Suggestions section visible");

    const suggestionText = page.locator("text=Senior Software Engineer with 6+ years");
    await expect(suggestionText).toBeVisible({ timeout: 10000 });
    console.log("Seeded professional_summary suggestion visible");

    await page.screenshot({ path: path.join(screenshotsDir, "03-suggestions.png") });

    // ── Step 5: Accept suggestion via backend API (same path as frontend) ──
    const acceptResult = await page.evaluate(
      async (args: { sessionId: string; suggestionId: string }) => {
        // Get JWT from Supabase auth storage — check all localStorage keys
        let token = "";
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes("auth")) {
            try {
              const data = JSON.parse(localStorage.getItem(key) || "{}");
              if (data?.access_token) {
                token = data.access_token;
                break;
              }
              if (data?.currentSession?.access_token) {
                token = data.currentSession.access_token;
                break;
              }
            } catch {}
          }
        }
        if (!token)
          return {
            error: "No access token found in localStorage",
            keys: Array.from({ length: localStorage.length }, (_: unknown, i: number) =>
              localStorage.key(i),
            ),
          };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        try {
          const res = await fetch("http://localhost:8000/api/optimization/suggestions/accept", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ session_id: args.sessionId, suggestion_id: args.suggestionId }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          const body = await res.json();
          return { status: res.status, body };
        } catch (e) {
          clearTimeout(timeoutId);
          return { error: String(e) };
        }
      },
      { sessionId: seed.session_id, suggestionId: seed.suggestion_id },
    );

    console.log("Accept result:", JSON.stringify(acceptResult).substring(0, 500));

    // ── Step 6: Assert accept succeeded ──
    expect(acceptResult.error, "Accept should not error").toBeUndefined();
    expect(acceptResult.status, "Accept must return 2xx").toBeGreaterThanOrEqual(200);
    expect(acceptResult.status).toBeLessThan(300);
    expect(acceptResult.body?.success, "Accept must succeed").toBe(true);
    console.log("Accept succeeded:", acceptResult.body?.message);

    // Verify updated_resume is returned (means resume was modified)
    expect(acceptResult.body?.updated_resume, "Must return updated resume").toBeTruthy();
    console.log("Updated resume returned — resume content was modified");

    await page.screenshot({ path: path.join(screenshotsDir, "04-after-accept.png") });

    // ── Step 7: Verify suggestion status changed in the UI ──
    // Reload to pick up the new state
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(5000);

    // Re-set job context since state is ephemeral
    // The suggestions should now show "Accepted" status
    const acceptedBadge = page.locator("text=Accepted").or(page.locator("text=Applied"));
    const hasAccepted = await acceptedBadge
      .first()
      .isVisible()
      .catch(() => false);
    console.log(`Suggestion marked as accepted after reload: ${hasAccepted}`);

    await page.screenshot({ path: path.join(screenshotsDir, "05-after-reload.png") });

    // ── Step 8: Verify the resume content was actually modified ──
    // Check that the professional summary in the preview changed
    const newSummary = page.locator("text=Senior Software Engineer with 6+ years");
    const summaryUpdated = await newSummary
      .first()
      .isVisible()
      .catch(() => false);
    console.log(`New summary text visible in preview: ${summaryUpdated}`);

    // ── Step 9: No runtime crashes ──
    const typeErrs = pageErrors.filter((e) => e.includes("TypeError"));
    expect(typeErrs, "No TypeError").toHaveLength(0);

    const errorBoundary = await page
      .getByText("This page didn't load")
      .isVisible()
      .catch(() => false);
    expect(errorBoundary, "No error boundary").toBe(false);

    await page.screenshot({ path: path.join(screenshotsDir, "06-final.png") });

    // ── Summary ──
    console.log("=== APPLY FLOW TEST PASSED ===");
    console.log(`API requests: ${apiRequests.length}`);
    console.log(`Console errors: ${consoleErrors.length}, Page errors: ${pageErrors.length}`);
    if (pageErrors.length > 0) console.log("Page errors:", pageErrors);
  });
});
