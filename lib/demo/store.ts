"use client";

import { useSyncExternalStore } from "react";
import { createSeed } from "./seed";
import type { DemoState, DemoUser } from "./types";

/**
 * Browser-side demo "database". State lives in localStorage so the mockup works on any static host with no
 * backend. Seed data is deterministic (guest ids, phones, QR tokens) so a QR shown on one device scans on another.
 */
const STATE_KEY = "dawati-demo-v1";
const SESSION_KEY = "dawati-demo-session";

interface Snap { ready: boolean; state: DemoState; userId: string | null }

const EMPTY: Snap = {
  ready: false,
  userId: null,
  state: { version: 1, users: [], clients: [], events: [], guests: [], messages: [], orders: [], templates: [], scans: [] },
};

let snap: Snap = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function safeGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string | null) {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => safeSet(STATE_KEY, JSON.stringify(snap.state)), 150);
}

export function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  let state: DemoState | null = null;
  const raw = safeGet(STATE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.version === 1 && Array.isArray(parsed.events)) state = parsed;
    } catch { /* fall through to seed */ }
  }
  snap = { ready: true, state: state ?? createSeed(), userId: safeGet(SESSION_KEY) };
  if (!state) persist();
  emit();
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getSnapshot = () => snap;
const getServerSnapshot = () => EMPTY;

export function getDemoState(): DemoState { ensureLoaded(); return snap.state; }

/** Apply a pure transition from lib/demo/actions.ts. */
export function dispatch(fn: (s: DemoState) => DemoState) {
  ensureLoaded();
  snap = { ...snap, state: fn(snap.state) };
  persist();
  emit();
}

export function resetDemo() {
  snap = { ...snap, state: createSeed() };
  persist();
  emit();
}

export function signInAs(userId: string) {
  ensureLoaded();
  safeSet(SESSION_KEY, userId);
  snap = { ...snap, userId };
  emit();
}

export function signOutDemo() {
  safeSet(SESSION_KEY, null);
  snap = { ...snap, userId: null };
  emit();
}

/** Subscribe to the whole demo state. `ready` is false on the server and during hydration. */
export function useDemo() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (typeof window !== "undefined" && !loaded) queueMicrotask(ensureLoaded);
  return s;
}

export function useDemoUser(): { ready: boolean; user: DemoUser | null } {
  const { ready, state, userId } = useDemo();
  return { ready, user: userId ? (state.users.find((u) => u.id === userId) ?? null) : null };
}
