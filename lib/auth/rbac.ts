import { ROLE_PRIORITY } from "@/types/rbac";
import type { UserRole } from "@/types/users";

export function getPrimaryRole(roles: UserRole[]): UserRole | null {
  if (!roles.length) return null;

  return [...roles].sort(
    (a, b) => ROLE_PRIORITY.indexOf(b) - ROLE_PRIORITY.indexOf(a)
  )[0];
}

export function hasAnyRole(
  userRoles: UserRole[],
  ...required: UserRole[]
): boolean {
  return required.some((role) => userRoles.includes(role));
}

export function hasAllRoles(
  userRoles: UserRole[],
  ...required: UserRole[]
): boolean {
  return required.every((role) => userRoles.includes(role));
}