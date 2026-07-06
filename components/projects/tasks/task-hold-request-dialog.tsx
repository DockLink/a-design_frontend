"use client";

import { useEffect, useMemo, useState } from "react";
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
import { formatBoardDate } from "@/lib/tasks/task-board";
import type { ProjectTaskView } from "@/lib/tasks/task-board";

function clampDate(dateIso: string, min: string, max: string): string {
  if (dateIso < min) return min;
  if (dateIso > max) return max;
  return dateIso;
}

function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function TaskHoldRequestDialog({
  open,
  onOpenChange,
  task,
  stageRange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: ProjectTaskView;
  stageRange?: { start: string; end: string } | null;
  onSubmit: (input: {
    taskId: string;
    reason: string;
    startDate: string;
    endDate: string;
    note?: string;
  }) => Promise<unknown>;
}) {
  // A hold may fall OUTSIDE the milestone/task window, but must stay within the
  // parent STAGE range. Fall back to the task's own window if the stage range
  // isn't available.
  const hasStage = Boolean(stageRange);
  const taskStart = stageRange ? stageRange.start.slice(0, 10) : task.startDate.slice(0, 10);
  const taskEnd = stageRange ? stageRange.end.slice(0, 10) : task.dueDate;
  const windowLabel = hasStage ? "stage" : "task";
  const today = new Date().toISOString().slice(0, 10);

  const defaultStart = useMemo(
    () => clampDate(today < taskStart ? taskStart : today, taskStart, taskEnd),
    [today, taskStart, taskEnd]
  );
  const defaultEnd = useMemo(() => {
    const suggested = addDays(defaultStart, 3);
    return clampDate(suggested < defaultStart ? addDays(defaultStart, 1) : suggested, taskStart, taskEnd);
  }, [defaultStart, taskStart, taskEnd]);

  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setNote("");
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  }, [open, defaultStart, defaultEnd]);

  const canSubmit = Boolean(reason.trim() && startDate && endDate);

  async function handleSubmit() {
    if (!canSubmit) return;
    if (endDate < startDate) {
      toast.error("End date must be on or after the start date");
      return;
    }
    if (startDate < taskStart || startDate > taskEnd) {
      toast.error(`Hold must start within the ${windowLabel} period (${formatBoardDate(taskStart)} – ${formatBoardDate(taskEnd)})`);
      return;
    }
    if (endDate > taskEnd) {
      toast.error(`Hold must end within the ${windowLabel} period (${formatBoardDate(taskStart)} – ${formatBoardDate(taskEnd)})`);
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        taskId: task.id,
        reason: reason.trim(),
        startDate,
        endDate,
        note: note.trim() || undefined,
      });
      toast.success("Hold request submitted");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit hold request");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[rgba(90,60,30,0.10)] bg-[var(--ds-surface-elevated)]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <DialogTitle>Request task hold</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <DialogBody className="space-y-3.5">
          <p className="text-sm text-[var(--ds-secondary-label)]">
            Request a pause on <span className="font-medium text-[var(--ds-label)]">{task.title}</span>. The hold
            period must fall within the {windowLabel} window ({formatBoardDate(taskStart)} – {formatBoardDate(taskEnd)}).
          </p>

          <div>
            <Label className="mb-1.5 text-xs text-[var(--ds-secondary-label)]">Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why does this task need to be on hold?"
              className="min-h-[72px] resize-none border-[var(--ds-separator)] bg-[var(--ds-bg)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 text-xs text-[var(--ds-secondary-label)]">Hold starts</Label>
              <Input
                type="date"
                min={taskStart}
                max={taskEnd}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 border-[var(--ds-separator)] bg-[var(--ds-bg)]"
              />
            </div>
            <div>
              <Label className="mb-1.5 text-xs text-[var(--ds-secondary-label)]">Hold ends</Label>
              <Input
                type="date"
                min={startDate || taskStart}
                max={taskEnd}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 border-[var(--ds-separator)] bg-[var(--ds-bg)]"
              />
            </div>
          </div>

          <div>
            <Label className="mb-1.5 text-xs text-[var(--ds-secondary-label)]">Additional note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any extra context for the reviewer…"
              className="min-h-[56px] resize-none border-[var(--ds-separator)] bg-[var(--ds-bg)]"
            />
          </div>
        </DialogBody>

        <DialogFooter className="border-[rgba(90,60,30,0.10)] bg-[var(--ds-bg)]">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || isSaving}
            onClick={() => void handleSubmit()}
            className="bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)]"
          >
            {isSaving ? "Submitting…" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
