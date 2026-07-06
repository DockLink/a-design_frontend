import type { ProjectMember } from "@/types/projects";
import type { User, UserRole } from "@/types/users";

export function isGuestRole(roles: UserRole[] | undefined): boolean {
  return roles?.includes("GUEST") ?? false;
}

export function isGuestUser(user: Pick<User, "roles">): boolean {
  return isGuestRole(user.roles);
}

export function isGuestProjectMember(member: ProjectMember): boolean {
  return isGuestRole(member.assignee?.roles as UserRole[] | undefined);
}
