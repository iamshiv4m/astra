import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Astrologer } from "@/types/domain";
import { defaultFilters, filterAstrologers } from "@/features/discovery/filters";
import { safeDestination, validateIdentity } from "@/features/auth/helpers";
import { createSeed, getSlots } from "@/lib/domain";
import { AstrologerProfile } from "@/features/discovery/profile-screen";
import { DiscoveryScreen } from "@/features/discovery/discovery-screen";
import { AuthScreen } from "@/features/auth/auth-screen";
import { readFileSync } from "node:fs";

const mock = vi.hoisted(() => ({
  snapshot: {} as Record<string, unknown>,
  push: vi.fn(),
  params: new URLSearchParams(),
}));
vi.mock("@/lib/store", () => ({ useDemo: () => mock.snapshot }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mock.push }), useSearchParams: () => mock.params }));

const advisor = (patch: Partial<Astrologer>): Astrologer => ({
  id: "ananya-sharma",
  name: "Ananya Sharma",
  title: "Vedic astrologer",
  specialty: "Vedic",
  expertise: ["Career", "Relationships"],
  experience: 12,
  languages: ["English", "Hindi"],
  rating: 4.9,
  consultations: 2400,
  gender: "Female",
  image: "",
  color: "",
  bio: "",
  style: "",
  prices: { 30: 149900, 45: 199900, 60: 249900 },
  featured: true,
  reviews: [],
  ...patch,
});
const advisors = [
  advisor({}),
  advisor({
    id: "meera",
    name: "Meera",
    specialty: "Tarot",
    experience: 6,
    rating: 4.7,
    languages: ["English"],
    prices: { 30: 99900, 45: 139900, 60: 189900 },
    featured: false,
  }),
  advisor({
    id: "raghav",
    name: "Raghav",
    gender: "Male",
    experience: 18,
    rating: 4.8,
    languages: ["Hindi"],
    featured: false,
  }),
];

