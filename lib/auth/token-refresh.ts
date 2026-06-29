"use client";

import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/types/api";

/**
 * Treats an error as an auth/expiry failure that a token refresh might fix.
 * Covers both the HTTP 401 status and Supabase's raw "jwt expired" message
 * that occasionally surfaces with other status codes.
 */
export function isAuthExpiryError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 401) return true;
  const msg = error.message?.toLowerCase() ?? "";
  return (
    msg.includes("jwt expired") ||
    msg.includes("token expired") ||
    msg.includes("invalid jwt") ||
    msg.includes("token is expired")
  );
}

/** Access tokens are proactively refreshed when they expire within this window. */
export const PROACTIVE_REFRESH_WINDOW_MS = 60_000;

// Single in-flight refresh shared across all concurrent callers so a burst of
// simultaneous 401s only triggers one network round-trip.
let inFlight: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (inFlight) return inFlight;
  inFlight = useAuthStore
    .getState()
    .refreshSession()
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** Milliseconds until the current access token expires (Infinity if unknown). */
export function msUntilExpiry(): number {
  const expiresAt = useAuthStore.getState().session?.expiresAt;
  if (!expiresAt) return Infinity;
  // Supabase `expires_at` is a unix timestamp in seconds.
  return expiresAt * 1000 - Date.now();
}

/**
 * Returns a valid (fresh enough) access token, proactively refreshing first if
 * the current one is about to expire. Returns null if there's no session.
 */
export async function ensureFreshToken(): Promise<string | null> {
  const session = useAuthStore.getState().session;
  if (!session?.accessToken) return null;

  if (session.refreshToken && msUntilExpiry() <= PROACTIVE_REFRESH_WINDOW_MS) {
    try {
      const refreshed = await refreshAccessToken();
      return refreshed ?? useAuthStore.getState().session?.accessToken ?? null;
    } catch {
      // Network blip during proactive refresh — fall back to the existing
      // token; the reactive path will retry on a real 401.
      return useAuthStore.getState().session?.accessToken ?? null;
    }
  }

  return session.accessToken;
}
