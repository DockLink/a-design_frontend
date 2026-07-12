"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useProjectContext } from "@/components/projects/project-context";
import { ProjectHeaderBanner } from "@/components/projects/project-header-banner";
import { useProjectMembers } from "@/hooks/use-project-members";
import { canManageProject, canViewHoldRequests } from "@/lib/projects/permissions";
import { NAV_ROUTES, PROJECT_TABS, projectTabRoute, type ProjectTab } from "@/types/navigation";

function tabFromPathname(pathname: string, projectId: string): ProjectTab {
  const base = `${NAV_ROUTES.projects}/${projectId}`;
  if (pathname === base) return "overview";
  const suffix = pathname.replace(`${base}/`, "") as ProjectTab;
  return PROJECT_TABS.some((t) => t.key === suffix) ? suffix : "overview";
}

export function ProjectShell({
  projectId,
  projectName,
  children,
}: {
  projectId: string;
  projectName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { project, refetch } = useProjectContext();
  const { effectiveRole, isViewer } = useProjectMembers();
  const [hovered, setHovered] = useState<string | null>(null);

  const activeTab = tabFromPathname(pathname, projectId);
  const tabs = PROJECT_TABS.filter((t) => !t.adminOnly || canViewHoldRequests(effectiveRole));

  return (
    <div className="project-page">
      <div
        className="project-shell-nav"
        style={{
          position: "sticky",
          top: 0,
          height: "44px",
          background: "#FCF8F4",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          borderBottom: "0.5px solid rgba(60,60,67,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          zIndex: 99,
          boxShadow: "0 1px 0 0 rgba(60,60,67,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Link
            href={NAV_ROUTES.projects}
            style={{ fontSize: "13px", color: "var(--ds-tertiary-label)", textDecoration: "none" }}
          >
            Projects
          </Link>
          <span style={{ fontSize: "13px", color: "#C7C7CC" }}>/</span>
          <span className="project-shell-nav-name" style={{ fontSize: "13px", color: "var(--ds-label)" }}>
            {projectName}
          </span>
        </div>

        <div style={{ display: "flex", height: "44px", overflowX: "auto" }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            const isHovered = hovered === tab.key;
            return (
              <Link
                key={tab.key}
                href={projectTabRoute(projectId, tab.key)}
                className="project-shell-nav-tab"
                onMouseEnter={() => setHovered(tab.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  height: "100%",
                  cursor: "pointer",
                  fontSize: "13px",
                  color: active ? "var(--ds-accent)" : isHovered ? "var(--ds-label)" : "var(--ds-tertiary-label)",
                  borderBottom: active ? "2px solid var(--ds-accent)" : "2px solid transparent",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {project && (
        <div className="project-banner-wrap">
          <ProjectHeaderBanner
            projectId={project.id}
            projectName={project.name}
            images={project.images}
            canEdit={canManageProject(effectiveRole, isViewer)}
            onUpdated={refetch}
          />
        </div>
      )}

      <div className="project-shell-content">{children}</div>
    </div>
  );
}
