"use client";

import { useCallback, useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import { mapProjectToCard } from "@/lib/projects/map-projects";
import { toProjectsQueryString } from "@/lib/projects/query-string";
import type {
  Project,
  ProjectCardView,
  ProjectsListResponse,
  ProjectsQueryParams,
} from "@/types/projects";

export function useProjects(params: ProjectsQueryParams = { page: 1, limit: 100 }) {
  const [projects, setProjects] = useState<ProjectCardView[]>([]);
  const [rawProjects, setRawProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<ProjectsListResponse["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const query = toProjectsQueryString(params);
      const response = await authApiClient<ProjectsListResponse>(
        `/projects${query}`
      );

      setRawProjects(response.data);
      setProjects(response.data.map(mapProjectToCard));
      setMeta(response.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
      setRawProjects([]);
      setProjects([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.page, params.limit, params.status, params.search, params.clients]);

  const deleteProject = useCallback(async (projectId: string) => {
    setIsDeleting(true);
    try {
      await authApiClient<{ id: string; deleted: true }>(`/projects/${projectId}`, {
        method: "DELETE",
      });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setRawProjects((prev) => prev.filter((p) => p.id !== projectId));
      setMeta((prev) =>
        prev
          ? {
              ...prev,
              total: Math.max(0, prev.total - 1),
              totalPages: Math.ceil(Math.max(0, prev.total - 1) / (params.limit ?? 100)),
            }
          : prev
      );
    } finally {
      setIsDeleting(false);
    }
  }, [params.limit]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    rawProjects,
    meta,
    isLoading,
    isDeleting,
    error,
    refetch: fetchProjects,
    deleteProject,
    activeProjects: projects.filter((p) => p.status === "Active"),
  };
}