export function getSessionIdFromAccessToken(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { session_id?: string };
    return payload.session_id ?? null;
  } catch {
    return null;
  }
}
