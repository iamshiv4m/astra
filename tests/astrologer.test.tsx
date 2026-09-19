import { describe, expect, it } from "vitest";
import {
  clientGroups,
  filterSessions,
  profilePatch,
  scheduleError,
  workspaceMetrics,
  workspaceRating,
} from "@/features/astrologer/helpers";
import type { Booking, Client, Schedule, Session } from "@/types/domain";
import { fireEvent, render, screen } from "@testing-library/react";
import { DemoProvider, STORAGE_KEY, useDemo } from "@/lib/store";
import { createSeed } from "@/lib/domain";
import { AstrologerAvailability } from "@/features/astrologer/availability";
import { AstrologerProfile } from "@/features/astrologer/profile";
import { ClientDetails, SessionActions } from "@/features/astrologer/workspace";

const now = Date.parse("2026-09-19T03:30:00Z");
const booking = (
  id: string,
  start: string,
  status: Booking["status"] = "confirmed",
  astrologerId = "ananya"
): Booking => ({
  id,
  astrologerId,
  clientId: "rahul",
  sessionId: `session-${id}`,
  start,
  end: new Date(Date.parse(start) + 30 * 60000).toISOString(),
  duration: 30,
  price: 149900,
  status,
  paymentStatus: "paid",
  topic: "Career",
  astrologerName: "Ananya",
});
const records = [
  booking("today", "2026-09-19T04:30:00Z"),
  booking("next", "2026-09-20T04:30:00Z"),
  booking("done", "2026-09-18T04:30:00Z", "completed"),
  booking("foreign", "2026-09-19T04:30:00Z", "confirmed", "other"),
];
const schedule: Schedule = {
  astrologerId: "ananya",
  windows: [{ day: 6, start: "09:00", end: "19:00" }],
  overrides: [],
  blocks: [],
};
const clients: Client[] = [
  { id: "rahul", name: "Rahul Mehta", email: "rahul@example.com", mobile: "", language: "English" },
];

describe("astrologer workspace records", () => {
  it("filters today by IST and keeps other astrologers private", () => {
    expect(filterSessions(records, "ananya", "today", now).map(b => b.id)).toEqual(["today"]);
    expect(filterSessions(records, "ananya", "upcoming", now).map(b => b.id)).toEqual(["today", "next"]);
    expect(filterSessions(records, "ananya", "past", now).map(b => b.id)).toEqual(["done"]);
  });
  it("separates earned money from upcoming booked value", () => {
    expect(workspaceMetrics(records, "ananya", now)).toEqual({
      earnings: 149900,
      bookedValue: 299800,
      completed: 1,
      upcoming: 2,
      today: 1,
    });
  });
  it("groups searchable clients with their actual consultation history", () => {
    const groups = clientGroups(records, clients, "ananya", "MEHTA");
    expect(groups).toHaveLength(1);
    expect(groups[0].bookings).toHaveLength(3);
    expect(clientGroups(records, clients, "other", "missing")).toEqual([]);
  });
  it("uses only ratings for this astrologer's completed consultations", () => {
    const sessions = [
      { bookingId: "done", rating: 4, status: "ended" },
      { bookingId: "foreign", rating: 1, status: "ended" },
      { bookingId: "today", rating: 2, status: "waiting" },
    ] as Session[];
    expect(workspaceRating(records, sessions, "ananya")).toEqual({ rating: 4, count: 1 });
    expect(workspaceRating(records, [], "ananya")).toEqual({ rating: null, count: 0 });
  });
});

describe("availability editing", () => {
  it("accepts adjacent windows and rejects reversed or malformed times", () => {
    expect(scheduleError(schedule)).toBe("");
    expect(scheduleError({ ...schedule, windows: [{ day: 0, start: "18:00", end: "09:00" }] })).toMatch(/end/i);
    expect(scheduleError({ ...schedule, windows: [{ day: 0, start: "25:00", end: "26:00" }] })).toMatch(/time/i);
    expect(
      scheduleError({
        ...schedule,
        windows: [
          { day: 0, start: "09:00", end: "10:00" },
          { day: 0, start: "10:00", end: "11:00" },
        ],
      })
    ).toBe("");
  });
  it("rejects overlapping weekly and date-specific windows", () => {
    expect(
      scheduleError({ ...schedule, windows: [...schedule.windows, { day: 6, start: "10:00", end: "12:00" }] })
    ).toMatch(/overlap/i);
    expect(
      scheduleError({
        ...schedule,
        overrides: [
          {
            date: "2026-09-20",
            windows: [
              { start: "10:00", end: "12:00" },
              { start: "11:00", end: "13:00" },
            ],
          },
        ],
      })
    ).toMatch(/overlap/i);
  });
  it("permits a closed date and validates blocked intervals", () => {
    expect(scheduleError({ ...schedule, overrides: [{ date: "2026-09-20", windows: [] }] })).toBe("");
    expect(scheduleError({ ...schedule, blocks: [{ date: "2026-09-20", start: "12:00", end: "11:00" }] })).toMatch(
      /end/i
    );
  });
});

