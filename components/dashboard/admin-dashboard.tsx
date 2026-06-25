"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Settings,
} from "lucide-react";

import { CreateProjectSheet } from "@/components/projects/create-project-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useProjects } from "@/hooks/use-projects";
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

const card: CSSProperties = {
  background: "#FFFFFF",
  borderRadius: "14px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

const sectionLabel: CSSProperties = {
  fontSize: "12px",
  fontWeight: 500,
  color: "#8E8E93",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "12px",
  marginTop: "24px",
  padding: "0 2px",
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
      <div style={{ fontSize: "28px", fontWeight: 600, color: "#1C1C1E", letterSpacing: "-0.5px" }}>
        {greeting}, {displayName.split(" ")[0]}.
      </div>
      <div style={{ fontSize: "14px", color: "#8E8E93", marginTop: "4px" }}>{dateStr}</div>

      <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowCreateProject(true)}
          style={{
            background: "#D4A96A", color: "white", fontSize: "14px", fontWeight: 500,
            borderRadius: "10px", height: "36px", padding: "0 18px", border: "none",
            cursor: "pointer", letterSpacing: "-0.1px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#D4A96A")}
        >
          + New project
        </button>
        <button
          onClick={() => router.push(NAV_ROUTES.userManagement)}
          style={{
            background: "rgba(212,169,106,0.12)", border: "none", color: "#C9894A",
            fontSize: "14px", fontWeight: 500, borderRadius: "10px", height: "36px",
            padding: "0 18px", cursor: "pointer", letterSpacing: "-0.1px",
          }}
        >
          <Settings size={14} style={{ verticalAlign: "middle", marginRight: "4px", marginTop: "-2px" }} />
          Manage users
        </button>
        <button
          onClick={() => router.push(NAV_ROUTES.accessRequests)}
          style={{
            background: "rgba(255,59,48,0.10)", border: "none", color: "#FF3B30",
            fontSize: "14px", fontWeight: 500, borderRadius: "10px", height: "36px",
            padding: "0 18px", cursor: "pointer", letterSpacing: "-0.1px",
          }}
        >
          Access requests
        </button>
      </div>

      <div style={sectionLabel}>System Overview</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", maxWidth: isMobile ? undefined : "240px" }}>
        {STATS.map((stat) => (
          <div key={stat.label} style={{ ...card, padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${stat.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <stat.icon size={16} color={stat.color} />
            </div>
            <div style={{ fontSize: "24px", fontWeight: 600, color: "#1C1C1E", letterSpacing: "-0.5px" }}>{stat.value}</div>
            <div style={{ fontSize: "12px", color: "#8E8E93" }}>{stat.label}</div>
            <div style={{ fontSize: "11px", color: "#C7C7CC" }}>{stat.subtext}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "24px" }}>
        <div style={sectionLabel}>Active Projects</div>
        {isLoading && <div style={{ fontSize: "14px", color: "#8E8E93" }}>Loading projects…</div>}
        {error && <div style={{ fontSize: "14px", color: "#FF3B30" }}>{error}</div>}
        {!isLoading && !error && activeProjects.length === 0 && (
          <div style={{ fontSize: "14px", color: "#8E8E93" }}>No active projects.</div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                  ...card, display: "flex", padding: 0,
                  border: `1px solid ${isHovered ? "#D4A96A" : "transparent"}`,
                  boxShadow: isHovered ? "0 4px 16px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.07)",
                  cursor: "pointer", transition: "all 0.15s", textAlign: "left",
                }}
              >
                <div style={{ width: "120px", height: "100px", background: `url(${project.thumbnail}) center/cover`, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
                      <div>
                        <div style={{ fontSize: "16px", fontWeight: 600, color: "#1C1C1E", marginBottom: "2px" }}>{project.name}</div>
                        <div style={{ fontSize: "13px", color: "#8E8E93" }}>{project.client}</div>
                      </div>
                      <span style={{ fontSize: "11px", color: "#9C8573", fontFamily: "ui-monospace, monospace" }}>{project.number}</span>
                    </div>
                  </div>
                  {(showProgress || showLead) && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        {showProgress && (
                          <span style={{ fontSize: "12px", color: "#8E8E93" }}>Progress: {project.completion}%</span>
                        )}
                        {showLead && (
                          <span style={{ fontSize: "12px", color: "#8E8E93" }}>Lead: {project.lead}</span>
                        )}
                      </div>
                      {showProgress && (
                        <div style={{ height: "4px", borderRadius: "9999px", background: "#F2EDE8", overflow: "hidden" }}>
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

      <div style={sectionLabel}>All Projects</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
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
                background: "#FFFFFF", borderRadius: "12px",
                border: `1px solid ${isHovered ? "#D4A96A" : "rgba(60,60,67,0.10)"}`,
                boxShadow: isHovered ? "0 4px 16px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.08)",
                cursor: "pointer", overflow: "hidden", transition: "all 0.15s", textAlign: "left", padding: 0,
              }}
            >
              <div style={{ width: "100%", height: "140px", background: `url(${project.thumbnail}) center/cover`, position: "relative" }}>
                <div style={{ position: "absolute", top: "8px", right: "8px", background: statusCfg.bg, color: statusCfg.color, fontSize: "10px", fontWeight: 500, borderRadius: "6px", padding: "3px 8px", backdropFilter: "blur(8px)" }}>
                  {project.status}
                </div>
                <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.6)", color: "white", fontSize: "9px", fontFamily: "ui-monospace, monospace", borderRadius: "4px", padding: "3px 7px", backdropFilter: "blur(8px)" }}>
                  {project.number}
                </div>
              </div>
              <div style={{ padding: "12px" }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" }}>
                  {project.name}
                </div>
                <div style={{ fontSize: "12px", color: "#8E8E93", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "8px" }}>
                  {project.client}
                </div>
                {((project.teamSize ?? 0) > 0 || (project.completion ?? 0) > 0) && (
                  <div style={{ fontSize: "11px", color: "#9C8573", marginBottom: "4px" }}>
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

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => router.push(NAV_ROUTES.projects)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#D4A96A", padding: 0, fontWeight: 500 }}
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