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
      <DialogContent className="border-[rgba(90,60,30,0.10)] bg-[#FDFAF6]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <DialogTitle>Request access</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>
        <DialogBody className="space-y-3">
          <p className="text-sm text-[#6B5744]">
            Ask the project team for access to <strong>{projectName}</strong>. A team lead or admin
            will review your request.
          </p>
          <div>
            <Label className="mb-1.5 text-xs text-[#6B5744]">Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why do you need access to this project?"
              className="min-h-[72px] resize-none border-[rgba(90,60,30,0.12)] bg-[#F5EFE6]"
            />
          </div>
        </DialogBody>
        <DialogFooter className="border-[rgba(90,60,30,0.10)] bg-[#F5EFE6]">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => void handleSubmit()}
            className="bg-[#D4A96A] text-white hover:bg-[#C9894A]"
          >
            {isSaving ? "Submitting…" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
