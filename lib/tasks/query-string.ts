import type { TasksQueryParams } from "@/types/tasks";

export function toTasksQueryString(params: TasksQueryParams = {}): string {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.taskable_type) qs.set("taskable_type", params.taskable_type);
  if (params.search) qs.set("search", params.search);
  if (params.depth !== undefined) qs.set("depth", String(params.depth));
  if (params.projects?.length) qs.set("projects", JSON.stringify(params.projects));
  const str = qs.toString();
  return str ? `?${str}` : "";
}