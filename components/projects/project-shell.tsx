"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import { canViewHoldRequests } from "@/lib/projects/permissions";
import { getPrimaryRole } from "@/lib/auth/rbac";
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
  const { user } = useAuth();
  const sidebarRole = toSidebarRole(user?.roles ? getPrimaryRole(user.roles) : null);
  const [hovered, setHovered] = useState<string | null>(null);

  const activeTab = tabFromPathname(pathname, projectId);
  const tabs = PROJECT_TABS.filter((t) => !t.adminOnly || canViewHoldRequests(sidebarRole));

  return (
    <div style={{ margin: "-28px" }}>
      <div
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
          padding: "0 28px",
          zIndex: 99,
          boxShadow: "0 1px 0 0 rgba(60,60,67,0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Link
            href={NAV_ROUTES.projects}
            style={{ fontSize: "13px", color: "#8E8E93", textDecoration: "none" }}
          >
            Projects
          </Link>
          <span style={{ fontSize: "13px", color: "#C7C7CC" }}>/</span>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#1C1C1E" }}>{projectName}</span>
        </div>

        <div style={{ display: "flex", height: "44px", overflowX: "auto" }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            const isHovered = hovered === tab.key;
            return (
              <Link
                key={tab.key}
                href={projectTabRoute(projectId, tab.key)}
                onMouseEnter={() => setHovered(tab.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  height: "100%",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 400,
                  color: active ? "#D4A96A" : isHovered ? "#1C1C1E" : "#8E8E93",
                  borderBottom: active ? "2px solid #D4A96A" : "2px solid transparent",
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

      <div style={{ padding: "24px 28px" }}>{children}</div>
    </div>
  );
}
