import type { SidebarRole } from "@/lib/navigation/sidebar-role";
import { PROJECT_LEAD_ROLE, type ProjectMember, type ProjectMemberProjectRole } from "@/types/projects";

export function getProjectLeadUserId(members: ProjectMember[]): string | null {
  return getProjectLeadUserIds(members)[0] ?? null;
}

export function getProjectLeadUserIds(members: ProjectMember[]): string[] {
  return members
    .filter((m) => m.status === "ACTIVE" && m.role === PROJECT_LEAD_ROLE)
    .map((m) => m.user_id);
}

export function getEffectiveProjectRole(
  userId: string | undefined,
  members: ProjectMember[],
  orgSidebarRole: SidebarRole
): SidebarRole {
  if (orgSidebarRole === "admin") return "admin";
  if (!userId) return "member";

  const membership = members.find((m) => m.user_id === userId && m.status === "ACTIVE");
  if (membership?.role === PROJECT_LEAD_ROLE) return "lead";
  return "member";
}

export function isUserProjectLead(userId: string, members: ProjectMember[]): boolean {
  return members.some(
    (m) => m.user_id === userId && m.status === "ACTIVE" && m.role === PROJECT_LEAD_ROLE
  );
}

export function memberRoleLabel(role?: ProjectMemberProjectRole): string {
  return role === PROJECT_LEAD_ROLE ? "Project Lead" : role === "VIEWER" ? "Viewer" : "Member";
}
