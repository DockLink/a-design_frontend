"use client";

import { useRef, useState } from "react";
import {
  Clock,
  Download,
  Folder,
  Pencil,
  Share2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { fileExtension, formatFileDate, formatFileSize } from "@/lib/files/format";
import type { ProjectFile } from "@/types/files";
import { FileTypeIcon } from "./file-type-icon";

export function FileList({
  files,
  loading,
  error,
  folderPath,
  isVersioned,
  canDelete,
  canRename,
  canDownload = true,
  canShare = true,
  canUploadVersion = true,
  onDownload,
  onShare,
  onDelete,
  onRename,
  onVersionHistory,
  onUploadNewVersion,
}: {
  files: ProjectFile[];
  loading: boolean;
  error: string | null;
  folderPath: string | null;
  isVersioned: boolean;
  canDelete: boolean;
  canRename: boolean;
  canDownload?: boolean;
  canShare?: boolean;
  canUploadVersion?: boolean;
  onDownload: (file: ProjectFile) => void;
  onShare: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
  onRename: (file: ProjectFile) => void;
  onVersionHistory: (file: ProjectFile) => void;
  onUploadNewVersion: (file: ProjectFile, picked: File) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!folderPath) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-[var(--ds-secondary-label)]">
        <Folder size={40} className="opacity-30" />
        <p className="text-[13px]">Select a folder to view files</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-[13px] text-[var(--ds-secondary-label)]">
        Loading files…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center text-[13px] text-red-600">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-[var(--ds-secondary-label)]">
        <Folder size={32} className="opacity-30" />
        <p className="text-[13px]">This folder is empty</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {/* Column headers */}
      <div className="sticky top-0 z-10 grid h-9 grid-cols-[1fr_120px_80px_100px] items-center border-b border-[rgba(90,60,30,0.10)] bg-[var(--ds-bg)] px-4 text-[12px] text-[var(--ds-secondary-label)]">
        <span>Name</span>
        <span>Date</span>
        <span>Size</span>
        <span />
      </div>

      {files.map((file) => (
        <FileRow
          key={file.id}
          file={file}
          isVersioned={isVersioned}
          canDelete={canDelete}
          canRename={canRename}
          canDownload={canDownload}
          canShare={canShare}
          canUploadVersion={canUploadVersion}
          hovered={hoveredId === file.id}
          onMouseEnter={() => setHoveredId(file.id)}
          onMouseLeave={() => setHoveredId(null)}
          onDownload={onDownload}
          onShare={onShare}
          onDelete={onDelete}
          onRename={onRename}
          onVersionHistory={onVersionHistory}
          onUploadNewVersion={onUploadNewVersion}
        />
      ))}
    </div>
  );
}

function FileRow({
  file,
  isVersioned,
  canDelete,
  canRename,
  canDownload,
  canShare,
  canUploadVersion,
  hovered,
  onMouseEnter,
  onMouseLeave,
  onDownload,
  onShare,
  onDelete,
  onRename,
  onVersionHistory,
  onUploadNewVersion,
}: {
  file: ProjectFile;
  isVersioned: boolean;
  canDelete: boolean;
  canRename: boolean;
  canDownload: boolean;
  canShare: boolean;
  canUploadVersion: boolean;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDownload: (file: ProjectFile) => void;
  onShare: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
  onRename: (file: ProjectFile) => void;
  onVersionHistory: (file: ProjectFile) => void;
  onUploadNewVersion: (file: ProjectFile, picked: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ext = fileExtension(file.fileName);

  function triggerVersionUpload() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    // Keep the uploaded file's own name — the backend supersedes the targeted
    // file by id, so no client-side rename is needed.
    onUploadNewVersion(file, picked);
    // Reset so the same file can be re-picked if needed
    e.target.value = "";
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={cn(
            "grid h-10 grid-cols-[1fr_120px_80px_100px] items-center border-b border-[rgba(90,60,30,0.07)] px-4 transition-colors",
            hovered ? "bg-[var(--ds-bg)]" : "bg-transparent"
          )}
        >
          {/* Hidden file input for new-version upload */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Name */}
          <div className="flex min-w-0 items-center gap-2">
            <FileTypeIcon ext={ext} size={15} />
            <span className="truncate text-[13px] font-medium text-[var(--ds-label)]">
              {file.fileName}
            </span>
            {isVersioned && file.version > 1 && (
              <span className="shrink-0 rounded-[3px] bg-[#F5E6D0] px-1 text-[9px] font-bold text-[var(--ds-accent)]">
                v{file.version}
              </span>
            )}
          </div>

          {/* Date */}
          <span className="text-[12px] text-[var(--ds-secondary-label)]">
            {formatFileDate(file.created_at)}
          </span>

          {/* Size */}
          <span className="text-[12px] text-[var(--ds-secondary-label)]">
            {formatFileSize(file.fileSize)}
          </span>

          {/* Inline actions */}
          <div
            className={cn(
              "flex items-center justify-end gap-1 transition-opacity",
              hovered ? "opacity-100" : "opacity-0"
            )}
          >
            {canDownload && (
              <ActionButton
                icon={<Download size={13} />}
                title="Download"
                onClick={() => onDownload(file)}
              />
            )}
            {canShare && (
              <ActionButton
                icon={<Share2 size={13} />}
                title="Share"
                onClick={() => onShare(file)}
              />
            )}
            {isVersioned && canUploadVersion && (
              <ActionButton
                icon={<UploadCloud size={13} />}
                title="Upload new version"
                onClick={triggerVersionUpload}
              />
            )}
            {isVersioned && canUploadVersion && (
              <ActionButton
                icon={<Clock size={13} />}
                title="Version history"
                onClick={() => onVersionHistory(file)}
              />
            )}
            {canRename && (
              <ActionButton
                icon={<Pencil size={13} />}
                title="Rename"
                onClick={() => onRename(file)}
              />
            )}
            {canDelete && (
              <ActionButton
                icon={<Trash2 size={13} />}
                title="Delete"
                danger
                onClick={() => onDelete(file)}
              />
            )}
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {canDownload && (
          <ContextMenuItem onSelect={() => onDownload(file)}>
            <Download size={13} />
            Download
          </ContextMenuItem>
        )}
        {canShare && (
          <ContextMenuItem onSelect={() => onShare(file)}>
            <Share2 size={13} />
            Share
          </ContextMenuItem>
        )}

        {canRename && (
          <ContextMenuItem onSelect={() => onRename(file)}>
            <Pencil size={13} />
            Rename
          </ContextMenuItem>
        )}

        {isVersioned && canUploadVersion && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={triggerVersionUpload}>
              <UploadCloud size={13} />
              Upload new version
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => onVersionHistory(file)}>
              <Clock size={13} />
              Version history
            </ContextMenuItem>
          </>
        )}

        {canDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem danger onSelect={() => onDelete(file)}>
              <Trash2 size={13} />
              Delete
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function ActionButton({
  icon,
  title,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  danger?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex items-center rounded p-0.5 transition-colors"
      style={{
        color: danger
          ? hovered ? "var(--ds-destructive)" : "#C4A090"
          : hovered ? "var(--ds-label)" : "var(--ds-secondary-label)",
      }}
    >
      {icon}
    </button>
  );
}
