import type { ApiErrorBody } from "@/types/api";

/**
 * File endpoints live on an unversioned controller — no /v2 prefix.
 * Strip the version segment from BACKEND_API_URL if present.
 */
const BACKEND_FILE_URL =
  (process.env.BACKEND_API_URL ?? "http://localhost:3000/v2").replace(
    /\/v\d+\/?$/,
    ""
  );

type FileResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: ApiErrorBody; status: number };

export async function backendFileFetch<T>(
  path: string,
  init?: RequestInit
): Promise<FileResult<T>> {
  const res = await fetch(`${BACKEND_FILE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
    cache: "no-store",
  });

  const body = (await res.json().catch(() => ({}))) as T | ApiErrorBody;

  if (!res.ok) {
    return { ok: false, error: body as ApiErrorBody, status: res.status };
  }

  return { ok: true, data: body as T, status: res.status };
}
