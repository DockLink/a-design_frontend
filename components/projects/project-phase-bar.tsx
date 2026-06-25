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
  const activeIndex = sorted.findIndex((s) => s.isActive);
  const progressIndex = activeIndex >= 0 ? activeIndex : 0;
  const progressPct = ((progressIndex + 1) / sorted.length) * 100;

  return (
    <div style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
        {sorted.map((stage) => (
          <span
            key={stage.id}
            style={{
              fontSize: "11px",
              color: stage.isActive ? "#D4A96A" : "#8E8E93",
              fontWeight: stage.isActive ? 600 : 400,
              flex: 1,
              textAlign: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {stage.name}
          </span>
        ))}
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
            background: "#D4A96A",
            borderRadius: "9999px",
            transition: "width 0.3s",
          }}
        />
      </div>
    </div>
  );
}
