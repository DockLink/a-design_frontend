"use client";

import { useMemo } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { mapToMemberProjectView } from "@/lib/projects/map-member-project";
import type { MemberProjectView, ProjectsQueryParams } from "@/types/projects";

/** Projects where the current user is an active member (any per-project role). */
export function useMemberProjects(
  params: Omit<ProjectsQueryParams, "as_member"> = { page: 1, limit: 100, status: "ACTIVE" }
) {
  const { user } = useAuth();
  const { rawProjects, isLoading, error, refetch, meta } = useProjects({
    ...params,
    as_member: true,
  });

  const memberProjects = useMemo<MemberProjectView[]>(() => {
    return rawProjects.map((project) => mapToMemberProjectView(project, user?.id));
  }, [rawProjects, user?.id]);

  const projectIds = useMemo(() => memberProjects.map((p) => p.id), [memberProjects]);

  return {
    memberProjects,
    projectIds,
    rawProjects,
    isLoading,
    error,
    refetch,
    meta,
  };
}
