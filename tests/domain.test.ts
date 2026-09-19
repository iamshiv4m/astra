import { describe, expect, it } from "vitest";
import {
  addDays,
  bookConsultation,
  calendarText,
  createSeed,
  dateKey,
  endConsultation,
  getSlots,
  joinConsultation,
  login,
  money,
  rateConsultation,
  replyMessage,
  retryMessage,
  saveSchedule,
  sendMessage,
  updateAstrologer,
  updateClient,
  validateSnapshot,
} from "../src/lib/domain";
import { createServices } from "../src/services/demo";

const seed = () => createSeed("2026-09-19");
const signedIn = () => login(seed(), "client");

describe("deterministic shared demo data", () => {
  it("creates the required linked inventory with an IST clock and no identity", () => {
    const state = seed();
    expect(state).toEqual(seed());
    expect(dateKey(state.now)).toBe("2026-09-19");
    expect(new Date(state.now).toISOString()).toBe("2026-09-19T03:30:00.000Z");
    expect(state.astrologers).toHaveLength(10);
    expect(state.astrologers.map(advisor => advisor.image)).toEqual(
      Array.from({ length: 10 }, (_, index) => `/portraits/${index + 1}.jpg`)
    );
    expect(state.bookings).toHaveLength(10);
    expect(state.sessions.filter(s => s.status === "ended")).toHaveLength(5);
    expect(state.messages).toHaveLength(20);
    expect(state.testimonials).toHaveLength(5);
    expect(state.clientId).toBeNull();
    expect(state.astrologerId).toBeNull();
    expect(state.astrologers[0].prices[30]).toBe(149900);
    expect(state.astrologers[1].prices[45]).toBe(199900);
    expect(state.astrologers[2].prices[30]).toBe(99900);
    expect(state.astrologers[0]).toMatchObject({ experience: 12, consultations: 2300 });
    expect(state.astrologers[1]).toMatchObject({
      experience: 15,
      expertise: expect.arrayContaining(["Career", "Finance"]),
    });
    expect(state.astrologers[2]).toMatchObject({
      experience: 9,
      expertise: expect.arrayContaining(["Relationships", "Marriage"]),
    });
    expect(state.astrologers.flatMap(a => getSlots(state, a.id, state.seedDate, 30)).length).toBeGreaterThan(20);
  });
  it("formats calendar dates independently of browser timezone", () => {
    expect(dateKey("2026-09-18T20:00:00Z")).toBe("2026-09-19");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(money(149900)).toBe("₹1,499");
  });
});

describe("availability and atomic bookings", () => {
  it("offers 15-minute starts fitting the full duration without occupied intervals", () => {
    const state = seed();
    for (const duration of [30, 45, 60] as const) {
      const slots = getSlots(state, "ananya-sharma", state.seedDate, duration);
      expect(slots.every(s => new Date(s.start).getUTCMinutes() % 15 === 0)).toBe(true);
      expect(slots.every(s => Date.parse(s.end) - Date.parse(s.start) === duration * 60000)).toBe(true);
      expect(slots.some(s => s.start === "2026-09-19T04:30:00.000Z")).toBe(false);
      expect(slots.every(s => Date.parse(s.start) > state.now)).toBe(true);
    }
    expect(getSlots(state, "ananya-sharma", addDays(state.seedDate, 30), 30)).toEqual([]);
  });
  it("resolves overrides and blocked intervals, exposes disabled slots", () => {
    const state = seed();
    const schedule = state.schedules[1];
    schedule.overrides = [{ date: state.seedDate, windows: [{ start: "14:00", end: "15:00" }] }];
    schedule.blocks = [{ date: state.seedDate, start: "14:15", end: "14:30" }];
    const slots = getSlots(state, schedule.astrologerId, state.seedDate, 30, true);
    expect(slots).toHaveLength(3);
    expect(slots.filter(s => s.available)).toHaveLength(1);
    expect(slots[0].reason).toMatch(/blocked/i);
  });
  it("confirms once, snapshots prices, and rejects a stale slot and failed payment without writes", () => {
    const state = signedIn();
    const slot = getSlots(state, "ananya-sharma", state.seedDate, 30)[0];
    const input = { astrologerId: "ananya-sharma", start: slot.start, duration: 30 as const, requestId: "one" };
    const result = bookConsultation(state, input);
    expect(result.state.bookings).toHaveLength(11);
    expect(result.state.sessions).toHaveLength(11);
    expect(bookConsultation(result.state, input).state).toBe(result.state);
    expect(() => bookConsultation(result.state, { ...input, requestId: "two" })).toThrow(/available/i);
    expect(() => bookConsultation({ ...state, scenario: "payment-failure" }, input)).toThrow(/payment/i);
    expect(state.bookings).toHaveLength(10);
    const edited = updateAstrologer(login(result.state, "astrologer"), "ananya-sharma", {
      prices: { 30: 200000, 45: 250000, 60: 300000 },
    });
    expect(edited.bookings.at(-1)?.price).toBe(149900);
    expect(() => bookConsultation(seed(), input)).toThrow(/sign in/i);
  });
  it("rejects invalid and booking-conflicting schedule changes", () => {
    const state = login(seed(), "astrologer");
    const schedule = state.schedules[0];
    expect(() => saveSchedule(state, { ...schedule, windows: [{ day: 1, start: "18:00", end: "09:00" }] })).toThrow(
      /range|window/i
    );
    expect(() =>
      saveSchedule(state, { ...schedule, blocks: [{ date: state.seedDate, start: "10:00", end: "11:00" }] })
    ).toThrow(/booking-6/);
    expect(() => saveSchedule(state, { ...schedule, overrides: [{ date: state.seedDate, windows: [] }] })).toThrow(
      /booking/
    );
  });
});

