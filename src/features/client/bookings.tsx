"use client";

import { useState } from "react";
import Link from "next/link";
import { useDemo } from "@/lib/store";
import { EmptyState, PageHeading } from "@/components/ui";
import { partitionBookings } from "@/features/booking/flow";
import { ClientWorkspace } from "./workspace";
import { BookingCard } from "./booking-card";
import styles from "./client.module.css";

export function ClientBookings({initialTab}: {initialTab: "upcoming" | "past"}) {
  const {state} = useDemo();
  const [tab, setTab] = useState(initialTab);
  const records = partitionBookings(state.scenario === "empty" ? [] : state.bookings, state.clientId ?? "", state.now);
  return <ClientWorkspace>
    <PageHeading title="Your consultations" description="Conversations to look forward to, and clarity to come back to." action={<Link href="/astrologers" className="btn btn-primary">Book a consultation</Link>} />
    <div className={styles.tabs} aria-label="Filter consultations">
      {(["upcoming", "past"] as const).map(value => <button key={value} type="button" aria-pressed={tab === value} className={`${styles.tab} ${tab === value ? styles.activeTab : ""}`} onClick={() => {setTab(value); window.history.replaceState(null, "", `/dashboard/bookings${value === "past" ? "?tab=past" : ""}`);}}>{value === "upcoming" ? "Upcoming" : "Past"} ({records[value].length})</button>)}
    </div>
    {records[tab].length ? <div className={styles.bookingList}>{records[tab].map(booking => <BookingCard key={booking.id} booking={booking} astrologer={state.astrologers.find(item => item.id === booking.astrologerId)} now={state.now} />)}</div> : <EmptyState title={tab === "upcoming" ? "A new conversation is waiting" : "Your story is just beginning"} description={tab === "upcoming" ? "You don’t have any upcoming consultations. Find a guide for whatever is on your mind." : "Completed consultations will appear here, along with your session recap and feedback."} href="/astrologers" label="Explore astrologers" />}
    <p className={styles.demoCaption}>All dates and times are shown in IST. Payments and consultations in this prototype are simulated.</p>
  </ClientWorkspace>;
}
