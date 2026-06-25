import type { LeadTaskRow, MemberTaskRow, Task, TaskUrgency } from "@/types/tasks";

function getDueMeta(startDate: string): {
  due: string;
  dueColor: string;
  urgency: TaskUrgency;
} {
  const start = new Date(startDate);
  const now = new Date();
  const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      due: `${Math.abs(diffDays)}d overdue`,
      dueColor: "#FF3B30",
      urgency: "overdue",
    };
  }
  if (diffDays === 0) {
    return { due: "Today", dueColor: "#FF9F0A", urgency: "today" };
  }
  if (diffDays <= 7) {
    return { due: `${diffDays}d`, dueColor: "#FF9F0A", urgency: "today" };
  }
  return {
    due: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    dueColor: "#8E8E93",
    urgency: "soon",
  };
}

function formatDue(startDate: string): { due: string; dueColor: string } {
  const { due, dueColor } = getDueMeta(startDate);
  return { due, dueColor };
}

export function mapTaskToLeadRow(task: Task, projectName: string): LeadTaskRow {
  const { due, dueColor } = formatDue(task.start_date);
  return {
    id: task.id,
    project: projectName,
    title: task.title,
    due,
    dueColor,
  };
}

export function mapTaskToMemberRow(task: Task, projectName: string): MemberTaskRow {
  const { due, dueColor, urgency } = getDueMeta(task.start_date);
  return {
    id: task.id,
    project: projectName,
    title: task.title,
    due,
    dueColor,
    urgency,
  };
}