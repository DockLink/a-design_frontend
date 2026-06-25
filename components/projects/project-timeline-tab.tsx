"use client";

import { useMemo } from "react";

import { useProjectContext } from "@/components/projects/project-context";
import { useProjectTaskables } from "@/hooks/use-project-taskables";
import { mapMilestoneToView, mapStageToView } from "@/lib/projects/map-stages";

export function ProjectTimelineTab() {
  const { project } = useProjectContext();
  const { tasks: stages, isLoading: stagesLoading } = useProjectTaskables(project!.id, "STAGE");
  const { tasks: milestones, isLoading: milestonesLoading } = useProjectTaskables(
    project!.id,
    "MILESTONE"
  );

  const stageViews = useMemo(() => stages.map((s) => mapStageToView(s)), [stages]);
  const milestoneViews = useMemo(() => milestones.map((m) => mapMilestoneToView(m)), [milestones]);

  const isLoading = stagesLoading || milestonesLoading;

  return (
    <div>
      <div style={{ fontSize: "20px", fontWeight: 600, marginBottom: "4px" }}>Timeline</div>
      <div style={{ fontSize: "13px", color: "#8E8E93", marginBottom: "16px" }}>
        Stages and milestones from the project schedule
      </div>

      {isLoading && <div style={{ color: "#8E8E93" }}>Loading timeline…</div>}

      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>Stages</div>
        {stageViews.length === 0 ? (
          <div style={{ fontSize: "13px", color: "#8E8E93" }}>No stages defined.</div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            }}
          >
            {stageViews.map((stage, i) => (
              <div
                key={stage.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: i < stageViews.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                  borderLeft: stage.isActive ? "3px solid #D4A96A" : "3px solid transparent",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: stage.isActive ? 600 : 400 }}>{stage.name}</div>
                <div style={{ fontSize: "12px", color: "#8E8E93", marginTop: "4px" }}>
                  {new Date(stage.startDate).toLocaleDateString()} → {new Date(stage.endDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px" }}>Milestones</div>
        {milestoneViews.length === 0 ? (
          <div style={{ fontSize: "13px", color: "#8E8E93" }}>No milestones defined.</div>
        ) : (
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            }}
          >
            {milestoneViews.map((m, i) => (
              <div
                key={m.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: i < milestoneViews.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 500 }}>{m.name}</div>
                {m.description && (
                  <div style={{ fontSize: "12px", color: "#6C6C70", marginTop: "4px" }}>{m.description}</div>
                )}
                <div style={{ fontSize: "12px", color: "#8E8E93", marginTop: "4px" }}>
                  {new Date(m.startDate).toLocaleDateString()} → {new Date(m.endDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
