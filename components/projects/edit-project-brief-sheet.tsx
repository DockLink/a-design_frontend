"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import {
  ProjectBriefAttachmentsList,
  ProjectBriefAttachmentsEmptyHint,
  ProjectBriefUploadButton,
} from "@/components/projects/project-brief-attachments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUpdateProject } from "@/hooks/use-update-project";
import { useUploadFile } from "@/hooks/use-upload-file";
import type { ProjectBriefAttachment } from "@/types/projects";

export function EditProjectBriefSheet({
  projectId,
  brief,
  attachments,
  open,
  onClose,
  onSaved,
}: {
  projectId: string;
  brief: string;
  attachments: ProjectBriefAttachment[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { updateProject } = useUpdateProject(projectId);
  const { uploadFile } = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(brief);
  const [items, setItems] = useState<ProjectBriefAttachment[]>(attachments);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setText(brief);
    setItems(attachments);
  }, [brief, attachments]);

  if (!open) return null;

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return;

    setIsUploading(true);
    try {
      const uploaded: ProjectBriefAttachment[] = [];
      for (const file of Array.from(files)) {
        const { token } = await uploadFile(file);
        uploaded.push({
          id: token,
          url: "",
          file_name: file.name,
          mime_type: file.type || null,
        });
      }
      setItems((prev) => [...prev, ...uploaded]);
      toast.success(uploaded.length > 1 ? "Files added" : "File added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProject({
        description: text.trim() || undefined,
        brief_attachments: items.map((item) => ({ id: item.id })),
      });
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
          width: "min(420px, 100vw)",
          height: "calc(100vh - 52px)",
          background: "var(--ds-surface-elevated)",
          borderLeft: "1px solid var(--ds-separator)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ds-separator)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "17px", fontWeight: 500 }}>Edit brief</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Label htmlFor="brief-text">Project brief</Label>
            <textarea
              id="brief-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              style={{
                minHeight: "160px",
                borderRadius: "8px",
                border: "1px solid rgba(90,60,30,0.15)",
                background: "var(--ds-bg)",
                padding: "10px",
                fontSize: "13px",
                lineHeight: 1.6,
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <Label>Attachments</Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => void handleFilesSelected(e.target.files)}
              />
              <ProjectBriefUploadButton
                isUploading={isUploading}
                disabled={isSaving}
                onClick={() => fileInputRef.current?.click()}
              />
            </div>
            {items.length === 0 ? <ProjectBriefAttachmentsEmptyHint /> : null}
            <ProjectBriefAttachmentsList attachments={items} canEdit onRemove={handleRemove} />
          </div>

          <Button type="submit" disabled={isSaving || isUploading} className="mt-auto h-9 w-full bg-[var(--ds-accent)] hover:bg-[#C4956A]">
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </form>
      </aside>
    </>
  );
}
