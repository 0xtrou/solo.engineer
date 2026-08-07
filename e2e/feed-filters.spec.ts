import { expect, test } from "@playwright/test";

const researchSources = [
  "arxiv", "hacker-news", "github", "stack-overflow", "dev", "indie-hackers", "bluesky", "openalex", "hugging-face", "microsoft-research", "google-ai", "mit-sloan", "social-media-today",
  "wikimedia", "creative-commons", "open-knowledge-foundation", "openstreetmap", "internet-archive", "learning-equality", "carpentries", "public-knowledge-project", "center-for-open-science", "numfocus", "open-source-ecology", "open-education-global", "oapen", "open-food-facts", "osgeo", "apereo", "posit", "moodle", "h5p", "canvas-lms", "overleaf", "pensoft", "frontiers", "automattic", "proton", "plausible", "matomo",
];
const policySources = ["eu-regulation", "us-regulation", "vietnam-regulation", "world-bank"];

test.describe("feed URL filters", () => {
  test("restores source, category, and search from a shared URL", async ({ page }) => {
    await page.goto("/?source=vietnam-regulation&view=policy&q=Vietnam");

    await expect(page).toHaveURL(/source=vietnam-regulation/);
    await expect(page).toHaveURL(/view=policy/);
    await expect(page).toHaveURL(/q=Vietnam/);
    await expect(page.getByTestId("view-filter-policy")).toHaveClass(/tab-button-active/);
    await expect(page.getByTestId("source-filter-vietnam-regulation")).toHaveClass(/source-item-active/);
    await expect(page.getByTestId("feed-card")).toHaveCount(1);
    await expect(page.getByTestId("feed-card")).toHaveAttribute("data-source", "vietnam-regulation");
    await expect(page.getByRole("searchbox", { name: "Search your feed" })).toHaveValue("Vietnam");
  });

  test("writes category, source, and search filters to the URL", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("feed-card").first()).toBeVisible();

    await page.getByTestId("view-filter-research").click();
    await expect(page).toHaveURL(/view=research/);
    await expect(page.getByTestId("feed-card")).toHaveCount(researchSources.length);

    await page.getByTestId("source-filter-arxiv").click();
    await expect(page).toHaveURL(/source=arxiv/);
    await expect(page).toHaveURL(/view=research/);
    await expect(page.getByTestId("feed-card")).toHaveCount(1);
    await expect(page.getByTestId("feed-card")).toHaveAttribute("data-source", "arxiv");

    const search = page.getByRole("searchbox", { name: "Search your feed" });
    await search.fill("Agentic");
    await expect(page).toHaveURL(/q=Agentic/);
    await expect(page.getByTestId("feed-card")).toHaveCount(1);

    await page.reload();
    await expect(search).toHaveValue("Agentic");
    await expect(page.getByTestId("feed-card")).toHaveCount(1);
  });

  test("normalizes invalid filters and persists local library state", async ({ page }) => {
    await page.goto("/?source=unknown&view=invalid&q=%20%20Agentic%20%20&saved=true");

    await expect(page.getByTestId("view-filter-focused")).toHaveClass(/tab-button-active/);
    await expect(page.getByTestId("source-filter-all")).toHaveClass(/source-item-active/);
    await expect(page.getByRole("searchbox", { name: "Search your feed" })).toHaveValue("Agentic");
    await expect(page.getByTestId("feed-card")).toHaveCount(1);

    await page.getByRole("button", { name: "Save bookmark" }).click();
    await page.getByRole("button", { name: /Library/ }).click();
    await expect(page).toHaveURL(/saved=1/);
    await expect(page.getByTestId("feed-card")).toHaveCount(1);

    await page.reload();
    await expect(page.getByTestId("feed-card")).toHaveCount(1);
  });

  test("matches social administration through curated topic aliases", async ({ page }) => {
    await page.goto("/?q=Social+administration");

    await expect(page.getByRole("searchbox", { name: "Search your feed" })).toHaveValue("Social administration");
    await expect(page.getByTestId("feed-card").first()).toBeVisible();
    await expect(page.getByTestId("empty-feed")).toHaveCount(0);
  });

  test("every category renders data", async ({ page }) => {
    for (const view of ["focused", "research", "policy"] as const) {
      await page.goto(`/?view=${view}`);
      await expect(page.getByTestId(`view-filter-${view}`)).toHaveClass(/tab-button-active/);
      await expect(page.getByTestId("feed-card").first()).toBeVisible();
      await expect(page.getByTestId("empty-feed")).toHaveCount(0);
    }
  });

  test("every configured source filter renders data", async ({ page }) => {
    for (const source of [...researchSources, ...policySources]) {
      await page.goto("/");
      await page.getByTestId(`source-filter-${source}`).click();
      await expect(page).toHaveURL(new RegExp(`source=${source}`));
      await expect(page.getByTestId("feed-card")).toHaveCount(1);
      await expect(page.getByTestId("feed-card")).toHaveAttribute("data-source", source);
      await expect(page.getByTestId("empty-feed")).toHaveCount(0);
    }
  });
});
