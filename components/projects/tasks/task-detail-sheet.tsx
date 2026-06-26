"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetCloseButton, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  BOARD_COLUMNS,
  PRIORITY_DOT,
  dueDateColor,
  formatBoardDate,
  type ProjectTaskView,
} from "@/lib/tasks/task-board";
import type { User } from "@/types/users";

import { TaskUserAvatar } from "./task-user-avatar";

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  canManage,
  members,
  onUpdateAssignees,
}: {
  task: ProjectTaskView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  members: User[];
  onUpdateAssignees: (taskId: string, userIds: string[]) => Promise<unknown>;
}) {
  const [isSaving, setIsSaving] = useState(false);

  if (!task) return null;

  async function toggleAssignee(userId: string) {
    if (!canManage) return;
    const exists = task!.assignees.some((a) => a.userId === userId);
    const next = exists
      ? task!.assignees.filter((a) => a.userId !== userId).map((a) => a.userId)
      : [...task!.assignees.map((a) => a.userId), userId];
    if (next.length === 0) {
      toast.error("Task must have at least one assignee");
      return;
    }
    setIsSaving(true);
    try {
      await onUpdateAssignees(task!.id, next);
      toast.success("Assignees updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update assignees");
    } finally {
      setIsSaving(false);
    }
  }

  const column = BOARD_COLUMNS.find((c) => c.id === task.status)!;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetCloseButton onClick={() => onOpenChange(false)} />
        <SheetHeader>
          <SheetTitle>{task.title}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-5">
          {task.description && <p className="text-sm text-[#9C8573]">{task.description}</p>}

          {task.stageName && task.milestoneName && (
            <div className="text-sm text-[#6B5744]">
              <span className="text-[#9C8573]">Path · </span>
              {task.stageName} → {task.milestoneName}
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: PRIORITY_DOT[task.priority] }} />
            <Badge variant="secondary" style={{ color: column.accent }}>
              {column.label}
            </Badge>
            <span className="text-sm" style={{ color: dueDateColor(task.dueDate, task.status) }}>
              Due {formatBoardDate(task.dueDate)}
            </span>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium tracking-wide text-[#9C8573] uppercase">Assignees</div>
            <div className="space-y-2">
              {members.map((m) => {
                const selected = task.assignees.some((a) => a.userId === m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={!canManage || isSaving}
                    onClick={() => void toggleAssignee(m.id)}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left ${selected ? "border-[#D4A96A] bg-[#F5E6D0]/40" : "border-border"}`}
                  >
                    <TaskUserAvatar initials={`${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`} size={24} />
                    <span className="text-sm">{m.first_name} {m.last_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {task.subtasks.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-medium tracking-wide text-[#9C8573] uppercase">
                Subtasks ({task.subtasks.length})
              </div>
              <div className="space-y-2">
                {task.subtasks.map((st) => (
                  <div key={st.id} className="rounded-lg bg-[#F5EFE6] px-3 py-2 text-sm">
                    {st.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Status changes and hold requests are not persisted yet — the API only supports create, list, and assignee updates today.
          </p>

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
