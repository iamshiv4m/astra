"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { ErrorNotice, Field, LoadingState } from "@/components/ui";
import { useDemo } from "@/lib/store";
import type { Role } from "@/types/domain";
import { safeDestination, validateIdentity } from "./helpers";
import styles from "./auth.module.css";

export function AuthScreen(props: { role?: Role; signup?: boolean }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthForm {...props} />
    </Suspense>
  );
}

function AuthForm({ role = "client", signup = false }: { role?: Role; signup?: boolean }) {
  const { state, ready, actions } = useDemo();
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"email" | "mobile">("email");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const astrologer = role === "astrologer";
  const destination = safeDestination(params.get("next"), role);
  const alternate = `${signup ? "/login" : "/signup"}?${new URLSearchParams({ next: destination })}`;

  async function enter(google = false) {
    setError(null);
    if (!google) {
      const problem = validateIdentity({ name, contact, mode, signup });
      if (problem) {
        setError(problem);
        return;
      }
    }
    setBusy(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      if (state.scenario === "error")
        throw new Error("Demo sign-in is temporarily unavailable. Return to normal mode below and try again.");
      actions.login(
        role,
        google ? (astrologer ? "Ananya Sharma" : "Demo Client") : name.trim() || undefined,
        google ? "demo@astra.example" : contact.trim()
      );
      router.push(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not sign you in. Please try again.");
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void enter();
  }

  return (
    <div className={`container page-section ${styles.layout}`}>
      <section className={styles.story} aria-label="Welcome to ASTRA">
        <div className={styles.orbit} aria-hidden="true">
          <span>✦</span>
        </div>
        <h1>
          {astrologer ? (
            <>
              Your wisdom.
              <br />A meaningful connection.
            </>
          ) : (
            <>
              A little clarity.
              <br />A new perspective.
            </>
          )}
        </h1>
        <p>
          {astrologer
            ? "A thoughtful space to manage your practice and make every conversation count."
            : "Meet a guide who understands your questions. Your next chapter starts with a conversation."}
        </p>
        <div className={styles.assurance}>
          <ShieldCheck size={19} aria-hidden="true" /> Private by design. Personal by nature.
        </div>
        <div className={styles.storyNote}>
          An interactive prototype. No real consultations or authentication take place.
        </div>
      </section>
      <section className={styles.formPanel}>
        <Link className={styles.back} href={astrologer ? "/login" : "/astrologers"}>
          ← {astrologer ? "Client sign in" : "Explore astrologers"}
        </Link>
        <h2>{astrologer ? "Astrologer sign in" : signup ? "Begin your journey" : "Welcome back"}</h2>
        <p className="muted">
          {astrologer
            ? "Enter the demo workspace as Ananya Sharma."
            : signup
              ? "Create your demo profile. Keep it simple."
              : "Sign in to your personal space for clarity."}
        </p>
        <div className={styles.demoNotice}>
          <Sparkles size={18} aria-hidden="true" />
          <span>
            <strong>You’re in a demo.</strong> Use sample details, not personal information. No password, OTP, SMS, or
            real Google connection is needed.
          </span>
        </div>
        {!ready || state.scenario === "loading" ? (
          <>
            <LoadingState />
            {ready && (
              <button className="btn btn-secondary" onClick={() => actions.setScenario("normal")}>
                Finish loading demo
              </button>
            )}
          </>
        ) : (
          <>
            <div className={styles.tabs} role="group" aria-label="Sign-in method">
              <button
                type="button"
                aria-pressed={mode === "email"}
                onClick={() => {
                  setMode("email");
                  setContact("");
                  setError(null);
                }}
              >
                Email address
              </button>
              <button
                type="button"
                aria-pressed={mode === "mobile"}
                onClick={() => {
                  setMode("mobile");
                  setContact("");
                  setError(null);
                }}
              >
                Mobile number
              </button>
            </div>
            <form onSubmit={submit} className="stack" noValidate>
              {signup && (
                <Field label="Your name">
                  <input
                    className="input"
                    autoComplete="name"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    placeholder="e.g. Aarav"
                    maxLength={80}
                    required
                    aria-invalid={Boolean(error && name.trim().length < 2)}
                  />
                </Field>
              )}
              <Field
                label={mode === "email" ? "Email address" : "Mobile number"}
                hint={mode === "email" ? "Try hello@example.com" : "Use a sample Indian mobile number"}
              >
                <input
                  className="input"
                  type={mode === "email" ? "email" : "tel"}
                  inputMode={mode === "email" ? "email" : "tel"}
                  autoComplete={mode === "email" ? "email" : "tel"}
                  placeholder={mode === "email" ? "hello@example.com" : "+91 98765 43210"}
                  value={contact}
                  onChange={event => setContact(event.target.value)}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "identity-error" : undefined}
                  required
                  maxLength={120}
                />
              </Field>
              {error && (
                <div id="identity-error">
                  <ErrorNotice message={error} />
                </div>
              )}
              {state.scenario === "error" && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    actions.setScenario("normal");
                    setError(null);
                  }}
                >
                  Return to normal demo mode
                </button>
              )}
              <button className="btn btn-primary" disabled={busy} type="submit">
                {busy ? "Opening your space…" : signup ? "Create demo account" : "Sign in to demo"}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
            {!astrologer && (
              <>
                <div className={styles.divider}>
                  <span>or continue with</span>
                </div>
                <button
                  className={`btn btn-secondary ${styles.google}`}
                  disabled={busy}
                  onClick={() => void enter(true)}
                >
                  <span aria-hidden="true" className={styles.googleMark}>
                    G
                  </span>{" "}
                  Google <span className={styles.simulated}>Simulated</span>
                </button>
                <p className={styles.switch}>
                  {signup ? "Already have a demo account?" : "New to ASTRA?"}{" "}
                  <Link href={alternate}>
                    {signup ? "Sign in" : "Create an account"} <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </p>
              </>
            )}
          </>
        )}
        <p className={styles.privacy}>
          Your demo profile stays in this browser. Do not share sensitive or personal details.
        </p>
        {!astrologer && (
          <Link className={styles.astroLink} href="/astrologer/login">
            Are you an astrologer? Enter your workspace →
          </Link>
        )}
      </section>
    </div>
  );
}
