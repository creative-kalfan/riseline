import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.resolve(__dirname, "../../playwright/screenshots/jobs_redesign");
fs.mkdirSync(screenshotsDir, { recursive: true });

const mockJobsData = {
  success: true,
  data: [
    {
      id: "job-01",
      title: "Staff Infrastructure Engineer",
      company_name: "Stripe",
      location: "San Francisco, CA (Hybrid)",
      employment_type: "Full-time",
      experience_level: "Staff+",
      salary: "$210k - $280k",
      description: `<h2>About the Role</h2><p>At Stripe, infrastructure engineers design and operate the distributed platforms that power global commerce.</p><h3>Key Responsibilities</h3><ul><li>Architect zero-downtime ledger migration systems.</li><li>Scale multi-region Kubernetes clusters.</li></ul>`,
      skills: ["Go", "Kubernetes", "PostgreSQL", "AWS", "Distributed Systems"],
      apply_url: "https://stripe.com/jobs/staff-infra",
      source_platform: "firecrawl_crawler",
      posted_date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      match: {
        overall: 94,
        skill_match: 96,
        experience_match: 92,
        location_match: 100,
        salary_match: 90,
        missing_skills: ["Rust"],
      },
    },
    {
      id: "job-02",
      title: "Senior Full Stack Engineer",
      company_name: "Notion",
      location: "Remote",
      employment_type: "Full-time",
      experience_level: "Senior",
      salary: "$180k - $230k",
      description: `<p>Help build the future of collaborative workspace software.</p>`,
      skills: ["TypeScript", "React", "Node", "PostgreSQL"],
      apply_url: "https://notion.so/careers/fullstack",
      source_platform: "ashby_crawler",
      posted_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      match: {
        overall: 88,
        skill_match: 90,
        experience_match: 85,
        location_match: 100,
        salary_match: 88,
        missing_skills: ["GraphQL"],
      },
    },
  ],
  meta: {
    page: 1,
    pageSize: 20,
    total: 2,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
  },
};

test.describe("Job Intelligence Redesign Verification", () => {
  test("Desktop 2-Zone Workspace, Search, Filters & Detail Tabs", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Intercept backend API requests
    await page.route("**/jobs/personalized*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockJobsData),
      });
    });

    await page.goto("/jobs");
    await page.waitForLoadState("domcontentloaded");

    // 1. Verify 2-zone workspace presence
    await expect(page.getByRole("heading", { name: "Job Intelligence" })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByPlaceholder(/Search opportunities/i)).toBeVisible({
      timeout: 10000,
    });

    // 2. Verify primary filter controls
    await expect(page.getByRole("button", { name: "Remote", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Filters/i })).toBeVisible();

    // 3. Verify opportunity card rendered with provenance & match
    await expect(
      page.getByRole("heading", { name: "Staff Infrastructure Engineer" }).first(),
    ).toBeVisible();
    await expect(page.getByText("94% match").first()).toBeVisible();

    // 4. Verify Action toolbar
    await expect(page.getByRole("button", { name: /Apply on Company Site/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tailor Resume/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();

    // Capture dark mode screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, "desktop_dark_workspace.png"),
      fullPage: false,
    });

    // Toggle to light mode and capture
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(screenshotsDir, "desktop_light_workspace.png"),
      fullPage: false,
    });

    // Toggle back to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    });
    await page.waitForTimeout(300);

    // 5. Test Additional Filters Drawer
    await page.getByRole("button", { name: /Filters/i }).click();
    await page.waitForTimeout(400);
    await expect(page.getByRole("heading", { name: "Additional Filters" })).toBeVisible();
    await expect(page.getByText("Skills & Technologies")).toBeVisible();

    await page.screenshot({
      path: path.join(screenshotsDir, "desktop_filters_drawer.png"),
      fullPage: false,
    });

    // Close drawer
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(300);

    // 6. Test Fit & Intelligence Tab
    await page.getByRole("button", { name: /Fit & Intelligence/i }).click();
    await page.waitForTimeout(400);
    await expect(page.getByText("Fit Analysis")).toBeVisible();
    await expect(page.getByText("Required Skills Breakdown")).toBeVisible();

    await page.screenshot({
      path: path.join(screenshotsDir, "desktop_intelligence_tab.png"),
      fullPage: false,
    });

    // Capture light mode intelligence tab
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(screenshotsDir, "desktop_light_intelligence.png"),
      fullPage: false,
    });
    await page.evaluate(() => {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    });
  });

  test("Mobile responsive layout at 375x812", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.route("**/jobs/personalized*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockJobsData),
      });
    });

    await page.goto("/jobs");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByPlaceholder(/Search opportunities/i)).toBeVisible({
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    // Capture mobile opportunities stream
    await page.screenshot({
      path: path.join(screenshotsDir, "mobile_stream_375.png"),
      fullPage: false,
    });

    // Select opportunity to navigate to detail
    await page.getByRole("heading", { name: "Staff Infrastructure Engineer" }).first().click();
    await page.waitForTimeout(500);

    await expect(page.getByRole("button", { name: /Back to list/i })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByRole("button", { name: /Apply on Company Site/i })).toBeVisible();

    // Capture mobile opportunity detail view in dark
    await page.screenshot({
      path: path.join(screenshotsDir, "mobile_detail_375.png"),
      fullPage: false,
    });

    // Toggle theme to light cleanly and capture mobile in light
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(screenshotsDir, "mobile_detail_light_375.png"),
      fullPage: false,
    });
  });
});
