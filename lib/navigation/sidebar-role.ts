import {
  ADMIN_ONLY_ROUTES,
  GUEST_BLOCKED_ROUTES,
  LEAD_ADMIN_ROUTES,
  NAV_ROUTES,
  SUPER_ADMIN_ONLY_ROUTES,
} from "@/types/navigation";
import type { UserRole } from "@/types/users";

export type SidebarRole = "superadmin" | "admin" | "lead" | "member" | "guest";

export const ROLE_LABEL: Record<SidebarRole, string> = {
  superadmin: "Super Administrator",
  admin: "Administrator",
  lead: "Project Lead",
  member: "Team Member",
  guest: "Guest",
};

export function toSidebarRole(role: UserRole | null): SidebarRole {
  if (role === "SUPER_ADMIN") return "superadmin";
  if (role === "ADMIN") return "admin";
  if (role === "TEAM_LEAD") return "lead";
  if (role === "GUEST" || role === "CLIENT_FULL_ACCESS") return "guest";
  return "member";
}

export const HOME_ROUTE: Record<SidebarRole, string> = {
  superadmin: NAV_ROUTES.superAdminDashboard,
  admin: NAV_ROUTES.adminDashboard,
  lead: NAV_ROUTES.leadDashboard,
  member: NAV_ROUTES.memberDashboard,
  guest: NAV_ROUTES.guestDashboard,
};

export function canAccessRoute(role: UserRole | null, pathname: string): boolean {
  if (!role) return false;

  if (role === "GUEST" || role === "CLIENT_FULL_ACCESS") {
    if (GUEST_BLOCKED_ROUTES.some((r) => pathname.startsWith(r))) return false;
    return (
      pathname.startsWith(NAV_ROUTES.guestDashboard) ||
      pathname.startsWith(NAV_ROUTES.projects) ||
      pathname.startsWith(NAV_ROUTES.settings)
    );
  }

  if (SUPER_ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    return role === "SUPER_ADMIN";
  }

  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
  const isLead = role === "TEAM_LEAD";

  if (ADMIN_ONLY_ROUTES.some((r) => pathname.startsWith(r))) return isAdmin;
  if (LEAD_ADMIN_ROUTES.some((r) => pathname.startsWith(r))) return isAdmin || isLead;
  return true;
}

export function canOpenProjectDetail(
  sidebarRole: SidebarRole,
  isAssigned = false,
  fullViewAccess = false,
): boolean {
  if (sidebarRole === "superadmin" || sidebarRole === "admin") return true;
  if (sidebarRole === "member" || sidebarRole === "lead") return true;
  if (fullViewAccess) return true;
  return isAssigned;
}

export function isSuperAdminRole(role: UserRole | null): boolean {
  return role === "SUPER_ADMIN";
}
