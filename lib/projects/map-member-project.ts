import type { MemberProjectView, Project, ProjectWithMembers } from "@/types/projects";

export function mapToMemberProjectView(
  project: Project | ProjectWithMembers,
  currentUserId?: string
): MemberProjectView {
  const members = "members" in project ? project.members ?? [] : [];
  const isAssigned =
    !currentUserId ||
    members.length === 0 ||
    members.some((m) => m.user_id === currentUserId && m.status === "ACTIVE");

  return {
    id: project.id,
    name: project.name,
    isAssigned,
  };
}
