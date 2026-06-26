"use client";

import { useCallback } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import type {
  CreateProjectRequest,
  CreateProjectStageInput,
  Project,
  ProjectMemberAssignRequest,
  ProjectWithMembers,
} from "@/types/projects";
import { PROJECT_LEAD_ROLE } from "@/types/projects";
import type { CreateTaskRequest } from "@/types/tasks";

export function useCreateProject() {
  const createProject = useCallback(
    async (
      payload: CreateProjectRequest,
      options?: {
        stages?: CreateProjectStageInput[];
        memberUserIds?: string[];
        projectLeadUserId?: string | null;
      }
    ) => {
      const project = await authApiClient<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (options?.stages?.length) {
        for (const stage of options.stages) {
          const taskPayload: CreateTaskRequest = {
            project_id: project.id,
            title: stage.name,
            start_date: stage.start_date,
            duration: stage.duration,
            order: stage.order,
            taskable_type: "STAGE",
          };
          await authApiClient("/tasks", {
            method: "POST",
            body: JSON.stringify(taskPayload),
          });
        }
      }

      if (options?.memberUserIds?.length) {
        const uniqueIds = [...new Set(options.memberUserIds)];
        const leadId = options.projectLeadUserId ?? null;
        const membersPayload: ProjectMemberAssignRequest = {
          members: uniqueIds.map((user_id) => ({
            user_id,
            status: "ACTIVE",
            role: leadId && user_id === leadId ? PROJECT_LEAD_ROLE : "MEMBER",
          })),
        };
        await authApiClient<ProjectWithMembers>(`/projects/${project.id}/members`, {
          method: "PUT",
          body: JSON.stringify(membersPayload),
        });
      }

      return project;
    },
    []
  );

  return { createProject };
}
