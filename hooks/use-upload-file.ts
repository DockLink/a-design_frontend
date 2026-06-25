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

    const body = await res.json();
    if (!res.ok) {
      throw new Error(body.message ?? "Upload failed");
    }

    return body as { token: string };
  }, []);

  return { uploadFile };
}
