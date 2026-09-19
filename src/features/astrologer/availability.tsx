"use client";

import { useState } from "react";
import { CalendarDays, Plus, Save, Trash2 } from "lucide-react";
import { useDemo } from "@/lib/store";
import { dateKey, formatDate, formatTime, getSlots } from "@/lib/domain";
import { Badge, ErrorNotice, Field, PageHeading } from "@/components/ui";
import type { Schedule } from "@/types/domain";
import { scheduleError } from "./helpers";
import styles from "./workspace.module.css";

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const clone = (schedule: Schedule): Schedule => JSON.parse(JSON.stringify(schedule));

export function AstrologerAvailability() {
  const { state } = useDemo();
  const saved = state.schedules.find(s => s.astrologerId === state.astrologerId);
  if (!saved)
    return <ErrorNotice message="No schedule found for this demo profile. Reset the demo to restore its schedule." />;
  return <AvailabilityEditor key={saved.astrologerId} saved={saved} />;
}

function AvailabilityEditor({ saved }: { saved: Schedule }) {
  const { state, actions, error: storeError } = useDemo();
  const [draft, setDraft] = useState(() => clone(saved));
  const [date, setDate] = useState(() => dateKey(state.now));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const slots = date ? getSlots(state, saved.astrologerId, date, 30) : [];
  function change(next: Schedule) {
    setDraft(next);
    setNotice("");
    setError("");
    actions.clearError();
  }
  function addDate(kind: "open" | "closed" | "block") {
    const next = clone(draft);
    if (kind === "block") next.blocks.push({ date, start, end });
    else {
      const existing = next.overrides.find(o => o.date === date);
      if (kind === "closed") next.overrides = [...next.overrides.filter(o => o.date !== date), { date, windows: [] }];
      else if (existing) existing.windows.push({ start, end });
      else next.overrides.push({ date, windows: [{ start, end }] });
    }
    const issue = scheduleError(next);
    if (issue) {
      setError(issue);
      setNotice("");
      return;
    }
    change(next);
  }
  function save() {
    setError("");
    setNotice("");
    const issue = scheduleError(draft);
    if (issue) {
      setError(issue);
      return;
    }
    try {
      actions.saveSchedule(draft);
      setNotice("Availability saved. Your public calendar and booking slots are up to date.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn’t save your availability. Please try again.");
    }
  }
  return (
    <>
      <PageHeading
        title="Your time, thoughtfully planned"
        description="Set the hours that work for you. We’ll make room for the right conversations."
        action={<Badge tone="gold">All times in IST</Badge>}
      />
      <div className={styles.availabilityGrid}>
        <div className={styles.stack}>
          <section className={styles.editorPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <h2>Weekly availability</h2>
                <p>Your regular hours, repeated each week.</p>
              </div>
              <CalendarDays size={20} />
            </div>
            <div className={styles.weeklyList}>
              {[1, 2, 3, 4, 5, 6, 0].map(day => (
                <div className={styles.weekday} key={day}>
                  <strong>{weekdays[day]}</strong>
                  <div className={styles.dayWindows}>
                    {!draft.windows.some(w => w.day === day) ? (
                      <span className={styles.closed}>Unavailable</span>
                    ) : null}
                    {draft.windows.map((window, index) =>
                      window.day === day ? (
                        <div className={styles.timeRange} key={index}>
                          <label>
                            <span className="sr-only">
                              {weekdays[day]} start time {index + 1}
                            </span>
                            <input
                              className="input"
                              type="time"
                              value={window.start}
                              onChange={e =>
                                change({
                                  ...draft,
                                  windows: draft.windows.map((w, i) =>
                                    i === index ? { ...w, start: e.target.value } : w
                                  ),
                                })
                              }
                            />
                          </label>
                          <span>to</span>
                          <label>
                            <span className="sr-only">
                              {weekdays[day]} end time {index + 1}
                            </span>
                            <input
                              className="input"
                              type="time"
                              value={window.end}
                              onChange={e =>
                                change({
                                  ...draft,
                                  windows: draft.windows.map((w, i) =>
                                    i === index ? { ...w, end: e.target.value } : w
                                  ),
                                })
                              }
                            />
                          </label>
                          <button
                            className={styles.iconButton}
                            aria-label={`Remove ${weekdays[day]} window ${index + 1}`}
                            onClick={() => change({ ...draft, windows: draft.windows.filter((_, i) => i !== index) })}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : null
                    )}
                  </div>
                  <button
                    className={styles.iconButton}
                    aria-label={`Add ${weekdays[day]} window`}
                    onClick={() =>
                      change({ ...draft, windows: [...draft.windows, { day, start: "09:00", end: "17:00" }] })
                    }
                  >
                    <Plus size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className={styles.editorPanel}>
            <div className={styles.sectionHeading}>
              <div>
                <h2>Date-specific hours & time off</h2>
                <p>Replace a day&apos;s hours, close a date, or block a break.</p>
              </div>
            </div>
            <div className={styles.dateEditor}>
              <Field label="Date">
                <input
                  className="input"
                  type="date"
                  min={dateKey(state.now)}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </Field>
              <Field label="Start time">
                <input className="input" type="time" value={start} onChange={e => setStart(e.target.value)} />
              </Field>
              <Field label="End time">
                <input className="input" type="time" value={end} onChange={e => setEnd(e.target.value)} />
              </Field>
            </div>
            <div className={styles.buttonRow}>
              <button className="btn btn-secondary" onClick={() => addDate("open")}>
                <Plus size={15} /> Add date hours
              </button>
              <button className="btn btn-secondary" onClick={() => addDate("block")}>
                Block interval
              </button>
              <button className="btn btn-ghost" onClick={() => addDate("closed")}>
                Close entire date
              </button>
            </div>
            <p className={styles.hint}>
              Date-specific hours replace recurring hours for that date. Add multiple non-overlapping windows if needed.
              Closing a date is rejected if it conflicts with a booking.
            </p>
            <div className={styles.exceptions}>
              {draft.overrides.map(override => (
                <div className={styles.exception} key={override.date}>
                  <div>
                    <strong>{formatDate(override.date)}</strong>
                    <p>
                      {override.windows.length
                        ? override.windows.map(w => `${w.start}–${w.end}`).join(", ") + " IST"
                        : "Closed all day"}{" "}
                      · Date override
                    </p>
                  </div>
                  <button
                    className={styles.iconButton}
                    aria-label={`Remove date override ${override.date}`}
                    onClick={() =>
                      change({ ...draft, overrides: draft.overrides.filter(o => o.date !== override.date) })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {draft.blocks.map((block, index) => (
                <div className={styles.exception} key={`${block.date}-${index}`}>
                  <div>
                    <strong>{formatDate(block.date)}</strong>
                    <p>
                      {block.start}–{block.end} IST · Blocked time
                    </p>
                  </div>
                  <button
                    className={styles.iconButton}
                    aria-label={`Remove block ${block.date} ${block.start}`}
                    onClick={() => change({ ...draft, blocks: draft.blocks.filter((_, i) => i !== index) })}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {!draft.overrides.length && !draft.blocks.length ? (
                <p className={styles.hint}>No exceptions yet. Your weekly schedule applies every day.</p>
              ) : null}
            </div>
          </section>
        </div>
        <aside className={styles.availabilityAside}>
          <section className={styles.previewPanel}>
            <Badge tone="green">Public calendar preview</Badge>
            <h2>{date ? formatDate(date) : "Choose a date"}</h2>
            <p>Available 30-minute starts from your saved schedule.</p>
            <div className={styles.slotPreview}>
              {slots
                .filter(s => s.available)
                .slice(0, 12)
                .map(slot => (
                  <span key={slot.start}>{formatTime(slot.start)}</span>
                ))}
            </div>
            {!slots.some(s => s.available) ? <p className={styles.hint}>No available starts for this date.</p> : null}
            {slots.filter(s => s.available).length > 12 ? (
              <p className={styles.hint}>+ {slots.filter(s => s.available).length - 12} more available starts</p>
            ) : null}
            <p className={styles.hint}>Booked times, breaks and elapsed slots are excluded automatically.</p>
          </section>
          <section className={styles.practiceNote}>
            <h3>Existing bookings are protected</h3>
            <p>
              A schedule change can never move or cancel a consultation. If an edit conflicts, we&apos;ll tell you which
              booking needs that time.
            </p>
            <p>This demo saves changes in your browser only.</p>
          </section>
        </aside>
      </div>
      <div className={styles.saveBar}>
        {error ? <ErrorNotice message={error} /> : null}
        {notice && !storeError ? (
          <p role="status" className={styles.success}>
            {notice}
          </p>
        ) : null}
        <div>
          <p>
            {dirty ? "You have unsaved changes" : "Your schedule is up to date"}
            <small>Changes apply to your public booking calendar.</small>
          </p>
          <div className={styles.buttonRow}>
            <button
              disabled={!dirty}
              className="btn btn-ghost"
              onClick={() => {
                change(clone(saved));
              }}
            >
              Discard
            </button>
            <button disabled={!dirty} className="btn btn-primary" onClick={save}>
              <Save size={16} /> Save availability
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
