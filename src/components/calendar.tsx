"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Slot } from "@/types/domain";

function key(date: Date) {
  return date.toISOString().slice(0, 10);
}
function dayLabel(date: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`)
  );
}

export function AvailabilityCalendar({
  value,
  onChange,
  minDate,
  maxDate,
}: {
  value: string;
  onChange: (value: string) => void;
  minDate: string;
  maxDate?: string;
}) {
  const [month, setMonth] = useState((value || minDate).slice(0, 7));
  const ref = useRef<HTMLDivElement>(null);
  const first = new Date(`${month}-01T12:00:00Z`);
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const bound = maxDate || key(new Date(new Date(`${minDate}T12:00:00Z`).getTime() + 30 * 86400000));
  const changeMonth = (n: number) => {
    const next = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + n, 1, 12));
    setMonth(key(next).slice(0, 7));
  };
  const navigate = (event: KeyboardEvent<HTMLButtonElement>, date: string) => {
    const jumps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(event.key in jumps)) return;
    event.preventDefault();
    const target = key(new Date(new Date(`${date}T12:00:00Z`).getTime() + jumps[event.key] * 86400000));
    if (target < minDate || target > bound) return;
    setMonth(target.slice(0, 7));
    requestAnimationFrame(() => ref.current?.querySelector<HTMLButtonElement>(`[data-date="${target}"]`)?.focus());
  };
  return (
    <div className="availability-calendar" ref={ref}>
      <div className="calendar-heading">
        <h3 aria-live="polite">
          {first.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })}
        </h3>
        <div>
          <button
            type="button"
            className="icon-button"
            aria-label="Previous month"
            disabled={month <= minDate.slice(0, 7)}
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Next month"
            disabled={month >= bound.slice(0, 7)}
            onClick={() => changeMonth(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {["M", "T", "W", "T", "F", "S", "S"].map((label, i) => (
            <span key={i} aria-hidden="true">
              {label}
            </span>
          ))}
        </div>
        <div className="calendar-days">
          {Array.from({ length: offset }, (_, i) => (
            <span key={`empty-${i}`} />
          ))}
          {Array.from({ length: count }, (_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, "0")}`;
            return (
              <button
                type="button"
                key={date}
                data-date={date}
                aria-label={dayLabel(date)}
                aria-pressed={date === value}
                className={date === value ? "selected" : ""}
                disabled={date < minDate || date > bound}
                onClick={() => onChange(date)}
                onKeyDown={e => navigate(e, date)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
      <p className="calendar-zone">All times in India Standard Time (IST)</p>
    </div>
  );
}

export function TimeSlots({
  slots,
  value,
  onChange,
}: {
  slots: Slot[];
  value: string;
  onChange: (value: string) => void;
}) {
  if (!slots.length) return <p className="muted">No available times on this day. Try another date.</p>;
  return (
    <div className="time-slots">
      {slots.map(slot => (
        <button
          type="button"
          className={`time-slot ${slot.start === value ? "selected" : ""}`}
          key={slot.start}
          disabled={!slot.available}
          aria-pressed={slot.start === value}
          aria-label={`${new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(new Date(slot.start))}${!slot.available ? ` - ${slot.reason || "Unavailable"}` : ""}`}
          title={slot.reason}
          onClick={() => onChange(slot.start)}
        >
          {new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(
            new Date(slot.start)
          )}
        </button>
      ))}
    </div>
  );
}
