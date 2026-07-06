"use client";

import { useCallback, useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import type { ProjectFolderTree } from "@/types/files";

function sumFileCounts(fileCounts: Record<string, number> | undefined): number {
  if (!fileCounts) return 0;
  return Object.values(fileCounts).reduce((sum, n) => sum + n, 0);
}

export function useProjectFileCount(projectId: string) {
  const [fileCount, setFileCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authApiClient<{ data: ProjectFolderTree }>(
        `/projects/${projectId}/files/tree`
      );
      setFileCount(sumFileCounts(res.data?.fileCounts));
    } catch {
      setFileCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { fileCount, isLoading, refetch: load };
}
