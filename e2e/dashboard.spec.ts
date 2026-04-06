import { test, expect } from "@playwright/test";

// All tests here run with the stored authenticated session from auth.setup.ts

test("dashboard loads without redirecting to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL("/dashboard");
  await expect(page).not.toHaveURL("/login");
});

test("dashboard renders profile section with username", async ({ page }) => {
  await page.goto("/dashboard");
  // "Copy my link" button lives in the username/account section
  await expect(page.getByRole("button", { name: /copy my link/i })).toBeVisible();
});

test("dashboard renders link management area", async ({ page }) => {
  await page.goto("/dashboard");
  // The add link button text is "+ Add link" — match on "Add link"
  await expect(page.getByRole("button", { name: /add link/i })).toBeVisible();
});

test("dashboard renders theme picker", async ({ page }) => {
  await page.goto("/dashboard");
  // Section label is "Theme" (not "appearance")
  await expect(page.getByText("Theme")).toBeVisible();
});

test("dashboard renders sign out button", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
});
