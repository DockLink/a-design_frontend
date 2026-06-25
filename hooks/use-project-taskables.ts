"use client";

import { useCallback, useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import type { ProjectMember, ProjectWithMembers } from "@/types/projects";
import type { CreateTaskRequest, Task, TaskableType, TasksListResponse, TasksQueryParams } from "@/types/tasks";
import { toTasksQueryString } from "@/lib/tasks/query-string";

export function useProjectTaskables(
  projectId: string | null,
  taskableType?: TaskableType,
  options: { limit?: number; depth?: number } = {}
) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(projectId));
  const [error, setError] = useState<string | null>(null);

  const limit = options.limit ?? 100;
  const depth = options.depth;

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const params: TasksQueryParams = {
        page: 1,
        limit,
        projects: [projectId],
        taskable_type: taskableType,
        depth,
      };
      const query = toTasksQueryString(params);
      const res = await authApiClient<TasksListResponse>(`/tasks${query}`);
      setTasks(res.data);
    } catch (err) {
      setTasks([]);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, taskableType, limit, depth]);

  const createTaskable = useCallback(async (payload: CreateTaskRequest) => {
    const created = await authApiClient<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setTasks((prev) => [...prev, created].sort((a, b) => a.order - b.order));
    return created;
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  return { tasks, isLoading, error, refetch: fetchTasks, createTaskable };
}
