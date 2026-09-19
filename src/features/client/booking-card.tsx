"use client";

import Link from "next/link";
import { ArrowUpRight, Video } from "lucide-react";
import { Avatar, Badge } from "@/components/ui";
import { formatDate, formatTime, money } from "@/lib/domain";
import type { Astrologer, Booking } from "@/types/domain";
import { joinMode } from "@/features/booking/flow";
import styles from "./client.module.css";

export function JoinAction({booking, now, className = "btn btn-primary"}: {booking: Booking; now: number; className?: string}) {
  const mode = joinMode(booking, now);
  if (mode === "expired") return null;
  return <Link className={className} href={`/session/${booking.sessionId}${mode === "demo" ? "?demo=1" : ""}`}>
    {mode === "recap" ? <ArrowUpRight size={16} /> : <Video size={16} />}
    {mode === "demo" ? "Start demo now" : mode === "recap" ? "View session recap" : "Join session"}
  </Link>;
}

export function BookingCard({booking, astrologer, now}: {booking: Booking; astrologer?: Astrologer; now: number}) {
  const mode = joinMode(booking, now);
  return <article className={styles.bookingRow}>
    {astrologer ? <Avatar astrologer={astrologer} size={56} /> : null}
    <div className={styles.bookingIdentity}>
      <h3><Link href={`/dashboard/bookings/${booking.id}`}>{booking.astrologerName}</Link></h3>
      <p>{formatDate(booking.start)} · {formatTime(booking.start)} IST</p>
      <p>{booking.duration} minutes · Private video consultation</p>
    </div>
    <Badge tone={booking.status === "completed" ? "muted" : booking.status === "active" ? "green" : "gold"}>{mode === "expired" ? "Time elapsed" : booking.status === "completed" ? "Completed" : booking.status === "active" ? "In progress" : "Confirmed"}</Badge>
    <div className={styles.bookingActions}>
      <span className={styles.bookingPrice}>{money(booking.price)}</span>
      <Link href={`/dashboard/bookings/${booking.id}`} className="btn btn-secondary">Details <ArrowUpRight size={15} /></Link>
      {mode === "join" || mode === "demo" ? <JoinAction booking={booking} now={now} /> : null}
    </div>
  </article>;
}
