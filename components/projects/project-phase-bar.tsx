import { Check } from "lucide-react";

import type { ProjectStageView } from "@/lib/projects/map-stages";

export function ProjectPhaseBar({ stages }: { stages: ProjectStageView[] }) {
  if (stages.length === 0) {
    return (
      <div className="project-phase-bar" style={{ fontSize: "13px", color: "#8E8E93" }}>
        No stages defined yet.
      </div>
    );
  }

  const sorted = [...stages].sort((a, b) => a.order - b.order);
  const completedCount = sorted.filter((s) => s.isCompleted).length;

  const activeIndex = sorted.findIndex((s) => !s.isCompleted && s.isActive);
  const firstOpenIndex = sorted.findIndex((s) => !s.isCompleted);
  const currentIndex = activeIndex >= 0 ? activeIndex : firstOpenIndex;

  const allComplete = completedCount === sorted.length;
  const progressPct = allComplete
    ? 100
    : ((completedCount + (currentIndex >= 0 ? 0.5 : 0)) / sorted.length) * 100;

  return (
    <div className="project-phase-bar">
      <div className="project-phase-bar__stages">
        {sorted.map((stage, i) => {
          const isCurrent = i === currentIndex;
          const color = stage.isCompleted ? "#248A3D" : isCurrent ? "#D4A96A" : "#8E8E93";
          return (
            <span
              key={stage.id}
              className="project-phase-bar__stage"
              style={{
                color,
                fontWeight: stage.isCompleted || isCurrent ? 600 : 400,
              }}
            >
              {stage.isCompleted && <Check size={11} style={{ flexShrink: 0 }} />}
              {stage.name}
            </span>
          );
        })}
      </div>
      <div className="project-phase-bar__track">
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
