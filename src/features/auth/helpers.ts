import type { Role } from "@/types/domain";

export function safeDestination(value: string | null, role: Role = "client"): string {
  const fallback = role === "astrologer" ? "/astrologer/dashboard" : "/dashboard";
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f]/.test(value)) return fallback;
  try {
    const path = decodeURIComponent(value.split(/[?#]/)[0]);
    if (path.includes("\\") || path.split("/").some(segment => segment === "." || segment === "..")) return fallback;
    const allowed =
      role === "astrologer"
        ? /^\/astrologer\/(dashboard|sessions|availability|profile)(\/|$)/
        : /^\/(booking|dashboard)(\/|$)/;
    return allowed.test(path) || /^\/session\/[a-zA-Z0-9_-]+$/.test(path) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function validateIdentity({
  name = "",
  contact,
  mode,
  signup = false,
}: {
  name?: string;
  contact: string;
  mode: "email" | "mobile";
  signup?: boolean;
}): string | null {
  if (signup && name.trim().length < 2) return "Enter your name (at least 2 characters).";
  if (mode === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim())) return "Enter a valid email address.";
  if (mode === "mobile" && !/^(?:91)?[6-9]\d{9}$/.test(contact.replace(/[\s()+-]/g, "")))
    return "Enter a valid 10-digit Indian mobile number.";
  return null;
}
