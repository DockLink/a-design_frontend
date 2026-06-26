import { getUserInitials, getUserListPrimaryLabel } from "@/lib/user/display";
import type { ProjectMember } from "@/types/projects";
import type { User } from "@/types/users";

export function resolveProjectMemberProfile(
  member: ProjectMember,
  orgUsers: User[],
): { name: string; initials: string } {
  const fromOrg = orgUsers.find((u) => u.id === member.user_id);
  if (fromOrg) {
    return {
      name: getUserListPrimaryLabel(fromOrg),
      initials: getUserInitials(fromOrg),
    };
  }

  const assignee = member.assignee;
  if (assignee) {
    const fields = {
      email: assignee.email ?? "",
      first_name: assignee.first_name ?? assignee.firstName ?? "",
      last_name: assignee.last_name ?? assignee.lastName ?? "",
    };
    const name = getUserListPrimaryLabel(fields);
    if (name && !looksLikeOpaqueId(name)) {
      return { name, initials: getUserInitials(fields) };
    }
  }

  return {
    name: `Member ${member.user_id.slice(0, 8)}…`,
    initials: "?",
  };
}

function looksLikeOpaqueId(value: string): boolean {
  const v = value.trim();
  if (v.length >= 20 && /^[a-f0-9]+$/i.test(v)) return true;
  if (/^[a-z0-9]{20,}$/i.test(v) && !v.includes("@") && !v.includes(" ")) return true;
  return false;
}

export function memberDisplayName(member: ProjectMember, orgUsers: User[]): string {
  return resolveProjectMemberProfile(member, orgUsers).name;
}

export function memberDisplayInitials(member: ProjectMember, orgUsers: User[]): string {
  return resolveProjectMemberProfile(member, orgUsers).initials;
}
