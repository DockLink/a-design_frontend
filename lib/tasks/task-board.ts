import { addIsoDuration } from "@/lib/projects/duration";
import { getUserInitials, getUserListPrimaryLabel } from "@/lib/user/display";
import type { Task, TaskablePriority, TaskableStatus } from "@/types/tasks";

export type BoardColumnId = "todo" | "in-progress" | "done";

export const BOARD_COLUMNS: { id: BoardColumnId; label: string; accent: string }[] = [
  { id: "todo", label: "To do", accent: "#9C8573" },
  { id: "in-progress", label: "In progress", accent: "#D4A96A" },
  { id: "done", label: "Done", accent: "#3D8B5E" },
];

export const PRIORITY_DOT: Record<TaskablePriority, string> = {
  CRITICAL: "#DC2626",
  HIGH: "#DC2626",
  MEDIUM: "#D4A96A",
  LOW: "#C4B5A5",
};

export interface TaskAssigneeView {
  userId: string;
  name: string;
  initials: string;
}

export interface TaskSubtaskView {
  id: string;
  title: string;
  status: BoardColumnId;
  assignees: TaskAssigneeView[];
}

export interface ProjectTaskView {
  id: string;
  title: string;
  description: string;
  status: BoardColumnId;
  apiStatus: TaskableStatus;
  priority: TaskablePriority;
  dueDate: string;
  startDate: string;
  duration: string;
  milestoneId?: string;
  milestoneName?: string;
  stageName?: string;
  assignees: TaskAssigneeView[];
  subtasks: TaskSubtaskView[];
  depth: number;
  raw: Task;
}

export function boardStatusFromApi(status: TaskableStatus): BoardColumnId {
  if (status === "COMPLETED") return "done";
  if (status === "IN_PROGRESS" || status === "IN_REVIEW" || status === "REOPENED") return "in-progress";
  return "todo";
}

export function apiStatusFromBoard(status: BoardColumnId): TaskableStatus {
  if (status === "done") return "COMPLETED";
  if (status === "in-progress") return "IN_PROGRESS";
  return "TODO";
}

export function taskDueDate(task: Task): Date {
  return addIsoDuration(task.start_date, task.duration);
}

export function taskDueDateIso(task: Task): string {
  return taskDueDate(task).toISOString().slice(0, 10);
}

export function durationBetweenDates(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  return `P${days}D`;
}

export function formatBoardDate(dateIso: string): string {
  return new Date(dateIso + (dateIso.includes("T") ? "" : "T00:00:00")).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function dueDateColor(dateIso: string, status: BoardColumnId, today = new Date().toISOString().slice(0, 10)) {
  if (status === "done") return "#C4B5A5";
  if (dateIso < today) return "#DC2626";
  if (dateIso === today) return "#D4A96A";
  return "#9C8573";
}


export function mapSubtaskToView(task: Task, assignees: TaskAssigneeView[] = []): TaskSubtaskView {
  return {
    id: task.id,
    title: task.title,
    status: boardStatusFromApi(task.status),
    assignees,
  };
}

export function mapTaskToView(
  task: Task,
  options: {
    assignees?: TaskAssigneeView[];
    milestoneName?: string;
    stageName?: string;
    milestoneId?: string;
    subtaskAssignees?: Record<string, TaskAssigneeView[]>;
  } = {}
): ProjectTaskView {
  const subtasks = (task.subtasks ?? task.children ?? []).map((st) =>
    mapSubtaskToView(st, options.subtaskAssignees?.[st.id] ?? [])
  );

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status: boardStatusFromApi(task.status),
    apiStatus: task.status,
    priority: task.taskablePriority,
    dueDate: taskDueDateIso(task),
    startDate: task.start_date,
    duration: task.duration,
    milestoneId: options.milestoneId,
    milestoneName: options.milestoneName,
    stageName: options.stageName,
    assignees: options.assignees ?? [],
    subtasks,
    depth: task.depth,
    raw: task,
  };
}
