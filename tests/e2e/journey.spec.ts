import { expect, test, type Page } from "@playwright/test";
import type { DemoState } from "../../src/types/domain";

async function readDemo(page: Page): Promise<DemoState> {
  return page.evaluate(() => {
    const saved = localStorage.getItem("astra.demo.v1");
    if (!saved) throw new Error("The ASTRA demo has not hydrated or persisted.");
    return JSON.parse(saved);
  });
}

async function chooseTomorrow(page: Page) {
  const calendar = page.locator(".availability-calendar");
  const selectedDate = await calendar.locator('.calendar-days button[aria-pressed="true"]').getAttribute("data-date");
  if (!selectedDate) throw new Error("The profile calendar has no selected date.");
  const tomorrow = new Date(`${selectedDate}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const date = tomorrow.toISOString().slice(0, 10);
  if (date.slice(0, 7) !== selectedDate.slice(0, 7)) {
    await calendar.getByRole("button", {name: "Next month", exact: true}).click();
  }
  await calendar.locator(`button[data-date="${date}"]`).click();
  return date;
}

for (const width of [1440, 390]) {
  test(`complete client consultation journey at ${width}px`, async ({page}) => {
    test.setTimeout(120000);
    await page.setViewportSize({width, height: 900});
    const runtimeErrors: string[] = [];
    page.on("pageerror", error => runtimeErrors.push(error.message));

    await test.step("Discover an advisor and carry a future slot into booking", async () => {
      await page.goto("/");
      await page.getByRole("link", {name: "Find your astrologer", exact: true}).first().click();
      await expect(page).toHaveURL(/\/astrologers$/);
      await page.getByRole("searchbox", {name: "Search astrologers by name or expertise"}).fill("Ananya");
      await page.getByRole("link", {name: "View profile", exact: true}).click();
      await expect(page).toHaveURL(/\/astrologers\/ananya-sharma$/);
      await expect(page.getByRole("heading", {name: "Ananya Sharma", exact: true})).toBeVisible();
      await chooseTomorrow(page);
      await page.locator(".time-slot:not(:disabled)").first().click();
      await page.getByRole("link", {name: width < 850 ? "Book session" : "Book consultation", exact: true}).click();
      await expect(page).toHaveURL(/\/booking\/ananya-sharma\?/);
      await expect(page.getByRole("heading", {name: "Your conversation awaits."})).toBeVisible();
    });

    const originalIntent = new URL(page.url()).searchParams;
    const date = originalIntent.get("date");
    const start = originalIntent.get("start");
    expect(date).toBeTruthy();
    expect(start).toBeTruthy();

    await test.step("Sign in without dropping the selected consultation", async () => {
      await page.getByRole("link", {name: /Sign in to confirm/}).click();
      await expect(page).toHaveURL(/\/login\?next=/);
      const returnUrl = new URL(new URL(page.url()).searchParams.get("next")!, "http://localhost:3001");
      expect(returnUrl.searchParams.get("date")).toBe(date);
      expect(returnUrl.searchParams.get("start")).toBe(start);
      expect(returnUrl.searchParams.get("duration")).toBe("30");
      await page.getByRole("textbox", {name: "Email address"}).fill(`journey-${width}@example.com`);
      await page.getByRole("button", {name: "Sign in to demo", exact: true}).click();
      await expect(page).toHaveURL(/\/booking\/ananya-sharma\?/);
      await expect(page.getByRole("button", {name: /Confirm & book/})).toBeEnabled();
      expect(new URL(page.url()).searchParams.get("start")).toBe(start);
    });

    await test.step("Exercise all four steps and confirm one paid demo booking", async () => {
      await page.getByRole("button", {name: "Back", exact: true}).click();
      await page.getByRole("button", {name: "Back", exact: true}).click();
      await page.getByRole("button", {name: "Back", exact: true}).click();
      await expect(page.getByRole("heading", {name: "How much time would you like?"})).toBeVisible();
      await page.getByRole("radio", {name: /^45 minutes/}).check();
      await page.getByRole("button", {name: "Continue", exact: true}).click();
      await expect(page.getByRole("heading", {name: "Choose a day that works for you."})).toBeVisible();
      await page.locator(`.calendar-days button[data-date="${date}"]`).click();
      await page.getByRole("button", {name: "Continue", exact: true}).click();
      await expect(page.getByRole("heading", {name: "Find your moment."})).toBeVisible();
      await expect(page.getByRole("button", {name: "Continue", exact: true})).toBeDisabled();
      await page.locator(".time-slot:not(:disabled)").first().click();
      await page.getByRole("button", {name: "Continue", exact: true}).click();
      await page.getByRole("textbox", {name: /What’s on your mind/}).fill("Demo career direction — exploring a thoughtful next step.");
      const before = await readDemo(page);
      await page.getByRole("button", {name: /Confirm & book/}).click();
      await expect(page.getByRole("heading", {name: "You’re all set."})).toBeVisible();
      await expect(page).toHaveURL(/confirmed=booking-request-/);
      const after = await readDemo(page);
      expect(after.bookings).toHaveLength(before.bookings.length + 1);
      expect(after.sessions).toHaveLength(before.sessions.length + 1);
    });

    const bookingHref = await page.getByRole("link", {name: /View my booking/}).getAttribute("href");
    if (!bookingHref) throw new Error("The booking confirmation has no detail link.");
    const bookingId = decodeURIComponent(bookingHref.split("/").at(-1)!);
    const confirmedState = await readDemo(page);
    const booking = confirmedState.bookings.find(item => item.id === bookingId);
    if (!booking) throw new Error("The confirmation does not reference a persisted booking.");
    expect(booking.duration).toBe(45);
    expect(booking.paymentStatus).toBe("paid");

    await test.step("Download a genuine calendar event and revisit the booking", async () => {
      const downloadEvent = page.waitForEvent("download");
      await page.getByRole("button", {name: "Add to calendar", exact: true}).click();
      const download = await downloadEvent;
      expect(download.suggestedFilename()).toMatch(/\.ics$/);
      const stream = await download.createReadStream();
      if (!stream) throw new Error("The calendar download could not be read.");
      let calendar = "";
      for await (const chunk of stream) calendar += chunk.toString();
      expect(calendar).toContain("BEGIN:VCALENDAR");
      expect(calendar).toContain("BEGIN:VEVENT");
      expect(calendar).toContain(`DTSTART:${booking.start.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`);

      await page.getByRole("link", {name: /View my booking/}).click();
      await expect(page).toHaveURL(new RegExp(`/dashboard/bookings/${bookingId}$`));
      await expect(page.getByText("Paid · Demo payment", {exact: true})).toBeVisible();
      await page.reload();
      await expect(page.getByText("45 minutes", {exact: true})).toBeVisible();
      const nav = page.getByRole("navigation", {name: width < 850 ? "Quick navigation" : "client navigation", exact: true});
      await nav.getByRole("link", {name: "Overview", exact: true}).click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("region", {name: "Your next consultation"})).toContainText("Ananya Sharma");
    });

    await test.step("Start the future demo without rescheduling and exchange a message", async () => {
      await page.getByRole("region", {name: "Your next consultation"}).getByRole("link", {name: "Start demo now", exact: true}).click();
      await expect(page).toHaveURL(new RegExp(`/session/${booking.sessionId}\\?demo=1$`));
      await page.getByRole("button", {name: "Enter demo room", exact: true}).click();
      await expect(page.getByRole("button", {name: "Enter demo room", exact: true})).toHaveCount(0);
      await expect(page.getByText("Connected · simulated", {exact: true})).toBeVisible();
      if (width < 850) await page.getByRole("button", {name: "Open consultation chat", exact: true}).click();
      const chat = width < 850
        ? page.getByRole("dialog", {name: "Consultation chat", exact: true})
        : page.getByRole("region", {name: "Consultation chat", exact: true});
      const message = "What is one thoughtful next step for my career?";
      await chat.getByRole("textbox", {name: "Message", exact: true}).fill(message);
      await chat.getByRole("button", {name: "Send message", exact: true}).click();
      await expect(chat.getByRole("log", {name: "Messages"})).toContainText(message);
      await expect(chat.getByRole("log", {name: "Messages"})).toContainText("Let’s explore what you want from your next chapter. What feels most important to you in your work right now?");
      await expect(chat.getByRole("textbox", {name: "Message", exact: true})).toHaveValue("");
      if (width < 850) await chat.getByRole("button", {name: "Close chat", exact: true}).click();
      const inCall = await readDemo(page);
      const original = inCall.bookings.find(item => item.id === bookingId)!;
      expect(original.start).toBe(booking.start);
      expect(original.end).toBe(booking.end);
      expect(inCall.sessions.find(item => item.id === booking.sessionId)?.startedAt).toBeTruthy();
    });

    await test.step("End, rate, and find the completed session in booking history", async () => {
      await page.getByRole("button", {name: "End consultation", exact: true}).click();
      const confirmation = page.getByRole("dialog", {name: "End this consultation?", exact: true});
      await confirmation.getByRole("button", {name: "End consultation", exact: true}).click();
      await expect(page.getByRole("heading", {name: "A little more clarity.", exact: true})).toBeVisible();
      await page.getByRole("radio", {name: "5 stars", exact: true}).check();
      await page.getByRole("textbox", {name: "A few words about your consultation (optional)", exact: true}).fill("A calm, useful demo conversation.");
      await page.getByRole("button", {name: "Save feedback", exact: true}).click();
      await expect(page.getByText("Thank you. Your feedback is saved in this demo.", {exact: true})).toBeVisible();
      await page.getByRole("link", {name: "Return to my sessions", exact: true}).click();
      await expect(page).toHaveURL(new RegExp(`/dashboard/bookings/${bookingId}$`));
      await expect(page.getByText("Completed", {exact: true})).toBeVisible();
      await page.getByRole("link", {name: "All consultations", exact: true}).click();
      await page.getByRole("button", {name: /^Past \(/}).click();
      const completed = page.locator("article").filter({has: page.locator(`a[href="${bookingHref}"]`)}).first();
      await expect(completed).toContainText("Completed");
      await completed.getByRole("link", {name: "Details", exact: true}).click();
      await page.getByRole("link", {name: "View session recap", exact: true}).click();
      await expect(page.getByRole("radio", {name: "5 stars", exact: true})).toBeChecked();
      await page.getByRole("link", {name: "Book another session", exact: true}).click();
      await expect(page).toHaveURL(/\/booking\/ananya-sharma$/);
      await expect(page.getByRole("heading", {name: "How much time would you like?", exact: true})).toBeVisible();
      const finished = await readDemo(page);
      expect(finished.bookings.filter(item => item.id === bookingId)).toHaveLength(1);
      expect(finished.bookings.find(item => item.id === bookingId)?.status).toBe("completed");
      expect(finished.sessions.find(item => item.id === booking.sessionId)?.rating).toBe(5);
    });
    expect(runtimeErrors).toEqual([]);
  });
}
