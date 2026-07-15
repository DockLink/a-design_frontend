import type { Project, ProjectCardView, ProjectImage } from "@/types/projects";

export const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80";

export function projectThumbnailUrl(images: { url: string }[]): string {
  return images[0]?.url ?? FALLBACK_THUMBNAIL;
}

/** Gallery / precedent images only — never includes the cover at index 0. */
export function projectGalleryImages(images: ProjectImage[]): ProjectImage[] {
  const coverId = images[0]?.id;
  if (!coverId) return [];
  return images.filter((img) => img.id !== coverId);
}

export function replaceProjectCover(
  images: ProjectImage[],
  newCoverId: string,
): { id: string }[] {
  return [{ id: newCoverId }, ...projectGalleryImages(images).map((img) => ({ id: img.id }))];
}

export function appendProjectGalleryImages(
  images: ProjectImage[],
  newImageIds: string[],
): { id: string }[] {
  const cover = images[0] ? [{ id: images[0].id }] : [];
  const gallery = projectGalleryImages(images).map((img) => ({ id: img.id }));
  const appended = newImageIds.map((id) => ({ id }));
  return [...cover, ...gallery, ...appended];
}

export function removeProjectGalleryImage(
  images: ProjectImage[],
  imageId: string,
): { id: string }[] {
  const cover = images[0] ? [{ id: images[0].id }] : [];
  const gallery = projectGalleryImages(images)
    .filter((img) => img.id !== imageId)
    .map((img) => ({ id: img.id }));
  return [...cover, ...gallery];
}

export function mapProjectToCard(project: Project): ProjectCardView {
  return {
    id: project.id,
    name: project.name,
    client: project.client?.name ?? "No client",
    thumbnail: projectThumbnailUrl(project.images),
    status: project.status === "ACTIVE" ? "Active" : "Inactive",
    number: project.code,
    location: project.location,
    currentStage: project.current_stage ?? null,
    created_at: project.created_at,
  };
}