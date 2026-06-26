"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { authApiClient } from "@/lib/api/authenticated-client";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import type { SidebarRole } from "@/lib/navigation/sidebar-role";
import {
  getEffectiveProjectRole,
  getProjectLeadUserIds,
} from "@/lib/projects/project-member-roles";
import type { ProjectMember, ProjectMemberAssignRequest, ProjectWithMembers } from "@/types/projects";
import { PROJECT_LEAD_ROLE } from "@/types/projects";

interface ProjectMembersContextValue {
  members: ProjectMember[];
  projectLeadUserId: string | null;
  projectLeadUserIds: string[];
  effectiveRole: SidebarRole;
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
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orgSidebarRole = toSidebarRole(user?.roles ? getPrimaryRole(user.roles) : null);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authApiClient<{ members: ProjectMember[] }>(
        `/projects/${projectId}/members`
      );
      setMembers(result.members ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load members";
      setError(message);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const projectLeadUserIds = useMemo(() => getProjectLeadUserIds(members), [members]);
  const projectLeadUserId = useMemo(() => projectLeadUserIds[0] ?? null, [projectLeadUserIds]);
  const effectiveRole = useMemo(
    () => getEffectiveProjectRole(user?.id, members, orgSidebarRole),
    [user?.id, members, orgSidebarRole]
  );

  const updateMembers = useCallback(
    async (payload: ProjectMemberAssignRequest, leadUserIds?: string[] | null) => {
      setIsLoading(true);
      setError(null);
      try {
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
            role: leadSet.has(user_id) ? PROJECT_LEAD_ROLE : role ?? "MEMBER",
          })),
        };

        const result = await authApiClient<ProjectWithMembers>(
          `/projects/${projectId}/members`,
          { method: "PUT", body: JSON.stringify(body) }
        );
        setMembers(result.members ?? []);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update members";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId]
  );

  const isAssigned = useCallback(
    (userId: string) => members.some((m) => m.user_id === userId && m.status === "ACTIVE"),
    [members]
  );

  const value = useMemo(
    () => ({
      members,
      projectLeadUserId,
      projectLeadUserIds,
      effectiveRole,
      isLoading,
      error,
      isAssigned,
      updateMembers,
      refetchMembers: fetchMembers,
    }),
    [members, projectLeadUserId, projectLeadUserIds, effectiveRole, isLoading, error, isAssigned, updateMembers, fetchMembers]
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
