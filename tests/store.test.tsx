import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Suspense, useEffect } from "react";
import { renderToString } from "react-dom/server";
import { DemoProvider, STORAGE_KEY, useDemo } from "../src/lib/store";
import { createSeed } from "../src/lib/domain";
import type { DemoActions } from "../src/types/domain";

let actions: DemoActions;
function Probe() {
  const demo = useDemo();
  useEffect(() => {
    actions = demo.actions;
  }, [demo.actions]);
  return (
    <div>
      <span data-testid="ready">{String(demo.ready)}</span>
      <span data-testid="identity">{demo.state.clientId ?? "guest"}</span>
      <span data-testid="clock">{demo.state.now}</span>
      <span data-testid="error">{demo.error}</span>
      <span data-testid="bookings">{demo.state.bookings.length}</span>
    </div>
  );
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("persistent demo provider", () => {
  it("keeps the server snapshot stable while a suspended descendant hydrates after the provider", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    let blocked = false;
    let release!: () => void;
    const pending = new Promise<void>(resolve => {
      release = resolve;
    });
    function DelayedProbe() {
      if (blocked) throw pending;
      return <Probe />;
    }
    const app = (
      <DemoProvider>
        <Suspense fallback={<span>Loading boundary</span>}>
          <DelayedProbe />
        </Suspense>
      </DemoProvider>
    );
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(app);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createSeed("2026-09-19"), clientId: "shivam" }));
    blocked = true;
    const view = render(app, { container, hydrate: true });
    await act(async () => {
      blocked = false;
      release();
      await pending;
    });
    await waitFor(() => expect(screen.getByTestId("identity")).toHaveTextContent("shivam"));
    expect(errors.mock.calls.map(call => String(call[0])).join("\n")).not.toMatch(
      /hydration|didn't match|did not match/i
    );
    view.unmount();
    container.remove();
  });
  it("hydrates a validated snapshot, synchronously commits actions and persists identity", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createSeed("2026-09-19")));
    render(
      <DemoProvider>
        <Probe />
      </DemoProvider>
    );
    await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("true"));
    act(() => actions.login("client"));
    expect(screen.getByTestId("identity")).toHaveTextContent("shivam");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).clientId).toBe("shivam");
  });
  it("persists legacy portrait migration at hydration while retaining user edits and bookings", async () => {
    const state = createSeed("2026-09-19");
    state.astrologers[0].image = "/portraits/ananya-sharma.svg";
    state.astrologers[0].bio = "An edited biography to preserve.";
    state.astrologers[1].image = "/portraits/custom.jpg";
    state.clientId = "shivam";
    state.clients[0].name = "Shivam Updated";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render(
      <DemoProvider>
        <Probe />
      </DemoProvider>
    );
    await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("true"));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.astrologers[0]).toEqual({ ...state.astrologers[0], image: "/portraits/1.jpg" });
    expect(saved.astrologers[1]).toEqual(state.astrologers[1]);
    expect(saved.clients).toEqual(state.clients);
    expect(saved.bookings).toEqual(state.bookings);
    expect(saved.clientId).toBe("shivam");
    expect(screen.getByTestId("error")).toBeEmptyDOMElement();
  });
  it("preserves corrupt storage until explicit reset and surfaces an actionable error", async () => {
    localStorage.setItem(STORAGE_KEY, "{broken");
    render(
      <DemoProvider>
        <Probe />
      </DemoProvider>
    );
    await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent(/reset/i));
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{broken");
    expect(() => act(() => actions.login("client"))).toThrow(/reset/i);
    act(() => actions.reset());
    expect(screen.getByTestId("error")).toBeEmptyDOMElement();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).version).toBe(1);
  });
  it("resumes the checkpoint without adding elapsed closed time", async () => {
    const state = createSeed("2026-09-19");
    state.now += 123000;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render(
      <DemoProvider>
        <Probe />
      </DemoProvider>
    );
    await waitFor(() => expect(screen.getByTestId("clock")).toHaveTextContent(String(state.now)));
  });
  it("explicit reset removes ASTRA booking drafts without touching unrelated browser data", async () => {
    localStorage.setItem("ASTRA:booking-draft:v1:ananya-sharma", JSON.stringify({ requestId: "old-request" }));
    localStorage.setItem("other-app:settings", "keep");
    render(
      <DemoProvider>
        <Probe />
      </DemoProvider>
    );
    await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("true"));
    act(() => actions.reset());
    expect(localStorage.getItem("ASTRA:booking-draft:v1:ananya-sharma")).toBeNull();
    expect(localStorage.getItem("other-app:settings")).toBe("keep");
  });
  it("shows failed persistence instead of claiming a save, leaving usable memory state", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    render(
      <DemoProvider>
        <Probe />
      </DemoProvider>
    );
    await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("true"));
    expect(screen.getByTestId("error")).toHaveTextContent(/memory|persist|saved/i);
    act(() => actions.login("client"));
    expect(screen.getByTestId("identity")).toHaveTextContent("shivam");
    expect(screen.getByTestId("error")).toHaveTextContent(/memory|persist|saved/i);
  });
});
