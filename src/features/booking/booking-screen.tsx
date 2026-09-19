"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, LockKeyhole, Video } from "lucide-react";
import { useDemo } from "@/lib/store";
import { addDays, calendarDownload, dateKey, formatDate, formatTime, getSlots, money } from "@/lib/domain";
import { Avatar, Badge, EmptyState, ErrorNotice, LoadingState, Stars } from "@/components/ui";
import { AvailabilityCalendar, TimeSlots } from "@/components/calendar";
import type { Astrologer, Booking, DemoActions, DemoState, Duration } from "@/types/domain";
import { bookingIntent, draftKey, newRequestId, restoreDraft, selectionValid, type BookingDraft } from "./flow";
import { DurationChoice } from "./duration-choice";
import styles from "./booking.module.css";

type Query = Record<string, string | undefined>;

export function BookingScreen({ astrologerId, query }: { astrologerId: string; query: Query }) {
  const {state, ready, error, actions} = useDemo();
  if (!ready || state.scenario === "loading") return <div className="container page-section"><LoadingState /></div>;
  const astrologer = state.astrologers.find(item => item.id === astrologerId);
  if (!astrologer) return <div className="container page-section"><EmptyState title="We couldn’t find this astrologer" description="Explore our advisors to find the right conversation for you." href="/astrologers" label="Explore astrologers" /></div>;
  return <div className="container page-section">{error ? <ErrorNotice message={error} /> : null}<BookingFlow key={astrologer.id} astrologer={astrologer} state={state} actions={actions} query={query} /></div>;
}

