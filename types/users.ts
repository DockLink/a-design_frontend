export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "TEAM_LEAD",
  "MEMBER",
  "GUEST",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type UserStatus = "ACTIVE" | "INACTIVE";

export type ThemePreset = "default" | "dark" | "high_contrast";
export type DensityPreference = "compact" | "comfortable";
export type FontSizePreference = "small" | "medium" | "large";
export type SidebarModePreference = "expanded" | "collapsed";

export const ALLOWED_HOME_ROUTES = [
  "/dashboard/super-admin",
  "/dashboard/admin",
  "/dashboard/lead",
  "/dashboard/member",
  "/dashboard/guest",
  "/projects",
  "/my-tasks",
  "/notifications",
] as const;

export type HomeRoutePreference = (typeof ALLOWED_HOME_ROUTES)[number];

export interface UserPreferences {
  theme_preset: ThemePreset;
  accent_color: string | null;
  density: DensityPreference;
  font_size: FontSizePreference;
  sidebar_mode: SidebarModePreference;
  avatar_file_id: string | null;
  default_home_route: HomeRoutePreference | null;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: UserRole[];
  status: UserStatus;
  preferences?: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
}