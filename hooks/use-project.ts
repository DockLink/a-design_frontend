"use client";

import { useQuery } from "@tanstack/react-query";

import { authApiClient } from "@/lib/api/authenticated-client";
import { queryKeys } from "@/lib/query/keys";
import type { Project } from "@/types/projects";

async function fetchProject(projectId: string): Promise<Project> {
  return authApiClient<Project>(`/projects/${projectId}`);
}

export function useProject(projectId: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.projects.detail(projectId ?? ""),
    queryFn: () => fetchProject(projectId!),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });

  return {
    project: data ?? null,
    isLoading,
    error: error ? (error instanceof Error ? error.message : "Failed to load project") : null,
    refetch: () => refetch().then(() => undefined),
  };
}
