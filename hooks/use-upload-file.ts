"use client";

import { useCallback } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";

export function useUploadFile() {
  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    const token = (await import("@/stores/auth-store")).useAuthStore.getState().session
      ?.accessToken;
    if (!token) throw new Error("Unauthorized");

    const res = await fetch("/api/storage/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const raw = await res.text();
    let body: { message?: string; token?: string };
    try {
      body = raw ? (JSON.parse(raw) as { message?: string; token?: string }) : {};
    } catch {
      throw new Error(
        raw.trim().slice(0, 200) || `Upload failed (HTTP ${res.status})`,
      );
    }

    if (!res.ok) {
      throw new Error(body.message ?? "Upload failed");
    }

    if (!body.token) {
      throw new Error("Upload succeeded but no file token was returned");
    }

    return { token: body.token };
  }, []);

  return { uploadFile };
}
