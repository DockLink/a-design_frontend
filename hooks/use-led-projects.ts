"use client";

import { useMemo } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { mapToLeadProjectView } from "@/lib/projects/map-lead-project";
import type { LeadProjectView, ProjectsQueryParams } from "@/types/projects";

/**
 * Lead dashboard — one request: GET /v2/projects (via useProjects).
 * Assign or update project members (admin or team lead): PUT /v2/projects/:id/members.
 */
export function useLedProjects(
  params: ProjectsQueryParams = { page: 1, limit: 100, status: "ACTIVE" }
) {
  const { user } = useAuth();
  const { rawProjects, isLoading, error, refetch, meta } = useProjects(params);

  const userId = user?.id;

  const ledProjects = useMemo<LeadProjectView[]>(() => {
    if (!userId) return [];
    return rawProjects.map((project) => ({
      ...mapToLeadProjectView(project, userId),
      isAssigned: true,
    }));
  }, [rawProjects, userId]);

  const ledProjectIds = useMemo(() => ledProjects.map((p) => p.id), [ledProjects]);

  return {
    ledProjects,
    ledProjectIds,
    rawProjects,
    teamMembers: [] as { id: string; name: string; initials: string; tasks: number }[],
    isLoading,
    error,
    refetch,
    meta,
  };
}
