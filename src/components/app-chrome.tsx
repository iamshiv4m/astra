"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Menu, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useDemo } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/domain";
import type { Scenario } from "@/types/domain";
import { Brand } from "./brand";
import { Field, Modal } from "./ui";

function DemoControls() {
  const { state, actions, error, ready } = useDemo();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [localError, setLocalError] = useState("");
  const reset = () => {
    try {
      actions.reset();
      setConfirm(false);
      setOpen(false);
      router.push("/");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Could not reset the demo.");
    }
  };
  return (
    <>
      {!path.startsWith("/session/") && (
        <button className="demo-trigger" disabled={!ready} onClick={() => setOpen(true)}>
          <SlidersHorizontal size={13} />
          Demo controls
        </button>
      )}
      {error && (
        <div className="global-error" role="alert">
          <p>{error}</p>
          <button className="btn btn-ghost" onClick={() => setOpen(true)}>
            Open recovery controls
          </button>
          <button className="btn btn-ghost" onClick={actions.clearError}>
            Dismiss notice
          </button>
        </div>
      )}
      <Modal open={open} onOpenChange={setOpen} title="Make yourself at home">
        <div className="demo-controls">
          <p className="demo-description">
            This is an interactive prototype. Accounts, consultations, payments and messages are simulated and saved
            only in this browser.
          </p>
          <div>
            <strong>Explore both sides of the conversation</strong>
            <div className="demo-role-buttons" style={{ marginTop: 12 }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  actions.login("client");
                  setOpen(false);
                  router.push("/dashboard");
                }}
              >
                Client workspace
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  actions.login("astrologer");
                  setOpen(false);
                  router.push("/astrologer/dashboard");
                }}
              >
                Astrologer workspace
              </button>
            </div>
          </div>
          <Field label="Preview a demo state" hint="Choose Normal to restore the regular experience.">
            <select value={state.scenario} onChange={e => actions.setScenario(e.target.value as Scenario)}>
              <option value="normal">Normal experience</option>
              <option value="loading">Loading state</option>
              <option value="error">Recoverable error</option>
              <option value="empty">Empty results</option>
              <option value="payment-failure">Payment failure</option>
            </select>
          </Field>
          <p className="demo-description">
            Demo clock: {formatDate(state.now)} · {formatTime(state.now)} IST. Time advances while this demo is open.
            Reset starts at 9:00 AM on the current IST date.
          </p>
          <div className="demo-reset">
            {confirm ? (
              <>
                <p>Reset all ASTRA bookings, messages, profiles and availability changes in this browser?</p>
                <div className="demo-role-buttons" style={{ marginTop: 14 }}>
                  <button className="btn btn-primary" onClick={reset}>
                    Yes, reset demo
                  </button>
                  <button className="btn btn-secondary" onClick={() => setConfirm(false)}>
                    Keep my changes
                  </button>
                </div>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setConfirm(true)}>
                <RotateCcw size={16} />
                Reset demo
              </button>
            )}
            <p>Restores the original fictional sample data. No other browser data is touched.</p>
          </div>
          {localError && <p role="alert">{localError}</p>}
        </div>
      </Modal>
    </>
  );
}

