"use client";

import { useCallback, useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import type { Project } from "@/types/projects";

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(projectId));
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await authApiClient<Project>(`/projects/${projectId}`);
      setProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchProject();
  }, [fetchProject]);

  return { project, isLoading, error, refetch: fetchProject };
}