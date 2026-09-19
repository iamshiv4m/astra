import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DurationChoice } from "@/features/booking/duration-choice";
import { ProfileForm } from "@/features/client/profile-form";
import { BookingFlow, BookingScreen } from "@/features/booking/booking-screen";
import { createSeed, getSlots, bookConsultation } from "@/lib/domain";
import { DemoProvider } from "@/lib/store";
import type { DemoActions, DemoState } from "@/types/domain";
import { restoreDraft, selectionValid, bookingIntent, partitionBookings, countdown, validateProfile, joinMode } from "@/features/booking/flow";
import type { Booking, Client, Slot } from "@/types/domain";

const slot: Slot = { start: "2026-09-19T10:00:00.000Z", end: "2026-09-19T10:30:00.000Z", available: true };
const booking = (id: string, start: string, status: Booking["status"] = "confirmed", clientId = "shivam"): Booking => ({
  id, start, end: new Date(new Date(start).getTime() + 1800000).toISOString(), status, clientId,
  astrologerId: "ananya", astrologerName: "Ananya", sessionId: `session-${id}`, duration: 30, price: 149900, paymentStatus: "paid", topic: "",
});
const profile: Client = { id: "shivam", name: "Shivam", email: "hi@example.com", mobile: "", language: "English" };
const replace = vi.fn();
vi.mock("next/navigation", () => ({useRouter: () => ({replace, push: vi.fn()})}));
afterEach(() => {cleanup(); localStorage.clear(); vi.clearAllMocks();});

describe("complete booking journey", () => {
  it("uses the app shell main landmark without nesting another main", () => {
    const {container} = render(<main id="main-content"><DemoProvider><BookingScreen astrologerId="ananya-sharma" query={{}} /></DemoProvider></main>);
    expect(container.querySelectorAll("main")).toHaveLength(1);
  });
  it("keeps the same payment request when retrying and confirms only once", () => {
    let state: DemoState = {...createSeed("2026-09-19"), clientId: "shivam", scenario: "payment-failure"};
    const advisor = state.astrologers[0];
    const selected = getSlots(state, advisor.id, state.seedDate, 30)[0];
    const book = vi.fn((input) => bookConsultation(state, input).booking);
    const actions = {book} as unknown as DemoActions;
    const {rerender} = render(<BookingFlow astrologer={advisor} state={state} actions={actions} query={{date: state.seedDate, duration: "30", start: selected.start}} />);
    fireEvent.click(screen.getByRole("button", {name: /Confirm & book/}));
    expect(screen.getByRole("alert")).toHaveTextContent("Nothing was charged or booked");
    const requestId = book.mock.calls[0][0].requestId;
    state = {...state, scenario: "normal"};
    rerender(<BookingFlow astrologer={advisor} state={state} actions={actions} query={{date: state.seedDate, duration: "30", start: selected.start}} />);
    fireEvent.click(screen.getByRole("button", {name: /Confirm & book/}));
    expect(book.mock.calls[1][0].requestId).toBe(requestId);
    expect(book).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("heading", {name: "You’re all set."})).toBeVisible();
    expect(screen.getByRole("link", {name: /View my booking/})).toHaveAttribute("href", expect.stringContaining("/dashboard/bookings/booking-request-"));
    expect(localStorage.getItem(`ASTRA:booking-draft:v1:${advisor.id}`)).toBeNull();
  });
  it("requires sign-in without dropping date, duration, and selected time", () => {
    const state = createSeed("2026-09-19");
    const advisor = state.astrologers[0];
    const selected = getSlots(state, advisor.id, state.seedDate, 45)[0];
    render(<BookingFlow astrologer={advisor} state={state} actions={{} as DemoActions} query={{date: state.seedDate, duration: "45", start: selected.start}} />);
    const url = new URL(screen.getByRole("link", {name: /Sign in to confirm/}).getAttribute("href")!, "https://astra.test");
    const intent = new URL(url.searchParams.get("next")!, "https://astra.test");
    expect(intent.searchParams.get("duration")).toBe("45");
    expect(intent.searchParams.get("start")).toBe(selected.start);
    expect(screen.queryByRole("button", {name: /Confirm & book/})).not.toBeInTheDocument();
  });
  it("does not submit a stale time when shared availability changes", () => {
    const state = {...createSeed("2026-09-19"), clientId: "shivam"};
    const advisor = state.astrologers[0];
    const selected = getSlots(state, advisor.id, state.seedDate, 30)[0];
    const book = vi.fn();
    const actions = {book} as unknown as DemoActions;
    const {rerender} = render(<BookingFlow astrologer={advisor} state={state} actions={actions} query={{date: state.seedDate, start: selected.start}} />);
    const occupied = bookConsultation(state, {astrologerId: advisor.id, start: selected.start, duration: 30, requestId: "another-tab"}).state;
    rerender(<BookingFlow astrologer={advisor} state={occupied} actions={actions} query={{date: state.seedDate, start: selected.start}} />);
    expect(screen.getByRole("button", {name: /Confirm & book/})).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("no longer available");
    expect(book).not.toHaveBeenCalled();
  });
});

