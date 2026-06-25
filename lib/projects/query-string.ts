import type { ProjectsQueryParams } from "@/types/projects";

export function toProjectsQueryString(params: ProjectsQueryParams = {}): string {
  const qs = new URLSearchParams();

  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.search) qs.set("search", params.search);
  if (params.clients?.length) {
    qs.set("clients", JSON.stringify(params.clients));
  }

  const str = qs.toString();
  return str ? `?${str}` : "";
}