"use client";

import { useProjectContext } from "@/components/projects/project-context";
import { ProjectMinutesBoard } from "@/components/projects/minutes/project-minutes-board";

export function ProjectMinutesTab() {
  const { project } = useProjectContext();
  if (!project) return null;
  return <ProjectMinutesBoard projectId={project.id} />;
}