describe("booking controls", () => {
  it("exposes all durations and updates the selected duration", () => {
    const change = vi.fn();
    render(<DurationChoice value={30} prices={{30: 149900, 45: 199900, 60: 249900}} onChange={change} />);
    expect(screen.getByRole("radio", {name: /30 minutes/})).toBeChecked();
    fireEvent.click(screen.getByRole("radio", {name: /45 minutes/}));
    expect(change).toHaveBeenCalledWith(45);
  });
  it("validates the profile, saves edits, and cancels back to stored values", () => {
    const save = vi.fn();
    render(<ProfileForm client={profile} today="2026-09-19" onSave={save} />);
    fireEvent.change(screen.getByLabelText("Full name"), {target: {value: ""}});
    fireEvent.click(screen.getByRole("button", {name: "Save changes"}));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByText("Please enter your name.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", {name: "Cancel"}));
    expect(screen.getByLabelText("Full name")).toHaveValue("Shivam");
    fireEvent.change(screen.getByLabelText("Full name"), {target: {value: "Shivam Jha"}});
    fireEvent.click(screen.getByRole("button", {name: "Save changes"}));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({name: "Shivam Jha"}));
  });
  it("keeps failed profile saves visible without claiming persistence", () => {
    render(<ProfileForm client={profile} today="2026-09-19" onSave={() => { throw new Error("Storage unavailable"); }} />);
    fireEvent.click(screen.getByRole("button", {name: "Save changes"}));
    expect(screen.getByRole("alert")).toHaveTextContent("Storage unavailable");
    expect(screen.queryByText("Your profile has been saved.")).not.toBeInTheDocument();
  });
  it("does not claim a persistent profile save when the store reports a storage warning", () => {
    const {rerender} = render(<ProfileForm client={profile} today="2026-09-19" onSave={() => {}} />);
    fireEvent.click(screen.getByRole("button", {name: "Save changes"}));
    rerender(<ProfileForm client={profile} today="2026-09-19" onSave={() => {}} saveWarning="Changes were not saved to this browser." />);
    expect(screen.queryByText("Your profile has been saved.")).not.toBeInTheDocument();
  });
  it("keeps birth details private until the client explicitly opts in", () => {
    const save = vi.fn();
    render(<ProfileForm client={profile} today="2026-09-19" onSave={save} />);
    const consent = screen.getByRole("checkbox", {name: /Share my birth details/});
    expect(consent).not.toBeChecked();
    fireEvent.click(consent);
    fireEvent.click(screen.getByRole("button", {name: "Save changes"}));
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({birthDetailsConsent: true}));
    fireEvent.click(consent);
    fireEvent.click(screen.getByRole("button", {name: "Save changes"}));
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({birthDetailsConsent: false}));
  });
});

