import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { elapsedSeconds, formatElapsed, getSessionAccess, nextDemoStatus, validateMessage } from "@/features/session/helpers";
import { CallControls, ChatPanel, ChatSheet, FeedbackForm } from "@/features/session/components";
import { ConsultationRoom } from "@/features/session/consultation-room";
import type { Booking, DemoActions, DemoState, Session } from "@/types/domain";

const booking = {
  clientId: "client-1", astrologerId: "ananya", start: "2026-09-19T10:00:00Z",
  end: "2026-09-19T10:30:00Z", status: "confirmed",
} as Booking;
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("consultation entry", () => {
  const roomState = {
    now: Date.parse("2026-09-19T09:00:00Z"), clientId: "client-1", astrologerId: null, scenario: "normal",
    clients: [{ id: "client-1", name: "Shivam" }],
    astrologers: [{ id: "ananya", name: "Ananya Sharma", title: "Vedic astrologer", image: "/portrait.svg", color: "#eee" }],
    bookings: [{ ...booking, id: "b1", sessionId: "s1", astrologerName: "Ananya Sharma", duration: 30, price: 149900 }],
    sessions: [{ id: "s1", bookingId: "b1", status: "waiting", muted: false, cameraOff: false, speakerOff: false, sharing: false }],
    messages: [],
  } as unknown as DemoState;

  it("provides an explicit demo entry without rewriting a future appointment", () => {
    vi.useFakeTimers();
    const join = vi.fn();
    const setCallStatus = vi.fn();
    const actions = { join, setCallStatus, replyMessage: vi.fn() } as unknown as DemoActions;
    const view = render(<ConsultationRoom sessionId="s1" demoRequested state={roomState} actions={actions} />);
    expect(join).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Enter demo room" }));
    expect(setCallStatus).toHaveBeenCalledWith("s1", "astrologer-joined");
    view.rerender(<ConsultationRoom sessionId="s1" demoRequested state={roomState} actions={actions} />);
    vi.advanceTimersByTime(1200);
    expect(join).toHaveBeenCalledExactlyOnceWith("s1", true);
    expect(roomState.bookings[0].start).toBe("2026-09-19T10:00:00Z");
    vi.useRealTimers();
  });

  it("does not restart an active consultation after a refresh", () => {
    const join = vi.fn();
    render(<ConsultationRoom sessionId="s1" demoRequested state={{ ...roomState, sessions: [{ ...roomState.sessions[0], status: "active", startedAt: "2026-09-19T08:59:00Z" }] }} actions={{ join } as unknown as DemoActions} />);
    expect(screen.getByLabelText("Consultation duration")).toHaveTextContent("01:00");
    expect(join).not.toHaveBeenCalled();
  });

  it("cancels a pending simulated join when the room is left", () => {
    vi.useFakeTimers();
    const join = vi.fn();
    const view = render(<ConsultationRoom sessionId="s1" demoRequested state={roomState} actions={{ join, setCallStatus: vi.fn() } as unknown as DemoActions} />);
    fireEvent.click(screen.getByRole("button", { name: "Enter demo room" }));
    view.unmount();
    vi.advanceTimersByTime(2000);
    expect(join).not.toHaveBeenCalled();
  });

  it("cancels pending scripted replies when the consultation ends", () => {
    vi.useFakeTimers();
    const activeState = { ...roomState, sessions: [{ ...roomState.sessions[0], status: "active" as const, startedAt: "2026-09-19T08:59:00Z" }] };
    const replyMessage = vi.fn();
    const actions = { replyMessage, sendMessage: vi.fn() } as unknown as DemoActions;
    const view = render(<ConsultationRoom sessionId="s1" state={activeState} actions={actions} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), { target: { value: "Career" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    view.rerender(<ConsultationRoom sessionId="s1" state={{ ...activeState, sessions: [{ ...activeState.sessions[0], status: "ended", endedAt: "2026-09-19T09:00:00Z" }] }} actions={actions} />);
    vi.advanceTimersByTime(2000);
    expect(replyMessage).not.toHaveBeenCalled();
    expect(screen.getByText("01:00")).toBeInTheDocument();
  });

  it("guards unknown and foreign sessions with a recovery link", () => {
    const view = render(<ConsultationRoom sessionId="missing" state={roomState} actions={{} as DemoActions} />);
    expect(screen.getByText("This room isn’t available")).toBeInTheDocument();
    view.rerender(<ConsultationRoom sessionId="s1" state={{ ...roomState, clientId: "other" }} actions={{} as DemoActions} />);
    expect(screen.getByText("Sign in to your consultation")).toBeInTheDocument();
  });

  it("uses the shared main landmark rather than nesting another one", () => {
    render(<main id="main-content"><ConsultationRoom sessionId="s1" state={roomState} actions={{} as DemoActions} /></main>);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});

describe("consultation controls", () => {
  it("restores focus to chat when the mobile sheet closes", async () => {
    const restore = vi.fn();
    function SheetExample() {
      const [open, setOpen] = useState(true);
      return <ChatSheet open={open} onOpenChange={setOpen} onCloseFocus={restore}><button onClick={() => setOpen(false)}>Back to call</button></ChatSheet>;
    }
    render(<SheetExample />);
    fireEvent.click(screen.getByRole("button", { name: "Back to call" }));
    await waitFor(() => expect(restore).toHaveBeenCalled());
  });

  it("sends trimmed text and exposes failed-message retry", () => {
    const send = vi.fn();
    const retry = vi.fn();
    render(<ChatPanel messages={[{ id: "m1", sessionId: "s1", sender: "client", text: "Hello", status: "failed", timestamp: "2026-09-19T10:00:00Z" }]} role="client" clientName="Shivam" astrologerName="Ananya" onSend={send} onRetry={retry} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), { target: { value: "  Career guidance  " } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(send).toHaveBeenCalledWith("Career guidance");
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Retry message" }));
    expect(retry).toHaveBeenCalledWith("m1");
  });

  it("exposes truthful simulated media states and persistent end action", () => {
    const toggle = vi.fn();
    const end = vi.fn();
    render(<CallControls session={{ muted: true, cameraOff: false, speakerOff: false, sharing: false } as Session} onToggle={toggle} onChat={() => {}} onEnd={end} chatOpen={false} />);
    expect(screen.getByRole("button", { name: "Unmute microphone" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Turn camera off" }));
    expect(toggle).toHaveBeenCalledWith("cameraOff");
    fireEvent.click(screen.getByRole("button", { name: "End consultation" }));
    expect(end).toHaveBeenCalledOnce();
  });

  it("requires a star rating and submits optional feedback", () => {
    const submit = vi.fn();
    render(<FeedbackForm onSubmit={submit} />);
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a rating");
    fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
    fireEvent.change(screen.getByLabelText("A few words about your consultation (optional)"), { target: { value: "Thoughtful guidance." } });
    fireEvent.click(screen.getByRole("button", { name: "Save feedback" }));
    expect(submit).toHaveBeenCalledWith(4, "Thoughtful guidance.");
  });
});

describe("consultation room", () => {
  it("counts only consultation time and freezes at the real end", () => {
    expect(elapsedSeconds({} as Session, Date.parse("2026-09-19T10:20:00Z"))).toBe(0);
    expect(elapsedSeconds({ startedAt: "2026-09-19T10:00:00Z", endedAt: "2026-09-19T10:02:13Z" } as Session, Date.parse("2026-09-19T11:00:00Z"))).toBe(133);
    expect(elapsedSeconds({ startedAt: "2026-09-19T11:00:00Z" } as Session, Date.parse("2026-09-19T10:00:00Z"))).toBe(0);
  });

  it("formats a timer without wrapping after an hour", () => {
    expect(formatElapsed(0)).toBe("00:00");
    expect(formatElapsed(125)).toBe("02:05");
    expect(formatElapsed(3661)).toBe("1:01:01");
  });

  it("only allows matching participants and scheduled joining inside ten minutes", () => {
    expect(getSessionAccess(booking, "other", null, Date.parse("2026-09-19T09:55:00Z"))).toEqual({ authorized: false, canJoin: false, roles: [] });
    expect(getSessionAccess(booking, "client-1", null, Date.parse("2026-09-19T09:49:59Z")).canJoin).toBe(false);
    expect(getSessionAccess(booking, "client-1", null, Date.parse("2026-09-19T09:50:00Z")).canJoin).toBe(true);
    expect(getSessionAccess(booking, "client-1", "ananya", Date.parse("2026-09-19T09:55:00Z")).roles).toEqual(["client", "astrologer"]);
    expect(getSessionAccess({ ...booking, status: "completed" }, "client-1", null, Date.parse("2026-09-19T10:00:00Z")).canJoin).toBe(false);
  });

  it("progresses both simulated join orders without restarting an ended room", () => {
    expect(nextDemoStatus("waiting", "client")).toBe("astrologer-joined");
    expect(nextDemoStatus("waiting", "astrologer")).toBe("client-joined");
    expect(nextDemoStatus("astrologer-joined", "client")).toBe("active");
    expect(nextDemoStatus("client-joined", "astrologer")).toBe("active");
    expect(nextDemoStatus("ended", "client")).toBe("ended");
    expect(nextDemoStatus("unstable", "client")).toBe("active");
  });

  it("trims messages and rejects empty or oversized submissions", () => {
    expect(validateMessage("  A question about my career.  ")).toBe("A question about my career.");
    expect(() => validateMessage(" \n ")).toThrow("Write a message");
    expect(() => validateMessage("a".repeat(2001))).toThrow("2,000");
  });
});
