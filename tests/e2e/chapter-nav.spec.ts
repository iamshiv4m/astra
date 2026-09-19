import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [375, 390, 430, 572, 768, 1024, 1440]) {
  test(`chapter navigation is distinct, compact and usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const nav = page.getByRole("navigation", { name: "Your ASTRA story" });
    if (width <= 600) {
      await expect(nav).toBeHidden();
      return;
    }
    const links = nav.getByRole("link");
    await expect(links).toHaveCount(4);
    for (const link of await links.all()) {
      expect(await link.locator("svg").count()).toBe(2);
      const size = await link.boundingBox();
      expect(size!.height).toBeGreaterThanOrEqual(44);
    }
    expect((await nav.boundingBox())!.height).toBeLessThanOrEqual(144);
    const guide = nav.getByRole("link", { name: "Your guide", exact: true });
    await guide.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#your-guide$/);
    await expect
      .poll(() => page.locator("#your-guide").evaluate(el => Math.abs(el.getBoundingClientRect().top)))
      .toBeLessThan(150);
    const results = await new AxeBuilder({ page })
      .include('nav[aria-label="Your ASTRA story"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
