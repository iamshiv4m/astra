import { test, expect } from "@playwright/test";

for (const width of [375, 390, 430]) {
  test(`mobile homepage has a bounded scroll journey at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("combobox", { name: "Consultation language" })).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      hero: document.querySelector("main section")!.getBoundingClientRect().height,
      guides: document.querySelector("#your-guide")!.getBoundingClientRect().top + window.scrollY,
    }));
    expect(dimensions.height).toBeLessThanOrEqual(4800);
    expect(dimensions.hero).toBeLessThanOrEqual(650);
    expect(dimensions.guides).toBeLessThanOrEqual(2100);
    const impact = await page.evaluate(() => {
      const hero = document.querySelector("main section")!;
      const chart = hero.querySelector("[data-hero-chart] svg")!;
      const caption = Array.from(hero.querySelectorAll("span")).find(el =>
        /illustrative kundli/i.test(el.textContent || "")
      );
      const chartBox = chart.getBoundingClientRect();
      const captionBox = caption?.getBoundingClientRect();
      return {
        chartWidth: chartBox.width,
        chartHeight: chartBox.height,
        chartTop: chartBox.top,
        captionHeight: captionBox?.height ?? 0,
      };
    });
    expect(impact.chartWidth).toBeGreaterThanOrEqual(200);
    expect(impact.chartHeight).toBeGreaterThanOrEqual(200);
    expect(impact.chartTop).toBeLessThan(520);
    expect(impact.captionHeight).toBeGreaterThan(0);
    await expect(page.getByRole("region", { name: "Topics and illustrative voices" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Topics and illustrative voices" }).getByRole("link", { name: "Career" })).toBeVisible();
    await expect(page.locator("#your-guide .astrologer-card")).toHaveCount(4);
    await expect(page.getByRole("link", { name: "Explore Vedic Astrology" })).toBeVisible();
    const more = page.getByRole("button", { name: "Read 3 more stories" });
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.click();
    await expect(page.getByRole("button", { name: "Show fewer stories" })).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#more-client-stories article")).toHaveCount(3);
    await expect(page.locator("#more-client-stories article").last()).toBeVisible();
    await page.getByRole("button", { name: "Show fewer stories" }).click();
    await expect(page.locator("#more-client-stories")).toBeHidden();
    await expect(page.getByRole("button", { name: "Read 3 more stories" })).toBeFocused();
    await page.getByRole("button", { name: "About these approaches" }).click();
    await expect(page.getByRole("heading", { name: "Your kundli. A wider perspective." })).toBeVisible();
    await page.getByRole("button", { name: "Hide approach details" }).click();
    await expect(page.getByRole("heading", { name: "Your kundli. A wider perspective." })).toBeHidden();
    const heroQuestion = page.getByRole("link", { name: /A new direction/ });
    const bounds = await heroQuestion.boundingBox();
    expect(bounds?.width).toBeGreaterThan(150);
    expect(bounds?.height).toBeGreaterThanOrEqual(100);
    await page.getByRole("tab", { name: /Meet over video/ }).click();
    await expect(page.getByRole("tabpanel")).toContainText("Consultation preview");
  });
}

test("desktop retains the complete editorial layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("#more-client-stories article").last()).toBeVisible();
  await expect(page.getByRole("button", { name: "Read 3 more stories" })).toHaveCount(0);
});
