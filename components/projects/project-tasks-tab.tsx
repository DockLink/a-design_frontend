"use client";

import { useProjectContext } from "@/components/projects/project-context";
import { useProjectTaskables } from "@/hooks/use-project-taskables";
import {
  getPriorityColor,
  getTaskStatusLabel,
  getTaskStatusStyle,
} from "@/lib/projects/map-stages";

export function ProjectTasksTab() {
  const { project } = useProjectContext();
  const { tasks, isLoading, error } = useProjectTaskables(project!.id, "TASK", {
    depth: 1,
    limit: 100,
  });

  return (
    <div>
      <div style={{ fontSize: "20px", fontWeight: 600, marginBottom: "4px" }}>Tasks</div>
      <div style={{ fontSize: "13px", color: "#8E8E93", marginBottom: "16px" }}>
        {tasks.length} task(s) in this project
      </div>

      {isLoading && <div style={{ color: "#8E8E93" }}>Loading tasks…</div>}
      {error && <div style={{ color: "#9B1C1C" }}>{error}</div>}

      {!isLoading && tasks.length === 0 && (
        <div style={{ padding: "32px", textAlign: "center", color: "#8E8E93" }}>No tasks yet.</div>
      )}

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
        }}
      >
        {tasks.map((task, i) => {
          const scfg = getTaskStatusStyle(task.status);
          return (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "0 16px",
                height: "52px",
                borderBottom: i < tasks.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: getPriorityColor(task.taskablePriority),
                }}
              />
              <div style={{ flex: 1, fontSize: "14px", color: "#1C1C1E" }}>{task.title}</div>
              <span
                style={{
                  fontSize: "11px",
                  background: scfg.bg,
                  color: scfg.color,
                  borderRadius: "6px",
                  padding: "3px 8px",
                  fontWeight: 500,
                }}
              >
                {getTaskStatusLabel(task.status)}
              </span>
              <span style={{ fontSize: "12px", color: "#8E8E93" }}>
                {new Date(task.start_date).toLocaleDateString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
