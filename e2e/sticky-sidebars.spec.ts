import { expect, test } from "@playwright/test";

test("research reader keeps desktop sidebars sticky", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("feed-left-sidebar")).toHaveCSS("position", "sticky");
  await expect(page.getByTestId("feed-right-sidebar")).toHaveCSS("position", "sticky");
});
