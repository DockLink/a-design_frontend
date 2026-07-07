"use client";

import { useCallback, useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import type { ProjectFile } from "@/types/files";

export function useProjectRecentFiles(projectId: string, limit = 5) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams({ limit: String(limit) });
      const res = await authApiClient<{ data: ProjectFile[] }>(
        `/projects/${projectId}/files/recent?${qs}`,
      );
      setFiles(res.data ?? []);
    } catch {
      setFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, limit]);

  useEffect(() => {
    void load();
  }, [load]);

  return { files, isLoading, refetch: load };
}
