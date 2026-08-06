import { expect, test } from "@playwright/test";

test.describe("AI infrastructure dashboard", () => {
  test("renders the US lens by default", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/AI Infrastructure Intelligence/);
    await expect(page.getByRole("heading", { name: /AI infrastructure in motion/i })).toBeVisible();
    await expect(page.locator(".country-tab.active")).toContainText("United States");
    await expect(page.locator(".news-row")).toHaveCount(5);
  });

  test("switches country lenses and refreshes the signal stream", async ({ page }) => {
    await page.goto("/");

    await page.locator(".country-tab").filter({ hasText: "Vietnam" }).click();
    await expect(page.locator(".country-tab.active")).toContainText("Vietnam");
    await expect(page.locator(".news-row").first()).toContainText("Southern industrial parks");

    await page.locator(".country-tab").filter({ hasText: "China" }).click();
    await expect(page.locator(".country-tab.active")).toContainText("China");
    await expect(page.locator(".news-row").first()).toContainText("Domestic accelerator roadmaps");
  });

  test("filters, searches, and saves signals", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("combobox", { name: "Filter signals" }).selectOption("Policy");
    await expect(page.locator(".news-row")).toHaveCount(1);
    await expect(page.locator(".news-row").first()).toContainText("Federal permitting reform");

    await page.getByPlaceholder("Search signals").fill("permitting");
    await expect(page.locator(".news-row")).toHaveCount(1);

    await page.getByRole("button", { name: "Save story" }).click();
    await expect(page.locator(".bookmark.saved")).toHaveCount(1);
  });
});
