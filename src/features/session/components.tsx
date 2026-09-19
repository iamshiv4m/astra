"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, MonitorUp, MessageSquare, PhoneOff, Star, Send, Check, CheckCheck, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { ChatMessage, Role, Session } from "@/types/domain";
import { formatTime } from "@/lib/domain";
import { validateMessage } from "./helpers";
import styles from "./session.module.css";

export function ChatSheet({ open, onOpenChange, onCloseFocus, children }: { open: boolean; onOpenChange: (open: boolean) => void; onCloseFocus: () => void; children: ReactNode }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="modal-overlay" />
    <Dialog.Content className={`modal-content ${styles.sheet}`} aria-describedby={undefined} onCloseAutoFocus={(event) => { event.preventDefault(); onCloseFocus(); }}>
      <div className="modal-heading"><Dialog.Title>Consultation chat</Dialog.Title><Dialog.Close className="icon-button" aria-label="Close chat"><X size={20} /></Dialog.Close></div>
      {children}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

export function ChatPanel({ messages, role, clientName, astrologerName, onSend, onRetry, disabled = false }: { messages: ChatMessage[]; role: Role; clientName: string; astrologerName: string; onSend: (text: string) => void; onRetry: (id: string) => void; disabled?: boolean }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  useEffect(() => {
    if (stickToBottom.current && scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages.length]);
  function send() {
    try {
      onSend(validateMessage(text));
      setText("");
      setError("");
      stickToBottom.current = true;
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Message could not be sent. Please try again."); }
  }
  return <section className={styles.chat} aria-label="Consultation chat">
    <header className={styles.chatHeader}><h2>In this conversation</h2><p>Your space for questions and reflections.</p></header>
    <div ref={scroller} className={styles.messages} role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions" onScroll={() => {
      const element = scroller.current;
      if (element) stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
    }}>
      <p className={styles.chatWelcome}>{messages.length ? "The beginning of your conversation" : "A little clarity starts with a question. Say hello when you’re ready."}<br />Messages and replies are simulated.</p>
      {messages.map((message) => <article key={message.id} className={`${styles.message} ${message.sender === role ? styles.ownMessage : ""}`}>
        <span className={styles.messageAuthor}>{message.sender === role ? "You" : message.sender === "client" ? clientName : astrologerName}</span>
        <p className={styles.bubble}>{message.text}</p>
        <div className={styles.messageMeta}>
          <time dateTime={message.timestamp}>{formatTime(message.timestamp)}</time>
          {message.sender === role && (message.status === "failed"
            ? <button className={styles.retry} onClick={() => onRetry(message.id)} aria-label="Retry message">Not sent · Retry</button>
            : <><span>{message.status === "read" ? "Read" : "Sent"}</span>{message.status === "read" ? <CheckCheck size={12} aria-hidden="true" /> : <Check size={12} aria-hidden="true" />}</>)}
        </div>
      </article>)}
    </div>
    <form className={styles.composer} onSubmit={(event) => { event.preventDefault(); send(); }}>
      <div className={styles.composerRow}>
        <textarea aria-label="Message" placeholder={disabled ? "Enter the room to chat" : "Write a message…"} rows={1} value={text} maxLength={2000} disabled={disabled} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); }
        }} />
        <button className={styles.send} type="submit" aria-label="Send message" disabled={disabled || !text.trim()}><Send size={17} /></button>
      </div>
      {error && <p role="alert" className={styles.formError}>{error}</p>}
      <p className={styles.chatCaption}>Stored only in this browser · Enter to send</p>
    </form>
  </section>;
}

export function CallControls({ session, onToggle, onChat, onEnd, chatOpen }: {
  session: Session; onToggle: (control: "muted" | "cameraOff" | "speakerOff" | "sharing") => void;
  onChat: () => void; onEnd: () => void; chatOpen: boolean;
}) {
  return <div className={styles.controls} aria-label="Simulated call controls">
    <button className={styles.control} aria-label={session.muted ? "Unmute microphone" : "Mute microphone"} aria-pressed={session.muted} onClick={() => onToggle("muted")}>
      {session.muted ? <MicOff size={21} /> : <Mic size={21} />}<span>{session.muted ? "Unmute" : "Mic"}</span>
    </button>
    <button className={styles.control} aria-label={session.cameraOff ? "Turn camera on" : "Turn camera off"} aria-pressed={!session.cameraOff} onClick={() => onToggle("cameraOff")}>
      {session.cameraOff ? <VideoOff size={21} /> : <Video size={21} />}<span>Camera</span>
    </button>
    <button className={styles.control} aria-label={session.speakerOff ? "Turn speaker on" : "Turn speaker off"} aria-pressed={!session.speakerOff} onClick={() => onToggle("speakerOff")}>
      {session.speakerOff ? <VolumeX size={21} /> : <Volume2 size={21} />}<span>Speaker</span>
    </button>
    <button className={styles.control} aria-label={session.sharing ? "Stop simulated screen share" : "Start simulated screen share"} aria-pressed={session.sharing} onClick={() => onToggle("sharing")}>
      <MonitorUp size={21} /><span>Share</span>
    </button>
    <button className={styles.control} aria-label="Open consultation chat" aria-pressed={chatOpen} onClick={onChat}>
      <MessageSquare size={21} /><span>Chat</span>
    </button>
    <button className={`${styles.control} ${styles.endControl}`} aria-label="End consultation" onClick={onEnd}><PhoneOff size={21} /><span>End</span></button>
  </div>;
}

export function FeedbackForm({ onSubmit, rating: initialRating = 0, feedback: initialFeedback = "" }: { onSubmit: (rating: number, feedback: string) => void; rating?: number; feedback?: string }) {
  const [rating, setRating] = useState(initialRating);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  return <form className={styles.feedback} onSubmit={(event) => {
    event.preventDefault();
    if (!rating) { setError("Choose a rating from 1 to 5 stars."); return; }
    try {
      onSubmit(rating, feedback.trim());
      setError("");
      setSaved(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Feedback could not be saved. Please try again."); }
  }}>
    <fieldset><legend>How was your consultation?</legend>
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((value) => <label key={value}>
          <input type="radio" name="rating" value={value} checked={rating === value} aria-label={`${value} ${value === 1 ? "star" : "stars"}`} onChange={() => { setRating(value); setSaved(false); }} />
          <Star aria-hidden="true" size={32} className={rating >= value ? styles.starSelected : ""} />
        </label>)}
      </div>
    </fieldset>
    <label htmlFor="session-feedback">A few words about your consultation (optional)</label>
    <textarea id="session-feedback" rows={3} maxLength={1000} value={feedback} placeholder="What felt helpful?" onChange={(event) => { setFeedback(event.target.value); setSaved(false); }} />
    {error && <p role="alert" className={styles.formError}>{error}</p>}
    {saved && <p role="status" className={styles.saved}>Thank you. Your feedback is saved in this demo.</p>}
    <button className={styles.primary} type="submit">{saved ? "Update feedback" : "Save feedback"}</button>
  </form>;
}
