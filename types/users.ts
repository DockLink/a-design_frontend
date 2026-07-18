export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "TEAM_LEAD",
  "MEMBER",
  "GUEST",
  "CLIENT_FULL_ACCESS",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type UserStatus = "ACTIVE" | "INACTIVE";

export type ThemePreset = "default" | "light" | "dark" | "high_contrast";
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

export interface CustomColorOverrides {
  bg?: string | null;
  surface?: string | null;
  surface_elevated?: string | null;
  sidebar_bg?: string | null;
  label?: string | null;
  secondary_label?: string | null;
  accent?: string | null;
  accent_hover?: string | null;
  separator?: string | null;
  destructive?: string | null;
  success?: string | null;
}

export interface UserPreferences {
  theme_preset: ThemePreset;
  accent_color: string | null;
  density: DensityPreference;
  font_size: FontSizePreference;
  sidebar_mode: SidebarModePreference;
  custom_colors: CustomColorOverrides;
  avatar_file_id: string | null;
  default_home_route: HomeRoutePreference | null;
}

/** Per-user settings (avatar, home route). Appearance fields come from global app settings. */
export type UserPersonalPreferences = Pick<
  UserPreferences,
  "avatar_file_id" | "default_home_route"
>;

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