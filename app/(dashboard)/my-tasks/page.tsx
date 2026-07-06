"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronRight, ListTodo, Search } from "lucide-react";

import { useMemberProjects } from "@/hooks/use-member-projects";
import { useTasks } from "@/hooks/use-tasks";
import {
  getTaskStatusLabel,
  getTaskStatusStyle,
  isTaskCompleted,
} from "@/lib/projects/map-stages";
import {
  dsCallout,
  dsLargeTitle,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { projectTabRoute } from "@/types/navigation";
import type { Task, TaskUrgency } from "@/types/tasks";

type FilterKey = "all" | "open" | "completed";

const URGENCY_COLOR: Record<TaskUrgency, string> = {
  overdue: "#FF3B30",
  today: "#FF9F0A",
  soon: "#8E8E93",
};

function getDue(startDate: string): { label: string; urgency: TaskUrgency } {
  const start = new Date(startDate);
  const diffDays = Math.ceil((start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, urgency: "overdue" };
  if (diffDays === 0) return { label: "Today", urgency: "today" };
  if (diffDays <= 7) return { label: `${diffDays}d`, urgency: "today" };
  return {
    label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    urgency: "soon",
  };
}

export default function MyTasksPage() {
  const router = useRouter();
  const { memberProjects, projectIds, isLoading: projectsLoading } = useMemberProjects({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });

  // Do NOT filter by status: tasks use workflow statuses (TODO / IN_PROGRESS /
  // COMPLETED / …), never "ACTIVE", so a status filter hides every task.
  const { tasks, isLoading: tasksLoading, error } = useTasks({
    page: 1,
    limit: 200,
    taskable_type: "TASK",
    depth: 1,
    projects: projectIds.length ? projectIds : undefined,
  });

  const [filter, setFilter] = useState<FilterKey>("open");
  const [query, setQuery] = useState("");

  const projectNameById = useMemo(() => {
    const map = new Map<string, string>();
    memberProjects.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [memberProjects]);

  const isLoading = projectsLoading || tasksLoading;

  const counts = useMemo(() => {
    let overdue = 0;
    let today = 0;
    let completed = 0;
    for (const t of tasks) {
      if (isTaskCompleted(t.status)) {
        completed += 1;
        continue;
      }
      const { urgency } = getDue(t.start_date);
      if (urgency === "overdue") overdue += 1;
      else if (urgency === "today") today += 1;
    }
    return { total: tasks.length, overdue, today, completed };
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (filter === "open" && isTaskCompleted(t.status)) return false;
        if (filter === "completed" && !isTaskCompleted(t.status)) return false;
        if (q && !t.title.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const ua = getDue(a.start_date).urgency;
        const ub = getDue(b.start_date).urgency;
        const rank: Record<TaskUrgency, number> = { overdue: 0, today: 1, soon: 2 };
        if (rank[ua] !== rank[ub]) return rank[ua] - rank[ub];
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      });
  }, [tasks, filter, query]);

  // Group filtered tasks by project for a clean, scannable layout.
  const grouped = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of filtered) {
      const arr = map.get(t.projectId) ?? [];
      arr.push(t);
      map.set(t.projectId, arr);
    }
    return Array.from(map.entries()).map(([projectId, items]) => ({
      projectId,
      projectName: projectNameById.get(projectId) ?? "Project",
      items,
    }));
  }, [filtered, projectNameById]);

  function openTask(task: Task) {
    router.push(projectTabRoute(task.projectId, "tasks"));
  }

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "open", label: "Open" },
    { key: "completed", label: "Completed" },
    { key: "all", label: "All" },
  ];

  return (
    <div>
      <div style={dsLargeTitle}>My Tasks</div>
      <div style={{ ...dsSubtitle, marginTop: "6px" }}>
        Tasks assigned to you across all your projects
      </div>

      {/* Summary stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginTop: "22px",
        }}
      >
        <StatCard
          icon={<ListTodo size={16} />}
          tint="#D4A96A"
          value={counts.total}
          label="Total tasks"
        />
        <StatCard
          icon={<AlertTriangle size={16} />}
          tint="#FF3B30"
          value={counts.overdue}
          label="Overdue"
        />
        <StatCard
          icon={<AlertTriangle size={16} />}
          tint="#FF9F0A"
          value={counts.today}
          label="Due soon"
        />
        <StatCard
          icon={<CheckCircle2 size={16} />}
          tint="#2D8B5E"
          value={counts.completed}
          label="Completed"
        />
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "24px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            background: "#F2EDE6",
            borderRadius: "10px",
            padding: "3px",
            gap: "2px",
          }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  border: "none",
                  cursor: "pointer",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 500,
                  background: active ? "#FFFFFF" : "transparent",
                  color: active ? "var(--ds-label)" : "var(--ds-secondary-label)",
                  boxShadow: active ? "0 1px 3px rgba(60,40,20,0.12)" : "none",
                  transition: "all 0.12s",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#FFFFFF",
            border: "1px solid rgba(90,60,30,0.16)",
            borderRadius: "10px",
            padding: "0 12px",
            height: "38px",
            minWidth: "220px",
            flex: "0 1 280px",
          }}
        >
          <Search size={15} color="var(--ds-secondary-label)" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks…"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: "var(--ds-label)",
              width: "100%",
            }}
          />
        </div>
      </div>

      {error && <div style={{ ...dsCallout, color: "var(--ds-destructive)" }}>{error}</div>}

      {isLoading ? (
        <div style={dsCallout}>Loading your tasks…</div>
      ) : grouped.length === 0 ? (
        <div
          style={{
            border: "1px dashed rgba(90,60,30,0.20)",
            background: "rgba(245,239,230,0.4)",
            borderRadius: "14px",
            padding: "44px 20px",
            textAlign: "center",
          }}
        >
          <ListTodo size={26} color="#C4B5A5" style={{ margin: "0 auto 10px" }} />
          <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--ds-secondary-label)" }}>
            {filter === "completed"
              ? "No completed tasks yet"
              : query
                ? "No tasks match your search"
                : "You're all caught up"}
          </div>
          <div style={{ fontSize: "12.5px", color: "var(--ds-secondary-label)", marginTop: "2px" }}>
            {filter === "open"
              ? "No open tasks assigned to you right now."
              : "Tasks assigned to you will appear here."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          {grouped.map((group) => (
            <div key={group.projectId}>
              <button
                onClick={() => router.push(projectTabRoute(group.projectId, "tasks"))}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 2px",
                  marginBottom: "10px",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "9999px", background: "var(--ds-accent)" }} />
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--ds-secondary-label)" }}>
                  {group.projectName}
                </span>
                <span style={{ fontSize: "12px", color: "#C4B5A5" }}>
                  {group.items.length}
                </span>
              </button>

              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "14px",
                  border: "0.5px solid rgba(90,60,30,0.12)",
                  boxShadow: "0 1px 3px rgba(60,40,20,0.06)",
                  overflow: "hidden",
                }}
              >
                {group.items.map((task, i) => {
                  const done = isTaskCompleted(task.status);
                  const { label, urgency } = getDue(task.start_date);
                  const statusStyle = getTaskStatusStyle(task.status);
                  return (
                    <button
                      key={task.id}
                      onClick={() => openTask(task)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "0 16px",
                        height: "60px",
                        background: "transparent",
                        border: "none",
                        borderBottom:
                          i < group.items.length - 1
                            ? "0.5px solid rgba(60,60,67,0.08)"
                            : "none",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(60,60,67,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "9999px",
                          flexShrink: 0,
                          background: done ? "#2D8B5E" : statusStyle.color,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: done ? "#C4B5A5" : "var(--ds-label)",
                            textDecoration: done ? "line-through" : "none",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 500,
                              color: statusStyle.color,
                              background: statusStyle.bg,
                              borderRadius: "6px",
                              padding: "1px 7px",
                            }}
                          >
                            {getTaskStatusLabel(task.status)}
                          </span>
                          {task.code && (
                            <span style={{ fontSize: "11px", color: "#C4B5A5" }}>{task.code}</span>
                          )}
                        </div>
                      </div>
                      {!done && (
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: urgency !== "soon" ? 600 : 400,
                            color: URGENCY_COLOR[urgency],
                            flexShrink: 0,
                          }}
                        >
                          {label}
                        </span>
                      )}
                      <ChevronRight size={15} color="#C7C7CC" style={{ flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  tint,
  value,
  label,
}: {
  icon: React.ReactNode;
  tint: string;
  value: number;
  label: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "14px",
        border: "0.5px solid rgba(90,60,30,0.12)",
        boxShadow: "0 1px 3px rgba(60,40,20,0.06)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <span
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "9px",
          background: `${tint}1A`,
          color: tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: "24px", fontWeight: 600, color: "var(--ds-label)", lineHeight: 1.1 }}>
        {value}
      </span>
      <span style={{ fontSize: "12.5px", color: "var(--ds-secondary-label)" }}>{label}</span>
    </div>
  );
}