describe("booking intent", () => {
  it("restores an explicit profile choice before a saved draft", () => {
    const draft = restoreDraft("ananya", { duration: "45", date: "2026-09-19", start: slot.start }, JSON.stringify({ version: 1, astrologerId: "ananya", duration: 60, date: "2026-09-20", start: "", topic: "Career", requestId: "keep" }), "2026-09-19");
    expect(draft.duration).toBe(45);
    expect(draft.start).toBe(slot.start);
    expect(draft.requestId).not.toBe("keep");
  });
  it("preserves request identity when restoring the same payment attempt", () => {
    const draft = restoreDraft("ananya", {}, JSON.stringify({ version: 1, astrologerId: "ananya", duration: 60, date: "2026-09-20", start: slot.start, topic: "Career", requestId: "keep" }), "2026-09-19");
    expect(draft.requestId).toBe("keep");
    expect(draft.duration).toBe(60);
  });
  it("safely ignores malformed drafts and invalid durations", () => {
    const draft = restoreDraft("ananya", { duration: "999", date: "not-a-day" }, "{bad", "2026-09-19");
    expect(draft.duration).toBe(30);
    expect(draft.date).toBe("2026-09-19");
    expect(draft.start).toBe("");
  });
  it("revalidates slots rather than trusting a stale selected time", () => {
    expect(selectionValid(slot.start, [slot])).toBe(true);
    expect(selectionValid(slot.start, [{ ...slot, available: false }])).toBe(false);
    expect(selectionValid(slot.start, [])).toBe(false);
  });
  it("retains selection in a safe internal login return URL", () => {
    const draft = restoreDraft("ananya", { duration: "45", date: "2026-09-19", start: slot.start }, null, "2026-09-19");
    const url = new URL(bookingIntent("ananya", draft), "https://astra.test");
    expect(url.pathname).toBe("/booking/ananya");
    expect(url.searchParams.get("duration")).toBe("45");
    expect(url.searchParams.get("start")).toBe(slot.start);
  });
  it("accepts the public profile time query and preserves it through sign-in", () => {
    const draft = restoreDraft("ananya", {duration: "45", date: "2026-09-19", time: slot.start}, null, "2026-09-19");
    expect(draft.start).toBe(slot.start);
    const url = new URL(bookingIntent("ananya", draft), "https://astra.test");
    expect(url.searchParams.get("start")).toBe(slot.start);
  });
});

describe("client workspace", () => {
  it("derives owned upcoming and past records from one booking source", () => {
    const records = [booking("2", "2026-09-20T10:00:00Z"), booking("1", "2026-09-19T10:00:00Z"), booking("old", "2026-09-18T10:00:00Z", "completed"), booking("foreign", "2026-09-19T10:00:00Z", "confirmed", "other")];
    const result = partitionBookings(records, "shivam", Date.parse("2026-09-19T09:00:00Z"));
    expect(result.upcoming.map(item => item.id)).toEqual(["1", "2"]);
    expect(result.past.map(item => item.id)).toEqual(["old"]);
  });
  it("uses simulated now for countdown, never the machine clock", () => {
    expect(countdown("2026-09-19T10:30:00Z", Date.parse("2026-09-19T09:00:00Z"))).toBe("1h 30m");
    expect(countdown("2026-09-19T10:30:00Z", Date.parse("2026-09-19T10:31:00Z"))).toBe("Ready to join");
  });
  it("offers scheduled joining only inside the join window", () => {
    const item = booking("1", "2026-09-19T10:00:00Z");
    expect(joinMode(item, Date.parse("2026-09-19T09:00:00Z"))).toBe("demo");
    expect(joinMode(item, Date.parse("2026-09-19T09:51:00Z"))).toBe("join");
    expect(joinMode({ ...item, status: "completed" }, Date.parse("2026-09-19T09:51:00Z"))).toBe("recap");
  });
  it("allows optional birth data and unknown birth time", () => {
    expect(validateProfile(profile, "2026-09-19")).toEqual({});
    expect(validateProfile({ ...profile, birthDate: "2000-01-01", birthTime: "" }, "2026-09-19")).toEqual({});
  });
  it("rejects future birth dates and invalid email without losing form values", () => {
    const errors = validateProfile({ ...profile, name: " ", email: "invalid", birthDate: "2027-01-01" }, "2026-09-19");
    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.birthDate).toBeTruthy();
  });
  it("rejects impossible dates and malformed optional birth times", () => {
    const errors = validateProfile({ ...profile, birthDate: "2000-02-31", birthTime: "25:61" }, "2026-09-19");
    expect(errors.birthDate).toBeTruthy();
    expect(errors.birthTime).toBeTruthy();
  });
  it("rejects a name longer than the shared profile limit", () => {
    expect(validateProfile({...profile, name: "A".repeat(81)}, "2026-09-19").name).toBeTruthy();
  });
});