export function BookingFlow({astrologer, state, actions, query}: {astrologer: Astrologer; state: DemoState; actions: DemoActions; query: Query}) {
  const router = useRouter();
  const [draft, setDraft] = useState<BookingDraft>(() => {
    let raw: string | null = null;
    try { raw = localStorage.getItem(draftKey(astrologer.id)); } catch { /* The page still works without draft storage. */ }
    return restoreDraft(astrologer.id, query, raw, dateKey(state.now));
  });
  const [step, setStep] = useState(draft.start ? 3 : 0);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [receipt, setReceipt] = useState<Booking | null>(null);
  const today = dateKey(state.now);
  const lastDate = addDays(today, 29);
  const dateAllowed = draft.date >= today && draft.date <= lastDate;
  const slots = dateAllowed ? getSlots(state, astrologer.id, draft.date, draft.duration, true) : [];
  const selectedValid = dateAllowed && selectionValid(draft.start, slots);
  const confirmed = receipt ?? state.bookings.find(item => item.id === query.confirmed && item.clientId === state.clientId && item.astrologerId === astrologer.id);

  useEffect(() => {
    if (confirmed) return;
    let active = true;
    try { localStorage.setItem(draftKey(astrologer.id), JSON.stringify(draft)); }
    catch { queueMicrotask(() => {if (active) setStorageWarning("Your browser cannot save this draft. Keep this tab open; your selections may not survive a refresh.");}); }
    return () => {active = false;};
  }, [draft, astrologer.id, confirmed]);

  function update(patch: Partial<BookingDraft>) {
    setDraft(previous => ({...previous, ...patch, requestId: newRequestId()}));
    setFailure("");
    setNotice("");
  }
  function chooseDuration(duration: Duration) {
    const keepsTime = dateAllowed && selectionValid(draft.start, getSlots(state, astrologer.id, draft.date, duration));
    update({duration, start: keepsTime ? draft.start : ""});
    if (draft.start && !keepsTime) setNotice("That time doesn’t fit the new duration. Please choose another available time.");
  }
  function confirm() {
    if (submitting.current || !state.clientId || !selectedValid) return;
    submitting.current = true;
    setBusy(true);
    setFailure("");
    try {
      const booking = actions.book({astrologerId: astrologer.id, start: draft.start, duration: draft.duration, topic: draft.topic, requestId: draft.requestId});
      setReceipt(booking);
      try { localStorage.removeItem(draftKey(astrologer.id)); } catch { /* Confirmation is stored by the shared booking repository. */ }
      router.replace(`/booking/${encodeURIComponent(astrologer.id)}?confirmed=${encodeURIComponent(booking.id)}`);
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "We couldn’t confirm your consultation. Your selection is safe; please try again.");
      submitting.current = false;
      setBusy(false);
    }
  }

  if (query.confirmed && !state.clientId) return <EmptyState title="Sign in to see your confirmation" description="Your booking belongs to your demo profile. Sign in to view its details." href={`/login?next=${encodeURIComponent(`/booking/${astrologer.id}?confirmed=${query.confirmed}`)}`} label="Sign in to continue" />;
  if (confirmed) return <BookingConfirmation booking={confirmed} astrologer={astrologer} />;
  if (query.confirmed) return <EmptyState title="Confirmation not found" description="This booking may belong to a different demo profile, or the demo may have been reset." href="/dashboard/bookings" label="View my bookings" />;

  return <>
    <header className={styles.header}>
      <Link href={`/astrologers/${astrologer.id}`} className={styles.backLink}><ArrowLeft size={16} /> Back to {astrologer.name.split(" ")[0]}’s profile</Link>
      <h1>Make space for clarity.</h1>
      <p className="muted">A private conversation, at a time that’s yours.</p>
    </header>
    <div className={styles.layout}>
      <div>
        <ol className={styles.stepper} aria-label="Booking progress">
          {["Duration", "Date", "Time", "Review"].map((label, index) => <li key={label} className={index === step ? styles.current : index < step ? styles.complete : ""} aria-current={index === step ? "step" : undefined}><span className={styles.stepNumber}>{index < step ? <Check size={15} /> : index + 1}</span><span>{label}</span></li>)}
        </ol>
        <section className={styles.panel} aria-labelledby="booking-step-title">
          <h2 id="booking-step-title" aria-live="polite" aria-atomic="true">{["How much time would you like?", "Choose a day that works for you.", "Find your moment.", "Your conversation awaits."][step]}</h2>
          <p className={styles.intro}>{["Every session is one-to-one. Choose the space you need.", "All appointments are shown in Indian Standard Time (IST).", `${draft.duration}-minute sessions · ${formatDate(`${draft.date}T12:00:00+05:30`)} · IST`, "Take a moment to check the details before you book."][step]}</p>
          {step === 0 ? <DurationChoice value={draft.duration} prices={astrologer.prices} onChange={chooseDuration} /> : null}
          {step === 1 ? <AvailabilityCalendar value={draft.date} minDate={today} maxDate={lastDate} onChange={date => {update({date, start: ""}); if (draft.start) setNotice("Date changed. Choose an available time for your new date.");}} /> : null}
          {step === 2 ? slots.some(slot => slot.available) ? <TimeSlots slots={slots} value={selectedValid ? draft.start : ""} onChange={start => update({start})} /> : <EmptyState title="No available times on this day" description="Try a different date or a shorter consultation. Availability updates when a booking or schedule changes." /> : null}
          {step === 3 ? <>
            <div className={styles.review}><Clock3 size={20} /><div><small>Session length</small><strong>{draft.duration} minutes</strong></div><button type="button" onClick={() => setStep(0)}>Change</button></div>
            <div className={styles.review}><CalendarDays size={20} /><div><small>Date and time · IST</small><strong>{formatDate(`${draft.date}T12:00:00+05:30`)}{draft.start ? `, ${formatTime(draft.start)}` : ""}</strong></div><button type="button" onClick={() => setStep(1)}>Change</button></div>
            <div className={styles.review}><Video size={20} /><div><small>How we’ll meet</small><strong>Private video consultation</strong></div><Badge tone="muted">Simulated</Badge></div>
            <div className={`field ${styles.topic}`}><label htmlFor="booking-topic">What’s on your mind? <span className="muted">(optional)</span></label><textarea id="booking-topic" className="input" value={draft.topic} maxLength={300} placeholder="Career, relationships, or simply finding a little direction…" onChange={event => update({topic: event.target.value})} /><small className="muted">Use fictional details for this demo. {draft.topic.length}/300</small></div>
            <div className={styles.notice}>Demo payment only. No card details, no real charge. Confirming creates a simulated paid booking in this browser.</div>
          </> : null}
          {notice ? <p role="status" className={styles.notice}>{notice}</p> : null}
          {!dateAllowed ? <ErrorNotice message="This date is outside the 30-day booking window. Please choose a new date." /> : null}
          {draft.start && !selectedValid ? <ErrorNotice message="Your selected time is no longer available. Choose another time before continuing." /> : null}
          {failure ? <ErrorNotice message={failure} /> : null}
          {storageWarning ? <ErrorNotice message={storageWarning} /> : null}
          <div className={styles.actions}>
            {step > 0 ? <button className="btn btn-secondary" type="button" onClick={() => setStep(previous => previous - 1)} disabled={busy}><ArrowLeft size={16} /> Back</button> : <span />}
            {step < 3 ? <button className="btn btn-primary" type="button" disabled={step === 1 ? !dateAllowed : step === 2 ? !selectedValid : false} onClick={() => setStep(previous => previous + 1)}>Continue <ArrowRight size={16} /></button> : state.clientId ? <button className="btn btn-primary" type="button" disabled={!selectedValid || busy} onClick={confirm}>{busy ? "Confirming…" : `Confirm & book · ${money(astrologer.prices[draft.duration])}`}</button> : selectedValid ? <Link href={`/login?next=${encodeURIComponent(bookingIntent(astrologer.id, draft))}`} className="btn btn-primary">Sign in to confirm <ArrowRight size={16} /></Link> : <button className="btn btn-primary" disabled>Choose an available time</button>}
          </div>
        </section>
      </div>
      <aside className={styles.summary} aria-label="Live booking summary">
        <h2 className={styles.summaryTitle}>Your consultation</h2>
        <div className={styles.summaryBody}>
          <div className={styles.advisor}><Avatar astrologer={astrologer} size={58} /><div><strong>{astrologer.name}</strong><p>{astrologer.specialty}</p><Stars rating={astrologer.rating} /></div></div>
          <dl className={styles.facts}>
            <div className={styles.fact}><dt>Duration</dt><dd>{draft.duration} minutes</dd></div>
            <div className={styles.fact}><dt>Date</dt><dd>{formatDate(`${draft.date}T12:00:00+05:30`)}</dd></div>
            <div className={styles.fact}><dt>Time</dt><dd>{selectedValid ? `${formatTime(draft.start)} IST` : "Select a time"}</dd></div>
            <div className={styles.fact}><dt>Session</dt><dd>Private video</dd></div>
          </dl>
          <div className={styles.total}><span>Total</span><strong>{money(astrologer.prices[draft.duration])}</strong></div>
          <p className={styles.note}><LockKeyhole size={15} /> Clear pricing. No additional fees.<br />Payment is simulated for this demo.</p>
        </div>
      </aside>
    </div>
  </>;
}

