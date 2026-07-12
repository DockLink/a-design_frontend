import type { SidebarRole } from "@/lib/navigation/sidebar-role";

export function canManageProject(role: SidebarRole, isViewer = false): boolean {
  if (role === "guest" || isViewer) return false;
  return role === "superadmin" || role === "admin" || role === "lead";
}

export function canViewHoldRequests(role: SidebarRole): boolean {
  return role === "superadmin" || role === "admin";
}

export function canViewAdminInsights(role: SidebarRole): boolean {
  return role === "superadmin" || role === "admin";
}

/** Org-level admins can edit all project fields (same as create flow). */
export function canEditProjectDetails(orgRole: SidebarRole): boolean {
  return orgRole === "superadmin" || orgRole === "admin";
}

export function canAccessProjectDetail(role: SidebarRole, isAssigned: boolean): boolean {
  if (role === "superadmin" || role === "admin") return true;
  if (role === "member" || role === "lead") return true;
  return isAssigned;
}

/** Guests cannot download; team members get complete view access (incl. downloads) on any project. */
export function canDownloadProjectFiles(role: SidebarRole, _isViewer = false): boolean {
  if (role === "guest") return false;
  return true;
}
