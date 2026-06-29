"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useProjectMembers } from "@/hooks/use-project-members";
import { useProjectTaskables } from "@/hooks/use-project-taskables";
import { authApiClient } from "@/lib/api/authenticated-client";
import { withTaskEndDate } from "@/lib/tasks/create-task-payload";
import { mapMilestoneToView, mapStageToView } from "@/lib/projects/map-stages";
import { canManageProject } from "@/lib/projects/permissions";
import {
  apiStatusFromBoard,
  boardStatusFromApi,
  mapTaskToView,
  type BoardColumnId,
  type ProjectTaskView,
  type TaskAssigneeView,
} from "@/lib/tasks/task-board";
import { assigneeFromUser, getUserInitials, getUserListPrimaryLabel, normalizeUserFields } from "@/lib/user/display";
import { mapWithConcurrency } from "@/lib/utils";
import type {
  CreateTaskRequest,
  Task,
  TaskAssigneeRecord,
  TaskAssigneeUpdate,
  TaskUpdateRequest,
  TaskWithAssignees,
} from "@/types/tasks";
import type { User } from "@/types/users";

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

const TASK_BOARD_FETCH_OPTIONS = { depth: 1, limit: 200 } as const;

function taskIdsKey(tasks: Task[]): string {
  return tasks
    .map((t) => t.id)
    .sort()
    .join(",");
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
    patchTaskInCache,
    reopenTaskable,
  } = useProjectTaskables(projectId, "TASK", TASK_BOARD_FETCH_OPTIONS);

  const [assigneeMap, setAssigneeMap] = useState<Record<string, TaskAssigneeView[]>>({});
  const [taskMilestoneMap, setTaskMilestoneMap] = useState<Record<string, string>>({});
  const [taskStageMap, setTaskStageMap] = useState<Record<string, string>>({});
  const [milestoneParents, setMilestoneParents] = useState<Record<string, { stageId: string; stageName: string }>>({});
  const [assigneesLoading, setAssigneesLoading] = useState(false);
  const [assigneesReady, setAssigneesReady] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Task["status"]>>({});
  const hierarchyKeyRef = useRef<string | null>(null);
  const assigneesKeyRef = useRef<string | null>(null);

  // Reset derived state when switching projects so a prior project's refs/maps
  // never block loading for the next project.
  useEffect(() => {
    hierarchyKeyRef.current = null;
    assigneesKeyRef.current = null;
    setAssigneeMap({});
    setTaskMilestoneMap({});
    setTaskStageMap({});
    setMilestoneParents({});
    setAssigneesLoading(false);
    setAssigneesReady(false);
    setStatusOverrides({});
  }, [projectId]);

  const stageIdsKey = useMemo(() => taskIdsKey(stageTasks), [stageTasks]);
  const rawTaskIdsKey = useMemo(() => taskIdsKey(rawTasks), [rawTasks]);

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

  // Lookup of proper, decrypted display names by user id. The /assignees
  // endpoint returns user records whose PII isn't resolved, so we always
  // prefer the project member record (which has correct names) when available.
  const memberLookup = useMemo(() => {
    const map: Record<string, { name: string; initials: string }> = {};
    for (const m of memberUsers) {
      map[m.id] = {
        name: getUserListPrimaryLabel(m),
        initials: getUserInitials(m),
      };
    }
    return map;
  }, [memberUsers]);

  const canManage = canManageProject(effectiveRole);
  const isAdmin = effectiveRole === "admin";

  useEffect(() => {
    if (hierarchyKeyRef.current === stageIdsKey) return;
    hierarchyKeyRef.current = stageIdsKey;

    if (!stageIdsKey) {
      setMilestoneParents({});
      setTaskMilestoneMap({});
      setTaskStageMap({});
      return;
    }

    let cancelled = false;

    void (async () => {
      const parentMap: Record<string, { stageId: string; stageName: string }> = {};
      const milestoneToTasks: Record<string, string> = {};
      const taskToStage: Record<string, string> = {};

      await mapWithConcurrency(stageTasks, 4, async (stage) => {
        try {
          const detail = await authApiClient<Task & { children?: Task[] }>(
            `/tasks/${stage.id}?include_children=true`
          );
          const children = detail.children ?? [];
          for (const child of children) {
            if (child.taskableType === "TASK") {
              taskToStage[child.id] = stage.title;
            }
          }
          const milestoneChildren = children.filter((child) => child.taskableType === "MILESTONE");
          await mapWithConcurrency(milestoneChildren, 4, async (child) => {
            parentMap[child.id] = { stageId: stage.id, stageName: stage.title };
            try {
              const milestoneDetail = await authApiClient<Task & { children?: Task[] }>(
                `/tasks/${child.id}?include_children=true`
              );
              for (const taskChild of milestoneDetail.children ?? []) {
                if (taskChild.taskableType === "TASK") {
                  milestoneToTasks[taskChild.id] = child.id;
                  taskToStage[taskChild.id] = stage.title;
                }
              }
            } catch {
              // ignore
            }
          });
        } catch {
          // ignore per-stage failures
        }
      });

      if (cancelled) return;

      setMilestoneParents(parentMap);
      setTaskMilestoneMap(milestoneToTasks);
      setTaskStageMap(taskToStage);
    })();

    return () => {
      cancelled = true;
    };
  }, [stageIdsKey, stageTasks]);

  useEffect(() => {
    if (assigneesKeyRef.current === rawTaskIdsKey) return;
    assigneesKeyRef.current = rawTaskIdsKey;

    if (!rawTaskIdsKey) {
      setAssigneeMap({});
      setAssigneesLoading(false);
      setAssigneesReady(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      setAssigneesLoading(true);
      setAssigneesReady(false);
      try {
        let batchResult: Record<string, TaskAssigneeRecord[]> | null = null;
        try {
          batchResult = await authApiClient<Record<string, TaskAssigneeRecord[]>>(
            "/tasks/batch-assignees",
            {
              method: "POST",
              body: JSON.stringify({ task_ids: rawTasks.map((t) => t.id) }),
            }
          );
        } catch {
          batchResult = null;
        }

        if (cancelled) return;

        if (batchResult) {
          const entries: [string, TaskAssigneeView[]][] = rawTasks.map((task) => [
            task.id,
            assigneesFromRecords(batchResult![task.id] ?? []),
          ]);
          setAssigneeMap(Object.fromEntries(entries));
          return;
        }

        const entries = await mapWithConcurrency(rawTasks, 5, async (task) => {
          try {
            const res = await authApiClient<TaskWithAssignees>(`/tasks/${task.id}/assignees`);
            return [task.id, assigneesFromRecords(res.assignees ?? [])] as const;
          } catch {
            return [task.id, []] as const;
          }
        });

        if (cancelled) return;
        setAssigneeMap(Object.fromEntries(entries));
      } finally {
        // Always clear the loading flag — even when this run was superseded by a
        // newer effect, otherwise navigation can leave the board stuck loading.
        setAssigneesLoading(false);
        if (!cancelled) {
          setAssigneesReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawTaskIdsKey, rawTasks]);

  const tasks: ProjectTaskView[] = useMemo(() => {
    return rawTasks.map((task) => {
      const effectiveTask = statusOverrides[task.id]
        ? { ...task, status: statusOverrides[task.id] }
        : task;
      const milestoneId = taskMilestoneMap[task.id];
      const milestone = milestoneId ? milestones.find((m) => m.id === milestoneId) : undefined;
      const stageInfo = milestoneId ? milestoneParents[milestoneId] : undefined;

      // Resolve each assignee's display name from the project member record.
      const assignees = (assigneeMap[task.id] ?? []).map((a) => {
        const resolved = memberLookup[a.userId];
        return resolved ? { ...a, name: resolved.name, initials: resolved.initials } : a;
      });

      return mapTaskToView(effectiveTask, {
        assignees,
        milestoneId,
        milestoneName: milestone?.name,
        stageName: stageInfo?.stageName ?? taskStageMap[task.id],
      });
    });
  }, [rawTasks, statusOverrides, assigneeMap, memberLookup, milestones, milestoneParents, taskMilestoneMap, taskStageMap]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refetchStages(), refetchMilestones(), refetchTasks()]);
  }, [refetchStages, refetchMilestones, refetchTasks]);

  const createProjectTask = useCallback(
    async (input: {
      title: string;
      description?: string;
      stageId?: string;
      milestoneId?: string;
      dueDate: string;
      priority: CreateTaskRequest["taskable_priority"];
      status: CreateTaskRequest["status"];
      assigneeUserIds: string[];
      subtasks?: { title: string; assigneeUserIds: string[] }[];
    }) => {
      const due = new Date(input.dueDate + "T23:59:59");

      // Keep the task start within its parent milestone/stage window so the
      // whole task sits inside the parent's period.
      const parentMilestone = input.milestoneId
        ? milestones.find((m) => m.id === input.milestoneId)
        : undefined;
      const parentStage = input.stageId ? stages.find((s) => s.id === input.stageId) : undefined;
      const rangeStartIso = parentMilestone?.startDate ?? parentStage?.startDate;

      let startDate = new Date();
      if (rangeStartIso && startDate.getTime() < new Date(rangeStartIso).getTime()) {
        startDate = new Date(rangeStartIso);
      }
      // Never let the start run past the due date.
      if (startDate.getTime() > due.getTime()) {
        startDate = new Date(due.getTime() - 1000);
      }

      // Attach to milestone if chosen, otherwise to the stage so the task
      // still rolls up into the stage for auto-completion + timeline.
      const parentId = input.milestoneId || input.stageId || undefined;

      const payload = withTaskEndDate({
        project_id: projectId,
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        start_date: startDate.toISOString(),
        end_date: due.toISOString(),
        taskable_type: "TASK",
        taskable_priority: input.priority,
        status: input.status,
        parent_taskable_id: parentId,
        order: rawTasks.length,
      });

      const created = await createTask(payload);

      if (input.assigneeUserIds.length > 0) {
        await authApiClient<TaskWithAssignees>(`/tasks/${created.id}/assignees`, {
          method: "PUT",
          body: JSON.stringify({
            assignees: input.assigneeUserIds.map((user_id) => ({ user_id, status: "ACTIVE" })),
          } satisfies { assignees: TaskAssigneeUpdate[] }),
        });
      }

      // Optionally create subtasks (TASK children) with their own assignees.
      const subtasks = (input.subtasks ?? []).filter((s) => s.title.trim());
      for (let i = 0; i < subtasks.length; i++) {
        const sub = subtasks[i];
        const subPayload = withTaskEndDate({
          project_id: projectId,
          title: sub.title.trim(),
          start_date: startDate.toISOString(),
          end_date: due.toISOString(),
          taskable_type: "TASK",
          status: "TODO",
          parent_taskable_id: created.id,
          order: i,
        });
        const createdSub = await createTask(subPayload);
        if (sub.assigneeUserIds.length > 0) {
          await authApiClient<TaskWithAssignees>(`/tasks/${createdSub.id}/assignees`, {
            method: "PUT",
            body: JSON.stringify({
              assignees: sub.assigneeUserIds.map((user_id) => ({ user_id, status: "ACTIVE" })),
            } satisfies { assignees: TaskAssigneeUpdate[] }),
          });
        }
      }

      await refetchTasks();
      return created;
    },
    [projectId, rawTasks.length, createTask, refetchTasks, milestones, stages]
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

  const updateTaskStatus = useCallback(
    async (taskId: string, boardStatus: BoardColumnId) => {
      const task = rawTasks.find((t) => t.id === taskId);
      if (!task) return;

      const previousStatus = task.status;
      const newStatus = apiStatusFromBoard(boardStatus);
      if (boardStatusFromApi(previousStatus) === boardStatus) return;

      // Instant UI: patch cache + local override before the network round-trip.
      patchTaskInCache(taskId, { status: newStatus });
      setStatusOverrides((prev) => ({ ...prev, [taskId]: newStatus }));

      try {
        await authApiClient<Task>(`/tasks/${taskId}`, {
          method: "PATCH",
          body: JSON.stringify({ status: newStatus } satisfies TaskUpdateRequest),
        });
        setStatusOverrides((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
        void refetchTasks();
      } catch (error) {
        patchTaskInCache(taskId, { status: previousStatus });
        setStatusOverrides((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
        throw error;
      }
    },
    [rawTasks, refetchTasks, patchTaskInCache]
  );

  const markMyCompletion = useCallback(
    async (taskId: string, completed: boolean) => {
      await authApiClient(`/tasks/${taskId}/my-completion`, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      });
      await refetchTasks();
    },
    [refetchTasks]
  );

  const reopenTask = useCallback(
    async (taskId: string) => {
      patchTaskInCache(taskId, { status: "REOPENED" });
      try {
        await reopenTaskable(taskId);
      } finally {
        // Reopen resets assignee completion + ancestor statuses; refresh to sync.
        assigneesKeyRef.current = null;
        await refetchTasks();
      }
    },
    [reopenTaskable, refetchTasks, patchTaskInCache]
  );

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
    isLoading: stagesLoading || milestonesLoading || tasksLoading,
    isAssigneesLoading: assigneesLoading && !assigneesReady,
    error: tasksError,
    refreshAll,
    createProjectTask,
    createStage,
    createMilestone,
    updateTaskAssignees,
    updateTaskStatus,
    markMyCompletion,
    reopenTask,
    refetchTasks,
  };
}
