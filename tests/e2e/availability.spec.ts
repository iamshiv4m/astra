import { expect, test } from "@playwright/test";

test("astrologer schedule edits change client-bookable slots and persist", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Demo controls", exact: true }).click();
  await page.getByRole("button", { name: "Astrologer workspace", exact: true }).click();
  await page.waitForURL("**/astrologer/dashboard");
  await page.goto("/astrologer/availability");
  const date = await page.locator('input[type="date"]').inputValue();
  const future = new Date(`${date}T12:00:00Z`);
  future.setUTCDate(future.getUTCDate() + 3);
  const target = future.toISOString().slice(0, 10);
  await page.goto("/astrologers/ananya-sharma");
  await expect(page.locator(".availability-calendar")).toBeVisible();
  while (await page.locator(`button[data-date="${target}"]`).count() === 0) {
    await page.getByRole("button", { name: "Next month", exact: true }).click();
  }
  await page.locator(`button[data-date="${target}"]`).click();
  await expect(page.getByRole("button", { name: /^10:00 am/i })).toBeEnabled();

  await page.goto("/astrologer/availability");
  await page.locator('input[type="date"]').fill(target);
  await page.getByLabel("Start time", { exact: true }).fill("10:00");
  await page.getByLabel("End time", { exact: true }).fill("11:00");
  await page.getByRole("button", { name: "Block interval", exact: true }).click();
  await page.getByRole("button", { name: "Save availability", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save availability", exact: true })).toBeDisabled();

  await page.goto("/astrologers/ananya-sharma");
  await expect(page.locator(".availability-calendar")).toBeVisible();
  while (await page.locator(`button[data-date="${target}"]`).count() === 0) {
    await page.getByRole("button", { name: "Next month", exact: true }).click();
  }
  await page.locator(`button[data-date="${target}"]`).click();
  await expect(page.getByRole("button", { name: /^10:00 am/i })).toBeDisabled();
  await expect(page.getByRole("button", { name: /^9:30 am/i })).toBeEnabled();
  await page.reload();
  await expect(page.locator(".availability-calendar")).toBeVisible();
  while (await page.locator(`button[data-date="${target}"]`).count() === 0) {
    await page.getByRole("button", { name: "Next month", exact: true }).click();
  }
  await page.locator(`button[data-date="${target}"]`).click();
  await expect(page.getByRole("button", { name: /^10:00 am/i })).toBeDisabled();
});
