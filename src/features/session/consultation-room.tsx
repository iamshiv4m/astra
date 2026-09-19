"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, MicOff, MonitorUp, Signal, VideoOff, WifiOff } from "lucide-react";
import { Avatar, EmptyState, Modal } from "@/components/ui";
import { formatDate, formatTime, money } from "@/lib/domain";
import type { Astrologer, Booking, CallStatus, DemoActions, DemoState, Role, Session } from "@/types/domain";
import { CallControls, ChatPanel, ChatSheet, FeedbackForm } from "./components";
import { elapsedSeconds, formatElapsed, getSessionAccess, nextDemoStatus } from "./helpers";
import styles from "./session.module.css";

interface RoomProps {
  sessionId: string;
  demoRequested?: boolean;
  state: DemoState;
  actions: DemoActions;
  error?: string | null;
}
const mobileQuery = "(max-width: 900px)";
function subscribeToViewport(listener: () => void) {
  const query = window.matchMedia?.(mobileQuery);
  query?.addEventListener("change", listener);
  return () => query?.removeEventListener("change", listener);
}
function mobileSnapshot() {
  return window.matchMedia?.(mobileQuery).matches ?? false;
}

export function ConsultationRoom({ sessionId, demoRequested = false, state, actions, error }: RoomProps) {
  const session = state.sessions.find(item => item.id === sessionId);
  const booking = state.bookings.find(item => item.id === session?.bookingId);
  const astrologer = state.astrologers.find(item => item.id === booking?.astrologerId);
  if (!session || !booking || !astrologer)
    return (
      <div className={styles.guard}>
        <EmptyState
          title="This room isn’t available"
          description="The consultation may have been removed when the demo was reset. Your current bookings are a good place to start."
          href="/dashboard/bookings"
          label="View my bookings"
        />
      </div>
    );
  const access = getSessionAccess(booking, state.clientId, state.astrologerId, state.now);
  if (!access.authorized)
    return (
      <div className={styles.guard}>
        <EmptyState
          title="Sign in to your consultation"
          description="This room belongs to a different demo profile. Sign in as the client who booked it, or as its astrologer. These are local demo identities, not production authentication."
          href={`/login?next=${encodeURIComponent(`/session/${sessionId}${demoRequested ? "?demo=1" : ""}`)}`}
          label="Client sign in"
        />
        <p style={{ textAlign: "center" }}>
          <Link
            href={`/astrologer/login?next=${encodeURIComponent(`/session/${sessionId}${demoRequested ? "?demo=1" : ""}`)}`}
          >
            Astrologer sign in
          </Link>
        </p>
      </div>
    );
  return (
    <Room
      key={`${session.id}-${state.seedDate}`}
      state={state}
      session={session}
      booking={booking}
      astrologer={astrologer}
      roles={access.roles}
      canJoin={access.canJoin}
      demoRequested={demoRequested}
      actions={actions}
      storeError={error}
    />
  );
}

