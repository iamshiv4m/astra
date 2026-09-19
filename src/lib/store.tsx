"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import * as domain from "./domain";
import type { DemoActions, DemoState } from "../types/domain";

export const STORAGE_KEY = "astra.demo.v1";
type Snapshot = { state: DemoState; ready: boolean; error: string | null };

function createDemoStore() {
  const serverSnapshot: Snapshot = { state: domain.createSeed("2026-01-01"), ready: false, error: null };
  let snapshot = serverSnapshot;
  let storageBlocked = false;
  let persistenceError: string | null = null;
  const listeners = new Set<() => void>();
  const emit = (next: Partial<Snapshot>) => {
    snapshot = { ...snapshot, ...next };
    listeners.forEach(listener => listener());
  };
  const persist = (state: DemoState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      persistenceError = null;
    } catch {
      persistenceError = "In-memory demo mode: changes could not be saved in this browser and will be lost on reload. Allow browser storage or reset to retry.";
    }
  };
  const commit = (state: DemoState) => {
    persist(state);
    emit({ state, error: persistenceError });
  };
  const run = <T,>(operation: () => T): T => {
    try {
      if (!snapshot.ready) throw new Error("The demo is still loading. Please try again in a moment.");
      if (storageBlocked) throw new Error("Saved demo data cannot be loaded. Use Reset demo before making changes.");
      return operation();
    } catch (error) {
      emit({ error: error instanceof Error ? error.message : "The demo action failed. Please try again." });
      throw error;
    }
  };
  const mutate = (operation: (state: DemoState) => DemoState) => run(() => {
    const next = operation(snapshot.state);
    if (next !== snapshot.state) commit(next);
  });
  const actions: DemoActions = {
    login: (role, name, contact) => mutate(state => domain.login(state, role, name, contact)),
    logout: role => mutate(state => domain.logout(state, role)),
    updateClient: patch => mutate(state => domain.updateClient(state, patch)),
    updateAstrologer: (id, patch) => mutate(state => domain.updateAstrologer(state, id, patch)),
    saveSchedule: schedule => mutate(state => domain.saveSchedule(state, schedule)),
    book: input => run(() => {
      const result = domain.bookConsultation(snapshot.state, input);
      if (result.state !== snapshot.state) commit(result.state);
      return result.booking;
    }),
    join: (id, demoNow) => mutate(state => domain.joinConsultation(state, id, demoNow)),
    setCallStatus: (id, status) => mutate(state => domain.setCallStatus(state, id, status)),
    toggleControl: (id, control) => mutate(state => domain.toggleControl(state, id, control)),
    endSession: id => mutate(state => domain.endConsultation(state, id)),
    rateSession: (id, rating, feedback) => mutate(state => domain.rateConsultation(state, id, rating, feedback)),
    sendMessage: (id, text, sender) => mutate(state => domain.sendMessage(state, id, text, sender)),
    replyMessage: id => mutate(state => domain.replyMessage(state, id)),
    retryMessage: id => mutate(state => domain.retryMessage(state, id)),
    setScenario: scenario => mutate(state => {
      if (!["normal", "loading", "error", "empty", "payment-failure"].includes(scenario)) throw new Error("Unknown demo scenario.");
      return { ...state, scenario };
    }),
    reset: () => {
      storageBlocked = false;
      let draftError: string | null = null;
      try {
        const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index));
        keys.forEach(key => { if (key?.startsWith("ASTRA:booking-draft:v1:")) localStorage.removeItem(key); });
      } catch {
        draftError = "Demo reset in memory, but old booking drafts could not be removed from browser storage. Allow storage and reset again before restoring a draft.";
      }
      commit(domain.createSeed());
      if (draftError) persistenceError = draftError;
      emit({ ready: true, error: persistenceError });
    },
    clearError: () => emit({ error: storageBlocked ? "Saved demo data cannot be loaded. Use Reset demo to recover." : persistenceError }),
  };
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    actions,
    hydrate: () => {
      let raw: string | null;
      try { raw = localStorage.getItem(STORAGE_KEY); }
      catch {
        persistenceError = "In-memory demo mode: browser storage is unavailable. Changes will be lost on reload.";
        emit({ state: domain.createSeed(), ready: true, error: persistenceError });
        return;
      }
      if (raw !== null) {
        try {
          commit(domain.validateSnapshot(JSON.parse(raw)));
          emit({ ready: true });
        }
        catch {
          storageBlocked = true;
          emit({ state: domain.createSeed(), ready: true, error: "Saved demo data is invalid or outdated. Your saved data was not overwritten. Use Reset demo to recover." });
        }
      } else {
        commit(domain.createSeed());
        emit({ ready: true });
      }
    },
    tick: (elapsed: number) => {
      if (!snapshot.ready || storageBlocked || elapsed <= 0) return;
      const state = { ...snapshot.state, now: snapshot.state.now + elapsed };
      persist(state);
      emit({ state, error: persistenceError ?? snapshot.error });
    },
    receive: (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      try {
        if (event.newValue === null) throw new Error("The saved demo was removed in another tab. Reset demo to continue.");
        const state = domain.validateSnapshot(JSON.parse(event.newValue));
        storageBlocked = false;
        emit({ state, error: null });
      } catch {
        storageBlocked = true;
        emit({ error: "Saved demo data changed in another tab and cannot be loaded. Use Reset demo to recover." });
      }
    },
  };
}

type Store = ReturnType<typeof createDemoStore>;
const Context = createContext<Store | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createDemoStore);
  useEffect(() => {
    store.hydrate();
    let previous = Date.now();
    const timer = window.setInterval(() => {
      const now = Date.now();
      store.tick(Math.max(0, now - previous));
      previous = now;
    }, 1000);
    window.addEventListener("storage", store.receive);
    return () => { window.clearInterval(timer); window.removeEventListener("storage", store.receive); };
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useDemo(): { state: DemoState; ready: boolean; error: string | null; actions: DemoActions } {
  const store = useContext(Context);
  if (!store) throw new Error("useDemo must be used inside DemoProvider.");
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return { ...snapshot, actions: store.actions };
}
