"use client";

import { useMemo, useState } from "react";
import { Check, Layers, Plus, RotateCcw, X } from "lucide-react";
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
  const {
    tasks: stages,
    refetch: refetchStages,
    createTaskable,
    setTaskableStatus,
    reopenTaskable,
  } = useProjectTaskables(projectId, "STAGE");

  const [newStageName, setNewStageName] = useState("");
  const [newStageStart, setNewStageStart] = useState("");
  const [newStageEnd, setNewStageEnd] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const stageViews = useMemo(
    () => stages.map((s) => mapStageToView(s)).sort((a, b) => a.order - b.order),
    [stages]
  );
  const completedCount = stageViews.filter((s) => s.isCompleted).length;

  async function handleMarkComplete(stageId: string) {
    setBusyId(stageId);
    try {
      await setTaskableStatus(stageId, "COMPLETED");
      await refetchStages();
      toast.success("Stage marked complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update stage");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReopen(stageId: string) {
    setBusyId(stageId);
    try {
      await reopenTaskable(stageId);
      await refetchStages();
      toast.success("Stage reopened");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reopen stage");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreateStage(e: React.FormEvent) {
    e.preventDefault();
    if (!newStageName.trim() || !newStageStart || !newStageEnd) return;
    if (new Date(newStageEnd) < new Date(newStageStart)) {
      toast.error("End date must be on or after the start date");
      return;
    }
    setIsSaving(true);
    try {
      const payload: CreateTaskRequest & { end_date: string } = {
        project_id: projectId,
        title: newStageName.trim(),
        start_date: new Date(newStageStart).toISOString(),
        end_date: new Date(newStageEnd + "T23:59:59").toISOString(),
        taskable_type: "STAGE",
        order: stages.length,
      };
      await createTaskable(payload);
      await refetchStages();
      setNewStageName("");
      setNewStageStart("");
      setNewStageEnd("");
      toast.success("Stage created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create stage");
    } finally {
      setIsSaving(false);
    }
  }

  const canSubmit = !!newStageName.trim() && !!newStageStart && !!newStageEnd && !isSaving;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
      />
      <div className="fixed left-1/2 top-1/2 z-[201] flex max-h-[88vh] w-[min(580px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-[#FDFAF6] shadow-[0_24px_70px_rgba(60,40,20,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(90,60,30,0.10)] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#F5E6D0] text-[#C9894A]">
              <Layers size={17} />
            </span>
            <div>
              <h2 className="text-[16px] font-semibold leading-tight text-[#1A1410]">Manage stages</h2>
              <p className="text-[12px] text-[#9C8573]">
                {stageViews.length} stage{stageViews.length === 1 ? "" : "s"}
                {completedCount > 0 ? ` · ${completedCount} complete` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[#9C8573] transition-colors hover:bg-[#F5EFE6] hover:text-[#6B5744]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-3 text-[12px] leading-relaxed text-[#9C8573]">
            Stages are the top-level phases of the project. Add milestones under each stage from the
            &ldquo;Manage milestones&rdquo; window.
          </p>

          {stageViews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgba(90,60,30,0.20)] bg-[#F5EFE6]/40 px-4 py-8 text-center">
              <Layers size={22} className="mx-auto mb-2 text-[#C4B5A5]" />
              <p className="text-[13px] font-medium text-[#6B5744]">No stages yet</p>
              <p className="text-[12px] text-[#9C8573]">Create your first stage below.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stageViews.map((s, i) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(90,60,30,0.10)] bg-white px-3.5 py-2.5 shadow-sm"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                        s.isCompleted
                          ? "bg-[#3D8B5E] text-white"
                          : "bg-[#F5E6D0] text-[#C9894A]"
                      }`}
                    >
                      {s.isCompleted ? <Check size={14} /> : i + 1}
                    </span>
                    <div className="min-w-0">
                      <div
                        className={`truncate text-[13.5px] font-medium ${
                          s.isCompleted ? "text-[#248A3D]" : "text-[#1A1410]"
                        }`}
                      >
                        {s.name}
                      </div>
                      <div className="text-[11.5px] text-[#9C8573]">
                        {new Date(s.startDate).toLocaleDateString()} –{" "}
                        {new Date(s.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {s.isCompleted ? (
                    <button
                      type="button"
                      onClick={() => void handleReopen(s.id)}
                      disabled={busyId === s.id}
                      title="Reopen stage"
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[rgba(90,60,30,0.22)] bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-[#6B5744] transition-colors hover:bg-[#F5EFE6] disabled:opacity-50"
                    >
                      <RotateCcw size={12} /> Reopen
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleMarkComplete(s.id)}
                      disabled={busyId === s.id}
                      title="Mark stage complete"
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#3D8B5E]/30 bg-[#3D8B5E]/8 px-2.5 py-1.5 text-[11.5px] font-medium text-[#248A3D] transition-colors hover:bg-[#3D8B5E]/15 disabled:opacity-50"
                    >
                      <Check size={12} /> Complete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: add stage */}
        <form
          onSubmit={(e) => void handleCreateStage(e)}
          className="border-t border-[rgba(90,60,30,0.10)] bg-white px-5 py-4"
        >
          <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-[#9C8573]">
            Add stage
          </div>
          <input
            placeholder="Stage name"
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            className="mb-2.5 h-9 w-full rounded-lg border border-[rgba(90,60,30,0.18)] bg-[#F5EFE6]/50 px-3 text-[13px] text-[#1A1410] outline-none placeholder:text-[#C4B5A5] focus:border-[#D4A96A] focus:bg-white"
          />
          <div className="mb-3 flex gap-2.5">
            <label className="flex-1">
              <span className="mb-1 block text-[11px] text-[#9C8573]">Start date</span>
              <input
                type="date"
                value={newStageStart}
                onChange={(e) => setNewStageStart(e.target.value)}
                className="h-9 w-full rounded-lg border border-[rgba(90,60,30,0.18)] bg-[#F5EFE6]/50 px-3 text-[13px] text-[#1A1410] outline-none focus:border-[#D4A96A] focus:bg-white"
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-[11px] text-[#9C8573]">End date</span>
              <input
                type="date"
                value={newStageEnd}
                min={newStageStart || undefined}
                onChange={(e) => setNewStageEnd(e.target.value)}
                className="h-9 w-full rounded-lg border border-[rgba(90,60,30,0.18)] bg-[#F5EFE6]/50 px-3 text-[13px] text-[#1A1410] outline-none focus:border-[#D4A96A] focus:bg-white"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#D4A96A] text-[13px] font-semibold text-white transition-colors hover:bg-[#C9894A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={15} />
            {isSaving ? "Creating…" : "Add stage"}
          </button>
        </form>
      </div>
    </>
  );
}
