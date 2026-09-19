"use client";

import type { Duration } from "@/types/domain";
import styles from "./booking.module.css";

const descriptions = { 30: "A focused conversation", 45: "Space to explore", 60: "A deeper understanding" };
export function DurationChoice({ value, prices, onChange }: { value: Duration; prices: Record<Duration, number>; onChange: (duration: Duration) => void }) {
  return <fieldset className={styles.durations}>
    <legend className={styles.srOnly}>Consultation duration</legend>
    {([30, 45, 60] as const).map(duration => <label key={duration} className={`${styles.duration} ${value === duration ? styles.selected : ""}`}>
      <input type="radio" name="duration" value={duration} checked={duration === value} onChange={() => onChange(duration)} />
      <span><strong>{duration} minutes</strong><small>{descriptions[duration]}</small></span>
      <b>{new Intl.NumberFormat("en-IN", {style: "currency", currency: "INR", maximumFractionDigits: 0}).format(prices[duration] / 100)}</b>
    </label>)}
  </fieldset>;
}
