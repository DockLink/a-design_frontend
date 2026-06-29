"use client";

import { toast } from "sonner";

// Dedup guard so a burst of failing requests only shows one toast.
let lastNotified = 0;
const DEDUP_WINDOW_MS = 5_000;

/**
 * Surfaces a single, friendly "session expired" toast. Safe to call from
 * non-React modules (the store, the API client) — it no-ops if called again
 * within the dedup window.
 */
export function notifySessionExpired(): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastNotified < DEDUP_WINDOW_MS) return;
  lastNotified = now;
  toast.error("Session expired, please log in.");
}
