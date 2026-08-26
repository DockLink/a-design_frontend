export const NAV_ROUTES = {
  login: "/login",
  adminDashboard: "/dashboard/admin",
  superAdminDashboard: "/dashboard/super-admin",
  leadDashboard: "/dashboard/lead",
  memberDashboard: "/dashboard/member",
  guestDashboard: "/dashboard/guest",
  projects: "/projects",
  myTasks: "/my-tasks",
  notifications: "/notifications",
  userManagement: "/user-management",
  guestUsers: "/guest-users",
  accessRequests: "/access-requests",
  settings: "/settings",
} as const;

export function projectRoute(projectId: string) {
  return `${NAV_ROUTES.projects}/${projectId}`;
}

export function projectTabRoute(projectId: string, tab: ProjectTab) {
  if (tab === "overview") return projectRoute(projectId);
  return `${projectRoute(projectId)}/${tab}`;
}

/** Files tab deep-link that opens a specific folder. */
export function projectFilesFolderRoute(projectId: string, folderPath: string) {
  const qs = new URLSearchParams({ folder: folderPath });
  return `${projectTabRoute(projectId, "files")}?${qs}`;
}

export type ProjectTab =
  | "overview"
  | "files"
  | "tasks"
  | "minutes"
  | "timeline"
  | "hold-requests";

export const PROJECT_TABS: { key: ProjectTab; label: string; adminOnly?: boolean }[] = [
  { key: "overview", label: "Overview" },
  { key: "files", label: "Files" },
  { key: "tasks", label: "Tasks" },
  { key: "minutes", label: "Minutes" },
  { key: "timeline", label: "Timeline" },
  { key: "hold-requests", label: "Hold Requests", adminOnly: true },
];

export type NavRoute = (typeof NAV_ROUTES)[keyof typeof NAV_ROUTES];

/** Super Admin only */
export const SUPER_ADMIN_ONLY_ROUTES = [
  NAV_ROUTES.superAdminDashboard,
] as const;

/** Admin + Super Admin only */
export const ADMIN_ONLY_ROUTES = [
  NAV_ROUTES.userManagement,
  NAV_ROUTES.guestUsers,
] as const;

/** Routes blocked for guest org role */
export const GUEST_BLOCKED_ROUTES = [
  NAV_ROUTES.userManagement,
  NAV_ROUTES.guestUsers,
  NAV_ROUTES.accessRequests,
  NAV_ROUTES.myTasks,
  NAV_ROUTES.notifications,
  NAV_ROUTES.superAdminDashboard,
  NAV_ROUTES.adminDashboard,
  NAV_ROUTES.leadDashboard,
  NAV_ROUTES.memberDashboard,
] as const;

/** Admin + Super Admin + Team Lead */
export const LEAD_ADMIN_ROUTES = [
  NAV_ROUTES.accessRequests,
] as const;