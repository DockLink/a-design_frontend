"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { useProjectTaskables } from "@/hooks/use-project-taskables";
import { authApiClient } from "@/lib/api/authenticated-client";
import { mapStageToView } from "@/lib/projects/map-stages";
import { withTaskEndDate } from "@/lib/tasks/create-task-payload";
import type { Task } from "@/types/tasks";

export function MilestoneManagementModal({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const { tasks: stages } = useProjectTaskables(projectId, "STAGE");
  const {
    tasks: milestones,
    refetch: refetchMilestones,
    createTaskable: createMilestoneTaskable,
  } = useProjectTaskables(projectId, "MILESTONE");

  const [milestoneStageMap, setMilestoneStageMap] = useState<Record<string, string>>({});
  const [stageId, setStageId] = useState("");
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const stageViews = useMemo(() => stages.map((s) => mapStageToView(s)), [stages]);

  const loadParents = useCallback(async () => {
    if (stages.length === 0) {
      setMilestoneStageMap({});
      return;
    }
    const map: Record<string, string> = {};
    await Promise.all(
      stages.map(async (stage) => {
        try {
          const detail = await authApiClient<Task & { children?: Task[] }>(
            `/tasks/${stage.id}?include_children=true`
          );
          for (const child of detail.children ?? []) {
            if (child.taskableType === "MILESTONE") {
              map[child.id] = stage.title;
            }
          }
        } catch {
          // stage may have no children yet
        }
      })
    );
    setMilestoneStageMap(map);
  }, [stages]);

  useEffect(() => {
    void loadParents();
  }, [loadParents]);

  async function handleCreateMilestone(e: React.FormEvent) {
    e.preventDefault();
    const targetStageId = stageId || stageViews[0]?.id;
    if (!targetStageId) {
      toast.error("Add a stage first");
      return;
    }
    if (!name.trim() || !start || !end) return;
    setIsSaving(true);
    try {
      const order = milestones.length;
      const payload = withTaskEndDate({
        project_id: projectId,
        title: name.trim(),
        start_date: new Date(start).toISOString(),
        end_date: new Date(end + "T23:59:59").toISOString(),
        taskable_type: "MILESTONE",
        parent_taskable_id: targetStageId,
        order,
        status: "TODO",
      });
      await createMilestoneTaskable(payload);
      await refetchMilestones();
      await loadParents();
      setName("");
      setStart("");
      setEnd("");
      toast.success("Milestone created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create milestone");
    } finally {
      setIsSaving(false);
    }
  }

  // Group milestones under their stage for display.
  const grouped = useMemo(() => {
    const byStage: Record<string, { stageName: string; items: { id: string; name: string }[] }> = {};
    for (const s of stageViews) {
      byStage[s.name] = { stageName: s.name, items: [] };
    }
    const unassigned: { id: string; name: string }[] = [];
    for (const m of milestones) {
      const stageName = milestoneStageMap[m.id];
      if (stageName && byStage[stageName]) {
        byStage[stageName].items.push({ id: m.id, name: m.title });
      } else {
        unassigned.push({ id: m.id, name: m.title });
      }
    }
    return { byStage, unassigned };
  }, [stageViews, milestones, milestoneStageMap]);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(560px, 92vw)",
          maxHeight: "85vh",
          background: "#FFFFFF",
          borderRadius: "14px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "0.5px solid rgba(60,60,67,0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "17px", fontWeight: 600 }}>Manage milestones</div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ fontSize: "12px", color: "#8E8E93", marginBottom: "12px" }}>
            Milestones live inside a stage. Pick the stage, then add a milestone under it.
          </div>

          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
            Milestones by stage ({milestones.length})
          </div>

          {stageViews.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#8E8E93", marginBottom: "16px" }}>
              No stages yet. Create a stage first from &ldquo;Manage stages&rdquo;.
            </div>
          ) : (
            <div style={{ marginBottom: "16px" }}>
              {stageViews.map((s) => {
                const group = grouped.byStage[s.name];
                return (
                  <div key={s.id} style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#6B5744" }}>{s.name}</div>
                    {group && group.items.length > 0 ? (
                      group.items.map((m) => (
                        <div key={m.id} style={{ fontSize: "13px", padding: "5px 0 5px 10px", color: "#1A1410" }}>
                          • {m.name}
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: "12px", padding: "5px 0 5px 10px", color: "#9C8573" }}>
                        No milestones
                      </div>
                    )}
                  </div>
                );
              })}
              {grouped.unassigned.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#9C8573" }}>Unassigned</div>
                  {grouped.unassigned.map((m) => (
                    <div key={m.id} style={{ fontSize: "13px", padding: "5px 0 5px 10px", color: "#1A1410" }}>
                      • {m.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={(e) => void handleCreateMilestone(e)} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Add milestone</div>
            {stageViews.length === 0 ? (
              <div style={{ fontSize: "12px", color: "#8E8E93" }}>Add a stage first to create milestones.</div>
            ) : (
              <>
                <select
                  value={stageId || stageViews[0]?.id}
                  onChange={(e) => setStageId(e.target.value)}
                  style={{ height: "36px", borderRadius: "8px", border: "1px solid rgba(60,60,67,0.15)", padding: "0 10px", background: "white" }}
                >
                  {stageViews.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Milestone name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ height: "36px", borderRadius: "8px", border: "1px solid rgba(60,60,67,0.15)", padding: "0 10px" }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="date"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    style={{ flex: 1, height: "36px", borderRadius: "8px", border: "1px solid rgba(60,60,67,0.15)", padding: "0 10px" }}
                  />
                  <input
                    type="date"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    style={{ flex: 1, height: "36px", borderRadius: "8px", border: "1px solid rgba(60,60,67,0.15)", padding: "0 10px" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    height: "36px",
                    background: "rgba(212,169,106,0.12)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#C9894A",
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Plus size={14} />
                  {isSaving ? "Creating…" : "Add milestone"}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
