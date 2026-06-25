"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useMemberProjects } from "@/hooks/use-member-projects";
import { useTasks } from "@/hooks/use-tasks";
import { canOpenProjectDetail } from "@/lib/navigation/sidebar-role";
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
  marginBottom: "8px",
  marginTop: "24px",
  padding: "0 2px",
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

  const { tasks: apiTasks, isLoading: tasksLoading, error: tasksError } = useTasks({
    page: 1,
    limit: tasksLimit,
    status: "ACTIVE",
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
      <div style={{ fontSize: "28px", fontWeight: 600, color: "#1C1C1E", letterSpacing: "-0.5px" }}>
        {greeting}, {displayName.split(" ")[0]}.
      </div>
      <div style={{ fontSize: "14px", color: "#8E8E93", marginTop: "4px" }}>{dateStr}</div>

      {overdueCount > 0 && (
        <div
          style={{
            marginTop: "16px",
            background: "rgba(255,59,48,0.08)",
            borderRadius: "10px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "14px", color: "#FF3B30", fontWeight: 500 }}>
            {overdueCount} overdue {overdueCount === 1 ? "task" : "tasks"} need your attention
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
        <button
          onClick={goToTasks}
          style={{
            height: "36px",
            padding: "0 18px",
            background: "#D4A96A",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 500,
            color: "white",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#D4A96A")}
        >
          View all tasks
        </button>
        <button
          onClick={goToProjects}
          style={{
            height: "36px",
            padding: "0 18px",
            background: "rgba(212,169,106,0.12)",
            border: "none",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#C9894A",
            cursor: "pointer",
          }}
        >
          Browse projects
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 260px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div>
          <div style={sectionLabel}>My tasks</div>
          {tasksLoading && (
            <div style={{ fontSize: "14px", color: "#8E8E93" }}>Loading tasks…</div>
          )}
          {tasksError && (
            <div style={{ fontSize: "14px", color: "#FF3B30" }}>{tasksError}</div>
          )}
          <div style={card}>
            {tasks.length === 0 && !tasksLoading && (
              <div style={{ padding: "16px", fontSize: "14px", color: "#8E8E93" }}>
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
                    padding: "0 16px",
                    height: "52px",
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
                        fontSize: "14px",
                        fontWeight: 500,
                        color: done ? "#C7C7CC" : "#1C1C1E",
                        textDecoration: done ? "line-through" : "none",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {task.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#8E8E93", marginTop: "1px" }}>
                      {task.project}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "12px",
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
          <div style={sectionLabel}>My projects</div>
          {projectsLoading && (
            <div style={{ fontSize: "13px", color: "#8E8E93" }}>Loading projects…</div>
          )}
          {projectsError && (
            <div style={{ fontSize: "13px", color: "#FF3B30" }}>{projectsError}</div>
          )}
          <div style={card}>
            {memberProjects.length === 0 && !projectsLoading && (
              <div style={{ padding: "14px", fontSize: "13px", color: "#8E8E93" }}>
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
                  padding: "14px 14px",
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
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "#1C1C1E" }}>
                      {project.name}
                    </span>
                    {project.progress != null && (
                      <span style={{ fontSize: "12px", color: "#8E8E93" }}>
                        {project.progress}%
                      </span>
                    )}
                  </div>
                  {project.progress != null && (
                    <div
                      style={{
                        height: "3px",
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
                fontSize: "14px",
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
