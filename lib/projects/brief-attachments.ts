import type { LucideIcon } from "lucide-react";
import { File, FileAudio, FileImage, FileText, FileVideo } from "lucide-react";

import type { ProjectBriefAttachment } from "@/types/projects";

export function attachmentDisplayName(file: ProjectBriefAttachment): string {
  return file.file_name?.trim() || "Untitled file";
}

export function attachmentIcon(mimeType?: string | null): LucideIcon {
  const mime = mimeType ?? "";
  if (mime.startsWith("image/")) return FileImage;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.includes("pdf") || mime.includes("document") || mime.includes("text")) return FileText;
  return File;
}

export function isPreviewableAttachment(mimeType?: string | null): boolean {
  const mime = mimeType ?? "";
  return mime.startsWith("image/") || mime.startsWith("audio/") || mime.startsWith("video/") || mime.includes("pdf");
}
