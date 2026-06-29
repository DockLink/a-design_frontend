import {
  ADMIN_ONLY_ROUTES,
  LEAD_ADMIN_ROUTES,
  NAV_ROUTES,
  SUPER_ADMIN_ONLY_ROUTES,
} from "@/types/navigation";
import type { UserRole } from "@/types/users";

export type SidebarRole = "superadmin" | "admin" | "lead" | "member";

export const ROLE_LABEL: Record<SidebarRole, string> = {
  superadmin: "Super Administrator",
  admin: "Administrator",
  lead: "Project Lead",
  member: "Team Member",
};

export function toSidebarRole(role: UserRole | null): SidebarRole {
  if (role === "SUPER_ADMIN") return "superadmin";
  if (role === "ADMIN") return "admin";
  if (role === "TEAM_LEAD") return "lead";
  return "member";
}

export const HOME_ROUTE: Record<SidebarRole, string> = {
  superadmin: NAV_ROUTES.superAdminDashboard,
  admin: NAV_ROUTES.adminDashboard,
  lead: NAV_ROUTES.leadDashboard,
  member: NAV_ROUTES.memberDashboard,
};

export function canAccessRoute(role: UserRole | null, pathname: string): boolean {
  if (!role) return false;

  if (SUPER_ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return role === "SUPER_ADMIN";
  }

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isLead = role === "TEAM_LEAD";

  if (ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) return isAdmin;
  if (LEAD_ADMIN_ROUTES.some((r) => pathname.startsWith(r))) return isAdmin || isLead;
  return true;
}

export function canOpenProjectDetail(sidebarRole: SidebarRole, isAssigned = false): boolean {
  if (sidebarRole === "superadmin" || sidebarRole === "admin") return true;
  return isAssigned;
}

export function isSuperAdminRole(role: UserRole | null): boolean {
  return role === "SUPER_ADMIN";
}
