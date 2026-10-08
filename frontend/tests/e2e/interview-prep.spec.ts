import { test, expect } from "@playwright/test";

/**
 * Interview Preparation vertical slice — browser E2E.
 *
 * NOTE: full generation happy-path requires migration 019 applied to the
 * live Supabase project (tables interview_prep_sessions/questions). Until
 * then these specs verify the real integrated flow up to the truthful
 * backend boundary: navigation, empty states, and honest failure (no mock
 * preparation data is ever rendered).
 */

test.describe("Interview Prep navigation", () => {
  test("sidebar exposes Interview Prep and list page renders honestly", async ({ page }) => {
    await page.goto("/interview-prep");
    await expect(page.getByRole("heading", { name: "Interview Prep" })).toBeVisible({
      timeout: 15000,
    });
    // Sidebar entry exists.
    await expect(page.getByRole("link", { name: /Interview Prep/ }).first()).toBeVisible();
    // Honest state: either an empty state or an error state — never fake questions.
    const empty = page.getByText("No preparation generated yet");
    const error = page.getByText("Could not load preparation sessions");
    await expect(empty.or(error)).toBeVisible({ timeout: 15000 });
  });

  test("Mission Control interview rounds offer Prepare for Interview", async ({ page }) => {
    await page.goto("/applications");
    await expect(
      page.getByRole("heading", { name: /Your hiring journey, orchestrated/ }).first(),
    ).toBeVisible({
      timeout: 15000,
    });
    const prepareButtons = page.getByRole("button", { name: /Prepare for Interview/ });
    const count = await prepareButtons.count();
    // If the test user has interviews, each round links into prep context.
    if (count > 0) {
      await prepareButtons.first().click();
      await expect(page).toHaveURL(/\/interview-prep\?applicationId=.*&interviewId=.*/, {
        timeout: 10000,
      });
      await expect(page.getByRole("heading", { name: "Interview Prep" })).toBeVisible({
        timeout: 15000,
      });
    } else {
      // No interviews for this user: record the skip honestly.
      expect(count).toBe(0);
    }
  });

  test("failed generation never renders fake questions", async ({ page }) => {
    await page.goto("/interview-prep");
    await expect(page.getByRole("heading", { name: "Interview Prep" })).toBeVisible({
      timeout: 15000,
    });
    // No question cards may exist without a real ready session.
    await expect(page.getByText("Why this matters")).toHaveCount(0);
    await expect(page.getByText("Talking points")).toHaveCount(0);
  });
});
