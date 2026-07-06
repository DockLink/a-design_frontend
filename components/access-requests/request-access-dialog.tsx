"use client";

import { useState } from "react";

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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RequestAccessDialog({
  open,
  onOpenChange,
  projectName,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onSubmit: (note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit() {
    setIsSaving(true);
    try {
      await onSubmit(note.trim() || undefined);
      setNote("");
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[rgba(90,60,30,0.10)] bg-[var(--ds-surface-elevated)]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <DialogTitle>Request access</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>
        <DialogBody className="space-y-3">
          <p className="text-sm text-[var(--ds-secondary-label)]">
            Ask the project team for access to <strong>{projectName}</strong>. A team lead or admin
            will review your request.
          </p>
          <div>
            <Label className="mb-1.5 text-xs text-[var(--ds-secondary-label)]">Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why do you need access to this project?"
              className="min-h-[72px] resize-none border-[var(--ds-separator)] bg-[var(--ds-bg)]"
            />
          </div>
        </DialogBody>
        <DialogFooter className="border-[rgba(90,60,30,0.10)] bg-[var(--ds-bg)]">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving}
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
