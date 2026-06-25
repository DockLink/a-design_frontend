import type { BackendLoginResponse, LoginResponse } from "@/types/auth";

/** Maps Supabase login payload (snake_case) to the frontend session shape. */
export function normalizeLoginResponse(raw: BackendLoginResponse): LoginResponse {
  if (!raw.access_token) {
    throw new Error("Login response missing access token");
  }

  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    expiresAt: raw.expires_at,
    expiresIn: raw.expires_in,
    source: "supabase",
    user: raw.user,
  };
}
