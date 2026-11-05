"use client";

import { useCallback, useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import { toTasksQueryString } from "@/lib/tasks/query-string";
import { mapWithConcurrency } from "@/lib/utils";
import type {
  Task,
  TaskAssigneeRecord,
  TasksListResponse,
  TaskWithAssignees,
} from "@/types/tasks";

const DEFAULT_CANDIDATE_LIMIT = 200;

export interface UseMyAssignedTasksParams {
  projectIds: string[];
  userId: string | undefined;
  /** Max tasks returned after assignee filtering. */
  limit?: number;
  /** How many project tasks to fetch before filtering. */
  candidateLimit?: number;
}

function isAssignedToUser(records: TaskAssigneeRecord[] | undefined, userId: string): boolean {
  if (!records?.length) return false;
  return records.some((r) => r.status === "ACTIVE" && r.user_id === userId);
}

async function loadAssigneeMap(tasks: Task[]): Promise<Record<string, TaskAssigneeRecord[]>> {
  if (tasks.length === 0) return {};

  // Match project-tasks-board: treat batch failure as null, then fall back to
  // per-task /assignees. Do not treat API failures as "unassigned".
  let batchResult: Record<string, TaskAssigneeRecord[]> | null = null;
  try {
    batchResult = await authApiClient<Record<string, TaskAssigneeRecord[]>>(
      "/tasks/batch-assignees",
      {
        method: "POST",
        body: JSON.stringify({ task_ids: tasks.map((t) => t.id) }),
      }
    );
  } catch {
    batchResult = null;
  }

  if (batchResult) {
    const entries: [string, TaskAssigneeRecord[]][] = tasks.map((task) => [
      task.id,
      batchResult![task.id] ?? [],
    ]);
    return Object.fromEntries(entries);
  }

  const entries = await mapWithConcurrency(tasks, 5, async (task) => {
    try {
      const res = await authApiClient<TaskWithAssignees>(`/tasks/${task.id}/assignees`);
      return [task.id, res.assignees ?? []] as const;
    } catch {
      return [task.id, []] as const;
    }
  });
  return Object.fromEntries(entries);
}

export function useMyAssignedTasks({
  projectIds,
  userId,
  limit,
  candidateLimit = DEFAULT_CANDIDATE_LIMIT,
}: UseMyAssignedTasksParams) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const projectsStr = projectIds.length ? JSON.stringify(projectIds) : undefined;

  const fetchAssignedTasks = useCallback(async () => {
    const projects: string[] = projectsStr ? (JSON.parse(projectsStr) as string[]) : [];
    if (!userId || !projects.length) {
      setTasks([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Do NOT filter by task status: workflow statuses are TODO / IN_PROGRESS / …
      // and a literal "ACTIVE" status filter would hide every task.
      const query = toTasksQueryString({
        page: 1,
        limit: candidateLimit,
        taskable_type: "TASK",
        depth: 1,
        projects,
      });
      const res = await authApiClient<TasksListResponse>(`/tasks${query}`);
      const candidates = res.data ?? [];
      const assigneeMap = await loadAssigneeMap(candidates);
      const assigned = candidates.filter((task) =>
        isAssignedToUser(assigneeMap[task.id], userId)
      );
      setTasks(typeof limit === "number" ? assigned.slice(0, limit) : assigned);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, projectsStr, limit, candidateLimit]);

  useEffect(() => {
    void fetchAssignedTasks();
  }, [fetchAssignedTasks]);

  return { tasks, isLoading, error, refetch: fetchAssignedTasks };
}
