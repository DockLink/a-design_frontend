import { authApiClient } from "@/lib/api/authenticated-client";
import { compareProjectsByNamePrefixDesc } from "@/lib/projects/sort-projects";
import { NAV_ROUTES, projectRoute } from "@/types/navigation";
import type { ProjectsListResponse } from "@/types/projects";

/** Guests with one assignment go straight to that project; otherwise the projects grid. */
export async function resolveGuestLandingRoute(): Promise<string> {
  const res = await authApiClient<ProjectsListResponse>(
    `/projects?page=1&limit=100&status=ACTIVE&as_member=true`,
  );
  const projects = [...(res.data ?? [])].sort(compareProjectsByNamePrefixDesc);
  if (projects.length === 1) {
    return projectRoute(projects[0].id);
  }
  return NAV_ROUTES.projects;
}
