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

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    rawProjects,
    meta,
    isLoading,
    error,
    refetch: fetchProjects,
    activeProjects: projects.filter((p) => p.status === "Active"),
  };
}