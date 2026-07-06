import { Suspense } from "react";

import { ProjectLayoutClient } from "@/components/projects/project-layout-client";

type Props = {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailLayout({ children, params }: Props) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<div style={{ padding: "24px", color: "var(--ds-tertiary-label)" }}>Loading project…</div>}>
      <ProjectLayoutClient projectId={projectId}>{children}</ProjectLayoutClient>
    </Suspense>
  );
}
