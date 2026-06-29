"use client";

import { useState } from "react";
import { Check, PauseCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetCloseButton, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TaskHoldRequestDialog } from "@/components/projects/tasks/task-hold-request-dialog";
import { useTaskHoldRequests } from "@/hooks/use-task-hold-requests";
import { useTaskSubtasks } from "@/hooks/use-task-subtasks";
import {
  formatHoldDate,
  holdRequestStatusLabel,
  holdRequestStatusStyle,
} from "@/lib/hold-requests/display";
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
  currentUserId,
  members,
  onUpdateAssignees,
  onMarkMyCompletion,
}: {
  task: ProjectTaskView | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  currentUserId?: string;
  members: User[];
  onUpdateAssignees: (taskId: string, userIds: string[]) => Promise<unknown>;
  onMarkMyCompletion?: (taskId: string, completed: boolean) => Promise<void>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [showHoldDialog, setShowHoldDialog] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskAssignees, setNewSubtaskAssignees] = useState<string[]>([]);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [busySubtaskId, setBusySubtaskId] = useState<string | null>(null);

  const {
    holds,
    pendingHold,
    isLoading: holdsLoading,
    createHoldRequest,
  } = useTaskHoldRequests(task?.id ?? null, open);

  const {
    subtasks,
    isLoading: subtasksLoading,
    createSubtask,
    markSubtaskMyCompletion,
  } = useTaskSubtasks(task, open);

  if (!task) return null;

  const subtaskDoneCount = subtasks.filter((s) => s.apiStatus === "COMPLETED").length;

  async function handleAddSubtask() {
    if (!newSubtaskTitle.trim()) return;
    setIsAddingSubtask(true);
    try {
      await createSubtask({ title: newSubtaskTitle, assigneeUserIds: newSubtaskAssignees });
      setNewSubtaskTitle("");
      setNewSubtaskAssignees([]);
      toast.success("Subtask added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add subtask");
    } finally {
      setIsAddingSubtask(false);
    }
  }

  async function handleSubtaskMyCompletion(subtaskId: string, completed: boolean) {
    setBusySubtaskId(subtaskId);
    try {
      await markSubtaskMyCompletion(subtaskId, completed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update subtask");
    } finally {
      setBusySubtaskId(null);
    }
  }

  function toggleNewSubtaskAssignee(userId: string) {
    setNewSubtaskAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  const isAssigned = currentUserId
    ? task.assignees.some((a) => a.userId === currentUserId)
    : false;
  const myRecord = task.assignees.find((a) => a.userId === currentUserId);
  const iHaveCompleted = !!myRecord?.completedAt;

  const canRequestHold = isAssigned && !pendingHold && task.status !== "done";

  const completedCount = task.assignees.filter((a) => a.completedAt).length;
  const totalCount = task.assignees.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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

  async function handleMarkDone() {
    if (!onMarkMyCompletion) return;
    setIsSaving(true);
    try {
      await onMarkMyCompletion(task!.id, !iHaveCompleted);
      toast.success(iHaveCompleted ? "Marked as incomplete" : "Marked as done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update completion");
    } finally {
      setIsSaving(false);
    }
  }

  const column = BOARD_COLUMNS.find((c) => c.id === task.status)!;

  return (
    <>
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

            {/* Individual progress section */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-[#9C8573] uppercase">
                  Assignees · {completedCount}/{totalCount} done
                </span>
                {isAssigned && task.status !== "done" && onMarkMyCompletion && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => void handleMarkDone()}
                    className={`h-7 gap-1 text-xs ${
                      iHaveCompleted
                        ? "border border-[rgba(90,60,30,0.22)] bg-transparent text-[#6C6C70]"
                        : "bg-[#3D8B5E] text-white hover:bg-[#2D7A4E]"
                    }`}
                  >
                    <Check className="size-3" />
                    {iHaveCompleted ? "Undo my done" : "Mark my part done"}
                  </Button>
                )}
              </div>

              {/* Progress bar */}
              {totalCount > 0 && (
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[#EDE3D4]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPct}%`,
                      background: progressPct === 100 ? "#3D8B5E" : "#D4A96A",
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                {members.map((m) => {
                  const assigneeView = task.assignees.find((a) => a.userId === m.id);
                  const selected = !!assigneeView;
                  const done = !!assigneeView?.completedAt;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!canManage || isSaving}
                      onClick={() => void toggleAssignee(m.id)}
                      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left ${
                        selected ? "border-[#D4A96A] bg-[#F5E6D0]/40" : "border-border"
                      }`}
                    >
                      <TaskUserAvatar initials={`${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`} size={24} />
                      <span className="flex-1 text-sm">
                        {m.first_name} {m.last_name}
                      </span>
                      {selected && (
                        <span
                          title={done ? "Completed" : "In progress"}
                          className={`flex size-5 items-center justify-center rounded-full ${
                            done ? "bg-[#3D8B5E]" : "bg-[#EDE3D4]"
                          }`}
                        >
                          <Check className={`size-3 ${done ? "text-white" : "text-[#C4B5A5]"}`} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-[#9C8573] uppercase">Hold requests</span>
                {canRequestHold && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 border-[rgba(90,60,30,0.22)] text-xs text-[#6B5744]"
                    onClick={() => setShowHoldDialog(true)}
                  >
                    <PauseCircle className="size-3.5" />
                    Request hold
                  </Button>
                )}
              </div>

              {holdsLoading && (
                <p className="text-xs text-[#9C8573]">Loading hold requests…</p>
              )}

              {!holdsLoading && pendingHold && (
                <div className="rounded-lg border border-[#D4A96A]/30 bg-[#F5E6D0]/30 px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="border-0 text-[11px]"
                      style={{
                        background: holdRequestStatusStyle(pendingHold.status).bg,
                        color: holdRequestStatusStyle(pendingHold.status).color,
                      }}
                    >
                      {holdRequestStatusLabel(pendingHold.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#1A1410]">{pendingHold.reason}</p>
                  <p className="mt-1 text-xs text-[#9C8573]">
                    {formatHoldDate(pendingHold.requestedStartDate)} –{" "}
                    {formatHoldDate(pendingHold.requestedEndDate)}
                  </p>
                </div>
              )}

              {!holdsLoading && !pendingHold && holds.length === 0 && (
                <p className="text-xs text-[#9C8573]">
                  {isAssigned
                    ? "No hold requests for this task yet."
                    : "Hold requests can be submitted by assigned members."}
                </p>
              )}

              {!holdsLoading && holds.filter((h) => h.status !== "PENDING").length > 0 && (
                <div className="mt-2 space-y-2">
                  {holds
                    .filter((h) => h.status !== "PENDING")
                    .map((hold) => {
                      const style = holdRequestStatusStyle(hold.status);
                      return (
                        <div
                          key={hold.id}
                          className="rounded-lg border border-[rgba(90,60,30,0.10)] bg-[#F5EFE6]/60 px-3 py-2"
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="border-0 text-[11px]"
                              style={{ background: style.bg, color: style.color }}
                            >
                              {holdRequestStatusLabel(hold.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#6B5744]">{hold.reason}</p>
                          <p className="mt-1 text-xs text-[#9C8573]">
                            {formatHoldDate(hold.requestedStartDate)} –{" "}
                            {formatHoldDate(hold.requestedEndDate)}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium tracking-wide text-[#9C8573] uppercase">
                  Subtasks {subtasks.length > 0 ? `· ${subtaskDoneCount}/${subtasks.length} done` : "(optional)"}
                </span>
              </div>
              <p className="mb-2 text-[11px] text-[#9C8573]">
                Subtasks are optional and can have their own assignees. When every subtask is
                completed, this task completes automatically.
              </p>

              {subtasksLoading && <p className="text-xs text-[#9C8573]">Loading subtasks…</p>}

              {!subtasksLoading && subtasks.length > 0 && (
                <div className="mb-3 space-y-2">
                  {subtasks.map((st) => {
                    const myRec = st.assignees.find((a) => a.userId === currentUserId);
                    const iAmOnSubtask = !!myRec;
                    const iDidMyPart = !!myRec?.completedAt;
                    const done = st.apiStatus === "COMPLETED";
                    const doneAssignees = st.assignees.filter((a) => a.completedAt).length;
                    return (
                      <div
                        key={st.id}
                        className={`rounded-lg border px-3 py-2 ${done ? "border-[#3D8B5E]/30 bg-[#3D8B5E]/5" : "border-border bg-[#F5EFE6]"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex size-4 shrink-0 items-center justify-center rounded-full ${done ? "bg-[#3D8B5E]" : "bg-[#EDE3D4]"}`}
                          >
                            <Check className={`size-2.5 ${done ? "text-white" : "text-[#C4B5A5]"}`} />
                          </span>
                          <span className={`flex-1 text-sm ${done ? "text-[#6C6C70] line-through" : "text-[#1A1410]"}`}>
                            {st.title}
                          </span>
                          {st.assignees.length > 0 && (
                            <span className="text-[11px] text-[#9C8573]">
                              {doneAssignees}/{st.assignees.length}
                            </span>
                          )}
                          <div className="flex -space-x-1.5">
                            {st.assignees.slice(0, 3).map((a) => (
                              <TaskUserAvatar key={a.userId} initials={a.initials} size={20} />
                            ))}
                          </div>
                        </div>
                        {iAmOnSubtask && !done && (
                          <div className="mt-2 flex justify-end">
                            <Button
                              type="button"
                              size="sm"
                              disabled={busySubtaskId === st.id}
                              onClick={() => void handleSubtaskMyCompletion(st.id, !iDidMyPart)}
                              className={`h-6 gap-1 text-[11px] ${
                                iDidMyPart
                                  ? "border border-[rgba(90,60,30,0.22)] bg-transparent text-[#6C6C70]"
                                  : "bg-[#3D8B5E] text-white hover:bg-[#2D7A4E]"
                              }`}
                            >
                              <Check className="size-2.5" />
                              {iDidMyPart ? "Undo my part" : "Mark my part done"}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {canManage && (
                <div className="space-y-2 rounded-lg border border-dashed border-[rgba(90,60,30,0.22)] p-3">
                  <input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="New subtask title"
                    className="h-8 w-full rounded-md border border-input bg-[#F5EFE6] px-2.5 text-sm outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {members.map((m) => {
                      const selected = newSubtaskAssignees.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleNewSubtaskAssignee(m.id)}
                          className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] ${selected ? "border-[#D4A96A] bg-[#F5E6D0]" : "border-border bg-[#F5EFE6]"}`}
                        >
                          <TaskUserAvatar initials={`${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`} size={14} />
                          {m.first_name || m.email}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!newSubtaskTitle.trim() || isAddingSubtask}
                    onClick={() => void handleAddSubtask()}
                    className="h-7 gap-1 border-[rgba(90,60,30,0.22)] text-xs text-[#6B5744]"
                  >
                    <Plus className="size-3" />
                    {isAddingSubtask ? "Adding…" : "Add subtask"}
                  </Button>
                </div>
              )}
            </div>

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </SheetBody>
        </SheetContent>
      </Sheet>

      {showHoldDialog && (
        <TaskHoldRequestDialog
          open={showHoldDialog}
          onOpenChange={setShowHoldDialog}
          task={task}
          onSubmit={createHoldRequest}
        />
      )}
    </>
  );
}
