"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { useProjectContext } from "@/components/projects/project-context";
import { useProjectMembers } from "@/hooks/use-project-members";
import { useUpdateProject } from "@/hooks/use-update-project";
import { useUploadFile } from "@/hooks/use-upload-file";
import { canManageProject } from "@/lib/projects/permissions";

export function ProjectFilesTab() {
  const { project, refetch } = useProjectContext();
  const { updateProject } = useUpdateProject(project!.id);
  const { uploadFile } = useUploadFile();
  const { effectiveRole } = useProjectMembers();
  const canManage = canManageProject(effectiveRole);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(file: File) {
    setIsUploading(true);
    try {
      const { token } = await uploadFile(file);
      const existing = project!.images.map((img) => ({ id: img.id }));
      await updateProject({ images: [...existing, { id: token }] });
      await refetch();
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "20px", fontWeight: 600 }}>Files</div>
          <div style={{ fontSize: "13px", color: "#8E8E93" }}>{project!.images.length} file(s)</div>
        </div>
        {canManage && (
          <>
            <input
              ref={inputRef}
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
              style={{
                height: "32px",
                padding: "0 14px",
                background: "#D4A96A",
                border: "none",
                borderRadius: "8px",
                color: "white",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Upload size={14} />
              {isUploading ? "Uploading…" : "Upload"}
            </button>
          </>
        )}
      </div>

      {project!.images.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: "#8E8E93", fontSize: "14px" }}>
          No files yet. Upload images or documents linked to this project.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
          {project!.images.map((img) => (
            <a
              key={img.id}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  height: "140px",
                  backgroundImage: `url(${img.url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div style={{ padding: "10px", fontSize: "12px", color: "#6C6C70" }}>{img.id.slice(0, 8)}…</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
