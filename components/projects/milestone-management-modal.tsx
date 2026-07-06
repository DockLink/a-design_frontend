"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Flag, Pencil, Plus, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";

import { useProjectTaskables } from "@/hooks/use-project-taskables";
import { authApiClient } from "@/lib/api/authenticated-client";
import { mapStageToView } from "@/lib/projects/map-stages";
import { withTaskEndDate } from "@/lib/tasks/create-task-payload";
import { resolveTaskEndDateIso } from "@/lib/tasks/task-dates";
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
    updateTaskable: updateMilestone,
    updateTaskableDates: updateMilestoneDates,
    setTaskableStatus,
    reopenTaskable,
  } = useProjectTaskables(projectId, "MILESTONE");

  const [busyId, setBusyId] = useState<string | null>(null);

  // Maps milestone id -> parent stage id.
  const [milestoneStageMap, setMilestoneStageMap] = useState<Record<string, string>>({});
  const [stageId, setStageId] = useState("");
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Inline milestone edit state.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);

  const stageViews = useMemo(
    () => stages.map((s) => mapStageToView(s)).sort((a, b) => a.order - b.order),
    [stages]
  );
  const stageById = useMemo(() => {
    const map = new Map<string, (typeof stageViews)[number]>();
    for (const s of stageViews) map.set(s.id, s);
    return map;
  }, [stageViews]);
  const milestoneById = useMemo(() => {
    const map = new Map<string, Task>();
    for (const m of milestones) map.set(m.id, m);
    return map;
  }, [milestones]);

  // The stage the new milestone will belong to, used to constrain its dates.
  const selectedStage = useMemo(
    () => stageViews.find((s) => s.id === (stageId || stageViews[0]?.id)),
    [stageViews, stageId]
  );
  const stageStart = selectedStage ? selectedStage.startDate.slice(0, 10) : undefined;
  const stageEnd = selectedStage ? selectedStage.endDate.slice(0, 10) : undefined;

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
              map[child.id] = stage.id;
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
    if (new Date(end) < new Date(start)) {
      toast.error("End date must be on or after the start date");
      return;
    }
    if (stageStart && stageEnd && (start < stageStart || end > stageEnd)) {
      toast.error(
        `Milestone must fall within the stage period (${new Date(stageStart).toLocaleDateString()} – ${new Date(stageEnd).toLocaleDateString()})`
      );
      return;
    }
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

  async function handleMarkComplete(milestoneId: string) {
    setBusyId(milestoneId);
    try {
      await setTaskableStatus(milestoneId, "COMPLETED");
      await refetchMilestones();
      toast.success("Milestone marked complete");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update milestone");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReopenMilestone(milestoneId: string) {
    setBusyId(milestoneId);
    try {
      await reopenTaskable(milestoneId);
      await refetchMilestones();
      toast.success("Milestone reopened");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reopen milestone");
    } finally {
      setBusyId(null);
    }
  }

  // Group milestones under their stage (by stage id) for display.
  const grouped = useMemo(() => {
    const byStage: Record<string, { id: string; name: string }[]> = {};
    for (const s of stageViews) byStage[s.id] = [];
    const unassigned: { id: string; name: string }[] = [];
    for (const m of milestones) {
      const parentStageId = milestoneStageMap[m.id];
      if (parentStageId && byStage[parentStageId]) {
        byStage[parentStageId].push({ id: m.id, name: m.title });
      } else {
        unassigned.push({ id: m.id, name: m.title });
      }
    }
    return { byStage, unassigned };
  }, [stageViews, milestones, milestoneStageMap]);

  function beginEdit(milestoneId: string) {
    const m = milestoneById.get(milestoneId);
    if (!m) return;
    setEditingId(milestoneId);
    setEditName(m.title);
    setEditStart(m.start_date.slice(0, 10));
    setEditEnd(resolveTaskEndDateIso(m).slice(0, 10));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditStart("");
    setEditEnd("");
  }

  async function handleSaveEdit(milestoneId: string) {
    const m = milestoneById.get(milestoneId);
    if (!m) return;
    if (!editName.trim() || !editStart || !editEnd) {
      toast.error("Milestone name, start and end dates are required");
      return;
    }
    if (new Date(editEnd) < new Date(editStart)) {
      toast.error("End date must be on or after the start date");
      return;
    }
    const parentStage = stageById.get(milestoneStageMap[milestoneId] ?? "");
    if (parentStage) {
      const sStart = parentStage.startDate.slice(0, 10);
      const sEnd = parentStage.endDate.slice(0, 10);
      if (editStart < sStart || editEnd > sEnd) {
        toast.error(
          `Milestone must fall within the stage period (${new Date(sStart).toLocaleDateString()} – ${new Date(sEnd).toLocaleDateString()})`
        );
        return;
      }
    }
    setIsEditSaving(true);
    try {
      if (editName.trim() !== m.title) {
        await updateMilestone(milestoneId, { title: editName.trim() });
      }
      const currentStart = m.start_date.slice(0, 10);
      const currentEnd = resolveTaskEndDateIso(m).slice(0, 10);
      if (editStart !== currentStart || editEnd !== currentEnd) {
        await updateMilestoneDates(
          milestoneId,
          new Date(`${editStart}T00:00:00`).toISOString(),
          new Date(`${editEnd}T23:59:59`).toISOString()
        );
      }
      await refetchMilestones();
      cancelEdit();
      toast.success("Milestone updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update milestone");
    } finally {
      setIsEditSaving(false);
    }
  }

  const canSubmit =
    !!name.trim() && !!start && !!end && stageViews.length > 0 && !isSaving;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
      />
      <div className="fixed left-1/2 top-1/2 z-[201] flex max-h-[88vh] w-[min(580px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-[var(--ds-surface-elevated)] shadow-[0_24px_70px_rgba(60,40,20,0.28)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(90,60,30,0.10)] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#F5E6D0] text-[var(--ds-accent-hover)]">
              <Flag size={16} />
            </span>
            <div>
              <h2 className="text-[16px] font-semibold leading-tight text-[var(--ds-label)]">Manage milestones</h2>
              <p className="text-[12px] text-[var(--ds-secondary-label)]">
                {milestones.length} milestone{milestones.length === 1 ? "" : "s"} across{" "}
                {stageViews.length} stage{stageViews.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[var(--ds-secondary-label)] transition-colors hover:bg-[var(--ds-bg)] hover:text-[var(--ds-secondary-label)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {stageViews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[rgba(90,60,30,0.20)] bg-[var(--ds-bg)]/40 px-4 py-8 text-center">
              <Flag size={22} className="mx-auto mb-2 text-[#C4B5A5]" />
              <p className="text-[13px] font-medium text-[var(--ds-secondary-label)]">No stages yet</p>
              <p className="text-[12px] text-[var(--ds-secondary-label)]">
                Create a stage first from &ldquo;Manage stages&rdquo;.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {stageViews.map((s) => {
                const items = grouped.byStage[s.id];
                const sStart = s.startDate.slice(0, 10);
                const sEnd = s.endDate.slice(0, 10);
                return (
                  <div key={s.id}>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`size-1.5 rounded-full ${s.isCompleted ? "bg-[#3D8B5E]" : "bg-[var(--ds-accent)]"}`}
                      />
                      <span className="text-[12px] font-semibold text-[var(--ds-secondary-label)]">{s.name}</span>
                      <span className="text-[11px] text-[#C4B5A5]">
                        {items?.length ?? 0} milestone{(items?.length ?? 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                    {items && items.length > 0 ? (
                      <div className="space-y-1.5">
                        {items.map((m) => (
                          <MilestoneRow
                            key={m.id}
                            id={m.id}
                            name={m.name}
                            task={milestoneById.get(m.id)}
                            isEditing={editingId === m.id}
                            editName={editName}
                            editStart={editStart}
                            editEnd={editEnd}
                            isSaving={isEditSaving}
                            stageStart={sStart}
                            stageEnd={sEnd}
                            busy={busyId === m.id}
                            onEdit={() => beginEdit(m.id)}
                            onCancel={cancelEdit}
                            onSave={() => void handleSaveEdit(m.id)}
                            onChangeName={setEditName}
                            onChangeStart={setEditStart}
                            onChangeEnd={setEditEnd}
                            onComplete={() => void handleMarkComplete(m.id)}
                            onReopen={() => void handleReopenMilestone(m.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-[rgba(90,60,30,0.14)] px-3 py-2 text-[12px] text-[#C4B5A5]">
                        No milestones
                      </div>
                    )}
                  </div>
                );
              })}

              {grouped.unassigned.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[#C4B5A5]" />
                    <span className="text-[12px] font-semibold text-[var(--ds-secondary-label)]">Unassigned</span>
                  </div>
                  <div className="space-y-1.5">
                    {grouped.unassigned.map((m) => (
                      <MilestoneRow
                        key={m.id}
                        id={m.id}
                        name={m.name}
                        task={milestoneById.get(m.id)}
                        isEditing={editingId === m.id}
                        editName={editName}
                        editStart={editStart}
                        editEnd={editEnd}
                        isSaving={isEditSaving}
                        busy={busyId === m.id}
                        onEdit={() => beginEdit(m.id)}
                        onCancel={cancelEdit}
                        onSave={() => void handleSaveEdit(m.id)}
                        onChangeName={setEditName}
                        onChangeStart={setEditStart}
                        onChangeEnd={setEditEnd}
                        onComplete={() => void handleMarkComplete(m.id)}
                        onReopen={() => void handleReopenMilestone(m.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: add milestone */}
        <form
          onSubmit={(e) => void handleCreateMilestone(e)}
          className="border-t border-[rgba(90,60,30,0.10)] bg-white px-5 py-4"
        >
          <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-[var(--ds-secondary-label)]">
            Add milestone
          </div>
          {stageViews.length === 0 ? (
            <p className="text-[12px] text-[var(--ds-secondary-label)]">Add a stage first to create milestones.</p>
          ) : (
            <>
              <div className="mb-2.5 flex gap-2.5">
                <select
                  value={stageId || stageViews[0]?.id}
                  onChange={(e) => setStageId(e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-[rgba(90,60,30,0.18)] bg-[var(--ds-bg)]/50 px-3 text-[13px] text-[var(--ds-label)] outline-none focus:border-[var(--ds-accent)] focus:bg-white"
                >
                  {stageViews.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                placeholder="Milestone name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-2.5 h-9 w-full rounded-lg border border-[rgba(90,60,30,0.18)] bg-[var(--ds-bg)]/50 px-3 text-[13px] text-[var(--ds-label)] outline-none placeholder:text-[#C4B5A5] focus:border-[var(--ds-accent)] focus:bg-white"
              />
              <div className="flex gap-2.5">
                <label className="flex-1">
                  <span className="mb-1 block text-[11px] text-[var(--ds-secondary-label)]">Start date</span>
                  <input
                    type="date"
                    value={start}
                    min={stageStart}
                    max={stageEnd}
                    onChange={(e) => setStart(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[rgba(90,60,30,0.18)] bg-[var(--ds-bg)]/50 px-3 text-[13px] text-[var(--ds-label)] outline-none focus:border-[var(--ds-accent)] focus:bg-white"
                  />
                </label>
                <label className="flex-1">
                  <span className="mb-1 block text-[11px] text-[var(--ds-secondary-label)]">End date</span>
                  <input
                    type="date"
                    value={end}
                    min={start || stageStart}
                    max={stageEnd}
                    onChange={(e) => setEnd(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[rgba(90,60,30,0.18)] bg-[var(--ds-bg)]/50 px-3 text-[13px] text-[var(--ds-label)] outline-none focus:border-[var(--ds-accent)] focus:bg-white"
                  />
                </label>
              </div>
              {stageStart && stageEnd && (
                <p className="mt-2 text-[11px] text-[var(--ds-secondary-label)]">
                  Must fall within the stage period: {new Date(stageStart).toLocaleDateString()} –{" "}
                  {new Date(stageEnd).toLocaleDateString()}
                </p>
              )}
              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--ds-accent)] text-[13px] font-semibold text-white transition-colors hover:bg-[var(--ds-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus size={15} />
                {isSaving ? "Creating…" : "Add milestone"}
              </button>
            </>
          )}
        </form>
      </div>
    </>
  );
}

function MilestoneRow({
  name,
  task,
  isEditing,
  editName,
  editStart,
  editEnd,
  isSaving,
  stageStart,
  stageEnd,
  busy,
  onEdit,
  onCancel,
  onSave,
  onChangeName,
  onChangeStart,
  onChangeEnd,
  onComplete,
  onReopen,
}: {
  id: string;
  name: string;
  task?: Task;
  isEditing: boolean;
  editName: string;
  editStart: string;
  editEnd: string;
  isSaving: boolean;
  stageStart?: string;
  stageEnd?: string;
  busy: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChangeName: (v: string) => void;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  onComplete: () => void;
  onReopen: () => void;
}) {
  if (isEditing) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-[var(--ds-accent)]/45 bg-[#F5E6D0]/25 p-3">
        <input
          value={editName}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Milestone name"
          className="h-9 rounded-lg border border-[rgba(90,60,30,0.18)] bg-white px-3 text-[13px] text-[var(--ds-label)] outline-none focus:border-[var(--ds-accent)]"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={editStart}
            min={stageStart}
            max={stageEnd}
            onChange={(e) => onChangeStart(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-[rgba(90,60,30,0.18)] bg-white px-3 text-[13px] text-[var(--ds-label)] outline-none focus:border-[var(--ds-accent)]"
          />
          <input
            type="date"
            value={editEnd}
            min={editStart || stageStart}
            max={stageEnd}
            onChange={(e) => onChangeEnd(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-[rgba(90,60,30,0.18)] bg-white px-3 text-[13px] text-[var(--ds-label)] outline-none focus:border-[var(--ds-accent)]"
          />
        </div>
        {stageStart && stageEnd && (
          <p className="text-[11px] text-[var(--ds-secondary-label)]">
            Within stage: {new Date(stageStart).toLocaleDateString()} –{" "}
            {new Date(stageEnd).toLocaleDateString()}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="h-8 flex-1 rounded-lg bg-[var(--ds-accent)] text-[12.5px] font-semibold text-white transition-colors hover:bg-[var(--ds-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="h-8 flex-1 rounded-lg border border-[rgba(90,60,30,0.18)] bg-white text-[12.5px] font-medium text-[var(--ds-secondary-label)] transition-colors hover:bg-[var(--ds-bg)]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const range = task
    ? `${new Date(task.start_date).toLocaleDateString()} – ${new Date(resolveTaskEndDateIso(task)).toLocaleDateString()}`
    : null;
  const isCompleted = task?.status === "COMPLETED";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[rgba(90,60,30,0.10)] bg-white px-3.5 py-2.5 shadow-sm">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full ${
            isCompleted ? "bg-[#3D8B5E] text-white" : "bg-[#F5E6D0] text-[var(--ds-accent-hover)]"
          }`}
        >
          <Flag size={11} />
        </span>
        <div className="min-w-0">
          <div
            className={`truncate text-[13px] font-medium ${
              isCompleted ? "text-[#248A3D]" : "text-[var(--ds-label)]"
            }`}
          >
            {name}
          </div>
          {range && <div className="text-[11px] text-[var(--ds-secondary-label)]">{range}</div>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {isCompleted ? (
          <button
            type="button"
            onClick={onReopen}
            disabled={busy}
            title="Reopen milestone"
            className="flex items-center gap-1 rounded-lg border border-[rgba(90,60,30,0.22)] bg-white px-2 py-1.5 text-[11px] font-medium text-[var(--ds-secondary-label)] transition-colors hover:bg-[var(--ds-bg)] disabled:opacity-50"
          >
            <RotateCcw size={11} /> Reopen
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            disabled={busy}
            title="Mark milestone complete"
            className="flex items-center gap-1 rounded-lg border border-[#3D8B5E]/30 bg-[#3D8B5E]/8 px-2 py-1.5 text-[11px] font-medium text-[#248A3D] transition-colors hover:bg-[#3D8B5E]/15 disabled:opacity-50"
          >
            <Check size={11} /> Complete
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          title="Edit milestone"
          className="flex size-8 items-center justify-center rounded-lg text-[var(--ds-accent-hover)] transition-colors hover:bg-[var(--ds-bg)]"
        >
          <Pencil size={13} />
        </button>
      </div>
    </div>
  );
}
