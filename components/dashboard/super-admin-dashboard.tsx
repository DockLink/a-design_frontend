"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { CreateProjectSheet } from "@/components/projects/create-project-sheet";
import { CreateUserSheet } from "@/components/user-management/create-user-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useProjects } from "@/hooks/use-projects";
import { useUsers } from "@/hooks/use-users";
import {
  dsActionBtn,
  dsCallout,
  dsCaption,
  dsCaption2,
  dsCard,
  dsFootnote,
  dsHeadline,
  dsLargeTitle,
  dsSectionLabel,
  dsStatValue,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { getUserDisplayName } from "@/lib/user/display";
import { NAV_ROUTES, projectRoute } from "@/types/navigation";
import type { ProjectCardView } from "@/types/projects";
import type { UserRole } from "@/types/users";

const SUPER_ADMIN_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "MEMBER", label: "Member" },
];

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

export function SuperAdminDashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const {
    projects,
    activeProjects,
    meta,
    isLoading,
    error,
    refetch,
    deleteProject,
    isDeleting,
  } = useProjects({ page: 1, limit: 100 });

  const { meta: usersMeta, createUser, isMutating: isCreatingUser } = useUsers({
    page: 1,
    limit: 1,
  });

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCardView | null>(null);

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
    {
      label: "System Users",
      value: String(usersMeta?.total ?? "—"),
      subtext: "All organisation accounts",
      icon: Users,
      color: "#5B21B6",
    },
    {
      label: "Access Level",
      value: "Full",
      subtext: "Super administrator",
      icon: Shield,
      color: "#2D6A4F",
    },
  ];

  function openProject(project: ProjectCardView) {
    router.push(projectRoute(project.id));
  }

  async function handleDeleteProject() {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" has been permanently deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ ...dsLargeTitle, display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield size={28} color="#D4A96A" />
            {greeting}, {displayName.split(" ")[0]}.
          </div>
          <div style={{ ...dsSubtitle, marginTop: "6px" }}>{dateStr}</div>
          <div style={{ ...dsCaption, marginTop: "4px", color: "#9C8573" }}>
            Super Admin · Full system access
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => setShowCreateProject(true)}
          style={{ ...dsActionBtn, background: "#D4A96A", color: "white" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#D4A96A")}
        >
          + New project
        </button>
        <button
          onClick={() => setShowCreateAdmin(true)}
          style={{ ...dsActionBtn, background: "rgba(91,33,182,0.12)", color: "#5B21B6" }}
        >
          <UserPlus size={16} />
          Create admin
        </button>
        <button
          onClick={() => router.push(NAV_ROUTES.userManagement)}
          style={{ ...dsActionBtn, background: "rgba(212,169,106,0.12)", color: "#C9894A" }}
        >
          <Users size={16} />
          Manage users
        </button>
        <button
          onClick={() => router.push(NAV_ROUTES.accessRequests)}
          style={{ ...dsActionBtn, background: "rgba(255,59,48,0.10)", color: "#FF3B30" }}
        >
          Access requests
        </button>
      </div>

      <div style={dsSectionLabel}>System Overview</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px",
        }}
      >
        {STATS.map((stat) => (
          <div
            key={stat.label}
            style={{ ...dsCard, padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: `${stat.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <stat.icon size={18} color={stat.color} />
            </div>
            <div style={dsStatValue}>{stat.value}</div>
            <div style={dsCaption}>{stat.label}</div>
            <div style={dsCaption2}>{stat.subtext}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "8px" }}>
        <div style={dsSectionLabel}>All Projects</div>
        {isLoading && <div style={dsCallout}>Loading projects…</div>}
        {error && <div style={{ ...dsCallout, color: "#FF3B30" }}>{error}</div>}
        {!isLoading && !error && projects.length === 0 && (
          <div style={dsCallout}>No projects in the system.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {projects.map((project) => {
            const isHovered = hoveredProject === project.id;
            const statusCfg = STATUS_CONFIG[project.status] ?? { bg: "#F5EFE6", color: "#6B5744" };

            return (
              <div
                key={project.id}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
                style={{
                  ...dsCard,
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  gap: "14px",
                  border: `1px solid ${isHovered ? "#D4A96A" : "var(--ds-separator)"}`,
                  transition: "all 0.15s",
                }}
              >
                <button
                  type="button"
                  onClick={() => openProject(project)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 0,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "10px",
                      background: `url(${project.thumbnail}) center/cover`,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...dsHeadline, marginBottom: "2px" }}>{project.name}</div>
                    <div style={dsFootnote}>{project.client}</div>
                  </div>
                  <span
                    style={{
                      background: statusCfg.bg,
                      color: statusCfg.color,
                      fontSize: "var(--ds-text-caption-2)",
                      fontWeight: 500,
                      borderRadius: "8px",
                      padding: "4px 10px",
                      flexShrink: 0,
                    }}
                  >
                    {project.status}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(project)}
                  disabled={isDeleting}
                  title="Delete project permanently"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,59,48,0.25)",
                    background: isHovered ? "rgba(255,59,48,0.08)" : "transparent",
                    cursor: isDeleting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: isDeleting ? 0.5 : 1,
                    transition: "background 0.12s",
                  }}
                >
                  <Trash2 size={16} color="#FF3B30" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: "28px", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => void refetch()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "var(--ds-text-callout)",
            color: "#D4A96A",
            padding: 0,
            fontWeight: 500,
          }}
        >
          Refresh projects →
        </button>
      </div>

      {deleteTarget && (
        <>
          <div
            onClick={() => setDeleteTarget(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 40 }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#FDFAF6",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "420px",
              width: "90%",
              zIndex: 41,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ ...dsHeadline, marginBottom: "8px", color: "#FF3B30" }}>
              Delete project permanently?
            </div>
            <p style={{ fontSize: "14px", color: "#6B5744", margin: "0 0 20px", lineHeight: 1.5 }}>
              <strong style={{ color: "#1A1410" }}>{deleteTarget.name}</strong> and all its files,
              tasks, members, and timeline data will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => void handleDeleteProject()}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  height: "40px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#FF3B30",
                  color: "white",
                  fontWeight: 500,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? "Deleting…" : "Delete permanently"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  height: "40px",
                  borderRadius: "10px",
                  border: "1px solid rgba(90,60,30,0.15)",
                  background: "white",
                  color: "#6B5744",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      <CreateProjectSheet
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreated={(id) => router.push(projectRoute(id))}
      />

      <CreateUserSheet
        open={showCreateAdmin}
        onClose={() => setShowCreateAdmin(false)}
        onSubmit={async (payload) => {
          await createUser(payload);
        }}
        isSubmitting={isCreatingUser}
        roleOptions={SUPER_ADMIN_ROLE_OPTIONS}
        defaultRole="ADMIN"
        title="Create admin user"
        subtitle="Super admins can create administrators and team leads."
      />
    </div>
  );
}
