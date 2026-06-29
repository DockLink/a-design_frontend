import type { ProjectsQueryParams } from "@/types/projects";
import type { TaskableType } from "@/types/tasks";

/**
 * Centralised React Query key factory.
 * Using structured keys lets us invalidate whole subtrees:
 *   queryClient.invalidateQueries({ queryKey: queryKeys.projects.all })
 * will bust the list AND every detail entry.
 */
export const queryKeys = {
  projects: {
    all: ["projects"] as const,
    list: (params: ProjectsQueryParams) => ["projects", "list", params] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
    members: (id: string) => ["projects", "members", id] as const,
    taskables: (
      projectId: string,
      type?: TaskableType,
      opts?: { limit?: number; depth?: number }
    ) =>
      ["projects", "taskables", projectId, type, opts?.limit ?? null, opts?.depth ?? null] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
    assignees: (id: string) => ["tasks", "assignees", id] as const,
    batchAssignees: (ids: string[]) => ["tasks", "batchAssignees", ...ids.slice().sort()] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params: object) => ["users", "list", params] as const,
  },
  holdRequests: {
    all: ["holdRequests"] as const,
    project: (projectId: string) => ["holdRequests", "project", projectId] as const,
  },
  accessRequests: {
    all: ["accessRequests"] as const,
    list: (params: object) => ["accessRequests", "list", params] as const,
  },
} as const;
