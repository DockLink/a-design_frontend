"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApiClient } from "@/lib/api/authenticated-client";
import { queryKeys } from "@/lib/query/keys";
import type { Project, UpdateProjectRequest } from "@/types/projects";

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  const updateProject = useCallback(
    async (payload: UpdateProjectRequest) => {
      const updated = await authApiClient<Project>(`/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      queryClient.setQueryData(queryKeys.projects.detail(projectId), updated);
      return updated;
    },
    [projectId, queryClient]
  );

  return { updateProject };
}
