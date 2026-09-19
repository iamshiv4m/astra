import type { Astrologer, Booking, Client, Schedule, Session } from "@/types/domain";
export type SessionView = "today" | "upcoming" | "past";
export interface ProfessionalInput {
  bio: string;
  expertise: string;
  languages: string;
  style: string;
  price30: string;
  price45: string;
  price60: string;
}
const dayKey = (value: number | string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
export function filterSessions(bookings: Booking[], id: string, view: SessionView, now: number): Booking[] {
  return bookings
    .filter(
      b =>
        b.astrologerId === id &&
        (view === "today"
          ? dayKey(b.start) === dayKey(now)
          : view === "past"
            ? b.status === "completed" || Date.parse(b.end) <= now
            : b.status !== "completed" && Date.parse(b.end) > now)
    )
    .sort((a, b) =>
      view === "past" ? Date.parse(b.start) - Date.parse(a.start) : Date.parse(a.start) - Date.parse(b.start)
    );
}
export function workspaceMetrics(bookings: Booking[], id: string, now: number) {
  const completed = bookings.filter(b => b.astrologerId === id && b.status === "completed");
  const upcoming = filterSessions(bookings, id, "upcoming", now);
  return {
    earnings: completed.reduce((sum, b) => sum + b.price, 0),
    bookedValue: upcoming.reduce((sum, b) => sum + b.price, 0),
    completed: completed.length,
    upcoming: upcoming.length,
    today: filterSessions(bookings, id, "today", now).length,
  };
}
export function workspaceRating(
  bookings: Booking[],
  sessions: Session[],
  id: string
): { rating: number | null; count: number } {
  const completed = new Set(bookings.filter(b => b.astrologerId === id && b.status === "completed").map(b => b.id));
  const ratings = sessions
    .filter(s => completed.has(s.bookingId) && s.status === "ended" && s.rating !== undefined)
    .map(s => s.rating!);
  return {
    rating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null,
    count: ratings.length,
  };
}
export function clientGroups(bookings: Booking[], clients: Client[], id: string, search: string) {
  const query = search.trim().toLowerCase();
  return clients
    .map(client => ({
      client,
      bookings: bookings
        .filter(b => b.astrologerId === id && b.clientId === client.id)
        .sort((a, b) => Date.parse(b.start) - Date.parse(a.start)),
    }))
    .filter(
      group =>
        group.bookings.length > 0 &&
        `${group.client.name} ${group.client.email} ${group.client.language}`.toLowerCase().includes(query)
    )
    .sort((a, b) => a.client.name.localeCompare(b.client.name));
}
export function scheduleError(schedule: Schedule): string {
  const validTime = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const ranges = [...schedule.windows, ...schedule.overrides.flatMap(o => o.windows), ...schedule.blocks];
  if (ranges.some(w => !validTime.test(w.start) || !validTime.test(w.end))) return "Enter a valid start and end time.";
  if (ranges.some(w => w.start >= w.end)) return "End time must be after start time.";
  if (schedule.windows.some(w => !Number.isInteger(w.day) || w.day < 0 || w.day > 6)) return "Choose a valid weekday.";
  for (const item of [...schedule.overrides, ...schedule.blocks]) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
      Number.isNaN(Date.parse(`${item.date}T00:00:00Z`)) ||
      new Date(`${item.date}T00:00:00Z`).toISOString().slice(0, 10) !== item.date
    )
      return "Choose a valid calendar date.";
  }
  if (new Set(schedule.overrides.map(o => o.date)).size !== schedule.overrides.length)
    return "A date can only have one override. Edit its existing windows.";
  const groups = [
    ...Array.from({ length: 7 }, (_, day) => schedule.windows.filter(w => w.day === day)),
    ...schedule.overrides.map(o => o.windows),
  ];
  for (const group of groups) {
    const ordered = [...group].sort((a, b) => a.start.localeCompare(b.start));
    if (ordered.some((w, i) => i > 0 && w.start < ordered[i - 1].end)) return "Availability windows must not overlap.";
  }
  return "";
}
export function profilePatch(input: ProfessionalInput): Partial<Astrologer> {
  if (!input.bio.trim()) throw new Error("Add a professional bio.");
  const expertise = [
    ...new Set(
      input.expertise
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    ),
  ];
  const languages = [
    ...new Set(
      input.languages
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    ),
  ];
  if (!expertise.length || !languages.length || !input.style.trim())
    throw new Error("Add expertise, languages, and your consultation style.");
  const values = [input.price30, input.price45, input.price60];
  if (values.some(p => !/^\d+(\.\d{1,2})?$/.test(p) || Number(p) <= 0 || Number(p) > 100000))
    throw new Error("Each price must be between ₹0.01 and ₹1,00,000, with at most two decimal places.");
  return {
    bio: input.bio.trim(),
    expertise,
    languages,
    style: input.style.trim(),
    prices: {
      30: Math.round(Number(input.price30) * 100),
      45: Math.round(Number(input.price45) * 100),
      60: Math.round(Number(input.price60) * 100),
    },
  };
}
