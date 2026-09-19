import type { Booking, Client, Duration, Slot } from "@/types/domain";

export interface BookingDraft {
  version: 1;
  astrologerId: string;
  duration: Duration;
  date: string;
  start: string;
  topic: string;
  requestId: string;
}

const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
export const newRequestId = () => `astra-${crypto.randomUUID()}`;
export const draftKey = (astrologerId: string) => `ASTRA:booking-draft:v1:${astrologerId}`;

export function restoreDraft(
  astrologerId: string,
  query: Record<string, string | undefined>,
  raw: string | null,
  today: string
): BookingDraft {
  let saved: Partial<BookingDraft> = {};
  try {
    const value = JSON.parse(raw ?? "null");
    if (value?.version === 1 && value.astrologerId === astrologerId) saved = value;
  } catch {
    /* A broken draft never blocks a new consultation. */
  }
  const requestedDuration = Number(query.duration ?? saved.duration);
  const duration: Duration = requestedDuration === 45 || requestedDuration === 60 ? requestedDuration : 30;
  const dateValue = query.date ?? saved.date ?? today;
  const date = typeof dateValue === "string" && validDate(dateValue) ? dateValue : today;
  const startValue = query.start ?? query.time ?? saved.start;
  const start = typeof startValue === "string" && !Number.isNaN(Date.parse(startValue)) ? startValue : "";
  const unchanged = duration === saved.duration && date === saved.date && start === saved.start;
  return {
    version: 1,
    astrologerId,
    duration,
    date,
    start,
    topic: typeof saved.topic === "string" ? saved.topic.slice(0, 300) : "",
    requestId: unchanged && typeof saved.requestId === "string" && saved.requestId ? saved.requestId : newRequestId(),
  };
}

export function selectionValid(start: string, slots: Slot[]) {
  return !!start && slots.some(slot => slot.available && Date.parse(slot.start) === Date.parse(start));
}

export function bookingIntent(astrologerId: string, draft: BookingDraft) {
  const query = new URLSearchParams({ duration: String(draft.duration), date: draft.date });
  if (draft.start) query.set("start", draft.start);
  return `/booking/${encodeURIComponent(astrologerId)}?${query}`;
}

export function partitionBookings(bookings: Booking[], clientId: string, now: number) {
  const owned = bookings.filter(booking => booking.clientId === clientId);
  const isPast = (booking: Booking) =>
    booking.status === "completed" || (booking.status !== "active" && Date.parse(booking.end) <= now);
  return {
    upcoming: owned.filter(booking => !isPast(booking)).sort((a, b) => Date.parse(a.start) - Date.parse(b.start)),
    past: owned.filter(isPast).sort((a, b) => Date.parse(b.start) - Date.parse(a.start)),
  };
}

export function countdown(start: string, now: number) {
  const minutes = Math.ceil((Date.parse(start) - now) / 60000);
  if (minutes <= 0) return "Ready to join";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function joinMode(booking: Booking, now: number): "demo" | "join" | "recap" | "expired" {
  if (booking.status === "completed") return "recap";
  if (booking.status === "active") return "join";
  if (Date.parse(booking.end) <= now) return "expired";
  return Date.parse(booking.start) - now <= 600000 ? "join" : "demo";
}

export function validateProfile(profile: Client, today: string): Partial<Record<keyof Client, string>> {
  const errors: Partial<Record<keyof Client, string>> = {};
  if (!profile.name.trim()) errors.name = "Please enter your name.";
  else if (profile.name.trim().length > 80) errors.name = "Keep your name to 80 characters or fewer.";
  if (!profile.email.trim() && !profile.mobile.trim()) errors.email = "Add an email address or mobile number.";
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
    errors.email = "Enter a valid email address.";
  if (profile.mobile && !/^\+?[\d\s()-]{10,16}$/.test(profile.mobile.trim()))
    errors.mobile = "Enter a valid mobile number.";
  if (!profile.language.trim()) errors.language = "Choose a preferred language.";
  if (profile.birthDate && (!validDate(profile.birthDate) || profile.birthDate > today))
    errors.birthDate = "Birth date must be a valid date, not in the future.";
  if (profile.birthTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(profile.birthTime))
    errors.birthTime = "Enter a valid birth time or choose unknown.";
  return errors;
}
