"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useUpdateProject } from "@/hooks/use-update-project";
import { useUploadFile } from "@/hooks/use-upload-file";
import { FALLBACK_THUMBNAIL, projectThumbnailUrl } from "@/lib/projects/map-projects";
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
  const displayImages = images.length > 0 ? images : [{ id: "fallback", url: FALLBACK_THUMBNAIL }];
  const [activeIndex, setActiveIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUploadFile();
  const { updateProject } = useUpdateProject(projectId);
  const [isUploading, setIsUploading] = useState(false);

  const src = displayImages[activeIndex]?.url ?? projectThumbnailUrl(images);

  useEffect(() => {
    if (activeIndex >= displayImages.length) setActiveIndex(0);
  }, [activeIndex, displayImages.length]);

  useEffect(() => {
    if (displayImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % displayImages.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [displayImages.length]);

  async function handleReplaceCover(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setIsUploading(true);
    try {
      const { token } = await uploadFile(file);
      const rest = images.filter((_, i) => i !== 0).map((img) => ({ id: img.id }));
      await updateProject({ images: [{ id: token }, ...rest] });
      toast.success("Cover image updated");
      setActiveIndex(0);
      await onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update cover image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAddPhotos(files: FileList | null) {
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
      toast.error(err instanceof Error ? err.message : "Failed to add photos");
    } finally {
      setIsUploading(false);
      if (addInputRef.current) addInputRef.current.value = "";
    }
  }

  return (
    <div
      className="project-header-banner"
      style={{
        position: "relative",
        width: "100%",
        backgroundColor: "#E8DFD3",
        backgroundImage: src ? `url(${src})` : undefined,
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        transition: "background-image 0.4s ease",
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
          left: "var(--ds-content-padding-x)",
          right: "var(--ds-content-padding-x)",
          bottom: "18px",
          color: "#FFFFFF",
        }}
      >
        <div style={{ fontSize: "clamp(20px, 2vw, 28px)", fontWeight: 600, textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
          {projectName}
        </div>
      </div>

      {displayImages.length > 1 ? (
        <div style={{ position: "absolute", bottom: "18px", right: "var(--ds-content-padding-x)", display: "flex", gap: "6px" }}>
          {displayImages.map((img, index) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                background: index === activeIndex ? "#FFFFFF" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>
      ) : null}

      {canEdit && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => void handleReplaceCover(e.target.files?.[0] ?? null)}
          />
          <input
            ref={addInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => void handleAddPhotos(e.target.files)}
          />
          <div style={{ position: "absolute", top: "16px", right: "var(--ds-content-padding-x)", display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => addInputRef.current?.click()}
              disabled={isUploading}
              style={bannerBtnStyle(isUploading)}
            >
              {isUploading ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
              Add photos
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              style={bannerBtnStyle(isUploading)}
            >
              {isUploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
              Change cover
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function bannerBtnStyle(disabled: boolean): React.CSSProperties {
  return {
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
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.7 : 1,
  };
}
