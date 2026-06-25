import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/types/api";

export async function authApiClient<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const token = useAuthStore.getState().session?.accessToken;
  if (!token) {
    throw new ApiError(401, { message: "Unauthorized", statusCode: 401 });
  }

  return apiClient<T>(path, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}