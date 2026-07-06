import { File, FileText, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

import { projectTabRoute } from "@/types/navigation";
import type { ProjectImage } from "@/types/projects";

function fileNameFromUrl(url: string, id: string): string {
  try {
    const parts = new URL(url).pathname.split("/");
    const last = parts[parts.length - 1];
    return last || `file-${id.slice(0, 8)}`;
  } catch {
    return `file-${id.slice(0, 8)}`;
  }
}

function fileExt(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "file";
}

function FileIcon({ ext }: { ext: string }) {
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
    return <ImageIcon size={14} color="var(--ds-tertiary-label)" />;
  }
  if (["pdf", "doc", "docx"].includes(ext)) {
    return <FileText size={14} color="#0071E3" />;
  }
  return <File size={14} color="var(--ds-tertiary-label)" />;
}

export function ProjectRecentFiles({
  projectId,
  images,
  limit = 5,
}: {
  projectId: string;
  images: ProjectImage[];
  limit?: number;
}) {
  const items = images.slice(0, limit);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ds-label)" }}>Recent files</div>
        <Link
          href={projectTabRoute(projectId, "files")}
          style={{ fontSize: "13px", color: "var(--ds-accent)", fontWeight: 500, textDecoration: "none" }}
        >
          View all
        </Link>
      </div>
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
          marginBottom: "20px",
        }}
      >
        {items.length === 0 ? (
          <div style={{ padding: "16px", fontSize: "13px", color: "var(--ds-tertiary-label)" }}>No files uploaded yet.</div>
        ) : (
          items.map((file, i) => {
            const name = fileNameFromUrl(file.url, file.id);
            const ext = fileExt(name);
            return (
              <div
                key={file.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "42px",
                  padding: "0 14px",
                  gap: "10px",
                  borderBottom: i < items.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                }}
              >
                <FileIcon ext={ext} />
                <div
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    color: "var(--ds-label)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </div>
                <span style={{ fontSize: "11px", color: "var(--ds-tertiary-label)" }}>Image</span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
