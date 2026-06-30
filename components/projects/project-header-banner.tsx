"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useUpdateProject } from "@/hooks/use-update-project";
import { useUploadFile } from "@/hooks/use-upload-file";
import { projectThumbnailUrl } from "@/lib/projects/map-projects";
import type { ProjectImage } from "@/types/projects";

export function ProjectHeaderBanner({
  projectId,
  projectName,
  images,
  canEdit = false,
  onUpdated,
}: {
  projectId: string;
  projectName: string;
  images: ProjectImage[];
  canEdit?: boolean;
  onUpdated?: () => void | Promise<void>;
}) {
  const src = projectThumbnailUrl(images);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUploadFile();
  const { updateProject } = useUpdateProject(projectId);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileSelected(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setIsUploading(true);
    try {
      const { token } = await uploadFile(file);
      await updateProject({ images: [{ id: token }] });
      toast.success("Project thumbnail updated");
      await onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update thumbnail");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div
      style={{
        position: "relative",
        height: "200px",
        margin: "0 -28px",
        backgroundColor: "#E8DFD3",
        backgroundImage: src ? `url(${src})` : undefined,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(28,28,30,0.05) 0%, rgba(28,28,30,0.55) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "28px",
          right: "28px",
          bottom: "18px",
          color: "#FFFFFF",
        }}
      >
        <div style={{ fontSize: "22px", fontWeight: 600, textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
          {projectName}
        </div>
      </div>

      {canEdit && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => void handleFileSelected(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Change thumbnail"
            style={{
              position: "absolute",
              top: "16px",
              right: "28px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.4)",
              background: "rgba(28,28,30,0.45)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: "#FFFFFF",
              fontSize: "13px",
              fontWeight: 500,
              cursor: isUploading ? "default" : "pointer",
              opacity: isUploading ? 0.7 : 1,
            }}
          >
            {isUploading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Camera size={15} />
            )}
            {isUploading ? "Uploading…" : "Change image"}
          </button>
        </>
      )}
    </div>
  );
}
