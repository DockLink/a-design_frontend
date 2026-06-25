export const NAV_ROUTES = {
  login: "/login",
  adminDashboard: "/dashboard/admin",
  leadDashboard: "/dashboard/lead",
  memberDashboard: "/dashboard/member",
  projects: "/projects",
  myTasks: "/my-tasks",
  notifications: "/notifications",
  userManagement: "/user-management",
  accessRequests: "/access-requests",
} as const;

export function projectRoute(projectId: string) {
  return `${NAV_ROUTES.projects}/${projectId}`;
}

export function projectTabRoute(projectId: string, tab: ProjectTab) {
  if (tab === "overview") return projectRoute(projectId);
  return `${projectRoute(projectId)}/${tab}`;
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

/** Admin + Super Admin only */
export const ADMIN_ONLY_ROUTES = [
  NAV_ROUTES.userManagement,
] as const;

/** Admin + Super Admin + Team Lead */
export const LEAD_ADMIN_ROUTES = [
  NAV_ROUTES.accessRequests,
] as const;