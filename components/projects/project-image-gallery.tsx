"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { useUpdateProject } from "@/hooks/use-update-project";
import { useUploadFile } from "@/hooks/use-upload-file";
import {
  appendProjectGalleryImages,
  projectGalleryImages,
  removeProjectGalleryImage,
} from "@/lib/projects/map-projects";
import type { ProjectImage } from "@/types/projects";

function useGalleryColumnCount(): number {
  const [count, setCount] = useState(5);

  useEffect(() => {
    function update() {
      const width = window.innerWidth;
      if (width < 768) setCount(2);
      else if (width < 1280) setCount(3);
      else setCount(5);
    }

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

function distributeToColumns(
  images: ProjectImage[],
  columnCount: number,
  aspectRatios: Record<string, number>,
): ProjectImage[][] {
  const columns = Array.from({ length: columnCount }, () => [] as ProjectImage[]);
  const heights = Array(columnCount).fill(0);

  for (const image of images) {
    const ratio = aspectRatios[image.id] ?? 1;
    let targetColumn = 0;
    for (let i = 1; i < columnCount; i += 1) {
      if (heights[i] < heights[targetColumn]) targetColumn = i;
    }
    columns[targetColumn].push(image);
    heights[targetColumn] += ratio;
  }

  return columns;
}

export function ProjectImageGallery({
  projectId,
  images,
  canEdit,
  onUpdated,
  variant = "default",
}: {
  projectId: string;
  images: ProjectImage[];
  canEdit: boolean;
  onUpdated?: () => void | Promise<void>;
  variant?: "default" | "sidebar";
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUploadFile();
  const { updateProject } = useUpdateProject(projectId);
  const [isUploading, setIsUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<ProjectImage | null>(null);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

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
        images: appendProjectGalleryImages(images, tokens),
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
      await updateProject({ images: removeProjectGalleryImage(images, imageId) });
      toast.success("Photo removed");
      if (previewImage?.id === imageId) setPreviewImage(null);
      await onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setRemovingId(null);
    }
  }

  const galleryImages = useMemo(() => projectGalleryImages(images), [images]);
  const galleryImageIds = useMemo(
    () => galleryImages.map((img) => img.id).join("|"),
    [galleryImages],
  );
  const isSidebar = variant === "sidebar";
  const columnCount = useGalleryColumnCount();

  const handleImageLoad = useCallback((imageId: string, img: HTMLImageElement) => {
    if (!img.naturalWidth) return;
    const ratio = img.naturalHeight / img.naturalWidth;
    setAspectRatios((prev) => {
      const existing = prev[imageId];
      if (existing !== undefined && Math.abs(existing - ratio) < 0.001) return prev;
      return { ...prev, [imageId]: ratio };
    });
  }, []);

  useEffect(() => {
    const ids = new Set(galleryImageIds.split("|").filter(Boolean));
    setAspectRatios((prev) => {
      const next: Record<string, number> = {};
      for (const [id, ratio] of Object.entries(prev)) {
        if (ids.has(id)) next[id] = ratio;
      }
      if (Object.keys(next).length === Object.keys(prev).length) return prev;
      return next;
    });
  }, [galleryImageIds]);

  useEffect(() => {
    if (!previewImage) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewImage(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewImage]);

  const masonryColumns = useMemo(
    () => distributeToColumns(galleryImages, columnCount, aspectRatios),
    [galleryImages, columnCount, aspectRatios],
  );

  return (
    <>
      <section className={`project-gallery-card${isSidebar ? " project-gallery-card--sidebar" : ""}`}>
        <div className="project-gallery-card__header">
          <h3 className="project-gallery-card__title">
            <ImagePlus size={16} color="#C9894A" aria-hidden />
            Precedent images
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

        <div
          className={`project-gallery-card__body${
            galleryImages.length > 0 ? " project-gallery-card__body--masonry" : ""
          }`}
        >
          {galleryImages.length === 0 ? (
            <div className="project-gallery-empty">
              {images.length === 0 ? "No precedent images yet." : "No additional precedent images yet."}
            </div>
          ) : (
            <div
              className={`project-gallery-masonry${
                isSidebar ? " project-gallery-masonry--sidebar" : ""
              }`}
            >
              {masonryColumns.map((column, columnIndex) => (
                <div key={columnIndex} className="project-gallery-masonry__column">
                  {column.map((image, index) => (
                    <div key={image.id} className="project-gallery-item project-gallery-item--preview">
                      <button
                        type="button"
                        className="project-gallery-item__preview-btn"
                        onClick={() => setPreviewImage(image)}
                        aria-label={`Preview image ${index + 1}`}
                      >
                        <img
                          src={image.url}
                          alt={`Precedent image ${index + 1}`}
                          onLoad={(e) => handleImageLoad(image.id, e.currentTarget)}
                        />
                      </button>
                      {canEdit ? (
                        <button
                          type="button"
                          title="Remove photo"
                          className="project-gallery-remove-btn"
                          disabled={removingId === image.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleRemove(image.id);
                          }}
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
              ))}
            </div>
          )}
        </div>
      </section>

      {previewImage ? (
        <div
          className="project-gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            className="project-gallery-lightbox__close"
            aria-label="Close preview"
            onClick={() => setPreviewImage(null)}
          >
            <X size={22} />
          </button>
          <img
            src={previewImage.url}
            alt="Precedent image preview"
            className="project-gallery-lightbox__image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