describe("identities and consultation lifecycle", () => {
  it("matches default identity, creates fictional clients and validates owner edits", () => {
    expect(signedIn().clientId).toBe("shivam");
    const state = login(seed(), "client", "Asha", "asha@example.test");
    expect(state.clients.find(c => c.id === state.clientId)?.name).toBe("Asha");
    expect(login(state, "client", "Asha", "asha@example.test").clients).toHaveLength(state.clients.length);
    expect(updateClient(state, { name: "Asha Rao", id: "shivam" }).clientId).toBe(state.clientId);
    expect(() => updateClient(state, { name: "" })).toThrow(/name/i);
    expect(() => updateAstrologer(state, "ananya-sharma", { bio: "no" })).toThrow(/sign in|own/i);
  });
  it("guards ownership and regular joins; demo shortcut preserves booked times", () => {
    const state = signedIn();
    expect(() => joinConsultation(state, "session-6", true)).toThrow(/own|access/i);
    expect(() => joinConsultation(state, "session-9")).toThrow(/10 minutes/i);
    const joined = joinConsultation(state, "session-9", true);
    expect(joined.bookings[8].start).toBe(state.bookings[8].start);
    expect(joined.sessions[8].startedAt).toBe(new Date(state.now).toISOString());
    expect(joined.bookings[8].status).toBe("active");
    const ended = endConsultation(joined, "session-9");
    expect(ended.bookings[8].status).toBe("completed");
    expect(endConsultation(ended, "session-9")).toBe(ended);
    expect(() => joinConsultation(ended, "session-9", true)).toThrow(/completed|ended/i);
    expect(() => rateConsultation(ended, "session-9", 0, "")).toThrow(/rating/i);
    const rated = rateConsultation(ended, "session-9", 5, "Helpful");
    expect(rateConsultation(rated, "session-9", 5, "Helpful")).toEqual(rated);
  });
  it("sends, retries, reads, and replies once without empty messages or post-end callbacks", () => {
    const state = joinConsultation(signedIn(), "session-9", true);
    expect(() => sendMessage(state, "session-9", "   ")).toThrow(/message/i);
    const failed = sendMessage({ ...state, scenario: "error" }, "session-9", "Career guidance?");
    expect(failed.messages.at(-1)?.status).toBe("failed");
    const sent = retryMessage({ ...failed, scenario: "normal" }, failed.messages.at(-1)!.id);
    const replied = replyMessage(sent, "session-9");
    expect(replied.messages).toHaveLength(sent.messages.length + 1);
    expect(replied.messages.at(-2)?.status).toBe("read");
    expect(replyMessage(replied, "session-9")).toBe(replied);
    const ended = endConsultation(replied, "session-9");
    expect(replyMessage(ended, "session-9")).toBe(ended);
    expect(() => sendMessage(ended, "session-9", "Late")).toThrow(/ended/i);
  });
  it("exports actual UTC booking instants with stable calendar identity", () => {
    const booking = seed().bookings[8];
    const ics = calendarText(booking);
    expect(ics).toContain("UID:booking-9@astra.demo");
    expect(ics).toContain("DTSTART:20260919T130000Z");
    expect(ics).toContain("DTEND:20260919T133000Z");
  });
});

