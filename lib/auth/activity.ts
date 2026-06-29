"use client";

/**
 * Tracks the timestamp of the user's last *real* interaction so we can expire
 * a session after a fixed window of inactivity, regardless of how long the
 * refresh token itself stays valid.
 *
 * Automated background work (notification polling, proactive token refresh)
 * deliberately does NOT count as activity — only genuine user input does.
 */

export const LAST_ACTIVE_KEY = "adesign-last-active";

/** Sessions expire after this much inactivity even if the token could refresh. */
export const INACTIVITY_LIMIT_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

/** Throttle window so we don't hammer localStorage on every mousemove. */
const WRITE_THROTTLE_MS = 30_000;

let lastWrite = 0;

export function recordActivity(force = false): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (!force && now - lastWrite < WRITE_THROTTLE_MS) return;
  lastWrite = now;
  try {
    window.localStorage.setItem(LAST_ACTIVE_KEY, String(now));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export function getLastActive(): number {
  if (typeof window === "undefined") return Date.now();
  try {
    const raw = window.localStorage.getItem(LAST_ACTIVE_KEY);
    if (!raw) return Date.now();
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : Date.now();
  } catch {
    return Date.now();
  }
}

/** True when the user has been inactive longer than the allowed window. */
export function isInactiveTooLong(): boolean {
  return Date.now() - getLastActive() > INACTIVITY_LIMIT_MS;
}

export function clearActivity(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LAST_ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}
