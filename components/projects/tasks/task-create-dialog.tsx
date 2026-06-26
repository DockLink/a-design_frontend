"use client";

import { useMemo, useState } from "react";
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
    milestoneId?: string;
    dueDate: string;
    priority: TaskablePriority;
    status: ReturnType<typeof apiStatusFromBoard>;
    assigneeUserIds: string[];
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
  const [isSaving, setIsSaving] = useState(false);

  const stageMilestones = useMemo(
    () => milestones.filter((m) => milestoneParents[m.id]?.stageId === stageId),
    [milestones, milestoneParents, stageId]
  );

  function toggleAssignee(userId: string) {
    setAssigneeIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  }

  async function submit() {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      await onCreate({
        title,
        description,
        milestoneId: milestoneId || undefined,
        dueDate,
        priority,
        status: apiStatusFromBoard(status),
        assigneeUserIds: assigneeIds,
      });
      toast.success("Task created");
      setTitle("");
      setDescription("");
      setAssigneeIds([]);
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
                <option value="">Optional</option>
                {stageMilestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
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
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const selected = assigneeIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleAssignee(m.id)}
                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${selected ? "border-[#D4A96A] bg-[#F5E6D0]" : "border-border bg-[#F5EFE6]"}`}
                  >
                    <TaskUserAvatar initials={`${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`} size={16} />
                    {m.first_name || m.email}
                  </button>
                );
              })}
            </div>
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