function Room({
  state,
  session,
  booking,
  astrologer,
  roles,
  canJoin,
  demoRequested,
  actions,
  storeError,
}: {
  state: DemoState;
  session: Session;
  booking: Booking;
  astrologer: Astrologer;
  roles: Role[];
  canJoin: boolean;
  demoRequested: boolean;
  actions: DemoActions;
  storeError?: string | null;
}) {
  const [selectedRole, setRole] = useState<Role>(roles[0]);
  const role = roles.includes(selectedRole) ? selectedRole : roles[0];
  const [chatOpen, setChatOpen] = useState(false);
  const [desktopChat, setDesktopChat] = useState(true);
  const [endOpen, setEndOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [localError, setError] = useState("");
  const mobile = useSyncExternalStore(subscribeToViewport, mobileSnapshot, () => false);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const joinPending = useRef(false);
  const chatButton = useRef<HTMLDivElement>(null);
  const client = state.clients.find(item => item.id === booking.clientId);
  const clientName = client?.name || "Client";
  const selfName = role === "client" ? clientName : astrologer.name;
  const remoteName = role === "client" ? astrologer.name : clientName;
  const ended = session.status === "ended";
  const entered = Boolean(session.startedAt);
  const duration = formatElapsed(elapsedSeconds(session, state.now));
  const messages = state.messages.filter(item => item.sessionId === session.id);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
      joinPending.current = false;
    };
  }, [session.id, session.startedAt, ended, state.seedDate]);

  function attempt(action: () => void) {
    try {
      action();
      setError("");
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
      return false;
    }
  }
  function later(action: () => void, delay: number) {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      attempt(action);
    }, delay);
    timers.current.add(timer);
  }
  function enter(demo: boolean) {
    if (joinPending.current || entered) return;
    if (!demo && !canJoin) {
      setError("Scheduled joining opens 10 minutes before your appointment.");
      return;
    }
    if (
      !attempt(() =>
        actions.setCallStatus(
          session.id,
          session.status === "waiting" ? nextDemoStatus("waiting", role) : session.status
        )
      )
    )
      return;
    joinPending.current = true;
    setJoining(true);
    later(() => {
      try {
        actions.join(session.id, demo);
        if (!messages.length) actions.replyMessage(session.id);
      } finally {
        joinPending.current = false;
        setJoining(false);
      }
    }, 1200);
  }
  function send(text: string) {
    actions.sendMessage(session.id, text, role);
    later(() => actions.replyMessage(session.id), 1400);
  }
  function retry(id: string) {
    if (attempt(() => actions.retryMessage(id))) later(() => actions.replyMessage(session.id), 1400);
  }
  function changeChat(open: boolean) {
    setChatOpen(open);
  }
  function openChat() {
    if (mobile) setChatOpen(true);
    else setDesktopChat(value => !value);
  }
  function endCall() {
    if (!entered) {
      setEndOpen(false);
      return;
    }
    if (attempt(() => actions.endSession(session.id))) {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
      setEndOpen(false);
      setChatOpen(false);
    }
  }

  if (ended)
    return (
      <div className={styles.recapPage}>
        <Link className={styles.brand} href="/">
          ASTRA
        </Link>
        <div className={styles.recap}>
          <header className={styles.recapHeading}>
            <span className={styles.recapCheck}>
              <Check size={25} />
            </span>
            <h1>A little more clarity.</h1>
            <p>Your simulated consultation is complete. Take a moment to reflect on the conversation.</p>
          </header>
          <div className={styles.summary}>
            <Avatar astrologer={astrologer} size={52} />
            <div>
              <strong>{astrologer.name}</strong>
              <p>
                {formatDate(booking.start)} · {formatTime(booking.start)} IST
              </p>
              <p>{money(booking.price)} · Simulated payment</p>
            </div>
            <div className={styles.summaryTime}>
              <strong>{duration}</strong>
              <p>Time together</p>
            </div>
          </div>
          {role === "client" ? (
            <FeedbackForm
              key={session.id}
              rating={session.rating}
              feedback={session.feedback}
              onSubmit={(rating, feedback) => actions.rateSession(session.id, rating, feedback)}
            />
          ) : (
            <p>
              {session.rating
                ? `The client rated this consultation ${session.rating} out of 5 stars.`
                : "Client feedback will appear here when it is submitted."}
            </p>
          )}
          <div className={styles.recapLinks}>
            <Link className={styles.primary} href={`/booking/${astrologer.id}`}>
              Book another session <ArrowRight size={16} />
            </Link>
            <Link href={role === "client" ? `/dashboard/bookings/${booking.id}` : "/astrologer/sessions"}>
              Return to my sessions
            </Link>
          </div>
        </div>
      </div>
    );

  const statusText: Record<CallStatus, string> = {
    waiting: "Your room is ready",
    "astrologer-joined": `${astrologer.name.split(" ")[0]} has joined`,
    "client-joined": `${clientName.split(" ")[0]} has joined`,
    active: "Connected · simulated",
    unstable: "Connection unstable · simulated",
    ended: "Consultation complete",
  };
  const chatProps = {
    messages,
    role,
    clientName,
    astrologerName: astrologer.name,
    onSend: send,
    onRetry: retry,
    disabled: !entered,
  };
  return (
    <div className={styles.room}>
      <header className={styles.topbar}>
        <Link
          className={styles.brand}
          href={role === "client" ? "/dashboard" : "/astrologer/dashboard"}
          aria-label="ASTRA dashboard"
        >
          ASTRA
        </Link>
        <div className={styles.topContext}>
          <div>
            <strong>{booking.topic || "A conversation for clarity"}</strong>
            {booking.duration}-minute consultation · {formatTime(booking.start)} IST
          </div>
          <span className={styles.simulated}>Simulated consultation</span>
        </div>
      </header>
      {(localError || storeError) && (
        <div className={styles.notice} role="alert">
          {localError || storeError}
        </div>
      )}
      <div className={`${styles.workspace} ${desktopChat ? "" : styles.workspaceNoChat}`}>
        <section className={styles.call} aria-label="Consultation stage">
          <div className={styles.stage}>
            <div className={styles.stageTop}>
              <div
                className={`${styles.connection} ${session.status === "unstable" ? styles.unstable : ""}`}
                role="status"
              >
                {session.status === "unstable" ? <WifiOff size={15} /> : <Signal size={15} />}
                {statusText[session.status]}
              </div>
              <span className={styles.timer} aria-label="Consultation duration">
                <span className={styles.timerDot} />
                {duration}
              </span>
            </div>
            {session.sharing && (
              <div className={styles.sharing}>
                <MonitorUp size={15} />
                Screen share preview · simulation only
              </div>
            )}
            <div className={styles.remote}>
              {role === "client" ? (
                <Avatar astrologer={astrologer} size={166} className={styles.portrait} />
              ) : (
                <span className={styles.selfInitial} style={{ width: 116, height: 116, fontSize: 40 }}>
                  {clientName.charAt(0)}
                </span>
              )}
              <h1>{remoteName}</h1>
              <p>{role === "client" ? astrologer.title : "Your consultation client"}</p>
              {entered ? (
                <span className={styles.presence}>
                  <span />
                  {session.status === "unstable" ? "Reconnecting the demo room…" : "Here with you · portrait preview"}
                </span>
              ) : (
                <div className={styles.lobbyActions}>
                  {demoRequested ? (
                    <button className={styles.primary} disabled={joining} onClick={() => enter(true)}>
                      {joining ? "Connecting demo room…" : "Enter demo room"} <ArrowRight size={15} />
                    </button>
                  ) : (
                    <>
                      <button className={styles.primary} disabled={joining || !canJoin} onClick={() => enter(false)}>
                        {joining ? "Connecting…" : "Join scheduled consultation"}
                      </button>
                      <button className={styles.secondary} disabled={joining} onClick={() => enter(true)}>
                        Start demo now
                      </button>
                    </>
                  )}
                  <small>
                    {joining
                      ? "Connecting your simulated participants. No device access is requested."
                      : `Scheduled for ${formatDate(booking.start)}, ${formatTime(booking.start)} IST. ${demoRequested ? "Demo entry leaves this time unchanged." : canJoin ? "Your scheduled room is open." : "Scheduled joining opens 10 minutes before. Try the demo at any time."}`}
                  </small>
                </div>
              )}
            </div>
            <div className={styles.stageBottom}>
              <strong>{remoteName}</strong>
              <span>{role === "client" ? "Your astrologer" : "Your client"} · No live video</span>
            </div>
            <div className={styles.self} aria-label="Your simulated camera preview">
              {session.cameraOff ? (
                <VideoOff size={26} />
              ) : (
                <span className={styles.selfInitial}>{selfName.charAt(0)}</span>
              )}
              <div className={styles.selfLabel}>
                <span>You · {session.cameraOff ? "camera off" : "preview"}</span>
                {session.muted && <MicOff size={12} />}
              </div>
            </div>
          </div>
          <div className={styles.scenario}>
            <label htmlFor="connection-scenario">Demo connection</label>
            <select
              id="connection-scenario"
              value={session.status}
              disabled={joining}
              onChange={event => attempt(() => actions.setCallStatus(session.id, event.target.value as CallStatus))}
            >
              {!entered && (
                <>
                  <option value="waiting">Waiting room</option>
                  <option value="astrologer-joined">Astrologer joined first</option>
                  <option value="client-joined">Client joined first</option>
                </>
              )}
              {entered && (
                <>
                  <option value="active">Connected</option>
                  <option value="unstable">Unstable connection</option>
                </>
              )}
            </select>
            {roles.length > 1 && (
              <>
                <label htmlFor="session-role">Viewing as</label>
                <select id="session-role" value={role} onChange={event => setRole(event.target.value as Role)}>
                  <option value="client">Client</option>
                  <option value="astrologer">Astrologer</option>
                </select>
              </>
            )}
          </div>
          <div ref={chatButton}>
            <CallControls
              session={session}
              onToggle={control => attempt(() => actions.toggleControl(session.id, control))}
              onChat={openChat}
              onEnd={() => setEndOpen(true)}
              chatOpen={mobile ? chatOpen : desktopChat}
            />
          </div>
          <p className={styles.controlNote}>
            Camera, microphone, audio and sharing are simulated. No permissions needed.
          </p>
        </section>
        {desktopChat && (
          <div className={`${styles.chat} ${styles.desktopChat}`}>
            <ChatPanel {...chatProps} />
          </div>
        )}
      </div>
      <ChatSheet
        open={chatOpen}
        onOpenChange={changeChat}
        onCloseFocus={() => {
          if (!endOpen)
            chatButton.current?.querySelector<HTMLButtonElement>('[aria-label="Open consultation chat"]')?.focus();
        }}
      >
        <ChatPanel {...chatProps} />
        <div className={styles.sheetEnd}>
          <button onClick={() => changeChat(false)}>Back to call</button>
          <button
            className={styles.endControl}
            onClick={() => {
              setChatOpen(false);
              setEndOpen(true);
            }}
          >
            End consultation
          </button>
        </div>
      </ChatSheet>
      <Modal
        open={endOpen}
        onOpenChange={setEndOpen}
        title={entered ? "End this consultation?" : "Leave the waiting room?"}
      >
        <p className={styles.confirmText}>
          {entered
            ? `You’ve spent ${duration} together. Ending will complete this booking in both demo dashboards. You can leave feedback next.`
            : "Your appointment will stay confirmed. You can return to this room from your bookings."}
        </p>
        <div className={styles.confirmActions}>
          <button onClick={() => setEndOpen(false)}>Stay in room</button>
          {entered ? (
            <button className={styles.endControl} onClick={endCall}>
              End consultation
            </button>
          ) : (
            <Link className={styles.primary} href={role === "client" ? "/dashboard/bookings" : "/astrologer/sessions"}>
              <ArrowLeft size={16} />
              Leave room
            </Link>
          )}
        </div>
      </Modal>
    </div>
  );
}
