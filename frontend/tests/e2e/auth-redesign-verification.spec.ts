import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, "../../playwright/screenshots/auth_redesign");
fs.mkdirSync(outDir, { recursive: true });

test.describe("CareerOS Auth Experience Redesign Verification", () => {
  // Use unauthenticated context for auth flow testing
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Desktop 1440x900: Login Page visual structure, password toggle, and navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Positioning headline
    await expect(page.getByRole("heading", { name: "Your next application" })).toBeVisible();
    await expect(page.getByText("starts here.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in to CareerOS" })).toBeVisible();

    // Value points
    await expect(page.getByText("One verified profile.")).toBeVisible();
    await expect(page.getByText("Targeted role versions.")).toBeVisible();
    await expect(page.getByText("Deterministic gap analysis.")).toBeVisible();

    // Form elements
    const emailInput = page.locator("#email");
    const passwordInput = page.locator("#password");
    const submitButton = page.locator("button[type=submit]");
    const toggleButton = page.getByRole("button", { name: "Show password" });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toContainText("Continue to CareerOS");

    // Password toggle test
    await passwordInput.fill("SecretPassword123!");
    expect(await passwordInput.getAttribute("type")).toBe("password");
    await toggleButton.click();
    expect(await passwordInput.getAttribute("type")).toBe("text");
    await page.getByRole("button", { name: "Hide password" }).click();
    expect(await passwordInput.getAttribute("type")).toBe("password");

    await page.screenshot({ path: path.join(outDir, "login_desktop_1440.png"), fullPage: true });

    // Test navigation from Login to Signup
    const signupLink = page.getByRole("link", { name: "Create your career profile" });
    await signupLink.click();
    await page.waitForURL("**/signup");
    await expect(page.getByRole("heading", { name: "Build once." })).toBeVisible();
  });

  test("Desktop 1440x900: Signup Page visual structure, password toggle, and navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/signup");
    await page.waitForLoadState("domcontentloaded");

    // Headline & copy
    await expect(page.getByRole("heading", { name: "Build once." })).toBeVisible();
    await expect(page.getByText("Apply with intent.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Create your profile" })).toBeVisible();

    // Value points
    await expect(page.getByText("Don't start from a blank page.")).toBeVisible();
    await expect(page.getByText("Zero experience fabrication.")).toBeVisible();
    await expect(page.getByText("Role-specific derived versions.")).toBeVisible();

    // Form elements
    const nameInput = page.locator("#name");
    const emailInput = page.locator("#email");
    const passwordInput = page.locator("#password");
    const submitButton = page.locator("button[type=submit]");

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toContainText("Create my CareerOS profile");

    await nameInput.fill("Jane Doe");
    await emailInput.fill("jane.doe@example.com");
    await passwordInput.fill("SecurePass999!");

    await page.screenshot({ path: path.join(outDir, "signup_desktop_1440.png"), fullPage: true });

    // Test navigation from Signup to Login
    const loginLink = page.getByRole("link", { name: "Sign in" });
    await loginLink.click();
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Your next application" })).toBeVisible();
  });

  test("Landing Page to Auth Flow navigation", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Header Sign In link
    const signInNav = page.getByRole("banner").getByRole("link", { name: "Sign In" });
    await expect(signInNav).toBeVisible();

    // Header Create Account link
    const createAccountNav = page.getByRole("banner").getByRole("link", { name: "Create Account" });
    await expect(createAccountNav).toBeVisible();

    // Click Create Account from Header -> should land on /signup
    await createAccountNav.click();
    await page.waitForURL("**/signup");
    await expect(page.getByRole("heading", { name: "Build once." })).toBeVisible();

    // Back to overview
    await page.getByRole("link", { name: "Back to Overview" }).click();
    await page.waitForURL("**/");

    // Click Sign In from Header -> should land on /login
    await page.getByRole("banner").getByRole("link", { name: "Sign In" }).click();
    await page.waitForURL("**/login");
    await expect(page.getByRole("heading", { name: "Your next application" })).toBeVisible();
  });

  test("Responsive viewports: 1366x768, 1280x720, Tablet 1024x768, Mobile 390x844", async ({
    page,
  }) => {
    // 1366x768
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: "Sign in to CareerOS" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "login_1366x768.png") });

    await page.goto("/signup");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: "Create your profile" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "signup_1366x768.png") });

    // 1280x720
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({ path: path.join(outDir, "login_1280x720.png") });

    await page.goto("/signup");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({ path: path.join(outDir, "signup_1280x720.png") });

    // Tablet 1024x768
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({ path: path.join(outDir, "login_tablet_1024x768.png") });

    await page.goto("/signup");
    await page.waitForLoadState("domcontentloaded");
    await page.screenshot({ path: path.join(outDir, "signup_tablet_1024x768.png") });

    // Mobile 390x844
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await page.waitForLoadState("domcontentloaded");

    // Check no horizontal overflow
    let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    let clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    await expect(page.getByRole("heading", { name: "Sign in to CareerOS" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "login_mobile_390x844.png"), fullPage: true });

    await page.goto("/signup");
    await page.waitForLoadState("domcontentloaded");
    scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    await expect(page.getByRole("heading", { name: "Create your profile" })).toBeVisible();
    await page.screenshot({ path: path.join(outDir, "signup_mobile_390x844.png"), fullPage: true });

    // Forgot Password page check
    await page.goto("/forgot-password");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await page.screenshot({
      path: path.join(outDir, "forgot_password_mobile_390x844.png"),
      fullPage: true,
    });
  });
});
