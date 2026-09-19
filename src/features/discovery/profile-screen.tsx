"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Clock3, Languages, MessageCircle, ShieldCheck, Video } from "lucide-react";
import { AvailabilityCalendar, TimeSlots } from "@/components/calendar";
import { Avatar, Badge, EmptyState, ErrorNotice, LoadingState, Stars } from "@/components/ui";
import { addDays, dateKey, formatDate, formatTime, getSlots, money } from "@/lib/domain";
import { useDemo } from "@/lib/store";
import type { Duration } from "@/types/domain";
import styles from "./profile.module.css";

export function AstrologerProfile({ id }: { id: string }) {
  const { state, ready, error, actions } = useDemo();
  const today = dateKey(state.now);
  const [selectedDate, setDate] = useState("");
  const date = selectedDate || today;
  const [duration, setDuration] = useState<Duration>(30);
  const [time, setTime] = useState("");
  const [selectionNotice, setSelectionNotice] = useState("");
  const advisor = state.astrologers.find(item => item.id === id);
  const slots = advisor ? getSlots(state, id, date, duration, true) : [];
  const selected = slots.find(slot => slot.start === time && slot.available);

  function changeDate(value: string) {
    setDate(value);
    setTime("");
    setSelectionNotice(time ? "Date updated. Please choose a time for your new date." : "");
  }
  function changeDuration(value: Duration) {
    setDuration(value);
    if (time && !getSlots(state, id, date, value).some(slot => slot.start === time && slot.available)) {
      setTime("");
      setSelectionNotice("That time doesn’t fit this duration. Please select another available time.");
    } else setSelectionNotice("");
  }

  if (!ready || state.scenario === "loading")
    return (
      <div className="container page-section stack">
        <LoadingState />
        {ready && (
          <button className="btn btn-secondary" onClick={() => actions.setScenario("normal")}>
            Finish loading demo
          </button>
        )}
      </div>
    );
  if (error || state.scenario === "error")
    return (
      <div className="container page-section stack">
        <ErrorNotice message={error || "We couldn’t load this profile. Please try again."} />
        <button
          className="btn btn-secondary"
          onClick={() => {
            actions.clearError();
            actions.setScenario("normal");
          }}
        >
          Try again
        </button>
      </div>
    );
  if (!advisor || state.scenario === "empty")
    return (
      <div className="container page-section">
        <EmptyState
          title="This guide isn’t available."
          description="Explore our other astrologers to find someone who feels right for you."
          href="/astrologers"
          label="Explore astrologers"
        />
        {state.scenario === "empty" && (
          <button className="btn btn-secondary" onClick={() => actions.setScenario("normal")}>
            Restore demo profile
          </button>
        )}
      </div>
    );

  const bookingHref = selected
    ? `/booking/${advisor.id}?${new URLSearchParams({ date, start: selected.start, duration: String(duration) })}`
    : "";

  return (
    <div className={`container ${styles.profile}`}>
      <Link href="/astrologers" className={styles.back}>
        <ArrowLeft size={15} aria-hidden="true" /> All astrologers
      </Link>
      <div className={styles.columns}>
        <div className={styles.details}>
          <section className={styles.identity}>
            <div className={styles.portrait}>
              <Avatar astrologer={advisor} size={152} />
            </div>
            <div className={styles.identityText}>
              <Badge tone="gold">
                <ShieldCheck size={13} aria-hidden="true" /> Verified · Demo profile
              </Badge>
              <h1>{advisor.name}</h1>
              <p className={styles.title}>{advisor.title}</p>
              <Stars rating={advisor.rating} count={advisor.reviews.length} />
              <div className={styles.identityMeta}>
                <span>
                  <Clock3 size={15} aria-hidden="true" /> {advisor.experience} years of experience
                </span>
                <span>
                  <MessageCircle size={15} aria-hidden="true" /> {advisor.consultations.toLocaleString("en-IN")} sample
                  consultations
                </span>
              </div>
            </div>
          </section>
          <div className={styles.quickFacts}>
            <span>
              <Languages size={17} aria-hidden="true" /> {advisor.languages.join(", ")}
            </span>
            <span>
              <Video size={17} aria-hidden="true" /> 1:1 video consultation
            </span>
          </div>
          <div className={styles.expertiseTags}>
            {advisor.expertise.map(item => (
              <Badge key={item} tone="muted">
                {item}
              </Badge>
            ))}
          </div>
          <section className={styles.section}>
            <h2>Meet {advisor.name.split(" ")[0]}</h2>
            <p>{advisor.bio}</p>
            <p className={styles.personalNote}>
              A space to pause, ask the questions on your mind, and leave with a clearer perspective.
            </p>
          </section>
          <section className={styles.section}>
            <h2>Areas of guidance</h2>
            <p>
              Bring a question that matters to you. Together, explore it through the lens of{" "}
              {advisor.specialty.toLowerCase()}.
            </p>
            <ul className={styles.expertiseList}>
              {advisor.expertise.map(item => (
                <li key={item}>
                  <Check size={17} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
          <section className={styles.section}>
            <h2>A conversation, at your pace</h2>
            <p>{advisor.style}</p>
            <div className={styles.sessionDetails}>
              <div>
                <Video size={20} aria-hidden="true" />
                <h3>Face to face</h3>
                <p>A private, one-to-one video conversation with room for your questions.</p>
              </div>
              <div>
                <Clock3 size={20} aria-hidden="true" />
                <h3>Time that’s yours</h3>
                <p>Choose a 30, 45 or 60-minute session. Clear pricing, before you book.</p>
              </div>
            </div>
          </section>
          <section className={styles.section}>
            <div className={styles.reviewHeading}>
              <h2>Words from their journeys</h2>
              <Stars rating={advisor.rating} />
            </div>
            <p className={styles.reviewNotice}>
              Illustrative reviews from fictional clients. Ratings, verification and consultation counts are demo
              content, not independently verified claims.
            </p>
            <div className={styles.reviews}>
              {advisor.reviews.map(review => (
                <article className={styles.review} key={review.id}>
                  <div>
                    <span className={styles.reviewAvatar} aria-hidden="true">
                      {review.name.charAt(0)}
                    </span>
                    <div>
                      <h3>{review.name}</h3>
                      <span className={styles.reviewTopic}>{review.topic}</span>
                    </div>
                    <div className={styles.reviewStars}>
                      <Stars rating={review.rating} />
                    </div>
                  </div>
                  <blockquote>“{review.text}”</blockquote>
                </article>
              ))}
            </div>
          </section>
          <div className={styles.disclaimer}>
            <ShieldCheck size={18} aria-hidden="true" />
            <p>
              Astrology is a tool for reflection, not a substitute for medical, legal or financial advice. This
              prototype simulates consultations; no live call or payment takes place.
            </p>
          </div>
        </div>
        <aside className={styles.bookingColumn} aria-label="Book a consultation">
          <section id="availability" className={styles.bookingPanel}>
            <div className={styles.bookingHeader}>
              <h2>A moment for clarity</h2>
              <p>Choose a time that works for you.</p>
            </div>
            <fieldset className={styles.durations}>
              <legend>Session duration</legend>
              {([30, 45, 60] as const).map(value => (
                <label key={value} className={duration === value ? styles.selectedDuration : ""}>
                  <input
                    type="radio"
                    name="profile-duration"
                    value={value}
                    checked={duration === value}
                    onChange={() => changeDuration(value)}
                  />
                  <span>{value} min</span>
                  <strong>{money(advisor.prices[value])}</strong>
                </label>
              ))}
            </fieldset>
            <div className={styles.calendarLabel}>
              <h3>Select a date</h3>
              <span>All times in IST</span>
            </div>
            <AvailabilityCalendar value={date} onChange={changeDate} minDate={today} maxDate={addDays(today, 29)} />
            <div className={styles.calendarLabel}>
              <h3>Available times</h3>
              <span>{formatDate(`${date}T12:00:00+05:30`, { day: "numeric", month: "short" })}</span>
            </div>
            {slots.length > 0 && (
              <div
                className={styles.slotList}
                role="region"
                aria-label="Consultation times, scroll for later times"
                tabIndex={0}
              >
                <TimeSlots
                  slots={slots}
                  value={time}
                  onChange={value => {
                    setTime(value);
                    setSelectionNotice("");
                  }}
                />
              </div>
            )}
            {!slots.some(slot => slot.available) && (
              <div className={styles.noSlots}>
                No times available for this duration. Please try another date or a shorter session.
              </div>
            )}
            {slots.some(slot => !slot.available) && (
              <p className={styles.slotHint}>Faded times are unavailable for this duration.</p>
            )}
            <div className={styles.selectionNotice} aria-live="polite">
              {selectionNotice || (time && !selected ? "This time is no longer available. Please select another." : "")}
            </div>
            <div className={styles.total}>
              <div>
                <span>{duration}-minute consultation</span>
                <strong>{money(advisor.prices[duration])}</strong>
              </div>
              <small>No hidden fees. Simulated payment.</small>
            </div>
            {selected ? (
              <Link className={`btn btn-primary ${styles.bookButton}`} href={bookingHref}>
                Book consultation <ArrowRight size={17} aria-hidden="true" />
              </Link>
            ) : (
              <button className={`btn btn-primary ${styles.bookButton}`} disabled>
                Select a time to continue
              </button>
            )}
            <p className={styles.bookingFootnote}>
              <ShieldCheck size={13} aria-hidden="true" />{" "}
              {selected
                ? `${formatTime(selected.start)} IST · Your time is selected`
                : "Your next step is a little more clarity."}
            </p>
          </section>
        </aside>
      </div>
      <div className={styles.mobileCta}>
        <div>
          <strong>{money(advisor.prices[duration])}</strong>
          <span> / {duration} min</span>
          <small>
            {selected
              ? `${formatTime(selected.start)} IST · ${formatDate(selected.start, { day: "numeric", month: "short" })}`
              : "Find a moment that’s yours"}
          </small>
        </div>
        <Link className="btn btn-primary" href={selected ? bookingHref : "#availability"}>
          {selected ? "Book session" : "Check availability"}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
