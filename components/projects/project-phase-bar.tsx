import { Check } from "lucide-react";

import type { ProjectStageView } from "@/lib/projects/map-stages";

export function ProjectPhaseBar({ stages }: { stages: ProjectStageView[] }) {
  if (stages.length === 0) {
    return (
      <div style={{ marginBottom: "24px", fontSize: "13px", color: "#8E8E93" }}>
        No stages defined yet.
      </div>
    );
  }

  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const completedCount = sorted.filter((s) => s.isCompleted).length;

  // The current stage is the first not-yet-completed stage (or the active one).
  const activeIndex = sorted.findIndex((s) => !s.isCompleted && s.isActive);
  const firstOpenIndex = sorted.findIndex((s) => !s.isCompleted);
  const currentIndex = activeIndex >= 0 ? activeIndex : firstOpenIndex;

  // Progress reflects actual completion: fully done stages fill the bar; the
  // current (in-progress) stage adds a half-step so movement is visible.
  const allComplete = completedCount === sorted.length;
  const progressPct = allComplete
    ? 100
    : ((completedCount + (currentIndex >= 0 ? 0.5 : 0)) / sorted.length) * 100;

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
        {sorted.map((stage, i) => {
          const isCurrent = i === currentIndex;
          const color = stage.isCompleted ? "#248A3D" : isCurrent ? "#D4A96A" : "#8E8E93";
          return (
            <span
              key={stage.id}
              style={{
                fontSize: "11px",
                color,
                fontWeight: stage.isCompleted || isCurrent ? 600 : 400,
                flex: 1,
                textAlign: "center",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
              }}
            >
              {stage.isCompleted && <Check size={11} style={{ flexShrink: 0 }} />}
              {stage.name}
            </span>
          );
        })}
      </div>
      <div
        style={{
          height: "6px",
          borderRadius: "9999px",
          background: "rgba(60,60,67,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: allComplete ? "#248A3D" : "#D4A96A",
            borderRadius: "9999px",
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}
