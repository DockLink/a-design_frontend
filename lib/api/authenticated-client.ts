import { apiClient } from "@/lib/api/client";
import {
  ensureFreshToken,
  isAuthExpiryError,
  refreshAccessToken,
} from "@/lib/auth/token-refresh";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/types/api";

function withAuth(init: RequestInit | undefined, token: string): RequestInit {
  return {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function authApiClient<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  // Proactively refresh if the token is about to expire, so most requests
  // never even see a 401.
  const token = await ensureFreshToken();
  if (!token) {
    throw new ApiError(401, { message: "Unauthorized", statusCode: 401 });
  }

  try {
    return await apiClient<T>(path, withAuth(init, token));
  } catch (error) {
    // Reactive path: the token expired between checks (or clock skew). Refresh
    // once and retry the original request with the new token.
    if (isAuthExpiryError(error)) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return await apiClient<T>(path, withAuth(init, newToken));
      }
      // Refresh failed → session is gone. Surface a clean, user-friendly error.
      throw new ApiError(401, {
        message: "Session expired, please log in",
        statusCode: 401,
      });
    }
    throw error;
  }
}

// Re-export so callers can detect the current session token if needed.
export function getAccessToken(): string | null {
  return useAuthStore.getState().session?.accessToken ?? null;
}
