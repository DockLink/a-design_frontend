import type { UserRole } from "./users";

/** Higher index = higher privilege — used for primaryRole */
export const ROLE_PRIORITY: UserRole[] = [
  "GUEST",
  "CLIENT_FULL_ACCESS",
  "MEMBER",
  "TEAM_LEAD",
  "ADMIN",
  "SUPER_ADMIN",
];

/** Future dashboard routes — not used yet */
export const ROLE_DEFAULT_ROUTE: Record<UserRole, string> = {
  SUPER_ADMIN: "/dashboard/super-admin",
  ADMIN: "/dashboard/admin",
  TEAM_LEAD: "/dashboard/lead",
  MEMBER: "/dashboard/member",
  GUEST: "/projects",
  CLIENT_FULL_ACCESS: "/projects",
};