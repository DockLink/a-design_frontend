import type { LeadProjectView, Project, ProjectWithMembers } from "@/types/projects";
import { PROJECT_LEAD_ROLE } from "@/types/projects";

export function mapToLeadProjectView(
  project: Project | ProjectWithMembers,
  currentUserId: string,
  taskCount = 0
): LeadProjectView {
  const members = "members" in project ? project.members ?? [] : [];
  const isAssigned = members.some(
    (m) => m.user_id === currentUserId && m.status === "ACTIVE" && m.role === PROJECT_LEAD_ROLE
  );

  let status: LeadProjectView["status"] = "In Progress";
  if (project.status === "INACTIVE") status = "Review";

  return {
    id: project.id,
    name: project.name,
    status,
    progress: 0,
    tasks: taskCount,
    isAssigned,
  };
}