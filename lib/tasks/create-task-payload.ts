import { addIsoDuration } from "@/lib/projects/duration";
import type { CreateTaskRequest } from "@/types/tasks";

export function isBlankDate(value?: string | null): boolean {
  return value == null || value.trim() === "";
}

/** Drop empty date/duration keys so they are omitted from JSON (never "" or null). */
export function withoutEmptyDates<
  T extends {
    start_date?: string | null;
    end_date?: string | null;
    duration?: string | null;
  },
>(payload: T): T {
  const next = { ...payload };
  if (isBlankDate(next.start_date)) delete next.start_date;
  if (isBlankDate(next.end_date)) delete next.end_date;
  if (next.duration == null || String(next.duration).trim() === "") delete next.duration;
  return next;
}

/** Ensure create payload includes end_date required by the backend. */
export function withTaskEndDate(
  payload: CreateTaskRequest & { end_date?: string; duration?: string }
): CreateTaskRequest & { end_date: string } {
  const { duration, ...rest } = payload;
  if (rest.end_date) {
    return { ...rest, end_date: rest.end_date };
  }
  if (duration && rest.start_date) {
    const end = addIsoDuration(rest.start_date, duration);
    return { ...rest, end_date: end.toISOString() };
  }
  throw new Error("Task requires end_date or duration");
}

/** STAGE may omit dates; TASK/MILESTONE still require an end date. */
export function normalizeCreateTaskPayload(payload: CreateTaskRequest): CreateTaskRequest {
  if (payload.taskable_type === "STAGE") {
    return withoutEmptyDates(payload);
  }
  return withTaskEndDate(payload);
}
