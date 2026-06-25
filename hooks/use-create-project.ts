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
import type { CreateTaskRequest } from "@/types/tasks";

export function useCreateProject() {
  const createProject = useCallback(
    async (
      payload: CreateProjectRequest,
      options?: {
        stages?: CreateProjectStageInput[];
        memberUserId?: string;
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

      if (options?.memberUserId) {
        const membersPayload: ProjectMemberAssignRequest = {
          members: [{ user_id: options.memberUserId, status: "ACTIVE" }],
        };
        const withMembers = await authApiClient<ProjectWithMembers>(
          `/projects/${project.id}/members`,
          {
            method: "PUT",
            body: JSON.stringify(membersPayload),
          }
        );
        if (typeof window !== "undefined" && withMembers.members) {
          sessionStorage.setItem(
            `adesign_project_members:${project.id}`,
            JSON.stringify(withMembers.members)
          );
        }
      }

      return project;
    },
    []
  );

  return { createProject };
}
