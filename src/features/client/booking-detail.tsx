"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CalendarDays, Video } from "lucide-react";
import { useDemo } from "@/lib/store";
import { calendarDownload, formatDate, formatTime, money } from "@/lib/domain";
import { Avatar, Badge, EmptyState, ErrorNotice, PageHeading, Stars } from "@/components/ui";
import { countdown, joinMode } from "@/features/booking/flow";
import { ClientWorkspace } from "./workspace";
import { JoinAction } from "./booking-card";
import styles from "./client.module.css";

export function BookingDetail({id}: {id: string}) {
  const {state} = useDemo();
  const [error, setError] = useState("");
  const booking = state.bookings.find(item => item.id === id && item.clientId === state.clientId);
  const advisor = state.astrologers.find(item => item.id === booking?.astrologerId);
  const session = state.sessions.find(item => item.id === booking?.sessionId);
  if (!booking) return <ClientWorkspace><EmptyState title="Booking not found" description="This consultation isn’t available for your current demo profile. It may belong to someone else, or the demo may have been reset." href="/dashboard/bookings" label="Back to my bookings" /></ClientWorkspace>;
  const mode = joinMode(booking, state.now);
  return <ClientWorkspace>
    <Link className="btn btn-ghost" href="/dashboard/bookings"><ArrowLeft size={16} /> All consultations</Link>
    <PageHeading title="Your consultation" description={`Booking reference: ${booking.id}`} action={<Badge tone={booking.status === "completed" ? "muted" : "green"}>{booking.status === "completed" ? "Completed" : booking.status === "active" ? "In progress" : mode === "expired" ? "Time elapsed" : "Confirmed"}</Badge>} />
    <div className={styles.detailLayout}>
      <section className={styles.detail}>
        <div className={styles.detailIdentity}>{advisor ? <Avatar astrologer={advisor} size={72} /> : null}<div><h2>{booking.astrologerName}</h2><p className="muted">{advisor?.specialty ?? "Private consultation"}</p>{advisor ? <Link href={`/astrologers/${advisor.id}`} className="gold">View profile</Link> : null}</div></div>
        <dl className={styles.details}>
          <div><dt>Date</dt><dd>{formatDate(booking.start)}</dd></div>
          <div><dt>Time</dt><dd>{formatTime(booking.start)} – {formatTime(booking.end)} IST</dd></div>
          <div><dt>Duration</dt><dd>{booking.duration} minutes</dd></div>
          <div><dt>Consultation</dt><dd>Private video · Simulated</dd></div>
          <div><dt>Payment status</dt><dd>Paid · Demo payment</dd></div>
          <div><dt>Total paid</dt><dd>{money(booking.price)}</dd></div>
        </dl>
        {booking.topic ? <div className={styles.topic}><h3>What’s on your mind</h3><p>{booking.topic}</p></div> : null}
        <p className={styles.demoCaption}>Your booked duration and price are saved with this consultation. No real payment was collected.</p>
      </section>
      <aside className={styles.detail}>
        <h2><Video size={21} /> {mode === "recap" ? "Your conversation, revisited" : "A moment just for you"}</h2>
        <Badge tone={session?.status === "active" ? "green" : "muted"}>{session?.status.replaceAll("-", " ") ?? "Waiting"}</Badge>
        <p className={styles.sessionNote}>{mode === "demo" ? `Your session begins in ${countdown(booking.start, state.now)} on the demo clock. Scheduled joining opens 10 minutes before your appointment. You can explore the simulated call now without moving your booking.` : mode === "recap" ? "Revisit your session summary and share how your conversation felt. Your feedback stays with this consultation." : mode === "expired" ? "The scheduled time has passed. Book a new consultation when you’re ready for your next conversation." : "Your room is ready. Find a quiet corner and join when you’re comfortable. No real camera or microphone access is required."}</p>
        <div className="stack"><JoinAction booking={booking} now={state.now} />{mode === "recap" || mode === "expired" ? <Link className="btn btn-primary" href={`/booking/${booking.astrologerId}`}>Book another conversation</Link> : null}<button type="button" className="btn btn-secondary" onClick={() => {try { calendarDownload(booking); } catch {setError("The calendar file couldn’t be downloaded. Please try again.");}}}><CalendarDays size={17} /> Add to calendar</button></div>
        {error ? <ErrorNotice message={error} /> : null}
        {session?.rating ? <div className={styles.topic}><h3>Your feedback</h3><Stars rating={session.rating} />{session.feedback ? <p>{session.feedback}</p> : null}<Link className="btn btn-ghost" href={`/session/${booking.sessionId}`}>Edit feedback</Link></div> : null}
        <p className={styles.demoCaption}>Downloads a real .ics file. No email or calendar invite is sent.</p>
      </aside>
    </div>
  </ClientWorkspace>;
}
