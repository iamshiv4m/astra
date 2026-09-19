"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Save } from "lucide-react";
import { useDemo } from "@/lib/store";
import { Avatar, Badge, ErrorNotice, Field, PageHeading, Stars } from "@/components/ui";
import { money } from "@/lib/domain";
import type { Astrologer } from "@/types/domain";
import { profilePatch, type ProfessionalInput } from "./helpers";
import styles from "./workspace.module.css";

function inputFrom(astrologer: Astrologer): ProfessionalInput {
  return {
    bio: astrologer.bio,
    expertise: astrologer.expertise.join(", "),
    languages: astrologer.languages.join(", "),
    style: astrologer.style,
    price30: String(astrologer.prices[30] / 100),
    price45: String(astrologer.prices[45] / 100),
    price60: String(astrologer.prices[60] / 100),
  };
}

export function AstrologerProfile() {
  const { state } = useDemo();
  const astrologer = state.astrologers.find(a => a.id === state.astrologerId);
  return astrologer ? <ProfileEditor key={astrologer.id} astrologer={astrologer} /> : null;
}

function ProfileEditor({ astrologer }: { astrologer: Astrologer }) {
  const { actions, error: storeError } = useDemo();
  const [form, setForm] = useState(() => inputFrom(astrologer));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const dirty = JSON.stringify(form) !== JSON.stringify(inputFrom(astrologer));
  function update(key: keyof ProfessionalInput, value: string) {
    setForm(f => ({ ...f, [key]: value }));
    setError("");
    setNotice("");
    actions.clearError();
  }
  return (
    <>
      <PageHeading
        title="Your professional profile"
        description="Let clients get to know the person behind the guidance."
        action={
          <Link className="btn btn-secondary" href={`/astrologers/${astrologer.id}`}>
            View public profile <ArrowUpRight size={16} />
          </Link>
        }
      />
      <form
        onSubmit={event => {
          event.preventDefault();
          setNotice("");
          setError("");
          try {
            actions.updateAstrologer(astrologer.id, profilePatch(form));
            setNotice("Profile saved. Your public profile and new booking prices are up to date.");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Your profile could not be saved. Please try again.");
          }
        }}
      >
        <div className={styles.profileGrid}>
          <div className={styles.stack}>
            <section className={styles.editorPanel}>
              <div className={styles.sectionHeading}>
                <div>
                  <h2>About your practice</h2>
                  <p>A warm introduction helps the right clients find you.</p>
                </div>
              </div>
              <div className={styles.formFields}>
                <Field label="Professional bio" hint="Your experience, approach, and the support clients can expect.">
                  <textarea
                    className="input"
                    rows={5}
                    required
                    maxLength={2000}
                    value={form.bio}
                    onChange={e => update("bio", e.target.value)}
                  />
                </Field>
                <Field label="Expertise" hint="Separate each area with a comma.">
                  <input
                    className="input"
                    required
                    value={form.expertise}
                    onChange={e => update("expertise", e.target.value)}
                    placeholder="Vedic astrology, Career, Relationships"
                  />
                </Field>
                <Field label="Languages" hint="Separate each language with a comma.">
                  <input
                    className="input"
                    required
                    value={form.languages}
                    onChange={e => update("languages", e.target.value)}
                  />
                </Field>
                <Field label="Consultation style">
                  <textarea
                    className="input"
                    rows={3}
                    required
                    maxLength={1000}
                    value={form.style}
                    onChange={e => update("style", e.target.value)}
                  />
                </Field>
              </div>
            </section>
            <section className={styles.editorPanel}>
              <div className={styles.sectionHeading}>
                <div>
                  <h2>Consultation pricing</h2>
                  <p>Set an explicit price for each session duration, in INR.</p>
                </div>
              </div>
              <div className={styles.pricingGrid}>
                {([30, 45, 60] as const).map(duration => (
                  <Field label={`${duration} minutes · ₹`} key={duration}>
                    <input
                      className="input"
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      max="100000"
                      step="0.01"
                      required
                      value={form[`price${duration}`]}
                      onChange={e => update(`price${duration}`, e.target.value)}
                    />
                  </Field>
                ))}
              </div>
              <p className={styles.hint}>
                New prices apply to future bookings only. Existing consultations keep their booked price. No real
                payments are processed.
              </p>
            </section>
          </div>
          <aside>
            <section className={styles.profilePreview}>
              <Avatar astrologer={astrologer} size={104} />
              <h2>{astrologer.name}</h2>
              <p>{astrologer.title}</p>
              <Badge tone="gold">Verified · Demo profile</Badge>
              <Stars rating={astrologer.rating} />
              <p className="muted">{astrologer.experience} years of fictional experience</p>
              <div className={styles.previewDivider} />
              <strong>
                {money(astrologer.prices[30])} <span>/ 30 minutes</span>
              </strong>
              <p className={styles.hint}>
                This preview reflects your last saved profile. Identity and verification are seeded demo information.
              </p>
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
              {dirty ? "You have unsaved changes" : "Profile is up to date"}
              <small>Your changes are stored in this browser.</small>
            </p>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!dirty}
                onClick={() => {
                  setForm(inputFrom(astrologer));
                  setNotice("");
                  setError("");
                  actions.clearError();
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={!dirty}>
                <Save size={16} /> Save profile
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}
