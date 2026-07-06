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

export function canAccessProjectDetail(role: SidebarRole, isAssigned: boolean): boolean {
  if (role === "superadmin" || role === "admin") return true;
  return isAssigned;
}

export function canDownloadProjectFiles(role: SidebarRole, isViewer = false): boolean {
  if (isViewer || role === "guest") return false;
  return true;
}
