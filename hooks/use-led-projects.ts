"use client";

import { useMemo } from "react";

import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { mapToLeadProjectView } from "@/lib/projects/map-lead-project";
import { PROJECT_LEAD_ROLE } from "@/types/projects";
import type { LeadProjectView, ProjectsQueryParams } from "@/types/projects";

/** Projects where the current user is assigned as per-project lead (PRU). */
export function useLedProjects(
  params: Omit<ProjectsQueryParams, "as_member_role"> = { page: 1, limit: 100, status: "ACTIVE" }
) {
  const { user } = useAuth();
  const { rawProjects, isLoading, error, refetch, meta } = useProjects({
    ...params,
    as_member_role: PROJECT_LEAD_ROLE,
  });

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
