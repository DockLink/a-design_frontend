import type { Project, ProjectCardView } from "@/types/projects";

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80";

export function mapProjectToCard(project: Project): ProjectCardView {
  return {
    id: project.id,
    name: project.name,
    client: project.client?.name ?? "No client",
    thumbnail: project.images[0]?.url ?? FALLBACK_THUMBNAIL,
    status: project.status === "ACTIVE" ? "Active" : "Inactive",
    number: project.code,
  };
}