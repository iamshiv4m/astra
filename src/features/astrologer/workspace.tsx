"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, CalendarDays, Check, Clock3, IndianRupee, Search, Star, Video } from "lucide-react";
import { useDemo } from "@/lib/store";
import { addDays, dateKey, formatDate, formatTime, money } from "@/lib/domain";
import { Avatar, Badge, EmptyState, ErrorNotice, LoadingState, Modal, PageHeading } from "@/components/ui";
import { AvailabilityCalendar } from "@/components/calendar";
import { WorkspaceShell } from "@/components/workspace-shell";
import type { Booking, Client, DemoState } from "@/types/domain";
import { clientGroups, filterSessions, workspaceMetrics, workspaceRating, type SessionView } from "./helpers";
import styles from "./workspace.module.css";

export function AstrologerWorkspace({ children }: { children: ReactNode }) {
  const { state, ready, error } = useDemo();
  return <WorkspaceShell role="astrologer">
    {!ready || state.scenario === "loading" ? <LoadingState /> : !state.astrologerId ?
      <EmptyState title="Your practice, in one place" description="Sign in to the astrologer demo to manage your consultations and availability." href="/astrologer/login" label="Astrologer sign in" /> :
      <div className={styles.workspace}>{error ? <ErrorNotice message={error} /> : null}{state.scenario === "error" ? <ErrorNotice message="This is the demo error state. Switch Demo controls back to Normal to continue." /> : children}</div>}
  </WorkspaceShell>;
}

export function SessionActions({ booking, now }: { booking: Booking; now: number }) {
  if (booking.status === "completed") return <Link className="btn btn-ghost" href={`/session/${booking.sessionId}`}>View recap <ArrowUpRight size={15} /></Link>;
  if (Date.parse(booking.end) <= now && booking.status !== "active") return <span className={styles.missed}>Session window ended</span>;
  const canJoin = booking.status === "active" || now >= Date.parse(booking.start) - 600000;
  return <div className={styles.sessionActions}>
    {canJoin ? <Link className="btn btn-primary" href={`/session/${booking.sessionId}`}><Video size={15} /> Join session</Link> :
      <span className={styles.joinNote}><Clock3 size={13} /> Join opens 10 min before</span>}
    {booking.status === "confirmed" ? <Link className={styles.demoLink} href={`/session/${booking.sessionId}?demo=1`}>Start demo now <ArrowUpRight size={13} /></Link> : null}
  </div>;
}

export function ClientDetails({ client, state, onClose }: { client: Client | null; state: DemoState; onClose: () => void }) {
  const bookings = client ? state.bookings.filter(b => b.clientId === client.id && b.astrologerId === state.astrologerId).sort((a, b) => Date.parse(b.start) - Date.parse(a.start)) : [];
  const consented = client && "birthDetailsConsent" in client && client.birthDetailsConsent === true;
  return <Modal open={!!client} onOpenChange={open => { if (!open) onClose(); }} title={client?.name || "Client details"} className={styles.clientDrawer}>
    {client ? <div className={styles.detailBody}>
      <div className={styles.clientIdentity}><span className={styles.initials}>{initials(client.name)}</span><div><strong>{client.name}</strong><p className="muted">{client.language} · Demo client</p></div></div>
      <dl className={styles.details}><div><dt>Email</dt><dd>{client.email || "Not provided"}</dd></div><div><dt>Mobile</dt><dd>{client.mobile || "Not provided"}</dd></div></dl>
      <section><h3>Birth details</h3>{consented ? <><p className="muted">Shared voluntarily for this local demo.</p><dl className={styles.details}><div><dt>Date</dt><dd>{client.birthDate ? formatDate(client.birthDate) : "Not shared"}</dd></div><div><dt>Time</dt><dd>{client.birthTime || "Unknown / not shared"}</dd></div><div><dt>Place</dt><dd>{client.birthPlace || "Not shared"}</dd></div></dl></> : <p className="muted">Birth details are private. This client has not given permission to share them.</p>}</section>
      <section><h3>Consultation history <span className={styles.count}>{bookings.length}</span></h3><div className={styles.history}>{bookings.map(b => <div key={b.id}><div><strong>{b.topic || "Personal guidance"}</strong><p className="muted">{formatDate(b.start)} · {formatTime(b.start)} IST · {b.duration} min</p></div><Badge tone={b.status === "completed" ? "muted" : "green"}>{b.status}</Badge><SessionActions booking={b} now={state.now} /></div>)}</div></section>
    </div> : null}
  </Modal>;
}

