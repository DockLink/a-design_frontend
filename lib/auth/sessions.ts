import { normalizeLoginResponse } from "@/lib/auth/normalize-login";
import type { AuthSession, BackendLoginResponse, LoginResponse } from "@/types/auth";

export function toAuthSession(response: LoginResponse | BackendLoginResponse): AuthSession {
  const normalized =
    "accessToken" in response ? response : normalizeLoginResponse(response);

  return {
    accessToken: normalized.accessToken,
    refreshToken: normalized.refreshToken,
    expiresAt: normalized.expiresAt,
    expiresIn: normalized.expiresIn,
    source: "supabase",
    user: normalized.user,
  };
}
