"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useMemberProjects } from "@/hooks/use-member-projects";
import {
  dsCallout,
  dsLargeTitle,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { getUserDisplayName } from "@/lib/user/display";
import { NAV_ROUTES, projectRoute } from "@/types/navigation";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function GuestDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { memberProjects, isLoading, error } = useMemberProjects({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });

  const displayName = user ? getUserDisplayName(user) : "there";

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <div style={dsLargeTitle}>{getGreeting()}, {displayName}</div>
        <div style={{ ...dsSubtitle, marginTop: "8px" }}>
          View-only access to projects assigned to you
        </div>
      </div>

      {error && (
        <div style={{ ...dsCallout, color: "var(--ds-destructive)", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: "12px", fontSize: "15px", fontWeight: 600, color: "var(--ds-label)" }}>
        Your projects ({memberProjects.length})
      </div>

      {isLoading ? (
        <div style={dsCallout}>Loading projects…</div>
      ) : memberProjects.length === 0 ? (
        <div style={dsCallout}>
          No projects assigned yet. Ask an administrator to add you from a project&apos;s overview page.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {memberProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => router.push(projectRoute(project.id))}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                width: "100%",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid var(--ds-separator)",
                background: "var(--ds-surface-elevated)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--ds-label)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {project.name}
                </div>
              </div>
              <ChevronRight size={16} color="var(--ds-tertiary-label)" />
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => router.push(NAV_ROUTES.projects)}
        style={{
          marginTop: "20px",
          background: "none",
          border: "none",
          padding: 0,
          color: "var(--ds-accent)",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        View all projects →
      </button>
    </div>
  );
}
