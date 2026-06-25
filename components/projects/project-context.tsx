"use client";

import { createContext, useContext } from "react";

import type { Project } from "@/types/projects";

interface ProjectContextValue {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
  value,
  children,
}: {
  value: ProjectContextValue;
  children: React.ReactNode;
}) {
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProjectContext must be used within ProjectProvider");
  return ctx;
}