describe("professional profile", () => {
  const input = {
    bio: "Thoughtful guidance.",
    expertise: "Vedic, Career",
    languages: "English, Hindi",
    style: "Practical",
    price30: "1499",
    price45: "1999",
    price60: "2499",
  };
  it("converts rupees to paise and normalizes comma-separated specialties", () => {
    expect(profilePatch(input)).toMatchObject({
      prices: { 30: 149900, 45: 199900, 60: 249900 },
      expertise: ["Vedic", "Career"],
      languages: ["English", "Hindi"],
    });
  });

  it("rejects zero prices and empty profile content", () => {
    expect(() => profilePatch({ ...input, price30: "0" })).toThrow(/price/i);
    expect(() => profilePatch({ ...input, bio: " " })).toThrow(/bio/i);
  });
});

function ReadyEditor({ profile = false }: { profile?: boolean }) {
  const { ready } = useDemo();
  return ready ? profile ? <AstrologerProfile /> : <AstrologerAvailability /> : null;
}

function mountEditor(profile = false) {
  const state = createSeed("2026-09-19");
  state.astrologerId = "ananya-sharma";
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render(
    <DemoProvider>
      <ReadyEditor profile={profile} />
    </DemoProvider>
  );
  return state;
}

describe("availability form integration", () => {
  it("keeps the editor usable when its optional preview date is cleared", () => {
    mountEditor();
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "" } });
    expect(screen.getByRole("heading", { name: "Choose a date" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add date hours" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/valid.*date/i);
  });
  it("rejects a booked-day closure and keeps every existing booking unchanged", () => {
    const state = mountEditor();
    fireEvent.click(screen.getByRole("button", { name: "Close entire date" }));
    fireEvent.click(screen.getByRole("button", { name: "Save availability" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/conflicts.*booking/);
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.bookings).toEqual(state.bookings);
    expect(persisted.schedules).toEqual(state.schedules);
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("persists a nonconflicting block through the shared store", () => {
    mountEditor();
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-09-21" } });
    fireEvent.click(screen.getByRole("button", { name: "Block interval" }));
    fireEvent.click(screen.getByRole("button", { name: "Save availability" }));
    expect(screen.getByRole("status")).toHaveTextContent("Availability saved");
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.schedules.find((s: Schedule) => s.astrologerId === "ananya-sharma").blocks).toContainEqual({
      date: "2026-09-21",
      start: "09:00",
      end: "17:00",
    });
  });
});

describe("professional profile integration", () => {
  it("updates new-session prices without changing booked price snapshots", () => {
    const state = mountEditor(true);
    fireEvent.change(screen.getByLabelText("30 minutes · ₹"), { target: { value: "1700" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByRole("status")).toHaveTextContent("Profile saved");
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.astrologers.find((a: { id: string }) => a.id === "ananya-sharma").prices[30]).toBe(170000);
    expect(persisted.bookings).toEqual(state.bookings);
  });

  describe("session and client details", () => {
    it("keeps future demo links separate from scheduled joining", () => {
      const item = records[0];
      const { rerender } = render(<SessionActions booking={item} now={now} />);
      expect(screen.getByRole("link", { name: /Start demo now/ })).toHaveAttribute(
        "href",
        `/session/${item.sessionId}?demo=1`
      );
      expect(screen.queryByRole("link", { name: /Join session/ })).not.toBeInTheDocument();
      rerender(<SessionActions booking={item} now={Date.parse(item.start) - 9 * 60000} />);
      expect(screen.getByRole("link", { name: /Join session/ })).toHaveAttribute("href", `/session/${item.sessionId}`);
      rerender(<SessionActions booking={{ ...item, status: "completed" }} now={now} />);
      expect(screen.queryByRole("link", { name: /Start demo now/ })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /View recap/ })).toBeInTheDocument();
    });
    it("hides optional birth details unless the client explicitly shares them", () => {
      const state = createSeed("2026-09-19");
      state.astrologerId = "ananya-sharma";
      const client = { ...state.clients[0], birthDetailsConsent: false };
      const { rerender } = render(<ClientDetails client={client} state={state} onClose={() => {}} />);
      expect(screen.queryByText("New Delhi")).not.toBeInTheDocument();
      expect(screen.getByText(/has not given permission/)).toBeInTheDocument();
      const sharedClient = { ...client, birthDetailsConsent: true };
      rerender(<ClientDetails client={sharedClient} state={state} onClose={() => {}} />);
      expect(screen.getByText("New Delhi")).toBeInTheDocument();
    });
  });
});
