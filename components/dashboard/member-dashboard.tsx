"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useMemberProjects } from "@/hooks/use-member-projects";
import { useTasks } from "@/hooks/use-tasks";
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
import { mapTaskToMemberRow } from "@/lib/tasks/map-tasks";
import { getUserDisplayName } from "@/lib/user/display";
import { NAV_ROUTES, projectRoute } from "@/types/navigation";
import type { MemberProjectView } from "@/types/projects";
import type { MemberTaskRow, TaskUrgency } from "@/types/tasks";

export interface MemberDashboardProps {
  /** Max tasks shown on the dashboard. */
  tasksLimit?: number;
  /** Max projects shown on the dashboard. */
  projectsLimit?: number;
  /** Override task list navigation. */
  onNavigateToTasks?: () => void;
  /** Override project list navigation. */
  onNavigateToProjects?: () => void;
  /** Override opening a single project. */
  onOpenProject?: (project: MemberProjectView) => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const URGENCY_COLOR: Record<TaskUrgency, string> = {
  overdue: "#FF3B30",
  today: "#FF9F0A",
  soon: "#8E8E93",
};

export function MemberDashboard({
  tasksLimit = 10,
  projectsLimit = 100,
  onNavigateToTasks,
  onNavigateToProjects,
  onOpenProject,
}: MemberDashboardProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { memberProjects, projectIds, isLoading: projectsLoading, error: projectsError } =
    useMemberProjects({ page: 1, limit: projectsLimit, status: "ACTIVE" });

  // NOTE: do NOT filter by status here. Tasks use workflow statuses
  // (TODO / IN_PROGRESS / COMPLETED / …), never the literal "ACTIVE", so a
  // status filter would silently hide every task.
  const { tasks: apiTasks, isLoading: tasksLoading, error: tasksError } = useTasks({
    page: 1,
    limit: tasksLimit,
    taskable_type: "TASK",
    depth: 1,
    projects: projectIds.length ? projectIds : undefined,
  });

  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set());

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    memberProjects.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [memberProjects]);

  const tasks = useMemo<MemberTaskRow[]>(
    () =>
      apiTasks.map((task) =>
        mapTaskToMemberRow(task, projectNameById.get(task.projectId) ?? "Project")
      ),
    [apiTasks, projectNameById]
  );

  const greeting = getGreeting();
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const displayName = user ? getUserDisplayName(user) : "there";

  const overdueCount = tasks.filter(
    (t) => t.urgency === "overdue" && !doneTasks.has(t.id)
  ).length;

  function toggleDone(id: string) {
    setDoneTasks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function goToTasks() {
    if (onNavigateToTasks) onNavigateToTasks();
    else router.push(NAV_ROUTES.myTasks);
  }

  function goToProjects() {
    if (onNavigateToProjects) onNavigateToProjects();
    else router.push(NAV_ROUTES.projects);
  }

  function openProject(project: MemberProjectView) {
    if (onOpenProject) {
      onOpenProject(project);
      return;
    }
    if (canOpenProjectDetail("member", project.isAssigned)) {
      router.push(`${projectRoute(project.id)}${project.isAssigned ? "?assigned=1" : ""}`);
    }
  }

  return (
    <div>
      <div style={dsLargeTitle}>
        {greeting}, {displayName.split(" ")[0]}.
      </div>
      <div style={{ ...dsSubtitle, marginTop: "6px" }}>{dateStr}</div>

      {overdueCount > 0 && (
        <div
          style={{
            marginTop: "20px",
            background: "rgba(255,59,48,0.08)",
            borderRadius: "var(--ds-radius-control)",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "var(--ds-text-callout)", color: "#FF3B30", fontWeight: 500 }}>
            {overdueCount} overdue {overdueCount === 1 ? "task" : "tasks"} need your attention
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={goToTasks}
          style={{
            ...dsActionBtn,
            background: "#D4A96A",
            color: "white",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#D4A96A")}
        >
          View all tasks
        </button>
        <button
          onClick={goToProjects}
          style={{
            ...dsActionBtn,
            background: "rgba(212,169,106,0.12)",
            color: "#C9894A",
          }}
        >
          Browse projects
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 300px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div>
          <div style={dsSectionLabel}>My tasks</div>
          {tasksLoading && (
            <div style={dsCallout}>Loading tasks…</div>
          )}
          {tasksError && (
            <div style={{ ...dsCallout, color: "#FF3B30" }}>{tasksError}</div>
          )}
          <div style={dsCard}>
            {tasks.length === 0 && !tasksLoading && (
              <div style={{ padding: "18px", ...dsCallout }}>
                No tasks assigned yet.
              </div>
            )}
            {tasks.map((task, i) => {
              const done = doneTasks.has(task.id);
              return (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "0 18px",
                    height: "56px",
                    borderBottom:
                      i < tasks.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                    background:
                      !done && task.urgency === "overdue"
                        ? "rgba(255,59,48,0.025)"
                        : "transparent",
                  }}
                >
                  <button
                    onClick={() => toggleDone(task.id)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `1.5px solid ${done ? "#D4A96A" : "rgba(60,60,67,0.25)"}`,
                      background: done ? "#D4A96A" : "transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {done && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        ...dsBody,
                        fontWeight: 500,
                        color: done ? "#C7C7CC" : "var(--ds-label)",
                        textDecoration: done ? "line-through" : "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {task.title}
                    </div>
                    <div style={{ ...dsCaption, marginTop: "2px" }}>
                      {task.project}
                    </div>
                  </div>

                  <span
                    style={{
                      ...dsCaption,
                      flexShrink: 0,
                      color: done ? "#C7C7CC" : URGENCY_COLOR[task.urgency],
                      fontWeight: task.urgency !== "soon" ? 500 : 400,
                    }}
                  >
                    {task.due}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={dsSectionLabel}>My projects</div>
          {projectsLoading && (
            <div style={dsFootnote}>Loading projects…</div>
          )}
          {projectsError && (
            <div style={{ ...dsFootnote, color: "#FF3B30" }}>{projectsError}</div>
          )}
          <div style={dsCard}>
            {memberProjects.length === 0 && !projectsLoading && (
              <div style={{ padding: "16px", ...dsFootnote }}>
                No assigned projects yet.
              </div>
            )}
            {memberProjects.map((project, i) => (
              <button
                key={project.id}
                onClick={() => openProject(project)}
                disabled={!project.isAssigned}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
                  background: "transparent",
                  border: "none",
                  borderBottom:
                    i < memberProjects.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                  cursor: project.isAssigned ? "pointer" : "default",
                  textAlign: "left",
                  transition: "background 0.12s",
                  opacity: project.isAssigned ? 1 : 0.85,
                }}
                onMouseEnter={(e) => {
                  if (project.isAssigned) {
                    e.currentTarget.style.background = "rgba(60,60,67,0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: project.progress != null ? "7px" : 0,
                    }}
                  >
                    <span style={{ ...dsFootnote, fontWeight: 500, color: "var(--ds-label)" }}>
                      {project.name}
                    </span>
                    {project.progress != null && (
                      <span style={dsCaption}>
                        {project.progress}%
                      </span>
                    )}
                  </div>
                  {project.progress != null && (
                    <div
                      style={{
                        height: "4px",
                        borderRadius: "9999px",
                        background: "#F2EDE8",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${project.progress}%`,
                          background: "#D4A96A",
                          borderRadius: "9999px",
                        }}
                      />
                    </div>
                  )}
                </div>
                {project.isAssigned && (
                  <ChevronRight size={14} color="#C7C7CC" style={{ flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>

          <div style={{ marginTop: "14px", padding: "0 2px" }}>
            <button
              onClick={goToProjects}
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
              Discover more projects →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
