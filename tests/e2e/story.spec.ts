import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [1440]) {
  test(`story topics connect to matching guides and the preview works at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your next chapter starts with a conversation.");
    await page.getByRole("button", { name: "Relationships", exact: true }).click();
    await expect(page.getByRole("region", { name: "Your starting point" })).toContainText(
      "Some connections need a new perspective."
    );
    await page.getByRole("link", { name: "Find guidance for relationships" }).click();
    await expect(page).toHaveURL("/astrologers?search=Relationships");
    await expect(page.getByRole("searchbox")).toHaveValue("Relationships");
    await expect(page.getByRole("link", { name: "View Meera Kapoor's profile" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View Raghav Mehta's profile" })).toHaveCount(0);
    await page.goBack();
    const firstTab = page.getByRole("tab", { name: /Choose your guide/ });
    await firstTab.focus();
    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: /Meet over video/ })).toBeFocused();
    await expect(page.getByRole("tabpanel")).toContainText("A real conversation. Room for every question.");
    await expect(page.getByText("Consultation preview · Simulated")).toBeVisible();
    await page.getByRole("link", { name: "Begin your conversation" }).click();
    await expect(page).toHaveURL("/astrologers");
    await expect(page.getByRole("searchbox")).toHaveValue("");
  });
}

test("all story choices and consultation preview states stay accessible", async ({ page }) => {
  test.setTimeout(60000);
  const violations: { width: number; state: string; id: string; targets: unknown[] }[] = [];
  for (const width of [1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    for (const [role, names] of [
      ["button", ["Career", "Relationships", "Self-discovery", "Family"]],
      ["tab", ["Choose your guide", "Choose your moment", "Reserve your space", "Meet over video"]],
    ] as const) {
      for (const name of names) {
        await page.getByRole(role, { name: new RegExp(name) }).click();
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        violations.push(
          ...results.violations.map(v => ({ width, state: name, id: v.id, targets: v.nodes.map(n => n.target) }))
        );
      }
    }
  }
  expect(violations).toEqual([]);
});

for (const width of [390, 1440]) {
  test(`Indian language and tradition discovery stays connected at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByRole("combobox", { name: "Consultation language" }).selectOption("Tamil");
    if (width === 390) {
      await expect(page.getByRole("link", { name: "Show 1 matching guide", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Explore astrology approaches" }).click();
    } else {
      await expect(page.getByText("1 Tamil-speaking guide in this demo")).toBeVisible();
    }
    const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(accessibility.violations.map(item => item.id)).toEqual([]);
    await page.getByRole("link", { name: "Explore Vedic Astrology" }).click();
    await expect(page).toHaveURL(/specialty=Vedic\+Astrology&language=Tamil/);
    await expect(page.getByRole("link", { name: "View Kavya Iyer's profile" })).toBeVisible();
    await expect(page.getByRole("link", { name: "View Ananya Sharma's profile" })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("button", { name: "Remove Language: Tamil" })).toBeVisible();
    await page.getByRole("button", { name: "Clear all", exact: true }).click();
    await expect(page.getByRole("link", { name: "View Ananya Sharma's profile" })).toBeVisible();
  });
}
