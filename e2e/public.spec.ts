import { test, expect } from "@playwright/test";

test.describe("auth guards", () => {
  test("dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("login page renders email input", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("textbox")).toBeVisible();
  });
});

test.describe("public profile", () => {
  test("unknown username returns 404", async ({ page }) => {
    const res = await page.goto("/__no_such_user_exists_xyzzy__");
    expect(res?.status()).toBe(404);
  });

  test("known profile renders name and footer", async ({ page }) => {
    const username = process.env.TEST_USERNAME;
    if (!username) test.skip();

    await page.goto(`/${username}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("made with stackd")).toBeVisible();
  });

  test("clicking a link redirects to an external URL", async ({ page }) => {
    const username = process.env.TEST_USERNAME;
    if (!username) test.skip();

    await page.goto(`/${username}`);
    const links = page.locator('a[href^="/api/click/"]');
    await expect(links.first()).toBeVisible();

    // Clicking should leave localhost entirely — the click API increments the
    // count then redirects to the link's external URL
    await Promise.all([
      page.waitForURL((url) => url.hostname !== "localhost"),
      links.first().click(),
    ]);
  });
});
