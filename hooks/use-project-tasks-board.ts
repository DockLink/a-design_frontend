"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useProjectMembers } from "@/hooks/use-project-members";
import { useProjectTaskables } from "@/hooks/use-project-taskables";
import { authApiClient } from "@/lib/api/authenticated-client";
import { mapMilestoneToView, mapStageToView } from "@/lib/projects/map-stages";
import { canManageProject } from "@/lib/projects/permissions";
import {
  mapTaskToView,
  type ProjectTaskView,
  type TaskAssigneeView,
} from "@/lib/tasks/task-board";
import { assigneeFromUser, getUserInitials, getUserListPrimaryLabel, normalizeUserFields } from "@/lib/user/display";
import type {
  CreateTaskRequest,
  Task,
  TaskAssigneeRecord,
  TaskAssigneeUpdate,
  TaskWithAssignees,
} from "@/types/tasks";
import type { User } from "@/types/users";

function assigneesFromRecords(records: TaskAssigneeRecord[]): TaskAssigneeView[] {
  return records
    .filter((r) => r.status === "ACTIVE")
    .map((r) => {
      const user = r.assignee;
      if (!user) {
        return { userId: r.user_id, name: "Member", initials: "?" };
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
      };
    });
}

export function useProjectTasksBoard(projectId: string) {
  const { user } = useAuth();
  const { members, effectiveRole } = useProjectMembers();

  const {
    tasks: stageTasks,
    isLoading: stagesLoading,
    refetch: refetchStages,
    createTaskable: createStage,
  } = useProjectTaskables(projectId, "STAGE");

  const {
    tasks: milestoneTasks,
    isLoading: milestonesLoading,
    refetch: refetchMilestones,
    createTaskable: createMilestone,
  } = useProjectTaskables(projectId, "MILESTONE");

  const {
    tasks: rawTasks,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
    createTaskable: createTask,
  } = useProjectTaskables(projectId, "TASK", { depth: 1, limit: 200 });

  const [assigneeMap, setAssigneeMap] = useState<Record<string, TaskAssigneeView[]>>({});
  const [taskMilestoneMap, setTaskMilestoneMap] = useState<Record<string, string>>({});
  const [milestoneParents, setMilestoneParents] = useState<Record<string, { stageId: string; stageName: string }>>({});
  const [assigneesLoading, setAssigneesLoading] = useState(false);

  const stages = useMemo(() => stageTasks.map((s) => mapStageToView(s)), [stageTasks]);
  const milestones = useMemo(() => milestoneTasks.map((m) => mapMilestoneToView(m)), [milestoneTasks]);

  const memberUsers = useMemo(() => {
    return members
      .filter((m) => m.status === "ACTIVE" && m.assignee)
      .map((m) => {
        const a = m.assignee!;
        return {
          id: m.user_id,
          email: a.email ?? "",
          first_name: a.first_name ?? a.firstName ?? "",
          last_name: a.last_name ?? a.lastName ?? "",
          roles: (a.roles as User["roles"]) ?? ["MEMBER"],
          status: "ACTIVE" as const,
        } satisfies User;
      });
  }, [members]);

  const canManage = canManageProject(effectiveRole);
  const isAdmin = effectiveRole === "admin";

  const loadHierarchy = useCallback(async () => {
    const parentMap: Record<string, { stageId: string; stageName: string }> = {};
    const milestoneToTasks: Record<string, string> = {};

    await Promise.all(
      stageTasks.map(async (stage) => {
        try {
          const detail = await authApiClient<Task & { children?: Task[] }>(
            `/tasks/${stage.id}?include_children=true`
          );
          for (const child of detail.children ?? []) {
            if (child.taskableType === "MILESTONE") {
              parentMap[child.id] = { stageId: stage.id, stageName: stage.title };
              try {
                const milestoneDetail = await authApiClient<Task & { children?: Task[] }>(
                  `/tasks/${child.id}?include_children=true`
                );
                for (const taskChild of milestoneDetail.children ?? []) {
                  if (taskChild.taskableType === "TASK") {
                    milestoneToTasks[taskChild.id] = child.id;
                  }
                }
              } catch {
                // ignore
              }
            }
          }
        } catch {
          // ignore per-stage failures
        }
      })
    );

    setMilestoneParents(parentMap);
    setTaskMilestoneMap(milestoneToTasks);
  }, [stageTasks]);

  const loadAssignees = useCallback(async (tasks: Task[]) => {
    if (!tasks.length) {
      setAssigneeMap({});
      return;
    }

    setAssigneesLoading(true);
    try {
      const entries = await Promise.all(
        tasks.map(async (task) => {
          try {
            const res = await authApiClient<TaskWithAssignees>(`/tasks/${task.id}/assignees`);
            return [task.id, assigneesFromRecords(res.assignees ?? [])] as const;
          } catch {
            return [task.id, []] as const;
          }
        })
      );
      setAssigneeMap(Object.fromEntries(entries));
    } finally {
      setAssigneesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHierarchy();
  }, [loadHierarchy]);

  useEffect(() => {
    void loadAssignees(rawTasks);
  }, [rawTasks, loadAssignees]);

  const tasks: ProjectTaskView[] = useMemo(() => {
    return rawTasks.map((task) => {
      const milestoneId = taskMilestoneMap[task.id];
      const milestone = milestoneId ? milestones.find((m) => m.id === milestoneId) : undefined;
      const stageInfo = milestoneId ? milestoneParents[milestoneId] : undefined;

      return mapTaskToView(task, {
        assignees: assigneeMap[task.id] ?? [],
        milestoneId,
        milestoneName: milestone?.name,
        stageName: stageInfo?.stageName,
      });
    });
  }, [rawTasks, assigneeMap, milestones, milestoneParents, taskMilestoneMap]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refetchStages(), refetchMilestones(), refetchTasks()]);
  }, [refetchStages, refetchMilestones, refetchTasks]);

  const createProjectTask = useCallback(
    async (input: {
      title: string;
      description?: string;
      milestoneId?: string;
      dueDate: string;
      priority: CreateTaskRequest["taskable_priority"];
      status: CreateTaskRequest["status"];
      assigneeUserIds: string[];
    }) => {
      const startDate = new Date();
      const due = new Date(input.dueDate);
      const days = Math.max(1, Math.ceil((due.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

      const payload: CreateTaskRequest = {
        project_id: projectId,
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        start_date: startDate.toISOString(),
        duration: `P${days}D`,
        taskable_type: "TASK",
        taskable_priority: input.priority,
        status: input.status,
        parent_taskable_id: input.milestoneId,
        order: rawTasks.length,
      };

      const created = await createTask(payload);

      if (input.assigneeUserIds.length > 0) {
        await authApiClient<TaskWithAssignees>(`/tasks/${created.id}/assignees`, {
          method: "PUT",
          body: JSON.stringify({
            assignees: input.assigneeUserIds.map((user_id) => ({ user_id, status: "ACTIVE" })),
          } satisfies { assignees: TaskAssigneeUpdate[] }),
        });
      }

      await refetchTasks();
      return created;
    },
    [projectId, rawTasks.length, createTask, refetchTasks]
  );

  const updateTaskAssignees = useCallback(async (taskId: string, userIds: string[]) => {
    const res = await authApiClient<TaskWithAssignees>(`/tasks/${taskId}/assignees`, {
      method: "PUT",
      body: JSON.stringify({
        assignees: userIds.map((user_id) => ({ user_id, status: "ACTIVE" })),
      }),
    });
    setAssigneeMap((prev) => ({
      ...prev,
      [taskId]: assigneesFromRecords(res.assignees ?? []),
    }));
    return res;
  }, []);

  const currentUserView = useMemo(() => {
    if (!user) return null;
    return assigneeFromUser(user);
  }, [user]);

  const myTasks = useMemo(() => {
    if (!currentUserView) return [];
    return tasks.filter((t) => t.assignees.some((a) => a.userId === currentUserView.userId));
  }, [tasks, currentUserView]);

  const visibleTasks = isAdmin || canManage ? tasks : myTasks;

  return {
    stages,
    milestones,
    milestoneParents,
    tasks,
    visibleTasks,
    myTasks,
    memberUsers,
    canManage,
    isAdmin,
    effectiveRole,
    currentUser: currentUserView,
    isLoading: stagesLoading || milestonesLoading || tasksLoading || assigneesLoading,
    error: tasksError,
    refreshAll,
    createProjectTask,
    createStage,
    createMilestone,
    updateTaskAssignees,
    refetchTasks,
  };
}
