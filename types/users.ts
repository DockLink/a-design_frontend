export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "TEAM_LEAD",
  "MEMBER",
  "GUEST",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type UserStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: UserRole[];
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}