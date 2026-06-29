"use client";

import { useProjectContext } from "@/components/projects/project-context";
import { ProjectFilesBoard } from "@/components/projects/files/project-files-board";

export function ProjectFilesTab() {
  const { project } = useProjectContext();
  if (!project) return null;
  return <ProjectFilesBoard projectId={project.id} />;
}