function initials(name: string) { return name.split(" ").map(p => p[0]).slice(0, 2).join(""); }

function SessionList({ bookings, state, onClient }: { bookings: Booking[]; state: DemoState; onClient: (client: Client) => void }) {
  return <div className={styles.sessionList}>{bookings.map(b => {
    const client = state.clients.find(c => c.id === b.clientId);
    return <article className={styles.sessionRow} key={b.id}>
      <div className={styles.sessionTime}><strong>{formatTime(b.start)}</strong><span>{b.duration} min · IST</span></div>
      <div className={styles.sessionPerson}><span className={styles.initials}>{initials(client?.name || "Client")}</span><div>
        <button className={styles.nameButton} onClick={() => client && onClient(client)}>{client?.name || "Demo client"}</button>
        <p>{b.topic || "Personal guidance"} <span>· Video consultation</span></p>
        <small>{formatDate(b.start)}</small>
      </div></div>
      <Badge tone={b.status === "completed" ? "muted" : "green"}>{b.status === "active" ? "In session" : b.status === "completed" ? "Completed" : "Confirmed"}</Badge>
      <SessionActions booking={b} now={state.now} />
    </article>;
  })}</div>;
}

export function AstrologerDashboard() {
  const { state } = useDemo();
  const astrologer = state.astrologers.find(a => a.id === state.astrologerId);
  const [selectedDate, setSelectedDate] = useState(() => dateKey(state.now));
  const [client, setClient] = useState<Client | null>(null);
  if (!astrologer) return null;
  const bookings = state.scenario === "empty" ? [] : state.bookings;
  const metrics = workspaceMetrics(bookings, astrologer.id, state.now);
  const rating = workspaceRating(bookings, state.sessions, astrologer.id);
  const selectedSessions = bookings.filter(b => b.astrologerId === astrologer.id && dateKey(b.start) === selectedDate).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
  const upcoming = filterSessions(bookings, astrologer.id, "upcoming", state.now);
  const next = upcoming[0];
  const nextClient = state.clients.find(c => c.id === next?.clientId);
  return <>
    <PageHeading title={`Good morning, ${astrologer.name.replace(/^(Dr\.|Pandit|Acharya)\s+/, "").split(" ")[0]}`} description="A little space to prepare. A meaningful conversation ahead." action={<Link href="/astrologer/availability" className="btn btn-secondary"><CalendarDays size={17} /> Manage availability</Link>} />
    <div className={styles.dateLine}><span>{formatDate(new Date(state.now).toISOString())}</span><span><i /> Astrologer workspace · Demo time, IST</span></div>
    <section aria-label="Practice overview" className={styles.metrics}>
      <div><span><IndianRupee size={17} /> Session earnings</span><strong>{money(metrics.earnings)}</strong><small>Completed demo consultations</small></div>
      <div><span><CalendarDays size={17} /> Upcoming sessions</span><strong>{metrics.upcoming.toString().padStart(2, "0")}</strong><small>{metrics.today} on today&apos;s calendar</small></div>
      <div><span><Check size={17} /> Completed sessions</span><strong>{metrics.completed.toString().padStart(2, "0")}</strong><small>From your interactive demo records</small></div>
      <div><span><Star size={17} /> Client rating</span><strong>{rating.rating?.toFixed(1) || "—"} <span>/ 5</span></strong><small>{rating.count} completed demo session review{rating.count === 1 ? "" : "s"}</small></div>
    </section>
    <div className={styles.dashboardGrid}>
      <div>
        {next ? <section className={styles.nextSession}><div><Badge tone="gold">Your next conversation</Badge><h2>{nextClient?.name || "Demo client"}</h2><p>{next.topic || "Personal guidance"} · {next.duration} minute video consultation</p><div className={styles.nextTime}><CalendarDays size={16} /> {formatDate(next.start)} <span>·</span> {formatTime(next.start)} IST</div></div><SessionActions booking={next} now={state.now} /></section> : null}
        <section className={styles.schedulePanel}><div className={styles.sectionHeading}><div><h2>{selectedDate === dateKey(state.now) ? "Today’s schedule" : formatDate(selectedDate)}</h2><p>{selectedSessions.length} consultations · All times in IST</p></div><Link href="/astrologer/sessions" className={styles.textLink}>View all <ArrowUpRight size={15} /></Link></div>
          {selectedSessions.length ? <SessionList bookings={selectedSessions} state={state} onClient={setClient} /> : <EmptyState title="Room to breathe" description="No consultations on this date. Select another date or open your availability." href="/astrologer/availability" label="Manage availability" />}
        </section>
      </div>
      <aside className={styles.dashboardAside}><section className={styles.calendarPanel}><div className={styles.sectionHeading}><h2>Your calendar</h2><CalendarDays size={17} /></div><AvailabilityCalendar value={selectedDate} onChange={setSelectedDate} minDate={addDays(dateKey(state.now), -30)} maxDate={addDays(dateKey(state.now), 29)} /><div className={styles.calendarNote}><i /> Select a date to view consultations</div></section>
        <section className={styles.practiceNote}><div className={styles.profileMini}><Avatar astrologer={astrologer} size={46} /><div><strong>Your practice is open</strong><p>Make room for what matters.</p></div></div><p>{money(metrics.bookedValue)} in upcoming booked value. Earnings update when a demo session is completed.</p><Link href="/astrologer/profile" className={styles.textLink}>Review your profile <ArrowUpRight size={15} /></Link></section>
      </aside>
    </div>
    <ClientDetails client={client} state={state} onClose={() => setClient(null)} />
  </>;
}

