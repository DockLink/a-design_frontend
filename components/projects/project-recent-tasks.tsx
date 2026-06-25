import Link from "next/link";

import {
  getPriorityColor,
  getTaskStatusLabel,
  getTaskStatusStyle,
} from "@/lib/projects/map-stages";
import { projectTabRoute } from "@/types/navigation";
import type { Task } from "@/types/tasks";

export function ProjectMemberAvatar({
  initials,
  size = 28,
  fontSize = 10,
}: {
  initials: string;
  size?: number;
  fontSize?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "rgba(212,169,106,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 600,
        color: "#C9894A",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export function ProjectRecentTasks({
  projectId,
  tasks,
  limit = 5,
}: {
  projectId: string;
  tasks: Task[];
  limit?: number;
}) {
  const items = tasks.slice(0, limit);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1C1C1E" }}>Recent tasks</div>
        <Link
          href={projectTabRoute(projectId, "tasks")}
          style={{ fontSize: "13px", color: "#D4A96A", fontWeight: 500, textDecoration: "none" }}
        >
          View all
        </Link>
      </div>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
        }}
      >
        {items.length === 0 ? (
          <div style={{ padding: "16px", fontSize: "13px", color: "#8E8E93" }}>No tasks yet.</div>
        ) : (
          items.map((task, i) => {
            const scfg = getTaskStatusStyle(task.status);
            return (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "0 14px",
                  height: "44px",
                  borderBottom: i < items.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                }}
              >
                <div
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: getPriorityColor(task.taskablePriority),
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    color: "#1C1C1E",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {task.title}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    background: scfg.bg,
                    color: scfg.color,
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {getTaskStatusLabel(task.status)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