function BookingConfirmation({booking, astrologer}: {booking: Booking; astrologer: Astrologer}) {
  const [error, setError] = useState("");
  return <div className={styles.confirmation}>
    <div className={styles.confirmationMark}><Check size={32} /></div>
    <h1>You’re all set.</h1>
    <p className="muted">A little clarity is on the calendar. Your consultation with {booking.astrologerName} is confirmed.</p>
    <div className={styles.confirmationDetails}>
      <div className={styles.advisor}><Avatar astrologer={astrologer} size={56} /><div><strong>{booking.astrologerName}</strong><p>{astrologer.specialty}</p><Badge tone="green">Confirmed</Badge></div></div>
      <dl className={styles.facts}>
        <div className={styles.fact}><dt>Date</dt><dd>{formatDate(booking.start)}</dd></div>
        <div className={styles.fact}><dt>Time</dt><dd>{formatTime(booking.start)} IST</dd></div>
        <div className={styles.fact}><dt>Duration</dt><dd>{booking.duration} minutes</dd></div>
        <div className={styles.fact}><dt>Payment</dt><dd>{money(booking.price)} · Demo paid</dd></div>
        <div className={styles.fact}><dt>Booking reference</dt><dd>{booking.id}</dd></div>
      </dl>
    </div>
    {error ? <ErrorNotice message={error} /> : null}
    <div className={styles.actions}><Link className="btn btn-primary" href={`/dashboard/bookings/${booking.id}`}>View my booking <ArrowRight size={16} /></Link><button className="btn btn-secondary" onClick={() => { try { calendarDownload(booking); } catch {setError("Your calendar download could not start. Please try again.");} }}><CalendarDays size={17} /> Add to calendar</button></div>
    <p className={styles.note}>The calendar download is a real .ics file. This demo does not send email or calendar invitations.</p>
    <div className={styles.actions}><Link href="/dashboard" className="btn btn-ghost">Go to my dashboard</Link></div>
  </div>;
}
