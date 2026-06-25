"use client";

import { useCallback, useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import { toTasksQueryString } from "@/lib/tasks/query-string";
import type { Task, TasksListResponse, TasksQueryParams } from "@/types/tasks";

export function useTasks(params: TasksQueryParams) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = toTasksQueryString(params);
      const res = await authApiClient<TasksListResponse>(`/tasks${query}`);
      setTasks(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    params.page,
    params.limit,
    params.status,
    params.taskable_type,
    params.search,
    params.depth,
    JSON.stringify(params.projects),
  ]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  return { tasks, isLoading, error, refetch: fetchTasks };
}