export function AppChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { state } = useDemo();
  const [menu, setMenu] = useState(false);
  const [info, setInfo] = useState<"privacy" | "about" | null>(null);
  const isWorkspace =
    path.startsWith("/dashboard") || (path.startsWith("/astrologer/") && path !== "/astrologer/login");
  const isSession = path.startsWith("/session/");
  const publicChrome = !isWorkspace && !isSession;
  const nav = (
    <>
      <Link
        href="/astrologers"
        className={path.startsWith("/astrologers") ? "active" : ""}
        onClick={() => setMenu(false)}
      >
        Our astrologers
      </Link>
      <Link href="/#how-it-works" onClick={() => setMenu(false)}>
        How it works
      </Link>
      <Link href="/dashboard/bookings" onClick={() => setMenu(false)}>
        My sessions
      </Link>
    </>
  );
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {publicChrome && (
        <header className={`site-header ${path === "/" ? "dark" : ""}`}>
          <div className="container nav-inner">
            <Brand />
            <nav className="desktop-nav" aria-label="Main navigation">
              {nav}
            </nav>
            <div className="nav-actions">
              <Link className="login-link" href={state.clientId ? "/dashboard" : "/login"}>
                {state.clientId ? "My dashboard" : "Log in"}
              </Link>
              <Link className={`btn ${path === "/" ? "btn-gold" : "btn-primary"}`} href="/astrologers">
                <span className="nav-cta-desktop">Find your astrologer</span>
                <span className="nav-cta-mobile">Find a guide</span>
                <ArrowUpRight size={14} />
              </Link>
              <button
                className="icon-button mobile-menu-button"
                aria-label="Open navigation"
                onClick={() => setMenu(true)}
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </header>
      )}
      <main id="main-content">{children}</main>
      {publicChrome && (
        <footer className="site-footer">
          <div className="container">
            <div className="footer-top">
              <div className="footer-brand">
                <Brand />
                <p>Clarity, one conversation away.</p>
              </div>
              <nav className="footer-links" aria-label="Footer navigation">
                <Link href="/astrologers">Our astrologers</Link>
                <Link href="/astrologer/login">For astrologers</Link>
                <Link href="/tech-stack">
                  Inside ASTRA <ArrowUpRight size={12} style={{ display: "inline" }} />
                </Link>
                <button className="btn btn-ghost" onClick={() => setInfo("about")}>
                  About this demo
                </button>
              </nav>
            </div>
            <div className="footer-bottom">
              <p>
                © {new Date().getFullYear()} ASTRA. A thoughtfully imagined prototype.
                <br />
                *Profiles, verification badges, reviews and trust claims are illustrative. No actual calls or payments.
              </p>
              <button
                className="text-link"
                style={{ fontWeight: 400, minHeight: 32 }}
                onClick={() => setInfo("privacy")}
              >
                Privacy & demo information
              </button>
            </div>
          </div>
        </footer>
      )}
      <Modal open={menu} onOpenChange={setMenu} title="Explore ASTRA">
        <nav className="mobile-menu" aria-label="Mobile navigation">
          {nav}
          <Link href={state.clientId ? "/dashboard" : "/login"} onClick={() => setMenu(false)}>
            {state.clientId ? "My dashboard" : "Log in / Sign up"}
          </Link>
          <Link href="/astrologer/login" onClick={() => setMenu(false)}>
            Astrologer workspace
          </Link>
          <Link href="/tech-stack" onClick={() => setMenu(false)}>
            Technology & architecture
          </Link>
        </nav>
      </Modal>
      <Modal
        open={info !== null}
        onOpenChange={open => {
          if (!open) setInfo(null);
        }}
        title={info === "privacy" ? "Your privacy in this demo" : "A little clarity about ASTRA"}
      >
        <div className="stack">
          <p>
            This pitch prototype demonstrates a private consultation platform. All astrologers, reviews, verification
            statuses and consultation histories are fictional.
          </p>
          <p>
            Data is stored locally in this browser. Do not enter real sensitive birth details, passwords or payment
            information. Use Demo controls to reset your data.
          </p>
          <p>
            Authentication, video, chat delivery, notifications and payments are simulated. There is no secure backend,
            remote participant or payment processing.
          </p>
          <p className="muted">
            Astrology is presented as personal reflection, not medical, legal or financial advice, and does not
            guarantee outcomes.
          </p>
          <Link className="text-link" href="/tech-stack" onClick={() => setInfo(null)}>
            Explore the proposed architecture <ArrowUpRight size={15} />
          </Link>
        </div>
      </Modal>
      <DemoControls />
    </>
  );
}
