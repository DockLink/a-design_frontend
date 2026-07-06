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

  const galleryImages = images.slice(1);

  return (
    <section className="project-gallery-card">
      <div className="project-gallery-card__header">
        <h3 className="project-gallery-card__title">
          <ImagePlus size={16} color="#C9894A" aria-hidden />
          Project gallery
        </h3>
        {canEdit ? (
          <>
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
          </>
        ) : null}
      </div>

      <div className="project-gallery-card__body">
        {galleryImages.length === 0 ? (
          <div className="project-gallery-empty">
            {images.length === 0 ? "No project photos yet." : "No additional photos yet."}
          </div>
        ) : (
          <div className="project-gallery-grid">
            {galleryImages.map((image, index) => (
              <div key={image.id} className="project-gallery-item">
                <img src={image.url} alt={`Project photo ${index + 2}`} />
                {canEdit ? (
                  <button
                    type="button"
                    title="Remove photo"
                    className="project-gallery-remove-btn"
                    disabled={removingId === image.id}
                    onClick={() => void handleRemove(image.id)}
                  >
                    {removingId === image.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
