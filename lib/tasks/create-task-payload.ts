import { addIsoDuration } from "@/lib/projects/duration";
import type { CreateTaskRequest } from "@/types/tasks";

/** Ensure create payload includes end_date required by the backend. */
export function withTaskEndDate(
  payload: CreateTaskRequest & { end_date?: string; duration?: string }
): CreateTaskRequest & { end_date: string } {
  const { duration, ...rest } = payload;
  if (rest.end_date) {
    return { ...rest, end_date: rest.end_date };
  }
  if (duration) {
    const end = addIsoDuration(rest.start_date, duration);
    return { ...rest, end_date: end.toISOString() };
  }
  throw new Error("Task requires end_date or duration");
}
