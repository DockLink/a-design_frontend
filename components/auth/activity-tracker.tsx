"use client";

import { useEffect } from "react";

import { recordActivity } from "@/lib/auth/activity";
import {
  PROACTIVE_REFRESH_WINDOW_MS,
  msUntilExpiry,
  refreshAccessToken,
} from "@/lib/auth/token-refresh";
import { useAuthStore } from "@/stores/auth-store";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"] as const;

// How often to check whether the access token is close to expiring.
const REFRESH_CHECK_INTERVAL_MS = 30_000;

/**
 * Mounted inside the authenticated shell. Two jobs:
 *  1. Record genuine user interaction so the 2-day inactivity window is accurate.
 *  2. Proactively refresh the access token in the background so an idle (but
 *     recently-active) user never hits a "jwt expired" error mid-session.
 */
export function ActivityTracker() {
  useEffect(() => {
    const onActivity = () => recordActivity();
    for (const evt of ACTIVITY_EVENTS) {
      window.addEventListener(evt, onActivity, { passive: true });
    }
    // Count mount as activity (the user just navigated here).
    recordActivity(true);

    return () => {
      for (const evt of ACTIVITY_EVENTS) {
        window.removeEventListener(evt, onActivity);
      }
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      const session = useAuthStore.getState().session;
      if (!session?.refreshToken) return;
      if (msUntilExpiry() <= PROACTIVE_REFRESH_WINDOW_MS) {
        // refreshSession internally enforces the inactivity ceiling and will
        // log out + notify if the user has been gone too long.
        void refreshAccessToken();
      }
    };

    const interval = setInterval(tick, REFRESH_CHECK_INTERVAL_MS);
    // Also refresh immediately when the tab regains focus after being hidden.
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
