"use client";

import { useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import type { DownloadUrlResponse } from "@/types/files";

export function useAvatarUrl(fileId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setUrl(null);
      return;
    }

    let cancelled = false;

    authApiClient<{ data: DownloadUrlResponse }>(`/files/${fileId}/download-url`)
      .then((res) => {
        if (!cancelled) setUrl(res.data.downloadUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [fileId]);

  return url;
}
