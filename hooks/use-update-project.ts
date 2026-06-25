"use client";

import { useCallback } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import type { Project, UpdateProjectRequest } from "@/types/projects";

export function useUpdateProject(projectId: string) {
  const updateProject = useCallback(
    async (payload: UpdateProjectRequest) => {
      return authApiClient<Project>(`/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    [projectId]
  );

  return { updateProject };
}
