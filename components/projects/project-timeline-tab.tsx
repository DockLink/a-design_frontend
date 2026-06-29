"use client";

import { useProjectContext } from "@/components/projects/project-context";
import { ProjectTimelineBoard } from "@/components/projects/timeline/project-timeline-board";

export function ProjectTimelineTab() {
  const { project } = useProjectContext();
  if (!project) return null;
  return <ProjectTimelineBoard projectId={project.id} />;
}
