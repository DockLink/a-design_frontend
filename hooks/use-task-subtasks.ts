"use client";

import { useCallback, useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import { withTaskEndDate } from "@/lib/tasks/create-task-payload";
import { boardStatusFromApi, type BoardColumnId, type ProjectTaskView, type TaskAssigneeView } from "@/lib/tasks/task-board";
import { getUserInitials, getUserListPrimaryLabel, normalizeUserFields } from "@/lib/user/display";
import { mapWithConcurrency } from "@/lib/utils";
import type { Task, TaskableStatus, TaskAssigneeRecord, TaskAssigneeUpdate, TaskWithAssignees } from "@/types/tasks";

export interface SubtaskView {
  id: string;
  title: string;
  status: BoardColumnId;
  apiStatus: TaskableStatus;
  assignees: TaskAssigneeView[];
}

function assigneesFromRecords(records: TaskAssigneeRecord[]): TaskAssigneeView[] {
  return records
    .filter((r) => r.status === "ACTIVE")
    .map((r) => {
      const user = r.assignee;
      if (!user) {
        return { userId: r.user_id, name: "Member", initials: "?", completedAt: r.completed_at };
      }
      const normalized = normalizeUserFields({
        email: user.email ?? "",
        first_name: user.first_name,
        last_name: user.last_name,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      return {
        userId: r.user_id,
        name: getUserListPrimaryLabel({ ...normalized, email: user.email ?? "" }),
        initials: getUserInitials({ ...normalized, email: user.email ?? "" }),
        completedAt: r.completed_at,
      };
    });
}

/**
 * Loads and manages the subtasks of a single task. Subtasks are regular TASK
 * taskables parented to the task; completing all of them auto-completes the
 * parent task (handled by the backend cascade).
 */
export function useTaskSubtasks(parentTask: ProjectTaskView | null, open: boolean) {
  const [subtasks, setSubtasks] = useState<SubtaskView[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const parentId = parentTask?.id ?? null;

  const refetch = useCallback(async () => {
    if (!parentId) {
      setSubtasks([]);
      return;
    }
    setIsLoading(true);
    try {
      const detail = await authApiClient<Task & { children?: Task[] }>(
        `/tasks/${parentId}?include_children=true`
      );
      const childTasks = (detail.children ?? []).filter((c) => c.taskableType === "TASK");

      const views = await mapWithConcurrency(childTasks, 5, async (child): Promise<SubtaskView> => {
        let assignees: TaskAssigneeView[] = [];
        try {
          const res = await authApiClient<TaskWithAssignees>(`/tasks/${child.id}/assignees`);
          assignees = assigneesFromRecords(res.assignees ?? []);
        } catch {
          // no assignees yet
        }
        return {
          id: child.id,
          title: child.title,
          status: boardStatusFromApi(child.status),
          apiStatus: child.status,
          assignees,
        };
      });

      views.sort((a, b) => a.title.localeCompare(b.title));
      setSubtasks(views);
    } catch {
      setSubtasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    if (open && parentId) void refetch();
    if (!open) setSubtasks([]);
  }, [open, parentId, refetch]);

  const createSubtask = useCallback(
    async (input: { title: string; assigneeUserIds: string[] }) => {
      if (!parentTask) return;
      const startIso = new Date().toISOString();
      const endIso = new Date(parentTask.dueDate + "T23:59:59").toISOString();

      const payload = withTaskEndDate({
        project_id: parentTask.raw.projectId,
        title: input.title.trim(),
        start_date: startIso,
        end_date: endIso,
        taskable_type: "TASK",
        parent_taskable_id: parentTask.id,
        status: "TODO",
        order: subtasks.length,
      });

      const created = await authApiClient<Task>("/tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (input.assigneeUserIds.length > 0) {
        await authApiClient<TaskWithAssignees>(`/tasks/${created.id}/assignees`, {
          method: "PUT",
          body: JSON.stringify({
            assignees: input.assigneeUserIds.map((user_id) => ({ user_id, status: "ACTIVE" })),
          } satisfies { assignees: TaskAssigneeUpdate[] }),
        });
      }

      await refetch();
    },
    [parentTask, subtasks.length, refetch]
  );

  const setSubtaskAssignees = useCallback(
    async (subtaskId: string, userIds: string[]) => {
      await authApiClient<TaskWithAssignees>(`/tasks/${subtaskId}/assignees`, {
        method: "PUT",
        body: JSON.stringify({
          assignees: userIds.map((user_id) => ({ user_id, status: "ACTIVE" })),
        } satisfies { assignees: TaskAssigneeUpdate[] }),
      });
      await refetch();
    },
    [refetch]
  );

  const markSubtaskMyCompletion = useCallback(
    async (subtaskId: string, completed: boolean) => {
      await authApiClient(`/tasks/${subtaskId}/my-completion`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      });
      await refetch();
    },
    [refetch]
  );

  return { subtasks, isLoading, refetch, createSubtask, setSubtaskAssignees, markSubtaskMyCompletion };
}