describe("storage contracts and service adapters", () => {
  it("migrates only known legacy seed portrait URLs without replacing edited advisor records", () => {
    const state = seed();
    state.astrologers[0] = {
      ...state.astrologers[0],
      image: "/portraits/ananya-sharma.svg",
      bio: "My edited biography.",
      name: "Ananya Updated",
      prices: { 30: 170000, 45: 230000, 60: 290000 },
    };
    state.astrologers[1].image = "/portraits/custom-raghav.jpg";
    state.astrologers[2].image = "/custom/meera-kapoor.svg";
    const migrated = validateSnapshot(state);
    expect(migrated.astrologers[0]).toEqual({ ...state.astrologers[0], image: "/portraits/1.jpg" });
    expect(migrated.astrologers[1]).toEqual(state.astrologers[1]);
    expect(migrated.astrologers[2]).toEqual(state.astrologers[2]);
    expect({ ...migrated, astrologers: state.astrologers }).toEqual(state);
    expect(state.astrologers[0].image).toBe("/portraits/ananya-sharma.svg");
  });
  it("preserves explicit birth-detail consent without granting it by default", () => {
    const state = seed();
    const consenting = {
      ...state,
      clients: state.clients.map(client => ({ ...client, birthDetailsConsent: client.id === "shivam" })),
    };
    expect(validateSnapshot(consenting).clients[0]).toMatchObject({ birthDetailsConsent: true });
    expect(validateSnapshot(consenting).clients[1]).toMatchObject({ birthDetailsConsent: false });
    expect(validateSnapshot(state).clients[0]).not.toHaveProperty("birthDetailsConsent");
    expect(() =>
      validateSnapshot({
        ...state,
        clients: [{ ...state.clients[0], birthDetailsConsent: "yes" }, ...state.clients.slice(1)],
      })
    ).toThrow();
  });
  it("accepts linked snapshots and rejects wrong versions, malformed fields, foreign links", () => {
    expect(validateSnapshot(JSON.parse(JSON.stringify(seed())))).toEqual(seed());
    expect(() => validateSnapshot({ ...seed(), version: 2 })).toThrow(/saved|snapshot/i);
    expect(() => validateSnapshot({ ...seed(), now: "yesterday" })).toThrow();
    expect(() => validateSnapshot({ ...seed(), bookings: [{ ...seed().bookings[0], clientId: "missing" }] })).toThrow();
    expect(() =>
      validateSnapshot({ ...seed(), astrologers: [{ ...seed().astrologers[0], prices: { 30: -1 } }] })
    ).toThrow();
  });
  it("service adapters share the same authoritative repository", async () => {
    let state = seed();
    const services = createServices({
      getState: () => state,
      commit: next => {
        state = next;
      },
    });
    await services.auth.login("client");
    expect((await services.profile.currentClient())?.id).toBe("shivam");
    expect(await services.astrologer.list()).toHaveLength(10);
    const slots = await services.availability.slots("ananya-sharma", state.seedDate, 30);
    const booking = await services.booking.confirm({
      astrologerId: "ananya-sharma",
      duration: 30,
      start: slots[0].start,
      requestId: "service",
    });
    expect((await services.payment.receipt(booking.id)).simulated).toBe(true);
    await services.session.join(booking.sessionId, true);
    await services.video.toggle(booking.sessionId, "muted");
    expect(state.sessions.at(-1)?.muted).toBe(true);
    await services.chat.send(booking.sessionId, "Hello");
    expect((await services.notification.list()).some(n => n.bookingId === booking.id)).toBe(true);
  });
});
