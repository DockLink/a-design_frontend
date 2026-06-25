import type { ApiErrorBody } from "@/types/api";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL ?? "http://localhost:3000/v2";

const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ??
  BACKEND_API_URL.replace(/\/v\d+\/?$/, "");

export type BackendScope = "versioned" | "shared";

type BackendResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: ApiErrorBody; status: number };

function resolveBaseUrl(scope: BackendScope): string {
  return scope === "shared" ? BACKEND_ORIGIN : BACKEND_API_URL;
}

export async function backendFetch<T>(
  path: string,
  init?: RequestInit,
  scope: BackendScope = "versioned"
): Promise<BackendResult<T>> {
  const base = resolveBaseUrl(scope);
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
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
