import { expect, test } from "@playwright/test";

test.describe("AI infrastructure dashboard", () => {
  test("renders live source data in US lens by default", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/AI Infrastructure Intelligence/);
    await expect(page.getByRole("heading", { name: /AI infrastructure in motion/i })).toBeVisible();
    await expect(page.locator(".country-tab.active")).toContainText("United States");
    await expect(page.locator(".news-row").first()).toBeVisible();
    await expect(page.locator(".watch-row").first()).toBeVisible();
    await expect(page.locator(".terminal-footer")).toContainText("source adapters monitored");
  });

  test("switches country lenses without replacing backend feed", async ({ page }) => {
    await page.goto("/");
    const initialTitles = await page.locator(".news-row h3").allTextContents();

    await page.locator(".country-tab").filter({ hasText: "Vietnam" }).click();
    await expect(page.locator(".country-tab.active")).toContainText("Vietnam");
    await expect(page.locator(".news-row").first()).toBeVisible();
    await expect(page.locator(".source-note")).toContainText("Vietnam legal connector");

    await page.locator(".country-tab").filter({ hasText: "China" }).click();
    await expect(page.locator(".country-tab.active")).toContainText("China");
    await expect(page.locator(".news-row").first()).toBeVisible();
    await expect(page.locator(".source-note")).toContainText("No China-specific connector");
    const chinaTitles = await page.locator(".news-row h3").allTextContents();
    expect(chinaTitles.some((title) => initialTitles.includes(title))).toBe(true);
  });

  test("filters, searches, saves, and refreshes existing feed signals", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("combobox", { name: "Filter signals" }).selectOption("Policy");
    const policyRows = page.locator(".news-row");
    await expect(policyRows.first()).toBeVisible();
    await expect(policyRows).not.toHaveCount(0);

    const firstPolicyTitle = (await policyRows.first().locator("h3").textContent()) ?? "policy";
    const searchTerm = firstPolicyTitle.split(/\s+/)[0];
    await page.getByPlaceholder("Search signals").fill(searchTerm);
    await expect(page.locator(".news-row").first()).toBeVisible();

    await page.getByRole("button", { name: "Save story" }).first().click();
    await expect(page.locator(".bookmark.saved")).toHaveCount(1);

    await page.getByRole("button", { name: "Refresh feed" }).click();
    await expect(page.locator(".terminal-footer")).toContainText("source adapters monitored");
  });
});
