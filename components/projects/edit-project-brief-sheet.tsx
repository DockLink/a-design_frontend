"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUpdateProject } from "@/hooks/use-update-project";

export function EditProjectBriefSheet({
  projectId,
  brief,
  open,
  onClose,
  onSaved,
}: {
  projectId: string;
  brief: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { updateProject } = useUpdateProject(projectId);
  const [text, setText] = useState(brief);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setText(brief);
  }, [brief]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProject({ description: text.trim() || undefined });
      toast.success("Brief updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update brief");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 29 }} />
      <aside
        style={{
          position: "fixed",
          right: 0,
          top: "52px",
          width: "360px",
          height: "calc(100vh - 52px)",
          background: "#FDFAF6",
          borderLeft: "1px solid rgba(90,60,30,0.12)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(90,60,30,0.12)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "17px", fontWeight: 500 }}>Edit brief</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <Label htmlFor="brief-text">Project brief</Label>
          <textarea
            id="brief-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={12}
            style={{ flex: 1, borderRadius: "8px", border: "1px solid rgba(90,60,30,0.15)", background: "#F5EFE6", padding: "10px", fontSize: "13px", lineHeight: 1.6 }}
          />
          <Button type="submit" disabled={isSaving} className="h-9 w-full bg-[#D4A96A] hover:bg-[#C4956A]">
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </form>
      </aside>
    </>
  );
}
