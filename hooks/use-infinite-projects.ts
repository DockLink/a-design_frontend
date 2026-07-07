"use client";

import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { authApiClient } from "@/lib/api/authenticated-client";
import { mapProjectToCard } from "@/lib/projects/map-projects";
import { compareProjectsByNamePrefixDesc } from "@/lib/projects/sort-projects";
import { queryKeys } from "@/lib/query/keys";
import { toProjectsQueryString } from "@/lib/projects/query-string";
import type {
  ProjectCardView,
  ProjectsListResponse,
  ProjectsQueryParams,
} from "@/types/projects";

const DEFAULT_PAGE_SIZE = 12;

export function useInfiniteProjects(
  baseParams: Omit<ProjectsQueryParams, "page"> & { limit?: number },
  options?: { enabled?: boolean },
) {
  const qc = useQueryClient();
  const limit = baseParams.limit ?? DEFAULT_PAGE_SIZE;
  const qKey = [...queryKeys.projects.all, "infinite", baseParams] as const;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: qKey,
    queryFn: ({ pageParam = 1 }) => {
      const params: ProjectsQueryParams = { ...baseParams, page: pageParam, limit };
      return authApiClient<ProjectsListResponse>(
        `/projects${toProjectsQueryString(params)}`,
      );
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.totalPages ?? 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
    enabled: options?.enabled ?? true,
  });

  const projects: ProjectCardView[] = useMemo(
    () =>
      (data?.pages ?? [])
        .flatMap((page) => page.data.map(mapProjectToCard))
        .sort(compareProjectsByNamePrefixDesc),
    [data],
  );

  const total = data?.pages[0]?.meta?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (projectId: string) =>
      authApiClient<{ id: string; deleted: true }>(`/projects/${projectId}`, {
        method: "DELETE",
      }),
    onSuccess: (_result, projectId) => {
      qc.setQueryData(qKey, (prev: typeof data) => {
        if (!prev) return prev;
        return {
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            data: page.data.filter((p) => p.id !== projectId),
          })),
        };
      });
    },
  });

  return {
    projects,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    isDeleting: deleteMutation.isPending,
    deleteProject: (id: string) => deleteMutation.mutateAsync(id),
    error: error ? (error instanceof Error ? error.message : "Failed to load projects") : null,
    refetch: () => refetch().then(() => undefined),
  };
}
