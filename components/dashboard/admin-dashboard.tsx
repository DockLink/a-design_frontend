"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Inbox,
  Plus,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

import { CreateProjectSheet } from "@/components/projects/create-project-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useAccessRequests } from "@/hooks/use-access-requests";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useProjects } from "@/hooks/use-projects";
import { dsCallout, dsLargeTitle, dsSubtitle } from "@/lib/styles/dashboard-tokens";
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
  const { meta: accessMeta } = useAccessRequests({ page: 1, limit: 1, status: "PENDING" });

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const displayName = user ? getUserDisplayName(user) : "there";
  const greeting = getGreeting();
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const pendingRequests = accessMeta?.total ?? 0;

  const avgCompletion = useMemo(() => {
    const withProgress = activeProjects.filter((p) => (p.completion ?? 0) >= 0);
    if (withProgress.length === 0) return 0;
    const sum = withProgress.reduce((acc, p) => acc + (p.completion ?? 0), 0);
    return Math.round(sum / withProgress.length);
  }, [activeProjects]);

  const totalTeam = useMemo(
    () => projects.reduce((acc, p) => acc + (p.teamSize ?? 0), 0),
    [projects]
  );

  const STATS = [
    {
      label: "Total projects",
      value: String(meta?.total ?? projects.length),
      subtext: `${activeProjects.length} active`,
      icon: FolderOpen,
      color: "#D4A96A",
    },
    {
      label: "Avg. completion",
      value: `${avgCompletion}%`,
      subtext: "Across active projects",
      icon: TrendingUp,
      color: "#2D8B5E",
    },
    {
      label: "Pending requests",
      value: String(pendingRequests),
      subtext: pendingRequests > 0 ? "Need review" : "All clear",
      icon: Inbox,
      color: "#FF9F0A",
      onClick: () => router.push(NAV_ROUTES.accessRequests),
    },
    {
      label: "Team assignments",
      value: String(totalTeam),
      subtext: "Across all projects",
      icon: Users,
      color: "#5B6CFF",
    },
  ];

  function openProject(project: ProjectCardView) {
    router.push(projectRoute(project.id));
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={dsLargeTitle}>
            {greeting}, {displayName.split(" ")[0]}.
          </div>
          <div style={{ ...dsSubtitle, marginTop: "6px" }}>{dateStr}</div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={() => router.push(NAV_ROUTES.userManagement)}
            style={secondaryBtn}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F2EDE6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            <Settings size={15} />
            Manage users
          </button>
          <button
            onClick={() => router.push(NAV_ROUTES.accessRequests)}
            style={secondaryBtn}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F2EDE6")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
          >
            <Inbox size={15} />
            Access requests
            {pendingRequests > 0 && (
              <span
                style={{
                  marginLeft: "2px",
                  minWidth: "18px",
                  height: "18px",
                  padding: "0 5px",
                  borderRadius: "9999px",
                  background: "#FF3B30",
                  color: "white",
                  fontSize: "11px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {pendingRequests}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowCreateProject(true)}
            style={primaryBtn}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D4A96A")}
          >
            <Plus size={16} />
            New project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(190px, 1fr))",
          gap: "14px",
          marginTop: "24px",
        }}
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            role={stat.onClick ? "button" : undefined}
            tabIndex={stat.onClick ? 0 : undefined}
            onClick={stat.onClick}
            onKeyDown={(e) => stat.onClick && e.key === "Enter" && stat.onClick()}
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              border: "0.5px solid rgba(90,60,30,0.12)",
              boxShadow: "0 1px 3px rgba(60,40,20,0.06)",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              cursor: stat.onClick ? "pointer" : "default",
              transition: "box-shadow 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              if (stat.onClick) {
                e.currentTarget.style.boxShadow = "0 8px 22px rgba(60,40,20,0.10)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(60,40,20,0.06)";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "11px",
                  background: `${stat.color}1A`,
                  color: stat.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <stat.icon size={18} />
              </span>
              {stat.onClick && <ArrowRight size={15} color="#C7C7CC" />}
            </div>
            <div style={{ fontSize: "28px", fontWeight: 600, color: "#1A1410", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
              {stat.value}
            </div>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "#1A1410" }}>{stat.label}</div>
              <div style={{ fontSize: "12px", color: "#9C8573", marginTop: "1px" }}>{stat.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active projects */}
      <SectionHeader
        title="Active projects"
        action={{ label: "View all", onClick: () => router.push(NAV_ROUTES.projects) }}
      />
      {isLoading && <div style={dsCallout}>Loading projects…</div>}
      {error && <div style={{ ...dsCallout, color: "#FF3B30" }}>{error}</div>}
      {!isLoading && !error && activeProjects.length === 0 && (
        <EmptyState
          message="No active projects yet"
          actionLabel="Create your first project"
          onAction={() => setShowCreateProject(true)}
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {activeProjects.slice(0, 4).map((project) => {
          const isHovered = hoveredProject === project.id;
          const showProgress = (project.completion ?? 0) > 0;
          return (
            <button
              key={project.id}
              onClick={() => openProject(project)}
              onMouseEnter={() => setHoveredProject(project.id)}
              onMouseLeave={() => setHoveredProject(null)}
              style={{
                display: "flex",
                padding: 0,
                background: "#FFFFFF",
                borderRadius: "16px",
                border: `1px solid ${isHovered ? "#D4A96A" : "rgba(90,60,30,0.12)"}`,
                boxShadow: isHovered ? "0 10px 26px rgba(60,40,20,0.12)" : "0 1px 3px rgba(60,40,20,0.06)",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "120px",
                  alignSelf: "stretch",
                  minHeight: "104px",
                  background: `url(${project.thumbnail}) center/cover`,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#1A1410", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {project.name}
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#9C8573", marginTop: "2px" }}>
                      {project.client}
                    </div>
                  </div>
                  {project.currentStage && (
                    <span
                      style={{
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        background: "rgba(212,169,106,0.14)",
                        color: "#C9894A",
                        borderRadius: "9999px",
                        padding: "3px 10px",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ width: "5px", height: "5px", borderRadius: "9999px", background: "#D4A96A" }} />
                      {project.currentStage}
                    </span>
                  )}
                </div>
                {showProgress && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "11.5px", color: "#9C8573" }}>
                        {project.lead ? `Lead · ${project.lead}` : "Progress"}
                      </span>
                      <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#6B5744" }}>
                        {project.completion}%
                      </span>
                    </div>
                    <div style={{ height: "5px", borderRadius: "9999px", background: "#F2EDE8", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${project.completion}%`, background: "#D4A96A", borderRadius: "9999px" }} />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* All projects */}
      <SectionHeader title="All projects" />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "16px",
        }}
      >
        {projects.map((project) => {
          const isHovered = hoveredProject === `grid-${project.id}`;
          const statusCfg = STATUS_CONFIG[project.status] ?? { bg: "#F5EFE6", color: "#6B5744" };
          return (
            <button
              key={project.id}
              onClick={() => openProject(project)}
              onMouseEnter={() => setHoveredProject(`grid-${project.id}`)}
              onMouseLeave={() => setHoveredProject(null)}
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: `1px solid ${isHovered ? "#D4A96A" : "rgba(90,60,30,0.12)"}`,
                boxShadow: isHovered ? "0 10px 26px rgba(60,40,20,0.12)" : "0 1px 3px rgba(60,40,20,0.06)",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
                padding: 0,
                overflow: "hidden",
              }}
            >
              <div style={{ width: "100%", height: "150px", background: `url(${project.thumbnail}) center/cover`, position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: statusCfg.bg,
                    color: statusCfg.color,
                    fontSize: "11px",
                    fontWeight: 600,
                    borderRadius: "8px",
                    padding: "4px 10px",
                  }}
                >
                  {project.status}
                </div>
              </div>
              <div style={{ padding: "15px 16px" }}>
                <div style={{ fontSize: "14.5px", fontWeight: 600, color: "#1A1410", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" }}>
                  {project.name}
                </div>
                <div style={{ fontSize: "12.5px", color: "#9C8573", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "12px" }}>
                  {project.client}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ fontSize: "11.5px", color: "#9C8573", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    {(project.teamSize ?? 0) > 0 && (
                      <>
                        <Users size={12} color="#C4B5A5" />
                        {project.teamSize}
                      </>
                    )}
                  </span>
                  {(project.completion ?? 0) > 0 && (
                    <span style={{ fontSize: "11.5px", fontWeight: 500, color: "#6B5744", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CheckCircle2 size={12} color="#2D8B5E" />
                      {project.completion}%
                    </span>
                  )}
                </div>
                {(project.currentPhase ?? 0) > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "3px", marginTop: "12px" }}>
                    {Array.from({ length: 6 }).map((_, i) => {
                      const phase = project.currentPhase ?? 0;
                      const done = i < phase;
                      const active = i === phase;
                      return (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: "3px",
                            borderRadius: "9999px",
                            background: done ? "#D4A96A" : active ? "#F5E6D0" : "#F2EDE8",
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <CreateProjectSheet
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreated={(id) => router.push(projectRoute(id))}
      />
    </div>
  );
}

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "32px",
        marginBottom: "14px",
        padding: "0 2px",
      }}
    >
      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#1A1410", margin: 0, letterSpacing: "-0.01em" }}>
        {title}
      </h2>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            color: "#D4A96A",
            padding: 0,
          }}
        >
          {action.label}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function EmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div
      style={{
        border: "1px dashed rgba(90,60,30,0.20)",
        background: "rgba(245,239,230,0.4)",
        borderRadius: "16px",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <FolderOpen size={26} color="#C4B5A5" style={{ margin: "0 auto 10px" }} />
      <div style={{ fontSize: "14px", fontWeight: 500, color: "#6B5744" }}>{message}</div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#D4A96A",
            fontWeight: 500,
            fontSize: "13px",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  height: "40px",
  padding: "0 18px",
  borderRadius: "10px",
  fontSize: "13.5px",
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
  background: "#D4A96A",
  color: "white",
  whiteSpace: "nowrap",
  transition: "background 0.15s",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  height: "40px",
  padding: "0 16px",
  borderRadius: "10px",
  fontSize: "13.5px",
  fontWeight: 500,
  cursor: "pointer",
  border: "1px solid rgba(90,60,30,0.16)",
  background: "#FFFFFF",
  color: "#6B5744",
  whiteSpace: "nowrap",
  transition: "background 0.15s",
};
