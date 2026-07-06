"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ProjectProvider, useProjectContext } from "@/components/projects/project-context";
import { ProjectShell } from "@/components/projects/project-shell";
import { useAuth } from "@/hooks/use-auth";
import { useProject } from "@/hooks/use-project";
import { ProjectMembersProvider, useProjectMembers } from "@/hooks/use-project-members";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import { canAccessProjectDetail } from "@/lib/projects/permissions";
import { NAV_ROUTES } from "@/types/navigation";

function ProjectAccessGate({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { isAssigned } = useProjectMembers();
  const { project, isLoading, error } = useProjectContext();

  const sidebarRole = toSidebarRole(user?.roles ? getPrimaryRole(user.roles) : null);
  const assignedParam = searchParams.get("assigned") === "1";
  const userId = user?.id ?? "";
  const assigned = assignedParam || isAssigned(userId);

  useEffect(() => {
    if (isLoading || !user) return;
    if (!canAccessProjectDetail(sidebarRole, assigned)) {
      router.replace(NAV_ROUTES.projects);
    }
  }, [isLoading, user, sidebarRole, assigned, router]);

  if (isLoading) {
    return <div style={{ padding: "24px", color: "var(--ds-tertiary-label)", fontSize: "14px" }}>Loading project…</div>;
  }

  if (error || !project) {
    return (
      <div style={{ padding: "24px", color: "var(--ds-destructive)", fontSize: "14px" }}>
        {error ?? "Project not found"}
      </div>
    );
  }

  if (!canAccessProjectDetail(sidebarRole, assigned)) return null;

  return (
    <ProjectShell projectId={projectId} projectName={project.name}>
      {children}
    </ProjectShell>
  );
}

export function ProjectLayoutClient({
  projectId,
  children,
}: {
  projectId: string;
  children: React.ReactNode;
}) {
  const { project, isLoading, error, refetch } = useProject(projectId);

  return (
    <ProjectMembersProvider projectId={projectId}>
      <ProjectProvider value={{ project, isLoading, error, refetch }}>
        <ProjectAccessGate projectId={projectId}>{children}</ProjectAccessGate>
      </ProjectProvider>
    </ProjectMembersProvider>
  );
}
