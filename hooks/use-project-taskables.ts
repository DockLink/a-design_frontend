"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApiClient } from "@/lib/api/authenticated-client";
import { queryKeys } from "@/lib/query/keys";
import { withTaskEndDate } from "@/lib/tasks/create-task-payload";
import { toTasksQueryString } from "@/lib/tasks/query-string";
import type { CreateTaskRequest, Task, TaskableType, TasksListResponse, TasksQueryParams } from "@/types/tasks";

const EMPTY_TASKS: Task[] = [];

async function fetchTaskables(
  projectId: string,
  taskableType?: TaskableType,
  options: { limit?: number; depth?: number } = {}
): Promise<Task[]> {
  const params: TasksQueryParams = {
    page: 1,
    limit: options.limit ?? 100,
    projects: [projectId],
    taskable_type: taskableType,
    depth: options.depth,
  };
  const query = toTasksQueryString(params);
  const res = await authApiClient<TasksListResponse>(`/tasks${query}`);
  return res.data;
}

export function useProjectTaskables(
  projectId: string | null,
  taskableType?: TaskableType,
  options: { limit?: number; depth?: number } = {}
) {
  const qc = useQueryClient();
  const qKey = queryKeys.projects.taskables(projectId ?? "", taskableType, options);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: qKey,
    queryFn: () => fetchTaskables(projectId!, taskableType, options),
    enabled: Boolean(projectId),
    staleTime: 20_000,
    refetchOnMount: "always",
  });

  const tasks = data ?? EMPTY_TASKS;

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (payload: CreateTaskRequest) => {
      const normalized = withTaskEndDate(payload);
      return authApiClient<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(normalized),
      });
    },
    onSuccess: (created) => {
      // Optimistic insert then background revalidate.
      qc.setQueryData<Task[]>(qKey, (prev) =>
        prev ? [...prev, created].sort((a, b) => a.order - b.order) : [created]
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: { title?: string; description?: string };
    }) =>
      authApiClient<Task>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (updated) => {
      qc.setQueryData<Task[]>(qKey, (prev) =>
        prev ? prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) : [updated]
      );
    },
  });

  const updateDatesMutation = useMutation({
    mutationFn: async ({
      taskId,
      startDateIso,
      endDateIso,
    }: {
      taskId: string;
      startDateIso: string;
      endDateIso: string;
    }) =>
      authApiClient<Task>(`/tasks/${taskId}/dates`, {
        method: "PATCH",
        body: JSON.stringify({ start_date: startDateIso, end_date: endDateIso }),
      }),
    onSuccess: (updated) => {
      qc.setQueryData<Task[]>(qKey, (prev) =>
        prev ? prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) : [updated]
      );
    },
  });

  // Stable wrappers keep the hook's public API unchanged for callers.
  const createTaskable = useCallback(
    (payload: CreateTaskRequest) => createMutation.mutateAsync(payload),
    [createMutation]
  );

  const updateTaskable = useCallback(
    (taskId: string, payload: { title?: string; description?: string }) =>
      updateMutation.mutateAsync({ taskId, payload }),
    [updateMutation]
  );

  const updateTaskableDates = useCallback(
    (taskId: string, startDateIso: string, endDateIso: string) =>
      updateDatesMutation.mutateAsync({ taskId, startDateIso, endDateIso }),
    [updateDatesMutation]
  );

  const patchTaskInCache = useCallback(
    (taskId: string, patch: Partial<Task>) => {
      qc.setQueryData<Task[]>(qKey, (prev) =>
        prev ? prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)) : prev
      );
    },
    [qc, qKey]
  );

  const setStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: Task["status"] }) =>
      authApiClient<Task>(`/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (updated) => {
      qc.setQueryData<Task[]>(qKey, (prev) =>
        prev ? prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) : [updated]
      );
    },
  });

  const reopenMutation = useMutation({
    mutationFn: async ({
      taskId,
      startDateIso,
      endDateIso,
    }: {
      taskId: string;
      startDateIso?: string;
      endDateIso?: string;
    }) =>
      authApiClient<Task>(`/tasks/${taskId}/reopen`, {
        method: "POST",
        body: JSON.stringify(
          startDateIso && endDateIso
            ? { start_date: startDateIso, end_date: endDateIso }
            : {}
        ),
      }),
    onSuccess: (updated) => {
      qc.setQueryData<Task[]>(qKey, (prev) =>
        prev ? prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) : [updated]
      );
    },
  });

  const setTaskableStatus = useCallback(
    (taskId: string, status: Task["status"]) =>
      setStatusMutation.mutateAsync({ taskId, status }),
    [setStatusMutation]
  );

  const reopenTaskable = useCallback(
    (taskId: string, startDateIso?: string, endDateIso?: string) =>
      reopenMutation.mutateAsync({ taskId, startDateIso, endDateIso }),
    [reopenMutation]
  );

  return {
    tasks,
    isLoading: isPending,
    error: error ? (error instanceof Error ? error.message : "Failed to load tasks") : null,
    refetch: () => refetch().then(() => undefined),
    createTaskable,
    updateTaskable,
    updateTaskableDates,
    patchTaskInCache,
    setTaskableStatus,
    reopenTaskable,
  };
}
