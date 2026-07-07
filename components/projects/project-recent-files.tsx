"use client";

import { File, FileText, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

import { useProjectRecentFiles } from "@/hooks/use-project-recent-files";
import { projectTabRoute } from "@/types/navigation";

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
  limit = 5,
}: {
  projectId: string;
  limit?: number;
}) {
  const { files, isLoading } = useProjectRecentFiles(projectId, limit);
  const filesTabHref = projectTabRoute(projectId, "files");

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ds-label)" }}>Recent files</div>
        <Link
          href={filesTabHref}
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
        {isLoading ? (
          <div style={{ padding: "16px", fontSize: "13px", color: "var(--ds-tertiary-label)" }}>Loading files…</div>
        ) : files.length === 0 ? (
          <div style={{ padding: "16px", fontSize: "13px", color: "var(--ds-tertiary-label)" }}>No files yet.</div>
        ) : (
          files.map((file, i) => {
            const ext = fileExt(file.fileName);
            return (
              <Link
                key={file.id}
                href={filesTabHref}
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "42px",
                  padding: "0 14px",
                  gap: "10px",
                  borderBottom: i < files.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                  textDecoration: "none",
                  color: "inherit",
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
                  {file.fileName}
                </div>
                <span style={{ fontSize: "11px", color: "var(--ds-tertiary-label)", textTransform: "uppercase" }}>
                  {ext}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </>
  );
}
