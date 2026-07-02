"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useUpdateProject } from "@/hooks/use-update-project";
import { useUploadFile } from "@/hooks/use-upload-file";
import type { ProjectImage } from "@/types/projects";

export function ProjectImageGallery({
  projectId,
  images,
  canEdit,
  onUpdated,
}: {
  projectId: string;
  images: ProjectImage[];
  canEdit: boolean;
  onUpdated?: () => void | Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUploadFile();
  const { updateProject } = useUpdateProject(projectId);
  const [isUploading, setIsUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Please choose image files");
      return;
    }

    setIsUploading(true);
    try {
      const tokens: string[] = [];
      for (const file of imageFiles) {
        const { token } = await uploadFile(file);
        tokens.push(token);
      }
      await updateProject({
        images: [...images.map((img) => ({ id: img.id })), ...tokens.map((id) => ({ id }))],
      });
      toast.success(imageFiles.length > 1 ? "Photos added" : "Photo added");
      await onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photos");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove(imageId: string) {
    setRemovingId(imageId);
    try {
      const remaining = images.filter((img) => img.id !== imageId).map((img) => ({ id: img.id }));
      await updateProject({ images: remaining });
      toast.success("Photo removed");
      await onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="project-gallery-section">
      <div className="project-gallery-header">
        <h3 className="project-gallery-title">Project gallery</h3>
        {canEdit ? (
          <div className="project-gallery-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => void handleFilesSelected(e.target.files)}
            />
            <button
              type="button"
              className="project-gallery-add-btn"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
              {isUploading ? "Uploading…" : "Add photos"}
            </button>
          </div>
        ) : null}
      </div>

      {images.length === 0 ? (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
            padding: "24px",
            fontSize: "13px",
            color: "#8E8E93",
            textAlign: "center",
          }}
        >
          No project photos yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              style={{
                position: "relative",
                aspectRatio: "4 / 3",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#E8DFD3",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
              }}
            >
              <img
                src={image.url}
                alt={`Project photo ${index + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {index === 0 ? (
                <span
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#fff",
                    background: "rgba(28,28,30,0.55)",
                    padding: "3px 8px",
                    borderRadius: "9999px",
                  }}
                >
                  Cover
                </span>
              ) : null}
              {canEdit ? (
                <button
                  type="button"
                  title="Remove photo"
                  disabled={removingId === image.id}
                  onClick={() => void handleRemove(image.id)}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    border: "none",
                    background: "rgba(28,28,30,0.55)",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {removingId === image.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
