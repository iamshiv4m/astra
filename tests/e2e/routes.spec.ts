import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { DemoState } from "../../src/types/domain";

const routes = [
  "/", "/astrologers", "/astrologers/ananya-sharma", "/login", "/signup",
  "/dashboard", "/dashboard/bookings", "/dashboard/bookings/booking-9", "/dashboard/profile",
  "/booking/ananya-sharma", "/session/session-9?demo=1", "/astrologer/login",
  "/astrologer/dashboard", "/astrologer/availability", "/astrologer/sessions",
  "/astrologer/sessions?view=clients", "/astrologer/profile", "/tech-stack",
];

async function enterBothWorkspaces(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Demo controls", exact: true }).click();
  await page.getByRole("button", { name: "Client workspace", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: "Demo controls", exact: true }).click();
  await page.getByRole("button", { name: "Astrologer workspace", exact: true }).click();
  await expect(page).toHaveURL(/\/astrologer\/dashboard$/);
}

for (const width of [375, 390, 430, 768, 1024, 1440]) {
  test(`all route patterns render without overflow at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("response", response => {
      if (["image", "font", "stylesheet", "script"].includes(response.request().resourceType()) && response.status() >= 400) {
        errors.push(`Broken asset ${response.status()}: ${response.url()}`);
      }
    });
    await enterBothWorkspaces(page);
    for (const [index, route] of routes.entries()) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBeLessThan(400);
      await expect(page.locator("h1").first(), route).toBeVisible();
      await expect(page.getByText("Opening ASTRA...", { exact: true })).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      const brokenImages = await page.evaluate(async () => {
        const images = Array.from(document.images);
        images.forEach(image => { image.loading = "eager"; });
        const results = await Promise.all(images.map(async image => {
          try {
            await image.decode();
            return image.naturalWidth > 0 ? null : image.currentSrc;
          } catch {
            return image.currentSrc || image.src;
          }
        }));
        return results.filter(Boolean);
      });
      expect(brokenImages, `Every image must decode on ${route} at ${width}px`).toEqual([]);
      const dimensions = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      expect(dimensions.actual, `${route} overflows at ${width}px`).toBeLessThanOrEqual(dimensions.viewport + 1);
      await expect(page.locator('a[href="#"]')).toHaveCount(0);
      await page.screenshot({ path: testInfo.outputPath(`${String(index).padStart(2, "0")}-${route.replace(/\W+/g, "-")}.png`), fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test("every route meets desktop and mobile automated accessibility checks", async ({ page }) => {
  test.setTimeout(120000);
  const violations: { width: number; route: string; id: string; targets: unknown[] }[] = [];
  await enterBothWorkspaces(page);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      violations.push(...result.violations.map(v => ({ width, route, id: v.id, targets: v.nodes.map(n => n.target) })));
    }
  }
  expect(violations).toEqual([]);
});

test("demo reset and local role identities persist on refresh", async ({ page }) => {
  await enterBothWorkspaces(page);
  await page.goto("/dashboard");
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(/sign in/i);
  await page.getByRole("button", { name: "Demo controls", exact: true }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Yes, reset demo", exact: true }).click();
  await expect(page).toHaveURL("/");
  await page.goto("/dashboard");
  await expect(page.getByRole("link", { name: /sign in|log in/i }).first()).toBeVisible();
});

test("mobile navigation is keyboard accessible with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Demo controls", exact: true })).toBeEnabled();
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Explore ASTRA" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect.poll(() => dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

test("old portrait references migrate without resetting local edits", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Demo controls", exact: true })).toBeEnabled();
  await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("astra.demo.v1")!) as DemoState;
    data.astrologers[0].image = "/portraits/ananya-sharma.svg";
    data.astrologers[1].image = "/portraits/10.jpg";
    data.clients.find(client => client.id === "shivam")!.name = "Preserved Demo Edit";
    localStorage.setItem("astra.demo.v1", JSON.stringify(data));
  });
  await page.reload();
  await expect(page.getByRole("button", { name: "Demo controls", exact: true })).toBeEnabled();
  const saved = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem("astra.demo.v1")!) as DemoState;
    return { portrait: data.astrologers[0].image, custom: data.astrologers[1].image, name: data.clients.find(client => client.id === "shivam")?.name, bookings: data.bookings.length };
  });
  expect(saved).toEqual({ portrait: "/portraits/1.jpg", custom: "/portraits/10.jpg", name: "Preserved Demo Edit", bookings: 10 });
});
