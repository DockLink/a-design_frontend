"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useLedProjects } from "@/hooks/use-led-projects";
import { useTasks } from "@/hooks/use-tasks";
import { canOpenProjectDetail } from "@/lib/navigation/sidebar-role";
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

export function LeadDashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { ledProjects, ledProjectIds, teamMembers, rawProjects, isLoading, error } =
    useLedProjects();

  const { tasks: apiTasks, isLoading: tasksLoading } = useTasks({
    page: 1,
    limit: 10,
    status: "ACTIVE",
    taskable_type: "TASK",
    depth: 1,
    projects: ledProjectIds.length ? ledProjectIds : undefined,
  });

  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set());

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    rawProjects.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [rawProjects]);

  const TASKS = useMemo<LeadTaskRow[]>(
    () =>
      apiTasks.map((task) =>
        mapTaskToLeadRow(task, projectNameById.get(task.projectId) ?? "Project")
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
      <div style={{ fontSize: "28px", fontWeight: 600, color: "#1C1C1E", letterSpacing: "-0.5px" }}>
        {greeting}, {displayName.split(" ")[0]}.
      </div>
      <div style={{ fontSize: "14px", color: "#8E8E93", marginTop: "4px" }}>{dateStr}</div>

      <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
        <button
          onClick={() => router.push(NAV_ROUTES.myTasks)}
          style={{
            background: "#D4A96A", color: "white", fontSize: "14px", fontWeight: 500,
            borderRadius: "10px", height: "36px", padding: "0 18px", border: "none", cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#D4A96A")}
        >
          View my tasks
        </button>
        <button
          onClick={() => router.push(NAV_ROUTES.accessRequests)}
          style={{
            background: "rgba(212,169,106,0.12)", border: "none", color: "#C9894A",
            fontSize: "14px", fontWeight: 500, borderRadius: "10px", height: "36px",
            padding: "0 18px", cursor: "pointer",
          }}
        >
          Access requests
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 280px",
          gap: "20px",
          alignItems: "start",
        }}
      >
        {/* LEFT — tasks */}
        <div>
          <div style={sectionLabel}>Your tasks</div>
          {tasksLoading && <div style={{ fontSize: "14px", color: "#8E8E93" }}>Loading tasks…</div>}
          {error && <div style={{ fontSize: "14px", color: "#FF3B30" }}>{error}</div>}
          <div style={card}>
            {TASKS.length === 0 && !tasksLoading && (
              <div style={{ padding: "16px", fontSize: "14px", color: "#8E8E93" }}>No tasks on your led projects.</div>
            )}
            {TASKS.map((task, i) => {
              const done = doneTasks.has(task.id);
              return (
                <div
                  key={task.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "0 16px", height: "52px",
                    borderBottom: i < TASKS.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                  }}
                >
                  <button
                    onClick={() => toggleDone(task.id)}
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: `1.5px solid ${done ? "#D4A96A" : "rgba(60,60,67,0.25)"}`,
                      background: done ? "#D4A96A" : "transparent",
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
                      fontSize: "14px", fontWeight: 500,
                      color: done ? "#C7C7CC" : "#1C1C1E",
                      textDecoration: done ? "line-through" : "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#8E8E93", marginTop: "1px" }}>{task.project}</div>
                  </div>
                  <span style={{ fontSize: "12px", color: done ? "#C7C7CC" : task.dueColor, flexShrink: 0, fontWeight: 500 }}>
                    {task.due}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: "12px", padding: "0 2px" }}>
            <button
              onClick={() => router.push(NAV_ROUTES.myTasks)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "14px", color: "#D4A96A", padding: 0, fontWeight: 500 }}
            >
              View all tasks →
            </button>
          </div>
        </div>

        {/* RIGHT — projects + team */}
        <div>
          <div style={sectionLabel}>Projects you lead</div>
          {isLoading && <div style={{ fontSize: "13px", color: "#8E8E93" }}>Loading…</div>}
          <div style={card}>
            {ledProjects.length === 0 && !isLoading && (
              <div style={{ padding: "14px", fontSize: "13px", color: "#8E8E93" }}>
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
                    width: "100%", display: "flex", alignItems: "center", minHeight: "52px",
                    padding: "10px 14px", gap: "10px",
                    background: hoveredProject === project.id ? "rgba(60,60,67,0.04)" : "transparent",
                    border: "none",
                    borderBottom: i < ledProjects.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                    cursor: project.isAssigned ? "pointer" : "default",
                    textAlign: "left", transition: "background 0.12s",
                    opacity: project.isAssigned ? 1 : 0.85,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {project.name}
                    </div>
                    <div style={{ marginTop: "5px", height: "3px", borderRadius: "9999px", background: "#F2EDE8", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${project.progress}%`, background: "#D4A96A", borderRadius: "9999px" }} />
                    </div>
                  </div>
                  <span style={{ background: cfg.bg, color: cfg.color, fontSize: "11px", fontWeight: 500, borderRadius: "6px", padding: "3px 7px", flexShrink: 0 }}>
                    {project.status}
                  </span>
                  {project.isAssigned && <ChevronRight size={14} color="#C7C7CC" style={{ flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          <div style={sectionLabel}>Team</div>
          <div style={card}>
            {teamMembers.length === 0 && (
              <div style={{ padding: "14px", fontSize: "13px", color: "#8E8E93" }}>No team members yet.</div>
            )}
            {teamMembers.map((member, i) => (
              <div
                key={member.id}
                style={{
                  display: "flex", alignItems: "center", height: "48px",
                  padding: "0 14px", gap: "10px",
                  borderBottom: i < teamMembers.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                }}
              >
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "rgba(212,169,106,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "10px", fontWeight: 600, color: "#C9894A", flexShrink: 0,
                }}>
                  {member.initials}
                </div>
                <span style={{ fontSize: "14px", color: "#1C1C1E", flex: 1 }}>{member.name}</span>
                <span style={{ fontSize: "12px", color: "#8E8E93" }}>{member.tasks} tasks</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}