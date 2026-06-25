import type { UsersQueryParams } from "@/types/users-api";

export function toUsersQueryString(params: UsersQueryParams = {}): string {
  const qs = new URLSearchParams();

  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.roles?.length) qs.set("roles", JSON.stringify(params.roles));

  const str = qs.toString();
  return str ? `?${str}` : "";
}
