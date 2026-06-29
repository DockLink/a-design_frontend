import { resolveTaskDurationIso, resolveTaskEndDateIso } from "@/lib/tasks/task-dates";
import type { Task, TaskableStatus } from "@/types/tasks";

export interface ProjectStageView {
  id: string;
  name: string;
  order: number;
  startDate: string;
  duration: string;
  endDate: string;
  isActive: boolean;
}

export interface ProjectMilestoneView {
  id: string;
  name: string;
  stageId?: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export function mapStageToView(stage: Task, now = new Date()): ProjectStageView {
  const endIso = resolveTaskEndDateIso(stage);
  const end = new Date(endIso);
  const start = new Date(stage.start_date);
  const isActive = start <= now && end >= now;

  return {
    id: stage.id,
    name: stage.title,
    order: stage.order,
    startDate: stage.start_date,
    duration: resolveTaskDurationIso(stage),
    endDate: endIso,
    isActive,
  };
}

export function mapMilestoneToView(milestone: Task): ProjectMilestoneView {
  return {
    id: milestone.id,
    name: milestone.title,
    startDate: milestone.start_date,
    endDate: resolveTaskEndDateIso(milestone),
    description: milestone.description ?? undefined,
  };
}

const STATUS_LABEL: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "Review",
  COMPLETED: "Done",
  ON_HOLD: "On hold",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  REOPENED: "Reopened",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  IN_PROGRESS: { bg: "rgba(212,169,106,0.14)", color: "#C9894A" },
  IN_REVIEW: { bg: "rgba(0,122,255,0.10)", color: "#0071E3" },
  COMPLETED: { bg: "rgba(52,199,89,0.12)", color: "#248A3D" },
  TODO: { bg: "rgba(60,60,67,0.08)", color: "#6C6C70" },
  ON_HOLD: { bg: "rgba(255,159,10,0.12)", color: "#C85000" },
};

const PRIORITY_COLOR: Record<string, string> = {
  CRITICAL: "#FF3B30",
  HIGH: "#FF3B30",
  MEDIUM: "#FF9F0A",
  LOW: "#8E8E93",
};

export function getTaskStatusLabel(status: TaskableStatus | string): string {
  return STATUS_LABEL[status] ?? status;
}

export function getTaskStatusStyle(status: TaskableStatus | string) {
  return STATUS_STYLE[status] ?? { bg: "rgba(60,60,67,0.08)", color: "#6C6C70" };
}

export function getPriorityColor(priority: string): string {
  return PRIORITY_COLOR[priority] ?? "#8E8E93";
}

export function isTaskCompleted(status: TaskableStatus | string): boolean {
  return status === "COMPLETED";
}

export function isTaskOverdue(task: Task, now = new Date()): boolean {
  if (isTaskCompleted(task.status)) return false;
  const due = new Date(resolveTaskEndDateIso(task));
  return due < now;
}

export function computeProjectStats(tasks: Task[], memberCount: number, fileCount: number) {
  const openTasks = tasks.filter((t) => !isTaskCompleted(t.status));
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t));
  const completed = tasks.filter((t) => isTaskCompleted(t.status));

  let nextDue: { date: string; label: string } | null = null;
  const upcoming = openTasks
    .map((t) => ({ task: t, due: new Date(resolveTaskEndDateIso(t)) }))
    .filter((x) => x.due >= new Date())
    .sort((a, b) => a.due.getTime() - b.due.getTime());

  if (upcoming[0]) {
    nextDue = {
      date: upcoming[0].due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      label: upcoming[0].task.title,
    };
  }

  const health =
    tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : null;

  return {
    openCount: openTasks.length,
    overdueCount: overdueTasks.length,
    overdueTitles: overdueTasks.slice(0, 3).map((t) => t.title),
    memberCount,
    fileCount,
    nextDue,
    health,
  };
}
