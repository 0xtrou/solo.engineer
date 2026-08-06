import { expect, test, type Page } from "@playwright/test";

test.setTimeout(90_000);

async function expectLiveCardsOrTransparentEmptyState(page: Page) {
  const cards = page.getByTestId("terminal-article");

  if (await cards.count() === 0) {
    await expect(page.getByTestId("terminal-empty")).toBeVisible();
    await expect(page.getByTestId("terminal-empty")).toContainText("no substitute content is shown");
    return;
  }

  const firstCard = cards.first();
  await expect(firstCard.getByRole("link")).toHaveAttribute("href", /^https?:\/\//);
  await expect(firstCard.locator("span").nth(2)).toHaveText(/\S+/);
  await expect(firstCard.locator("time")).toHaveAttribute("datetime", /\S+/);
}

test.describe("live AI infrastructure terminal", () => {
  test("exposes source health and only renders attributable live records", async ({ page }) => {
    await page.goto("/terminal");

    await expect(page.getByTestId("terminal-shell")).toBeVisible();
    await expect(page.getByText("SOURCE HEALTH", { exact: true })).toBeVisible();
    await expect(page.getByText(/does not substitute generated content/i)).toBeVisible();
    await expect(page.getByTestId("terminal-fetched-at")).not.toHaveText("Unavailable");

    const sourceStates = page.locator('[data-testid^="terminal-source-"]');
    expect(await sourceStates.count()).toBeGreaterThan(0);
    await expect(sourceStates.first()).toHaveAttribute("href", /^https?:\/\//);

    await expectLiveCardsOrTransparentEmptyState(page);
  });

  test("links from home into terminal", async ({ page }) => {
    await page.goto("/");

    const terminalLink = page.locator('a[href="/terminal"]').first();
    await expect(terminalLink).toBeVisible();
    await terminalLink.click();

    await expect(page).toHaveURL(/\/terminal$/);
    await expect(page.getByTestId("terminal-shell")).toBeVisible();
  });

  test("persists region and sector filters in URL", async ({ page }) => {
    await page.goto("/terminal");

    await page.getByTestId("terminal-region-vietnam").click();
    await expect(page).toHaveURL(/region=vietnam/);
    await expect(page.getByRole("heading", { name: "Vietnam AI infrastructure" })).toBeVisible();

    await page.getByTestId("terminal-sector-power-and-grid").click();
    await expect(page).toHaveURL(/region=vietnam/);
    await expect(page).toHaveURL(/sector=power-and-grid/);

    await page.reload();
    await expect(page.getByTestId("terminal-region-vietnam")).toHaveClass(/terminal-nav-button-active/);
    await expect(page.getByTestId("terminal-sector-power-and-grid")).toHaveClass(/terminal-nav-button-active/);
    await expect(page.getByRole("heading", { name: "Vietnam AI infrastructure" })).toBeVisible();

    const cards = page.getByTestId("terminal-article");
    if (await cards.count()) {
      expect(await cards.evaluateAll((elements) => elements.every((element) => element.getAttribute("data-category") === "power-and-grid"))).toBe(true);
    }
  });
});
