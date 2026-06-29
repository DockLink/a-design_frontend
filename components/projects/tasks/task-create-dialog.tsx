"use client";

import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BOARD_COLUMNS,
  apiStatusFromBoard,
  type BoardColumnId,
} from "@/lib/tasks/task-board";
import type { ProjectStageView } from "@/lib/projects/map-stages";
import type { TaskablePriority } from "@/types/tasks";
import type { User } from "@/types/users";

import { TaskUserAvatar } from "./task-user-avatar";

function memberLabel(m: User): string {
  return [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email;
}

function memberInitials(m: User): string {
  return `${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`.toUpperCase() || (m.email[0]?.toUpperCase() ?? "?");
}

/** Dropdown to pick assignees; selected members shown as removable chips. */
function AssigneePicker({
  members,
  selectedIds,
  onChange,
  placeholder = "Add assignee…",
}: {
  members: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const available = members.filter((m) => !selectedIds.includes(m.id));
  const selected = members.filter((m) => selectedIds.includes(m.id));

  return (
    <div className="space-y-1.5">
      <select
        value=""
        onChange={(e) => {
          if (e.target.value) onChange([...selectedIds, e.target.value]);
        }}
        disabled={available.length === 0}
        className="h-9 w-full rounded-lg border border-input bg-[#F5EFE6] px-3 text-sm disabled:opacity-50"
      >
        <option value="">
          {available.length === 0 ? "All members added" : placeholder}
        </option>
        {available.map((m) => (
          <option key={m.id} value={m.id}>
            {memberLabel(m)}
          </option>
        ))}
      </select>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((m) => (
            <span
              key={m.id}
              className="flex items-center gap-1.5 rounded-md border border-[#D4A96A] bg-[#F5E6D0] px-2 py-1 text-xs"
            >
              <TaskUserAvatar initials={memberInitials(m)} size={16} />
              {memberLabel(m)}
              <button
                type="button"
                onClick={() => onChange(selectedIds.filter((id) => id !== m.id))}
                className="text-[#9C8573] hover:text-[#6B5744]"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface SubtaskDraft {
  title: string;
  assigneeIds: string[];
}

export function TaskCreateDialog({
  open,
  onOpenChange,
  defaultStatus,
  stages,
  milestones,
  milestoneParents,
  members,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus: BoardColumnId;
  stages: ProjectStageView[];
  milestones: { id: string; name: string }[];
  milestoneParents: Record<string, { stageId: string; stageName: string }>;
  members: User[];
  onCreate: (input: {
    title: string;
    description?: string;
    stageId?: string;
    milestoneId?: string;
    dueDate: string;
    priority: TaskablePriority;
    status: ReturnType<typeof apiStatusFromBoard>;
    assigneeUserIds: string[];
    subtasks?: { title: string; assigneeUserIds: string[] }[];
  }) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stageId, setStageId] = useState(stages[0]?.id ?? "");
  const [milestoneId, setMilestoneId] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<TaskablePriority>("MEDIUM");
  const [status, setStatus] = useState<BoardColumnId>(defaultStatus);
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const stageMilestones = useMemo(
    () => milestones.filter((m) => milestoneParents[m.id]?.stageId === stageId),
    [milestones, milestoneParents, stageId]
  );

  function addSubtaskRow() {
    setSubtasks((prev) => [...prev, { title: "", assigneeIds: [] }]);
  }

  function updateSubtask(index: number, patch: Partial<SubtaskDraft>) {
    setSubtasks((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function removeSubtask(index: number) {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setAssigneeIds([]);
    setSubtasks([]);
  }

  async function submit() {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await onCreate({
        title,
        description,
        stageId: stageId || undefined,
        milestoneId: milestoneId || undefined,
        dueDate,
        priority,
        status: apiStatusFromBoard(status),
        assigneeUserIds: assigneeIds,
        subtasks: subtasks
          .filter((s) => s.title.trim())
          .map((s) => ({ title: s.title, assigneeUserIds: s.assigneeIds })),
      });
      toast.success("Task created");
      resetForm();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogCloseButton onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-[#F5EFE6]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea id="task-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-[#F5EFE6]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <select
                value={stageId}
                onChange={(e) => {
                  setStageId(e.target.value);
                  setMilestoneId("");
                }}
                className="h-9 w-full rounded-lg border border-input bg-[#F5EFE6] px-3 text-sm"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Milestone</Label>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-[#F5EFE6] px-3 text-sm"
                disabled={stageMilestones.length === 0}
              >
                <option value="">{stageMilestones.length === 0 ? "None — attach to stage" : "Optional"}</option>
                {stageMilestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {stageMilestones.length === 0 && (
                <p className="text-[11px] text-[#9C8573]">
                  No milestones in this stage. Add them in Manage Milestones or the Timeline tab.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-[#F5EFE6]" />
            </div>
            <div className="space-y-1.5">
              <Label>Column</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BoardColumnId)}
                className="h-9 w-full rounded-lg border border-input bg-[#F5EFE6] px-3 text-sm"
              >
                {BOARD_COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <div className="flex gap-2">
              {(["LOW", "MEDIUM", "HIGH"] as TaskablePriority[]).map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={priority === p ? "default" : "outline"}
                  onClick={() => setPriority(p)}
                >
                  {p[0]}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Assignees</Label>
            <AssigneePicker members={members} selectedIds={assigneeIds} onChange={setAssigneeIds} />
          </div>

          <div className="space-y-2 rounded-lg border border-dashed border-[rgba(90,60,30,0.22)] p-3">
            <div className="flex items-center justify-between">
              <Label>Subtasks (optional)</Label>
              <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={addSubtaskRow}>
                <Plus className="size-3" /> Add subtask
              </Button>
            </div>
            {subtasks.length === 0 ? (
              <p className="text-[11px] text-[#9C8573]">
                Break this task into subtasks. Each can have its own assignees; the task completes
                when all subtasks are done.
              </p>
            ) : (
              <div className="space-y-3">
                {subtasks.map((st, i) => (
                  <div key={i} className="space-y-1.5 rounded-md bg-[#F5EFE6]/60 p-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={st.title}
                        placeholder={`Subtask ${i + 1} title`}
                        onChange={(e) => updateSubtask(i, { title: e.target.value })}
                        className="h-8 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeSubtask(i)}
                        className="text-[#9C8573] hover:text-red-600"
                        aria-label="Remove subtask"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <AssigneePicker
                      members={members}
                      selectedIds={st.assigneeIds}
                      onChange={(ids) => updateSubtask(i, { assigneeIds: ids })}
                      placeholder="Assign subtask to…"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={!title.trim() || isSaving}>
            {isSaving ? "Creating…" : "Add task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