describe("public supporting text contrast", () => {
  it.each([
    ["discovery/discovery", "filterNote"],
    ["discovery/discovery", "sampleNotice"],
    ["discovery/discovery", "helpStrip p"],
    ["discovery/profile", "sessionDetails p"],
    ["discovery/profile", "reviewNotice"],
    ["discovery/profile", "reviewTopic"],
    ["discovery/profile", "disclaimer"],
    ["discovery/profile", "bookingHeader p"],
    ["discovery/profile", "calendarLabel span"],
    ["discovery/profile", "slotHint"],
    ["discovery/profile", "total small"],
    ["discovery/profile", "bookingFootnote"],
    ["discovery/profile", "mobileCta small"],
    ["auth/auth", "divider"],
    ["auth/auth", "privacy"],
  ])("%s .%s meets AA contrast on the cream surface", (module, selector) => {
    const css = readFileSync(`src/features/${module}.module.css`, "utf8");
    const globalCss = readFileSync("src/app/globals.css", "utf8");
    const color = css.match(new RegExp(`\\.${selector}\\s*\\{[^}]*color:\\s*([^;]+)`))![1].trim();
    const resolve = (value: string) =>
      value.startsWith("var(") ? globalCss.match(new RegExp(`${value.slice(4, -1)}:\\s*(#[a-fA-F0-9]+)`))![1] : value;
    const luminance = (hex: string) => {
      const channels = hex
        .slice(1)
        .match(/.{2}/g)!
        .map(value => {
          const channel = parseInt(value, 16) / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const background = luminance(resolve("var(--cream)"));
    const foreground = luminance(resolve(color));
    expect((background + 0.05) / (foreground + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("advisor discovery", () => {
  it("searches name and expertise without case or surrounding-space sensitivity", () => {
    expect(filterAstrologers(advisors, { ...defaultFilters, search: " ANANYA " }).map(a => a.id)).toEqual([
      "ananya-sharma",
    ]);
    expect(filterAstrologers(advisors, { ...defaultFilters, search: "career" })).toHaveLength(3);
  });
  it("combines all seven filter categories", () => {
    const filters = {
      ...defaultFilters,
      specialty: "Vedic",
      experience: "10",
      language: "Hindi",
      price: "1500",
      rating: "4.8",
      availability: "today",
      gender: "Female",
    };
    expect(filterAstrologers(advisors, filters, new Set(["ananya-sharma"]))).toEqual([advisors[0]]);
    expect(filterAstrologers(advisors, filters, new Set())).toEqual([]);
  });
  it("sorts by recommendation, rating, experience and actual 30-minute price", () => {
    expect(filterAstrologers(advisors, defaultFilters)[0].id).toBe("ananya-sharma");
    expect(filterAstrologers(advisors, { ...defaultFilters, sort: "rating" })[0].id).toBe("ananya-sharma");
    expect(filterAstrologers(advisors, { ...defaultFilters, sort: "experience" })[0].id).toBe("raghav");
    expect(filterAstrologers(advisors, { ...defaultFilters, sort: "price" })[0].id).toBe("meera");
    expect(advisors.map(a => a.id)).toEqual(["ananya-sharma", "meera", "raghav"]);
  });
  it("returns an empty result for an unmatched search", () => {
    expect(filterAstrologers(advisors, { ...defaultFilters, search: "no such advisor" })).toEqual([]);
  });
});

describe("demo identity", () => {
  it("preserves a safe booking draft URL and defaults to the correct dashboard", () => {
    const draft = "/booking/ananya-sharma?date=2026-09-20&time=10%3A00&duration=45";
    expect(safeDestination(draft)).toBe(draft);
    expect(safeDestination("/dashboard/bookings/booking-1")).toBe("/dashboard/bookings/booking-1");
    expect(safeDestination(null)).toBe("/dashboard");
    expect(safeDestination("/astrologer/availability", "astrologer")).toBe("/astrologer/availability");
    expect(safeDestination(null, "astrologer")).toBe("/astrologer/dashboard");
  });
  it("restores guarded consultation deep links for either demo role", () => {
    const room = "/session/session-9?demo=1";
    expect(safeDestination(room)).toBe(room);
    expect(safeDestination(room, "astrologer")).toBe(room);
    expect(safeDestination("/session-evil/session-9")).toBe("/dashboard");
    expect(safeDestination("/session/session-9/../../login")).toBe("/dashboard");
    expect(safeDestination("/session//evil.example")).toBe("/dashboard");
  });

  describe("discovery and auth screens", () => {
    beforeEach(() => {
      mock.snapshot = {
        state: createSeed("2026-09-19"),
        ready: true,
        error: null,
        actions: { login: vi.fn(), setScenario: vi.fn(), clearError: vi.fn() },
      };
      mock.push.mockReset();
      mock.params = new URLSearchParams();
    });
    it("continues the homepage topic into the directory search", () => {
      mock.params = new URLSearchParams("search=Relationships");
      render(<DiscoveryScreen />);
      expect(screen.getByRole("searchbox")).toHaveValue("Relationships");
      expect(screen.getByRole("button", { name: "Remove Search: Relationships" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "View Raghav Mehta's profile" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
      expect(screen.getByRole("link", { name: "View Raghav Mehta's profile" })).toBeInTheDocument();
    });
    it("combines tradition and language from the homepage and lets clients clear them", () => {
      mock.params = new URLSearchParams("specialty=Vedic+Astrology&language=Tamil");
      render(<DiscoveryScreen />);
      expect(screen.getByRole("combobox", { name: "Astrology type" })).toHaveValue("Vedic Astrology");
      expect(screen.getByRole("combobox", { name: "Language" })).toHaveValue("Tamil");
      expect(screen.getByRole("link", { name: "View Kavya Iyer's profile" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "View Ananya Sharma's profile" })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
      expect(screen.getByRole("link", { name: "View Ananya Sharma's profile" })).toBeInTheDocument();
    });
    it("leaves the main landmark to AppChrome", () => {
      const view = render(
        <main id="main-content">
          <AuthScreen />
        </main>
      );
      expect(screen.getAllByRole("main")).toHaveLength(1);
      view.rerender(
        <main id="main-content">
          <AstrologerProfile id="ananya-sharma" />
        </main>
      );
      expect(screen.getAllByRole("main")).toHaveLength(1);
      view.rerender(
        <main id="main-content">
          <DiscoveryScreen />
        </main>
      );
      expect(screen.getAllByRole("main")).toHaveLength(1);
    });
    it("starts the calendar at the hydrated demo date, not the server placeholder", () => {
      mock.snapshot = { ...mock.snapshot, state: createSeed("2026-01-01"), ready: false };
      const view = render(<AstrologerProfile id="ananya-sharma" />);
      mock.snapshot = { ...mock.snapshot, state: createSeed("2026-09-19"), ready: true };
      view.rerender(<AstrologerProfile id="ananya-sharma" />);
      expect(screen.getByRole("button", { name: "19 September 2026" })).toHaveAttribute("aria-pressed", "true");
    });
    it("carries the exact selected slot and duration into booking", () => {
      const state = createSeed("2026-09-19");
      const slot = getSlots(state, "ananya-sharma", state.seedDate, 30).find(item => item.available)!;
      render(<AstrologerProfile id="ananya-sharma" />);
      const label = new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(new Date(slot.start));
      fireEvent.click(screen.getByRole("button", { name: label }));
      const link = screen.getByRole("link", { name: "Book consultation" });
      const href = new URL(link.getAttribute("href")!, "https://astra.example");
      expect(href.pathname).toBe("/booking/ananya-sharma");
      expect(href.searchParams.get("start")).toBe(slot.start);
      expect(href.searchParams.get("duration")).toBe("30");
      fireEvent.click(screen.getByRole("button", { name: "20 September 2026" }));
      expect(screen.getByRole("button", { name: "Select a time to continue" })).toBeDisabled();
    });
    it("keeps fully booked times visible but disabled", () => {
      const state = createSeed("2026-09-19");
      const schedule = state.schedules.find(item => item.astrologerId === "ananya-sharma")!;
      schedule.blocks.push({ date: state.seedDate, start: "00:00", end: "23:59" });
      mock.snapshot = { ...mock.snapshot, state };
      render(<AstrologerProfile id="ananya-sharma" />);
      const unavailable = screen
        .getAllByRole("button")
        .filter(button => button.getAttribute("aria-label")?.includes(" - "));
      expect(unavailable.length).toBeGreaterThan(0);
      expect(unavailable.every(button => button.hasAttribute("disabled"))).toBe(true);
    });
    it("validates sign in and then restores the interrupted booking", async () => {
      mock.params = new URLSearchParams({ next: "/booking/ananya-sharma?duration=45" });
      render(<AuthScreen />);
      fireEvent.click(screen.getByRole("button", { name: "Sign in to demo" }));
      expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address");
      fireEvent.change(screen.getByRole("textbox", { name: /Email address/ }), {
        target: { value: "hello@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Sign in to demo" }));
      await waitFor(() => expect(mock.push).toHaveBeenCalledWith("/booking/ananya-sharma?duration=45"));
    });
  });
  it.each([
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/booking-evil",
    "/dashboard/../../login",
    "/dashboard/%2e%2e/login",
    "/dashboard%2f..%2flogin",
    "javascript:alert(1)",
  ])("rejects unsafe return destination %s", path => {
    expect(safeDestination(path)).toBe("/dashboard");
  });
  it("validates contact details without requesting a password or OTP", () => {
    expect(validateIdentity({ contact: "hello", mode: "email" })).toBe("Enter a valid email address.");
    expect(validateIdentity({ contact: "hello@example.com", mode: "email" })).toBeNull();
    expect(validateIdentity({ contact: "+91 98765 43210", mode: "mobile" })).toBeNull();
    expect(validateIdentity({ contact: "123", mode: "mobile" })).toBe("Enter a valid 10-digit Indian mobile number.");
    expect(validateIdentity({ name: "", contact: "hello@example.com", mode: "email", signup: true })).toBe(
      "Enter your name (at least 2 characters)."
    );
  });
});