export function AstrologerSessions() {
  const { state } = useDemo();
  const searchParams = useSearchParams();
  const clientsView = searchParams.get("view") === "clients";
  const [view, setView] = useState<SessionView>("today");
  const [search, setSearch] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const id = state.astrologerId || "";
  const bookings = state.scenario === "empty" ? [] : state.bookings;
  const groups = clientGroups(bookings, state.clients, id, search);
  const sessions = filterSessions(bookings, id, view, state.now).filter(b => `${state.clients.find(c => c.id === b.clientId)?.name} ${b.topic}`.toLowerCase().includes(search.toLowerCase().trim()));
  return <>
    <PageHeading title={clientsView ? "Your clients" : "Consultations"} description={clientsView ? "Every conversation has a story. Keep the important details close." : "A clear view of the conversations ahead, and the guidance you’ve shared."} action={<Link className="btn btn-secondary" href="/astrologer/availability"><CalendarDays size={17} /> Manage availability</Link>} />
    <div className={styles.listToolbar}>{!clientsView ? <div className={styles.tabs} aria-label="Filter consultations">{(["today", "upcoming", "past"] as const).map(tab => <button key={tab} aria-pressed={view === tab} onClick={() => setView(tab)}>{tab === "today" ? "Today" : tab === "upcoming" ? "Upcoming" : "Past"} <span>{filterSessions(bookings, id, tab, state.now).length}</span></button>)}</div> : <p className="muted">{groups.length} clients in your demo practice</p>}
      <label className={styles.search}><Search size={17} /><span className="sr-only">Search {clientsView ? "clients" : "consultations"}</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={clientsView ? "Search clients…" : "Search name or topic…"} /></label>
    </div>
    {clientsView ? groups.length ? <div className={styles.clientGrid}>{groups.map(group => <article className={styles.clientCard} key={group.client.id}><div className={styles.clientIdentity}><span className={styles.initials}>{initials(group.client.name)}</span><div><h2>{group.client.name}</h2><p>{group.client.language}</p></div></div><div className={styles.clientSummary}><span>{group.bookings.length} consultation{group.bookings.length === 1 ? "" : "s"}</span><span>{group.bookings.filter(b => b.status === "completed").length} completed</span></div><p className="muted">Latest booking · {formatDate(group.bookings[0].start)}</p><button className="btn btn-secondary" onClick={() => setClient(group.client)}>View client details <ArrowUpRight size={15} /></button></article>)}</div> : <EmptyState title="No clients found" description="Try a different name, email, or language. Clients appear here after a booking." /> :
      sessions.length ? <section className={styles.schedulePanel}><SessionList bookings={sessions} state={state} onClient={setClient} /></section> : <EmptyState title="No consultations here" description={search ? "Try a different name or topic." : "Your consultations will appear here when booked. Try another view or update your availability."} />}
    <p className={styles.privacyNote}>Fictional demo records · Client details stay in this browser · All session times are IST</p>
    <ClientDetails client={client} state={state} onClose={() => setClient(null)} />
  </>;
}
