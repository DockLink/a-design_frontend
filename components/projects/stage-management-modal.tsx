"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { useProjectTaskables } from "@/hooks/use-project-taskables";
import { mapStageToView } from "@/lib/projects/map-stages";
import type { CreateTaskRequest } from "@/types/tasks";

export function StageManagementModal({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const { tasks: stages, refetch: refetchStages, createTaskable } = useProjectTaskables(
    projectId,
    "STAGE"
  );

  const [newStageName, setNewStageName] = useState("");
  const [newStageStart, setNewStageStart] = useState("");
  const [newStageDuration, setNewStageDuration] = useState("P30D");
  const [isSaving, setIsSaving] = useState(false);

  const stageViews = useMemo(() => stages.map((s) => mapStageToView(s)), [stages]);

  async function handleCreateStage(e: React.FormEvent) {
    e.preventDefault();
    if (!newStageName.trim() || !newStageStart) return;
    setIsSaving(true);
    try {
      const payload: CreateTaskRequest = {
        project_id: projectId,
        title: newStageName.trim(),
        start_date: new Date(newStageStart).toISOString(),
        duration: newStageDuration,
        taskable_type: "STAGE",
        order: stages.length,
      };
      await createTaskable(payload);
      await refetchStages();
      setNewStageName("");
      setNewStageStart("");
      toast.success("Stage created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create stage");
    } finally {
      setIsSaving(false);
    }
  }

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
          <div style={{ fontSize: "17px", fontWeight: 600 }}>Manage stages</div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ fontSize: "12px", color: "#8E8E93", marginBottom: "12px" }}>
            Stages are the top-level phases of the project. Add milestones under each stage from
            the &ldquo;Manage milestones&rdquo; window.
          </div>

          <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>Stages ({stageViews.length})</div>
          {stageViews.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#8E8E93", marginBottom: "16px" }}>No stages yet.</div>
          ) : (
            <div style={{ marginBottom: "16px" }}>
              {stageViews.map((s) => (
                <div key={s.id} style={{ fontSize: "13px", padding: "8px 0", borderBottom: "0.5px solid rgba(60,60,67,0.08)" }}>
                  {s.name} · {new Date(s.startDate).toLocaleDateString()}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={(e) => void handleCreateStage(e)} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>Add stage</div>
            <input
              placeholder="Stage name"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              style={{ height: "36px", borderRadius: "8px", border: "1px solid rgba(60,60,67,0.15)", padding: "0 10px" }}
            />
            <input
              type="date"
              value={newStageStart}
              onChange={(e) => setNewStageStart(e.target.value)}
              style={{ height: "36px", borderRadius: "8px", border: "1px solid rgba(60,60,67,0.15)", padding: "0 10px" }}
            />
            <input
              placeholder="Duration (e.g. P45D)"
              value={newStageDuration}
              onChange={(e) => setNewStageDuration(e.target.value)}
              style={{ height: "36px", borderRadius: "8px", border: "1px solid rgba(60,60,67,0.15)", padding: "0 10px" }}
            />
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
              {isSaving ? "Creating…" : "Add stage"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
