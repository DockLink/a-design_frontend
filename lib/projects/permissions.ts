import type { SidebarRole } from "@/lib/navigation/sidebar-role";

export function canManageProject(role: SidebarRole): boolean {
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
