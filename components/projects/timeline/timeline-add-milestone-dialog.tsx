"use client";

import { useEffect, useState } from "react";
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
import type { ProjectStageView } from "@/lib/projects/map-stages";
import { stageColor } from "@/lib/projects/timeline";

export function TimelineAddMilestoneDialog({
  open,
  onOpenChange,
  stages,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: ProjectStageView[];
  onSave: (input: {
    title: string;
    description?: string;
    stageId: string;
    startDate: string;
    endDate: string;
    completed?: boolean;
  }) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stageId, setStageId] = useState(stages[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [completed, setCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const today = new Date().toISOString().slice(0, 10);
    const inTwoWeeks = new Date();
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
    setTitle("");
    setDescription("");
    setStageId(stages[0]?.id ?? "");
    setStartDate(today);
    setEndDate(inTwoWeeks.toISOString().slice(0, 10));
    setCompleted(false);
  }, [open, stages]);

  const selectedStage = stages.find((s) => s.id === stageId);
  const stageStart = selectedStage ? selectedStage.startDate.slice(0, 10) : undefined;
  const stageEnd = selectedStage ? selectedStage.endDate.slice(0, 10) : undefined;

  const canSubmit = Boolean(title.trim() && stageId && startDate && endDate);

  async function handleSave() {
    if (!canSubmit) return;
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be on or after the start date");
      return;
    }
    if (stageStart && stageEnd && (startDate < stageStart || endDate > stageEnd)) {
      toast.error(
        `Milestone must fall within the stage period (${new Date(stageStart).toLocaleDateString()} – ${new Date(stageEnd).toLocaleDateString()})`
      );
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        stageId,
        startDate,
        endDate,
        completed,
      });
      toast.success("Milestone created");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create milestone");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[rgba(90,60,30,0.10)] bg-[#FDFAF6]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <DialogTitle>Add milestone</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <DialogBody className="space-y-3.5">
          {stages.length === 0 ? (
            <p className="text-sm text-[#9C8573]">
              Create project stages on the overview first, then add milestones here.
            </p>
          ) : (
            <>
              <div>
                <Label className="mb-1.5 text-xs text-[#6B5744]">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Milestone title…"
                  className="h-9 border-[rgba(90,60,30,0.12)] bg-[#F5EFE6]"
                />
              </div>

              <div>
                <Label className="mb-1.5 text-xs text-[#6B5744]">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description…"
                  className="min-h-[60px] resize-none border-[rgba(90,60,30,0.12)] bg-[#F5EFE6]"
                />
              </div>

              <div>
                <Label className="mb-1.5 text-xs text-[#6B5744]">Stage</Label>
                <div className="flex flex-wrap gap-1 rounded-lg bg-[#F5EFE6] p-1">
                  {stages.map((s, index) => {
                    const active = stageId === s.id;
                    const color = stageColor(index);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStageId(s.id)}
                        className={`h-8 flex-1 truncate rounded-md px-2 text-[11px] ${active ? "border bg-[#FDFAF6] font-medium" : "text-[#9C8573]"}`}
                        style={
                          active
                            ? { borderColor: "rgba(90,60,30,0.14)", color }
                            : undefined
                        }
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 text-xs text-[#6B5744]">Start date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    min={stageStart}
                    max={stageEnd}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 border-[rgba(90,60,30,0.12)] bg-[#F5EFE6]"
                  />
                </div>
                <div>
                  <Label className="mb-1.5 text-xs text-[#6B5744]">End date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate || stageStart}
                    max={stageEnd}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 border-[rgba(90,60,30,0.12)] bg-[#F5EFE6]"
                  />
                </div>
              </div>
              {stageStart && stageEnd && (
                <p className="text-[11px] text-[#9C8573]">
                  Must fall within the stage period: {new Date(stageStart).toLocaleDateString()} – {new Date(stageEnd).toLocaleDateString()}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[13px] text-[#6B5744]">Mark as completed</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={completed}
                  onClick={() => setCompleted((c) => !c)}
                  className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors ${completed ? "bg-[#D4A96A]" : "bg-[rgba(90,60,30,0.18)]"}`}
                >
                  <span
                    className={`absolute top-[3px] size-4 rounded-full bg-white shadow transition-[left] ${completed ? "left-[21px]" : "left-[3px]"}`}
                  />
                </button>
              </div>
            </>
          )}
        </DialogBody>

        <DialogFooter className="border-[rgba(90,60,30,0.10)] bg-[#F5EFE6]">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canSubmit || isSaving || stages.length === 0}
            onClick={() => void handleSave()}
            className="bg-[#D4A96A] text-white hover:bg-[#C9894A]"
          >
            {isSaving ? "Saving…" : "Save milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
