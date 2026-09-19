import type { Booking, CallStatus, Role, Session } from "@/types/domain";

export function elapsedSeconds(session: Session, now: number): number {
  if (!session.startedAt) return 0;
  const end = session.endedAt ? Date.parse(session.endedAt) : now;
  return Math.max(0, Math.floor((end - Date.parse(session.startedAt)) / 1000)) || 0;
}
export function formatElapsed(seconds: number): string {
  const value = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(value / 60);
  const remaining = String(value % 60).padStart(2, "0");
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}:${remaining}`
    : `${String(minutes).padStart(2, "0")}:${remaining}`;
}
export function getSessionAccess(
  booking: Booking,
  clientId: string | null,
  astrologerId: string | null,
  now: number
): { authorized: boolean; canJoin: boolean; roles: Role[] } {
  const roles: Role[] = [];
  if (clientId === booking.clientId) roles.push("client");
  if (astrologerId === booking.astrologerId) roles.push("astrologer");
  const authorized = roles.length > 0;
  return {
    authorized,
    roles,
    canJoin:
      authorized &&
      booking.status !== "completed" &&
      now >= Date.parse(booking.start) - 600_000 &&
      now < Date.parse(booking.end),
  };
}
export function nextDemoStatus(status: CallStatus, role: Role): CallStatus {
  if (status === "waiting") return role === "client" ? "astrologer-joined" : "client-joined";
  return status === "ended" ? "ended" : "active";
}
export function validateMessage(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Write a message before sending.");
  if (trimmed.length > 2000) throw new Error("Keep your message under 2,000 characters.");
  return trimmed;
}
