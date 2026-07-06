"use client";

import { ExternalLink, Loader2, Paperclip, Trash2, Upload } from "lucide-react";

import { attachmentDisplayName, attachmentIcon } from "@/lib/projects/brief-attachments";
import type { ProjectBriefAttachment } from "@/types/projects";

export function ProjectBriefAttachmentsList({
  attachments,
  canEdit,
  onRemove,
  removingId,
}: {
  attachments: ProjectBriefAttachment[];
  canEdit?: boolean;
  onRemove?: (id: string) => void;
  removingId?: string | null;
}) {
  if (attachments.length === 0) {
    return (
      <div style={{ fontSize: "12px", color: "var(--ds-tertiary-label)", marginTop: "10px" }}>
        No files attached yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
      {attachments.map((file) => {
        const Icon = attachmentIcon(file.mime_type);
        return (
          <div
            key={file.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "10px",
              background: "rgba(60,60,67,0.04)",
              border: "0.5px solid rgba(60,60,67,0.08)",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(212,169,106,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "var(--ds-accent-hover)",
              }}
            >
              <Icon size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--ds-label)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {attachmentDisplayName(file)}
              </div>
              {file.mime_type ? (
                <div style={{ fontSize: "11px", color: "var(--ds-tertiary-label)", marginTop: "2px" }}>{file.mime_type}</div>
              ) : null}
            </div>
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open file"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#6C6C70",
                flexShrink: 0,
              }}
            >
              <ExternalLink size={14} />
            </a>
            {canEdit && onRemove ? (
              <button
                type="button"
                title="Remove file"
                disabled={removingId === file.id}
                onClick={() => onRemove(file.id)}
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  border: "none",
                  background: "rgba(60,60,67,0.06)",
                  color: "#6C6C70",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {removingId === file.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function ProjectBriefUploadButton({
  disabled,
  isUploading,
  onClick,
}: {
  disabled?: boolean;
  isUploading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="project-brief-upload-btn"
      disabled={disabled || isUploading}
      onClick={onClick}
    >
      {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
      {isUploading ? "Uploading…" : "Upload files"}
    </button>
  );
}

export function ProjectBriefAttachmentsEmptyHint() {
  return (
    <div
      style={{
        marginTop: "10px",
        padding: "14px",
        borderRadius: "10px",
        border: "1px dashed rgba(90,60,30,0.18)",
        background: "rgba(247,241,235,0.5)",
        fontSize: "12px",
        color: "var(--ds-tertiary-label)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <Paperclip size={14} />
      Attach PDFs, audio, images, or any project reference files.
    </div>
  );
}
