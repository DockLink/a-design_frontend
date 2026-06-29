"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApiClient } from "@/lib/api/authenticated-client";
import { mapProjectToCard } from "@/lib/projects/map-projects";
import { queryKeys } from "@/lib/query/keys";
import { toProjectsQueryString } from "@/lib/projects/query-string";
import type {
  Project,
  ProjectCardView,
  ProjectsListResponse,
  ProjectsQueryParams,
} from "@/types/projects";

async function fetchProjects(params: ProjectsQueryParams): Promise<ProjectsListResponse> {
  const query = toProjectsQueryString(params);
  return authApiClient<ProjectsListResponse>(`/projects${query}`);
}

export function useProjects(params: ProjectsQueryParams = { page: 1, limit: 100 }) {
  const qc = useQueryClient();
  const qKey = queryKeys.projects.list(params);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: qKey,
    queryFn: () => fetchProjects(params),
    staleTime: 30_000,
  });

  const rawProjects: Project[] = data?.data ?? [];
  const meta = data?.meta ?? null;

  const projects: ProjectCardView[] = useMemo(
    () => rawProjects.map(mapProjectToCard),
    [rawProjects]
  );

  const activeProjects: ProjectCardView[] = useMemo(
    () => projects.filter((p) => p.status === "Active"),
    [projects]
  );

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) =>
      authApiClient<{ id: string; deleted: true }>(`/projects/${projectId}`, {
        method: "DELETE",
      }),
    onSuccess: (_result, projectId) => {
      // Optimistic removal from cached list.
      qc.setQueryData<ProjectsListResponse>(qKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          data: prev.data.filter((p) => p.id !== projectId),
          meta: prev.meta
            ? {
                ...prev.meta,
                total: Math.max(0, prev.meta.total - 1),
                totalPages: Math.ceil(
                  Math.max(0, prev.meta.total - 1) / (params.limit ?? 100)
                ),
              }
            : prev.meta,
        };
      });
    },
  });

  const deleteProject = useCallback(
    (projectId: string) => deleteMutation.mutateAsync(projectId),
    [deleteMutation]
  );

  return {
    projects,
    rawProjects,
    meta,
    isLoading,
    isDeleting: deleteMutation.isPending,
    error: error ? (error instanceof Error ? error.message : "Failed to load projects") : null,
    refetch: () => refetch().then(() => undefined),
    deleteProject,
    activeProjects,
  };
}
