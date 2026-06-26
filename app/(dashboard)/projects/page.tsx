"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CreateProjectSheet } from "@/components/projects/create-project-sheet";
import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import {
  dsActionBtn,
  dsCallout,
  dsCaption2,
  dsCard,
  dsFootnote,
  dsHeadline,
  dsLargeTitle,
  dsMono,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { projectRoute } from "@/types/navigation";

export default function ProjectsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { projects, isLoading, error, refetch } = useProjects({ page: 1, limit: 100, status: "ACTIVE" });
  const sidebarRole = toSidebarRole(user?.roles ? getPrimaryRole(user.roles) : null);
  const canCreateProject = sidebarRole === "admin";

  const [showCreateProject, setShowCreateProject] = useState(false);

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
            style={{
              ...dsActionBtn,
              background: "#D4A96A",
              color: "white",
              marginTop: "4px",
            }}
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
          {cards.map((p) => (
            <div
              key={p.id}
              style={{ ...dsCard, cursor: "pointer" }}
              onClick={() => router.push(projectRoute(p.id))}
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
                <div style={{ ...dsCaption2, ...dsMono, color: "#9C8573", marginTop: "8px" }}>{p.number}</div>
              </div>
            </div>
          ))}
        </div>
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
