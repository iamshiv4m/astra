"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";
import { useDemo } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/domain";
import { Avatar, EmptyState } from "@/components/ui";
import { AstrologerCard } from "@/components/astrologer-card";
import { countdown, partitionBookings } from "@/features/booking/flow";
import { ClientWorkspace } from "./workspace";
import { BookingCard, JoinAction } from "./booking-card";
import styles from "./client.module.css";

export function ClientDashboard() {
  const {state} = useDemo();
  const client = state.clients.find(item => item.id === state.clientId);
  const {upcoming, past} = partitionBookings(state.scenario === "empty" ? [] : state.bookings, state.clientId ?? "", state.now);
  const next = upcoming[0];
  const advisor = state.astrologers.find(item => item.id === next?.astrologerId);
  const hour = Number(new Intl.DateTimeFormat("en", {hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata"}).format(state.now));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const recommendations = [...state.astrologers].sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating).slice(0, 3);
  return <ClientWorkspace>
    <header className={styles.greeting}><h1>{greeting}, {client?.name.split(" ")[0] ?? "there"}.</h1><p>A little perspective. A clearer path. This is your space.</p></header>
    {next ? <section className={styles.next} aria-label="Your next consultation">
      <div>
        <h2>Your next conversation</h2>
        <div className={styles.nextIdentity}>{advisor ? <Avatar astrologer={advisor} size={76} /> : null}<div><h3>{next.astrologerName}</h3><p>{advisor?.specialty ?? "Private consultation"}</p></div></div>
        <div className={styles.nextTime}><span><CalendarDays size={17} />{formatDate(next.start)}</span><span><Clock3 size={17} />{formatTime(next.start)} IST · {next.duration} min</span></div>
      </div>
      <div className={styles.countdown}><small>{next.status === "active" ? "Your consultation is" : "Starts in"}</small><strong>{next.status === "active" ? "In progress" : countdown(next.start, state.now)}</strong><div className={styles.nextActions}><JoinAction booking={next} now={state.now} /><Link href={`/dashboard/bookings/${next.id}`} className="btn btn-secondary">View details</Link></div><p className={styles.demoCaption}>Demo clock · Start now does not change your booking.</p></div>
    </section> : <EmptyState title="Your next conversation starts here" description="Meet an astrologer who understands what’s on your mind. Your upcoming consultations will appear here." href="/astrologers" label="Find your astrologer" />}
    <section className={styles.section}>
      <div className={styles.sectionHead}><h2>Upcoming consultations <span className="muted">({upcoming.length})</span></h2><Link href="/dashboard/bookings">View all <ArrowRight size={14} /></Link></div>
      <div className={styles.bookingList}>{upcoming.slice(0, 3).map(booking => <BookingCard key={booking.id} booking={booking} astrologer={state.astrologers.find(item => item.id === booking.astrologerId)} now={state.now} />)}</div>
      {!upcoming.length ? <p className="muted">Nothing scheduled just yet. Take your time finding the right guide.</p> : null}
    </section>
    {past.length ? <section className={styles.section}>
      <div className={styles.sectionHead}><h2>Recent conversations</h2><Link href="/dashboard/bookings?tab=past">View history <ArrowRight size={14} /></Link></div>
      <div className={styles.bookingList}>{past.slice(0, 2).map(booking => <BookingCard key={booking.id} booking={booking} astrologer={state.astrologers.find(item => item.id === booking.astrologerId)} now={state.now} />)}</div>
    </section> : null}
    <section className={styles.section}>
      <div className={styles.sectionHead}><h2>A guide for your next chapter</h2><Link href="/astrologers">Explore all <ArrowRight size={14} /></Link></div>
      <div className={styles.recommendations}>{recommendations.map(astrologer => <AstrologerCard key={astrologer.id} astrologer={astrologer} />)}</div>
      <p className={styles.demoCaption}>Fictional demo advisors. Profile ratings and consultation counts are seeded historical examples, separate from your bookings.</p>
    </section>
  </ClientWorkspace>;
}
