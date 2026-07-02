import { canAccessRoute } from "@/lib/navigation/sidebar-role";
import { NAV_ROUTES } from "@/types/navigation";
import { ROLE_DEFAULT_ROUTE } from "@/types/rbac";
import type { HomeRoutePreference, UserPreferences, UserRole } from "@/types/users";

const HOME_ROUTE_LABELS: Record<HomeRoutePreference, string> = {
  "/dashboard/super-admin": "Super Admin dashboard",
  "/dashboard/admin": "Admin dashboard",
  "/dashboard/lead": "Lead dashboard",
  "/dashboard/member": "Member dashboard",
  "/dashboard/guest": "Guest dashboard",
  [NAV_ROUTES.projects]: "Projects",
  [NAV_ROUTES.myTasks]: "My Tasks",
  [NAV_ROUTES.notifications]: "Notifications",
};

export function getHomeRouteLabel(route: HomeRoutePreference): string {
  return HOME_ROUTE_LABELS[route] ?? route;
}

export function getSelectableHomeRoutes(role: UserRole | null): HomeRoutePreference[] {
  const candidates: HomeRoutePreference[] = [
    ROLE_DEFAULT_ROUTE.SUPER_ADMIN as HomeRoutePreference,
    ROLE_DEFAULT_ROUTE.ADMIN as HomeRoutePreference,
    ROLE_DEFAULT_ROUTE.TEAM_LEAD as HomeRoutePreference,
    ROLE_DEFAULT_ROUTE.MEMBER as HomeRoutePreference,
    ROLE_DEFAULT_ROUTE.GUEST as HomeRoutePreference,
    NAV_ROUTES.projects,
    NAV_ROUTES.myTasks,
    NAV_ROUTES.notifications,
  ];

  return candidates.filter(
    (route) => role && canAccessRoute(role, route),
  ) as HomeRoutePreference[];
}

export function resolveHomeRoute(
  role: UserRole | null,
  preferences?: Partial<UserPreferences> | null,
): string {
  const preferred = preferences?.default_home_route;
  if (preferred && role && canAccessRoute(role, preferred)) {
    return preferred;
  }
  return role ? ROLE_DEFAULT_ROUTE[role] : NAV_ROUTES.adminDashboard;
}
