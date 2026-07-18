import type { ProjectMember } from "@/types/projects";
import type { User, UserRole } from "@/types/users";

const GUEST_ORG_ROLES: UserRole[] = ["GUEST", "CLIENT_FULL_ACCESS"];

export function isGuestRole(roles: UserRole[] | undefined): boolean {
  return roles?.some((role) => GUEST_ORG_ROLES.includes(role)) ?? false;
}

/** Org-wide view-only guest: can open every project, cannot manage or download. */
export function isGuestFullViewAccess(roles: UserRole[] | undefined): boolean {
  return roles?.includes("CLIENT_FULL_ACCESS") ?? false;
}

export function isGuestUser(user: Pick<User, "roles">): boolean {
  return isGuestRole(user.roles);
}

export function isGuestProjectMember(member: ProjectMember): boolean {
  return isGuestRole(member.assignee?.roles as UserRole[] | undefined);
}

export function guestAccessLabel(roles: UserRole[] | undefined): string {
  if (isGuestFullViewAccess(roles)) return "Full view access";
  if (roles?.includes("GUEST")) return "Guest";
  return "Guest";
}
