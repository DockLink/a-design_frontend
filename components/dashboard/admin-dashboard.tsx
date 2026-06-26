"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Settings,
} from "lucide-react";

import { CreateProjectSheet } from "@/components/projects/create-project-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useProjects } from "@/hooks/use-projects";
import {
  dsActionBtn,
  dsCallout,
  dsCaption,
  dsCaption2,
  dsCard,
  dsFootnote,
  dsHeadline,
  dsLargeTitle,
  dsMono,
  dsSectionLabel,
  dsStatValue,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { getUserDisplayName } from "@/lib/user/display";
import { NAV_ROUTES, projectRoute } from "@/types/navigation";
import type { ProjectCardView } from "@/types/projects";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#D8F3DC", color: "#2D6A4F" },
  Inactive: { bg: "#F5EFE6", color: "#9C8573" },
  "On hold": { bg: "#FFF3CD", color: "#7B5E0A" },
  Completed: { bg: "#EDE9FE", color: "#5B21B6" },
  Archived: { bg: "#F5EFE6", color: "#9C8573" },
};

export function AdminDashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { projects, activeProjects, meta, isLoading, error } = useProjects({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const displayName = user ? getUserDisplayName(user) : "there";
  const greeting = getGreeting();
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const STATS = [
    {
      label: "Total Projects",
      value: String(meta?.total ?? projects.length),
      subtext: `${activeProjects.length} active`,
      icon: FolderOpen,
      color: "#D4A96A",
    },
  ];

  function openProject(project: ProjectCardView) {
    router.push(projectRoute(project.id));
  }

  return (
    <div>
      <div style={dsLargeTitle}>
        {greeting}, {displayName.split(" ")[0]}.
      </div>
      <div style={{ ...dsSubtitle, marginTop: "6px" }}>{dateStr}</div>

      <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => setShowCreateProject(true)}
          style={{
            ...dsActionBtn,
            background: "#D4A96A",
            color: "white",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#D4A96A")}
        >
          + New project
        </button>
        <button
          onClick={() => router.push(NAV_ROUTES.userManagement)}
          style={{
            ...dsActionBtn,
            background: "rgba(212,169,106,0.12)",
            color: "#C9894A",
          }}
        >
          <Settings size={16} />
          Manage users
        </button>
        <button
          onClick={() => router.push(NAV_ROUTES.accessRequests)}
          style={{
            ...dsActionBtn,
            background: "rgba(255,59,48,0.10)",
            color: "#FF3B30",
          }}
        >
          Access requests
        </button>
      </div>

      <div style={dsSectionLabel}>System Overview</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", maxWidth: isMobile ? undefined : "280px" }}>
        {STATS.map((stat) => (
          <div key={stat.label} style={{ ...dsCard, padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <stat.icon size={18} color={stat.color} />
            </div>
            <div style={dsStatValue}>{stat.value}</div>
            <div style={dsCaption}>{stat.label}</div>
            <div style={dsCaption2}>{stat.subtext}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "8px" }}>
        <div style={dsSectionLabel}>Active Projects</div>
        {isLoading && <div style={dsCallout}>Loading projects…</div>}
        {error && <div style={{ ...dsCallout, color: "#FF3B30" }}>{error}</div>}
        {!isLoading && !error && activeProjects.length === 0 && (
          <div style={dsCallout}>No active projects.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {activeProjects.map((project) => {
            const isHovered = hoveredProject === project.id;
            const showProgress = (project.completion ?? 0) > 0;
            const showLead = Boolean(project.lead);
            return (
              <button
                key={project.id}
                onClick={() => openProject(project)}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                style={{
                  ...dsCard, display: "flex", padding: 0,
                  border: `1px solid ${isHovered ? "#D4A96A" : "transparent"}`,
                  boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.10)" : undefined,
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                }}
              >
                <div style={{ width: "140px", minHeight: "112px", background: `url(${project.thumbnail}) center/cover`, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "6px" }}>
                      <div>
                        <div style={{ ...dsHeadline, marginBottom: "4px" }}>{project.name}</div>
                        <div style={dsFootnote}>{project.client}</div>
                      </div>
                      <span style={{ ...dsCaption2, ...dsMono, color: "#9C8573" }}>{project.number}</span>
                    </div>
                  </div>
                  {(showProgress || showLead) && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        {showProgress && (
                          <span style={dsCaption}>Progress: {project.completion}%</span>
                        )}
                        {showLead && (
                          <span style={dsCaption}>Lead: {project.lead}</span>
                        )}
                      </div>
                      {showProgress && (
                        <div style={{ height: "5px", borderRadius: "9999px", background: "#F2EDE8", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${project.completion}%`, background: "#D4A96A" }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={dsSectionLabel}>All Projects</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {projects.map((project) => {
          const isHovered = hoveredProject === project.id;
          const statusCfg = STATUS_CONFIG[project.status] ?? { bg: "#F5EFE6", color: "#6B5744" };

          return (
            <button
              key={project.id}
              onClick={() => openProject(project)}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
              style={{
                ...dsCard,
                border: `1px solid ${isHovered ? "#D4A96A" : "var(--ds-separator)"}`,
                boxShadow: isHovered ? "0 8px 24px rgba(0,0,0,0.10)" : undefined,
                cursor: "pointer", transition: "all 0.15s", textAlign: "left", padding: 0,
              }}
            >
              <div style={{ width: "100%", height: "160px", background: `url(${project.thumbnail}) center/cover`, position: "relative" }}>
                <div style={{ position: "absolute", top: "10px", right: "10px", background: statusCfg.bg, color: statusCfg.color, fontSize: "var(--ds-text-caption-2)", fontWeight: 500, borderRadius: "8px", padding: "4px 10px", backdropFilter: "blur(8px)" }}>
                  {project.status}
                </div>
                <div style={{ position: "absolute", bottom: "10px", left: "10px", background: "rgba(0,0,0,0.6)", color: "white", fontSize: "var(--ds-text-caption-2)", ...dsMono, borderRadius: "6px", padding: "4px 8px", backdropFilter: "blur(8px)" }}>
                  {project.number}
                </div>
              </div>
              <div style={{ padding: "16px" }}>
                <div style={{ ...dsHeadline, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "4px" }}>
                  {project.name}
                </div>
                <div style={{ ...dsCaption, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "10px" }}>
                  {project.client}
                </div>
                {((project.teamSize ?? 0) > 0 || (project.completion ?? 0) > 0) && (
                  <div style={{ ...dsCaption2, color: "#9C8573", marginBottom: "6px" }}>
                    {(project.teamSize ?? 0) > 0 && `${project.teamSize} members`}
                    {(project.teamSize ?? 0) > 0 && (project.completion ?? 0) > 0 && " · "}
                    {(project.completion ?? 0) > 0 && `${project.completion}% complete`}
                  </div>
                )}
                {(project.currentPhase ?? 0) > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    {Array.from({ length: 6 }).map((_, i) => {
                      const phase = project.currentPhase ?? 0;
                      const done = i < phase;
                      const active = i === phase;
                      return (
                        <div key={i} style={{ flex: 1, height: "3px", borderRadius: "9999px", background: done ? "#D4A96A" : active ? "#F5E6D0" : "#F2EDE8" }} />
                      );
                    })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "28px", textAlign: "center" }}>
        <button
          onClick={() => router.push(NAV_ROUTES.projects)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "var(--ds-text-callout)", color: "#D4A96A", padding: 0, fontWeight: 500 }}
        >
          View all projects →
        </button>
      </div>

      <CreateProjectSheet
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreated={(id) => router.push(projectRoute(id))}
      />
    </div>
  );
}