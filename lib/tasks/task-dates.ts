import { addIsoDuration } from "@/lib/projects/duration";

export type TaskLike = {
  start_date: string;
  end_date?: string | null;
  duration?: string;
  durationHours?: string | number | null;
};

/** Resolve end date from API fields (end_date, duration ISO, or durationHours). */
export function resolveTaskEndDate(task: TaskLike): Date {
  if (task.end_date) {
    const d = new Date(task.end_date);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (task.duration) return addIsoDuration(task.start_date, task.duration);
  if (task.durationHours != null && task.durationHours !== "") {
    const hours = Number(task.durationHours);
    if (!Number.isNaN(hours)) {
      return new Date(new Date(task.start_date).getTime() + hours * 3600000);
    }
  }
  return addIsoDuration(task.start_date, "P30D");
}

export function resolveTaskEndDateIso(task: TaskLike): string {
  return resolveTaskEndDate(task).toISOString();
}

export function resolveTaskDurationIso(task: TaskLike): string {
  if (task.duration) return task.duration;
  const end = resolveTaskEndDate(task);
  const start = new Date(task.start_date);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
  return `P${days}D`;
}
