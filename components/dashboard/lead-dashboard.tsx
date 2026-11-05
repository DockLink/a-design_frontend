"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useLedProjects } from "@/hooks/use-led-projects";
import { useMemberProjects } from "@/hooks/use-member-projects";
import { useMyAssignedTasks } from "@/hooks/use-my-assigned-tasks";
import { canOpenProjectDetail } from "@/lib/navigation/sidebar-role";
import {
  dsActionBtn,
  dsBody,
  dsCallout,
  dsCaption,
  dsCard,
  dsFootnote,
  dsLargeTitle,
  dsSectionLabel,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { mapTaskToLeadRow } from "@/lib/tasks/map-tasks";
import { getUserDisplayName } from "@/lib/user/display";
import { NAV_ROUTES, projectRoute } from "@/types/navigation";
import type { LeadTaskRow } from "@/types/tasks";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  "In Progress": { bg: "rgba(212,169,106,0.12)", color: "#C9894A" },
  Review: { bg: "rgba(52,199,89,0.12)", color: "#248A3D" },
  Planning: { bg: "rgba(0,122,255,0.10)", color: "#0071E3" },
  Completed: { bg: "rgba(52,199,89,0.12)", color: "#248A3D" },
};

export function LeadDashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { ledProjects, isLoading, error } = useLedProjects();

  // Personal tasks are scoped to all active memberships (any role), not PRU-only.
  // Assignment guarantees membership, not project-lead status.
  const {
    memberProjects,
    projectIds: memberProjectIds,
    isLoading: memberProjectsLoading,
  } = useMemberProjects({ page: 1, limit: 100, status: "ACTIVE" });

  const {
    tasks: apiTasks,
    isLoading: tasksLoading,
    error: tasksError,
  } = useMyAssignedTasks({
    projectIds: memberProjectIds,
    userId: user?.id,
    limit: 10,
  });

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set());

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    memberProjects.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [memberProjects]);

  const TASKS = useMemo<LeadTaskRow[]>(
    () =>
      apiTasks.map((task) =>
        mapTaskToLeadRow(task, projectNameById.get(task.projectId) ?? "Project")
      ),
    [apiTasks, projectNameById]
  );

  const tasksPanelLoading = memberProjectsLoading || tasksLoading;

  const greeting = getGreeting();
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const displayName = user ? getUserDisplayName(user) : "there";

  function toggleDone(id: string) {
    setDoneTasks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openProject(projectId: string, isAssigned: boolean) {
    if (canOpenProjectDetail("lead", isAssigned)) {
      router.push(`${projectRoute(projectId)}${isAssigned ? "?assigned=1" : ""}`);
    }
  }

  return (
    <div>
      <div style={dsLargeTitle}>
        {greeting}, {displayName.split(" ")[0]}.
      </div>
      <div style={{ ...dsSubtitle, marginTop: "6px" }}>{dateStr}</div>

      <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => router.push(NAV_ROUTES.myTasks)}
          style={{
            ...dsActionBtn,
            background: "var(--ds-accent)", color: "white",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--ds-accent)")}
        >
          View my tasks
        </button>
        <button
          onClick={() => router.push(NAV_ROUTES.accessRequests)}
          style={{
            ...dsActionBtn,
            background: "var(--ds-accent-muted)", color: "var(--ds-accent-hover)",
          }}
        >
          Access requests
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 320px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* LEFT — tasks */}
        <div>
          <div style={dsSectionLabel}>Your tasks</div>
          {tasksPanelLoading && <div style={dsCallout}>Loading tasks…</div>}
          {tasksError && (
            <div style={{ ...dsCallout, color: "var(--ds-destructive)" }}>{tasksError}</div>
          )}
          <div style={dsCard}>
            {TASKS.length === 0 && !tasksPanelLoading && !tasksError && (
              <div style={{ padding: "18px", ...dsCallout }}>No tasks assigned to you yet.</div>
            )}
            {TASKS.map((task, i) => {
              const done = doneTasks.has(task.id);
              return (
                <div
                  key={task.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "0 18px", height: "56px",
                    borderBottom: i < TASKS.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                  }}
                >
                  <button
                    onClick={() => toggleDone(task.id)}
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: `1.5px solid ${done ? "var(--ds-accent)" : "rgba(60,60,67,0.25)"}`,
                      background: done ? "var(--ds-accent)" : "transparent",
                      cursor: "pointer", flexShrink: 0, padding: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {done && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      ...dsBody, fontWeight: 500,
                      color: done ? "#C7C7CC" : "var(--ds-label)",
                      textDecoration: done ? "line-through" : "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {task.title}
                    </div>
                    <div style={{ ...dsCaption, marginTop: "2px" }}>{task.project}</div>
                  </div>
                  <span style={{ ...dsCaption, color: done ? "#C7C7CC" : task.dueColor, flexShrink: 0, fontWeight: 500 }}>
                    {task.due}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "12px", padding: "0 2px" }}>
            <button
              onClick={() => router.push(NAV_ROUTES.myTasks)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "var(--ds-text-callout)", color: "var(--ds-accent)", padding: 0, fontWeight: 500 }}
            >
              View all tasks →
            </button>
          </div>
        </div>

        {/* RIGHT — projects */}
        <div>
          <div style={dsSectionLabel}>Projects you lead</div>
          {isLoading && <div style={dsFootnote}>Loading…</div>}
          {error && (
            <div style={{ ...dsFootnote, color: "var(--ds-destructive)", marginBottom: "8px" }}>
              {error}
            </div>
          )}
          <div style={dsCard}>
            {ledProjects.length === 0 && !isLoading && !error && (
              <div style={{ padding: "16px", ...dsFootnote }}>
                No assigned lead projects yet.
              </div>
            )}
            {ledProjects.map((project, i) => {
              const cfg = STATUS_CONFIG[project.status] ?? { bg: "rgba(60,60,67,0.08)", color: "#6C6C70" };
              return (
                <button
                  key={project.id}
                  onClick={() => openProject(project.id, project.isAssigned)}
                  onMouseEnter={() => setHoveredProject(project.id)}
                  onMouseLeave={() => setHoveredProject(null)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", minHeight: "56px",
                    padding: "12px 16px", gap: "12px",
                    background: hoveredProject === project.id ? "rgba(60,60,67,0.04)" : "transparent",
                    border: "none",
                    borderBottom: i < ledProjects.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                    cursor: project.isAssigned ? "pointer" : "default",
                    textAlign: "left", transition: "background 0.12s",
                    opacity: project.isAssigned ? 1 : 0.85,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...dsFootnote, fontWeight: 500, color: "var(--ds-label)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {project.name}
                    </div>
                    <div style={{ marginTop: "6px", height: "4px", borderRadius: "9999px", background: "#F2EDE8", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${project.progress}%`, background: "var(--ds-accent)", borderRadius: "9999px" }} />
                    </div>
                  </div>
                  <span style={{ background: cfg.bg, color: cfg.color, fontSize: "var(--ds-text-caption-2)", fontWeight: 500, borderRadius: "8px", padding: "4px 8px", flexShrink: 0 }}>
                    {project.status}
                  </span>
                  {project.isAssigned && <ChevronRight size={14} color="#C7C7CC" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}