"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CreateProjectSheet } from "@/components/projects/create-project-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import {
  dsActionBtn,
  dsCallout,
  dsCard,
  dsFootnote,
  dsHeadline,
  dsLargeTitle,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { projectRoute } from "@/types/navigation";
import type { ProjectCardView } from "@/types/projects";

export default function ProjectsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { projects, isLoading, error, refetch, deleteProject, isDeleting } = useProjects({ page: 1, limit: 100, status: "ACTIVE" });
  const sidebarRole = toSidebarRole(user?.roles ? getPrimaryRole(user.roles) : null);
  const canCreateProject = sidebarRole === "admin" || sidebarRole === "superadmin";
  const isSuperAdmin = sidebarRole === "superadmin";

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCardView | null>(null);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  async function handleDeleteProject() {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" permanently deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  const cards = projects;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={dsLargeTitle}>Projects</div>
          <div style={{ ...dsSubtitle, marginTop: "8px" }}>
            {canCreateProject
              ? "All organisation projects"
              : "Browse projects — open assigned projects from your dashboard"}
          </div>
        </div>
        {canCreateProject && (
          <button
            type="button"
            onClick={() => setShowCreateProject(true)}
            style={{ ...dsActionBtn, background: "#D4A96A", color: "white", marginTop: "4px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D4A96A")}
          >
            + New project
          </button>
        )}
      </div>

      <div style={{ marginBottom: "24px" }} />

      {error && (
        <div style={{ padding: "14px", background: "#FEE2E2", color: "#9B1C1C", borderRadius: "var(--ds-radius-control)", marginBottom: "18px", fontSize: "var(--ds-text-callout)" }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={dsCallout}>Loading projects…</div>
      ) : cards.length === 0 ? (
        <div style={dsCallout}>
          No projects found.
          {canCreateProject && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setShowCreateProject(true)}
                style={{ background: "none", border: "none", padding: 0, color: "#D4A96A", cursor: "pointer", fontWeight: 500 }}
              >
                Create your first project
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {cards.map((p) => {
            const isHovered = hoveredProject === p.id;
            return (
              <div
                key={p.id}
                style={{ ...dsCard, position: "relative", overflow: "hidden" }}
                onMouseEnter={() => setHoveredProject(p.id)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                <div
                  role="button"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(projectRoute(p.id))}
                  onKeyDown={(e) => e.key === "Enter" && router.push(projectRoute(p.id))}
                >
                  <div
                    style={{
                      height: "160px",
                      backgroundImage: `url(${p.thumbnail})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div style={{ padding: "18px" }}>
                    <div style={dsHeadline}>{p.name}</div>
                    <div style={{ ...dsFootnote, marginTop: "6px" }}>{p.client}</div>
                    {p.currentStage && (
                      <div
                        style={{
                          marginTop: "10px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "rgba(212,169,106,0.14)",
                          color: "#C9894A",
                          borderRadius: "9999px",
                          padding: "3px 10px",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        <span style={{ width: "6px", height: "6px", borderRadius: "9999px", background: "#D4A96A" }} />
                        {p.currentStage}
                      </div>
                    )}
                  </div>
                </div>

                {isSuperAdmin && isHovered && (
                  <button
                    type="button"
                    title="Delete project permanently"
                    disabled={isDeleting}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(p);
                    }}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      border: "none",
                      background: "rgba(255,59,48,0.85)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: isDeleting ? "not-allowed" : "pointer",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    }}
                  >
                    <Trash2 size={15} color="white" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <>
          <div
            onClick={() => setDeleteTarget(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }}
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
              zIndex: 201,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#FF3B30", marginBottom: "8px" }}>
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
        onCreated={(id) => {
          void refetch();
          router.push(projectRoute(id));
        }}
      />
    </div>
  );
}
