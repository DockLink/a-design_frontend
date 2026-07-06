import type { NextRequest } from "next/server";

/** Forwards the browser IP and user-agent to the backend for session tracking. */
export function clientForwardHeaders(req: NextRequest): HeadersInit {
  const headers: Record<string, string> = {};
  const ua = req.headers.get("user-agent");
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  if (ua) headers["User-Agent"] = ua;
  if (forwarded) headers["X-Forwarded-For"] = forwarded;
  else if (realIp) headers["X-Forwarded-For"] = realIp;

  return headers;
}
