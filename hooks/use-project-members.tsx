"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { authApiClient } from "@/lib/api/authenticated-client";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import type { SidebarRole } from "@/lib/navigation/sidebar-role";
import {
  getEffectiveProjectRole,
  getProjectLeadUserIds,
  isProjectViewer,
} from "@/lib/projects/project-member-roles";
import { queryKeys } from "@/lib/query/keys";
import type { ProjectMember, ProjectMemberAssignRequest, ProjectWithMembers } from "@/types/projects";
import { PROJECT_LEAD_ROLE } from "@/types/projects";

interface ProjectMembersContextValue {
  members: ProjectMember[];
  projectLeadUserId: string | null;
  projectLeadUserIds: string[];
  effectiveRole: SidebarRole;
  isViewer: boolean;
  isOrgGuest: boolean;
  isLoading: boolean;
  error: string | null;
  isAssigned: (userId: string) => boolean;
  updateMembers: (
    payload: ProjectMemberAssignRequest,
    leadUserIds?: string[] | null
  ) => Promise<ProjectWithMembers>;
  refetchMembers: () => Promise<void>;
}

const ProjectMembersContext = createContext<ProjectMembersContextValue | null>(null);

export function ProjectMembersProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const qKey = queryKeys.projects.members(projectId);

  const orgSidebarRole = toSidebarRole(user?.roles ? getPrimaryRole(user.roles) : null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const result = await authApiClient<{ members: ProjectMember[] }>(
        `/projects/${projectId}/members`
      );
      return result.members ?? [];
    },
    staleTime: 30_000,
  });

  const members: ProjectMember[] = data ?? [];

  const updateMutation = useMutation({
    mutationFn: async ({
      payload,
      leadUserIds,
    }: {
      payload: ProjectMemberAssignRequest;
      leadUserIds?: string[] | null;
    }) => {
      const resolvedLeads =
        leadUserIds !== undefined
          ? leadUserIds
          : payload.members
              .filter((m) => m.role === PROJECT_LEAD_ROLE)
              .map((m) => m.user_id);

      const leadSet = new Set(resolvedLeads);

      const body = {
        members: payload.members.map(({ user_id, status, role }) => ({
          user_id,
          status,
          role: leadSet.has(user_id)
            ? PROJECT_LEAD_ROLE
            : role === "VIEWER"
              ? "VIEWER"
              : role ?? "MEMBER",
        })),
      };

      return authApiClient<ProjectWithMembers>(`/projects/${projectId}/members`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
    },
    onSuccess: (result) => {
      qc.setQueryData<ProjectMember[]>(qKey, result.members ?? []);
    },
  });

  const updateMembers = useCallback(
    (payload: ProjectMemberAssignRequest, leadUserIds?: string[] | null) =>
      updateMutation.mutateAsync({ payload, leadUserIds }),
    [updateMutation]
  );

  const projectLeadUserIds = useMemo(() => getProjectLeadUserIds(members), [members]);
  const projectLeadUserId = useMemo(() => projectLeadUserIds[0] ?? null, [projectLeadUserIds]);
  const effectiveRole = useMemo(
    () => getEffectiveProjectRole(user?.id, members, orgSidebarRole),
    [user?.id, members, orgSidebarRole]
  );
  const isOrgGuest = orgSidebarRole === "guest";
  const isViewer = useMemo(
    () => isOrgGuest || isProjectViewer(members, user?.id),
    [isOrgGuest, members, user?.id]
  );

  const isAssigned = useCallback(
    (userId: string) => members.some((m) => m.user_id === userId && m.status === "ACTIVE"),
    [members]
  );

  const refetchMembers = useCallback(() => refetch().then(() => undefined), [refetch]);

  const value = useMemo<ProjectMembersContextValue>(
    () => ({
      members,
      projectLeadUserId,
      projectLeadUserIds,
      effectiveRole,
      isViewer,
      isOrgGuest,
      isLoading,
      error: error ? (error instanceof Error ? error.message : "Failed to load members") : null,
      isAssigned,
      updateMembers,
      refetchMembers,
    }),
    [
      members,
      projectLeadUserId,
      projectLeadUserIds,
      effectiveRole,
      isViewer,
      isOrgGuest,
      isLoading,
      error,
      isAssigned,
      updateMembers,
      refetchMembers,
    ]
  );

  return (
    <ProjectMembersContext.Provider value={value}>{children}</ProjectMembersContext.Provider>
  );
}

export function useProjectMembers() {
  const ctx = useContext(ProjectMembersContext);
  if (!ctx) throw new Error("useProjectMembers must be used within ProjectMembersProvider");
  return ctx;
}
