"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import type { ProjectMember, ProjectMemberAssignRequest, ProjectWithMembers } from "@/types/projects";

const MEMBERS_CACHE_KEY = "adesign_project_members";

function loadCachedMembers(projectId: string): ProjectMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(`${MEMBERS_CACHE_KEY}:${projectId}`);
    return raw ? (JSON.parse(raw) as ProjectMember[]) : [];
  } catch {
    return [];
  }
}

function saveCachedMembers(projectId: string, members: ProjectMember[]) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${MEMBERS_CACHE_KEY}:${projectId}`, JSON.stringify(members));
}

interface ProjectMembersContextValue {
  members: ProjectMember[];
  isLoading: boolean;
  error: string | null;
  isAssigned: (userId: string) => boolean;
  updateMembers: (payload: ProjectMemberAssignRequest) => Promise<ProjectWithMembers>;
  setMembers: (members: ProjectMember[]) => void;
}

const ProjectMembersContext = createContext<ProjectMembersContextValue | null>(null);

export function ProjectMembersProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const [members, setMembersState] = useState<ProjectMember[]>(() => loadCachedMembers(projectId));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMembersState(loadCachedMembers(projectId));
  }, [projectId]);

  const setMembers = useCallback(
    (next: ProjectMember[]) => {
      setMembersState(next);
      saveCachedMembers(projectId, next);
    },
    [projectId]
  );

  const updateMembers = useCallback(
    async (payload: ProjectMemberAssignRequest) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await authApiClient<ProjectWithMembers>(
          `/projects/${projectId}/members`,
          { method: "PUT", body: JSON.stringify(payload) }
        );
        const next = result.members ?? [];
        setMembers(next);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update members";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, setMembers]
  );

  const isAssigned = useCallback(
    (userId: string) => members.some((m) => m.user_id === userId && m.status === "ACTIVE"),
    [members]
  );

  const value = useMemo(
    () => ({ members, isLoading, error, isAssigned, updateMembers, setMembers }),
    [members, isLoading, error, isAssigned, updateMembers, setMembers]
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
