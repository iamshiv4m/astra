"use client";

import { useState, type FormEvent } from "react";
import type { Client } from "@/types/domain";
import { validateProfile } from "@/features/booking/flow";
import styles from "./client.module.css";

export function ProfileForm({
  client,
  today,
  onSave,
  saveWarning,
}: {
  client: Client;
  today: string;
  onSave: (profile: Client) => void;
  saveWarning?: string | null;
}) {
  const [draft, setDraft] = useState(client);
  const [unknownTime, setUnknownTime] = useState(!client.birthTime);
  const [errors, setErrors] = useState<Partial<Record<keyof Client, string>>>({});
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  function change(key: Exclude<keyof Client, "birthDetailsConsent">, value: string) {
    setDraft(previous => ({ ...previous, [key]: value }));
    setNotice("");
    setErrors(previous => ({ ...previous, [key]: undefined }));
  }
  function save(event: FormEvent) {
    event.preventDefault();
    setFailure("");
    setNotice("");
    const next = {
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
      mobile: draft.mobile.trim(),
      birthTime: unknownTime ? "" : draft.birthTime,
    };
    const result = validateProfile(next, today);
    setErrors(result);
    if (Object.keys(result).length) return;
    try {
      onSave(next);
      setDraft(next);
      setNotice("Your profile has been saved.");
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "Your changes could not be saved. Please try again.");
    }
  }
  function field(
    key: Exclude<keyof Client, "birthDetailsConsent">,
    label: string,
    type = "text",
    extra: Record<string, string | boolean> = {}
  ) {
    return (
      <div className="field">
        <label htmlFor={`profile-${key}`}>{label}</label>
        <input
          id={`profile-${key}`}
          className="input"
          type={type}
          value={draft[key] ?? ""}
          onChange={event => change(key, event.target.value)}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `${key}-error` : undefined}
          {...extra}
        />
        {errors[key] ? (
          <p role="alert" className={styles.fieldError} id={`${key}-error`}>
            {errors[key]}
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <form onSubmit={save} className={styles.profileForm} noValidate>
      <section className={styles.formSection}>
        <div>
          <h2>The essentials</h2>
          <p className="muted">A little about you, for a more personal conversation.</p>
        </div>
        <div className={styles.formFields}>
          {field("name", "Full name", "text", { autoComplete: "name", maxLength: "80" })}
          {field("email", "Email address", "email", { autoComplete: "email" })}
          {field("mobile", "Mobile number", "tel", { autoComplete: "tel" })}
          <div className="field">
            <label htmlFor="profile-language">Preferred language</label>
            <select
              id="profile-language"
              className="select"
              value={draft.language}
              onChange={event => change("language", event.target.value)}
            >
              {[
                ...new Set([
                  draft.language,
                  "English",
                  "Hindi",
                  "Tamil",
                  "Telugu",
                  "Bengali",
                  "Marathi",
                  "Gujarati",
                  "Kannada",
                ]),
              ]
                .filter(Boolean)
                .map(language => (
                  <option key={language}>{language}</option>
                ))}
            </select>
          </div>
        </div>
      </section>
      <section className={styles.formSection}>
        <div>
          <h2>
            Your birth details <span className={styles.optional}>Optional</span>
          </h2>
          <p className="muted">
            Share only what you are comfortable with. You can always discuss these during your consultation.
          </p>
        </div>
        <div className={styles.formFields}>
          {field("birthDate", "Birth date", "date", { max: today })}
          <div>
            {field("birthTime", "Birth time", "time", { disabled: unknownTime })}
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={unknownTime}
                onChange={event => {
                  setUnknownTime(event.target.checked);
                  if (event.target.checked) change("birthTime", "");
                }}
              />{" "}
              I don’t know my birth time
            </label>
          </div>
          {field("birthPlace", "Birth place", "text", { placeholder: "City, state, country", maxLength: "150" })}
          <label className={styles.consent}>
            <input
              type="checkbox"
              checked={draft.birthDetailsConsent === true}
              onChange={event => {
                setDraft(previous => ({ ...previous, birthDetailsConsent: event.target.checked }));
                setNotice("");
              }}
            />
            <span>
              Share my birth details with astrologers I book with.
              <small>
                Optional. This makes these details visible in their demo client view. You can turn sharing off and save
                again at any time.
              </small>
            </span>
          </label>
        </div>
      </section>
      <p className={styles.privacy}>
        Demo privacy: these details stay in this browser. Please use fictional information; no real personal details are
        needed.
      </p>
      {failure ? (
        <p role="alert" className={styles.fieldError}>
          {failure}
        </p>
      ) : null}
      {notice && !saveWarning ? (
        <p role="status" className={styles.success}>
          {notice}
        </p>
      ) : null}
      <div className={styles.actions}>
        <button type="submit" className="btn btn-primary">
          Save changes
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setDraft(client);
            setUnknownTime(!client.birthTime);
            setErrors({});
            setNotice("");
            setFailure("");
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
