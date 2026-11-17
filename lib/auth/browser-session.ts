"use client";

/**
 * Session cookie that marks the current browser process as authenticated.
 * Cleared by the browser on a full quit (no Max-Age / Expires), so the next
 * cold open cannot restore localStorage auth without logging in again.
 * Shared across tabs, unlike sessionStorage.
 */

export const BROWSER_SESSION_COOKIE = "adesign-browser-session";

function cookieAttributes(clearing = false): string {
  const parts = ["path=/", "SameSite=Lax"];
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("Secure");
  }
  if (clearing) {
    parts.push("Max-Age=0");
  }
  return parts.join("; ");
}

export function hasBrowserSession(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((part) => part.startsWith(`${BROWSER_SESSION_COOKIE}=`));
}

export function markBrowserSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${BROWSER_SESSION_COOKIE}=1; ${cookieAttributes()}`;
}

export function clearBrowserSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${BROWSER_SESSION_COOKIE}=; ${cookieAttributes(true)}`;
}
