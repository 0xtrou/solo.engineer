import { expect, test, type Page } from "@playwright/test";

test.setTimeout(90_000);

async function expectLiveCardsOrTransparentEmptyState(page: Page) {
  const cards = page.getByTestId("crypto-article");

  if (await cards.count() === 0) {
    await expect(page.getByTestId("crypto-empty")).toBeVisible();
    await expect(page.getByTestId("crypto-empty")).toContainText("no substitute content is shown");
    return;
  }

  const firstCard = cards.first();
  await expect(firstCard.getByRole("link")).toHaveAttribute("href", /^https?:\/\//);
  await expect(firstCard.locator("time")).toHaveAttribute("datetime", /\S+/);
}

test.describe("live crypto terminal", () => {
  test("exposes source health and only renders attributable live records", async ({ page }) => {
    await page.goto("/crypto");

    await expect(page.getByTestId("crypto-shell")).toBeVisible();
    await expect(page.getByText("SOURCE HEALTH", { exact: true })).toBeVisible();
    await expect(page.getByText(/does not substitute generated content/i)).toBeVisible();
    await expect(page.getByTestId("crypto-fetched-at")).not.toHaveText("Unavailable");

    const sourceStates = page.locator('[data-testid^="crypto-source-"]');
    expect(await sourceStates.count()).toBeGreaterThan(0);
    await expect(sourceStates.first()).toHaveAttribute("href", /^https?:\/\//);

    await expectLiveCardsOrTransparentEmptyState(page);
  });

  test("links from home into crypto terminal", async ({ page }) => {
    await page.goto("/");

    const cryptoLink = page.locator('a[href="/crypto"]').first();
    await expect(cryptoLink).toBeVisible();
    await cryptoLink.click();

    await expect(page).toHaveURL(/\/crypto$/);
    await expect(page.getByTestId("crypto-shell")).toBeVisible();
  });

  test("persists sector and category filters in URL", async ({ page }) => {
    await page.goto("/crypto");

    await page.getByTestId("crypto-region-markets").click();
    await expect(page).toHaveURL(/region=markets/);
    await expect(page.getByRole("heading", { name: "Markets crypto" })).toBeVisible();

    await page.getByTestId("crypto-sector-markets").click();
    await expect(page).toHaveURL(/region=markets/);
    await expect(page).toHaveURL(/sector=markets/);

    await page.reload();
    await expect(page.getByTestId("crypto-region-markets")).toHaveClass(/terminal-nav-button-active/);
    await expect(page.getByTestId("crypto-sector-markets")).toHaveClass(/terminal-nav-button-active/);

    const cards = page.getByTestId("crypto-article");
    if (await cards.count()) {
      expect(await cards.evaluateAll((elements) => elements.every((element) => element.getAttribute("data-category") === "markets"))).toBe(true);
    }
  });

  test("renders live telemetry and sticky sidebars", async ({ page }) => {
    await page.goto("/crypto");

    await expect(page.getByTestId("crypto-telemetry")).toBeVisible();
    await expect(page.getByTestId("crypto-activity-chart")).toBeVisible();
    await expect(page.getByTestId("crypto-category-chart")).toBeVisible();
    await expect(page.getByTestId("crypto-source-chart")).toBeVisible();
    await expect(page.getByTestId("crypto-left-sidebar")).toHaveCSS("position", "sticky");
    await expect(page.getByTestId("crypto-right-sidebar")).toHaveCSS("position", "sticky");
  });
});
