"use client";

import { useProjectContext } from "@/components/projects/project-context";
import { ProjectTasksBoard } from "@/components/projects/tasks/project-tasks-board";

export function ProjectTasksTab() {
  const { project } = useProjectContext();
  if (!project) return null;
  return <ProjectTasksBoard projectId={project.id} />;
}
