"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { useProjects } from "@/hooks/use-projects";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import { projectRoute } from "@/types/navigation";

const card: CSSProperties = {
  background: "#FFFFFF",
  borderRadius: "14px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
  overflow: "hidden",
  cursor: "pointer",
};

export default function ProjectsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { projects, isLoading, error } = useProjects({ page: 1, limit: 100, status: "ACTIVE" });
  const sidebarRole = toSidebarRole(user?.roles ? getPrimaryRole(user.roles) : null);

  const cards = projects;

  return (
    <div>
      <div style={{ fontSize: "28px", fontWeight: 600, color: "#1C1C1E", marginBottom: "8px" }}>
        Projects
      </div>
      <div style={{ fontSize: "14px", color: "#8E8E93", marginBottom: "20px" }}>
        {sidebarRole === "admin"
          ? "All organisation projects"
          : "Browse projects — open assigned projects from your dashboard"}
      </div>

      {error && (
        <div style={{ padding: "12px", background: "#FEE2E2", color: "#9B1C1C", borderRadius: "8px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{ color: "#8E8E93", fontSize: "14px" }}>Loading projects…</div>
      ) : cards.length === 0 ? (
        <div style={{ color: "#8E8E93", fontSize: "14px" }}>No projects found.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {cards.map((p) => (
            <div
              key={p.id}
              style={card}
              onClick={() => router.push(projectRoute(p.id))}
            >
              <div
                style={{
                  height: "120px",
                  backgroundImage: `url(${p.thumbnail})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div style={{ padding: "14px" }}>
                <div style={{ fontSize: "15px", fontWeight: 600, color: "#1C1C1E" }}>{p.name}</div>
                <div style={{ fontSize: "13px", color: "#8E8E93", marginTop: "4px" }}>{p.client}</div>
                <div style={{ fontSize: "12px", color: "#9C8573", marginTop: "6px" }}>{p.number}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
