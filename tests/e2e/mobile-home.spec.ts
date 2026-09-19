import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [375, 390, 430, 572]) {
  test(`mobile homepage prioritizes guide discovery at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("combobox", { name: "Consultation language" })).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      hero: document.querySelector("main section")!.getBoundingClientRect().height,
      guides: document.querySelector("#your-guide")!.getBoundingClientRect().top + window.scrollY,
      width: document.documentElement.scrollWidth,
    }));
    expect(dimensions.height).toBeLessThanOrEqual(3100);
    expect(dimensions.hero).toBeLessThanOrEqual(520);
    expect(dimensions.guides).toBeLessThanOrEqual(1100);
    expect(dimensions.width).toBeLessThanOrEqual(width);
    await expect(page.getByRole("navigation", { name: "Your ASTRA story" })).toBeHidden();
    await expect(page.getByRole("region", { name: "Topics and illustrative voices" })).toBeHidden();
    await expect(page.getByRole("link", { name: /A new direction/ })).toBeHidden();
    await expect(page.getByRole("region", { name: "Your starting point" })).toBeHidden();
    await expect(page.getByRole("region", { name: "The intended ASTRA experience" })).toBeHidden();
    await expect(page.locator("#your-guide .astrologer-card")).toHaveCount(4);
    await expect(page.locator("#your-guide .astrologer-card").last()).toBeVisible();
    await expect(page.getByRole("list", { name: "Your consultation in three steps" }).getByRole("listitem")).toHaveCount(3);
    await expect(page.getByRole("tabpanel")).toBeHidden();
    await expect(page.getByText("Illustrative kundli", { exact: true })).toBeVisible();
    await expect(page.getByText("Demo only. Calls and payments are simulated.")).toBeVisible();
    await page.getByRole("link", { name: "How it works", exact: true }).click();
    await expect(page).toHaveURL(/#how-it-works$/);
    await expect(page.getByRole("heading", { name: "How it works", exact: true })).toBeInViewport();

    await page.getByRole("button", { name: "Explore astrology approaches" }).click();
    await expect(page.getByRole("link", { name: "Explore Vedic Astrology" })).toBeVisible();
    await page.getByRole("button", { name: "Hide astrology approaches" }).click();
    await expect(page.getByRole("link", { name: "Explore Vedic Astrology" })).toBeHidden();
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test("mobile topic and language choices combine into one directory handoff", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("combobox", { name: "Consultation language" }).selectOption("Hindi");
  await page.getByRole("button", { name: "Relationships", exact: true }).click();
  const submit = page.getByRole("link", { name: /Show \d+ matching guides?/ });
  await expect(submit).toHaveAttribute("href", "/astrologers?search=Relationships&language=Hindi");
  await submit.click();
  await expect(page.getByRole("searchbox")).toHaveValue("Relationships");
  await expect(page.getByRole("button", { name: "Remove Language: Hindi" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Meera Kapoor's profile" })).toBeVisible();
});

test("desktop retains the complete editorial layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("#more-client-stories article").last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Read 3 more stories" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Topics and illustrative voices" })).toBeVisible();
  await expect(page.getByRole("tabpanel")).toBeVisible();
});
