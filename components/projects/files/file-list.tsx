"use client";

import { useEffect, useRef, useState } from "react";
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
import type { ProjectFile, ProjectFolderNode } from "@/types/files";
import { FileTypeIcon } from "./file-type-icon";

const GRID_COLS = "grid-cols-[28px_1fr_120px_80px_100px]";
const MAX_SELECTABLE_DEFAULT = 50;

export function FileList({
  files,
  childFolders = [],
  fileCounts = {},
  loading,
  error,
  folderPath,
  isVersioned,
  canDelete,
  canRename,
  canDownload = true,
  canShare = true,
  canUploadVersion = true,
  selectedIds,
  onToggleFile,
  onToggleAll,
  maxSelectable = MAX_SELECTABLE_DEFAULT,
  onOpenFolder,
  onDownload,
  onShare,
  onDelete,
  onRename,
  onVersionHistory,
  onUploadNewVersion,
}: {
  files: ProjectFile[];
  childFolders?: ProjectFolderNode[];
  fileCounts?: Record<string, number>;
  loading: boolean;
  error: string | null;
  folderPath: string | null;
  isVersioned: boolean;
  canDelete: boolean;
  canRename: boolean;
  canDownload?: boolean;
  canShare?: boolean;
  canUploadVersion?: boolean;
  selectedIds: Set<string>;
  onToggleFile: (fileId: string) => void;
  onToggleAll: () => void;
  maxSelectable?: number;
  onOpenFolder: (path: string) => void;
  onDownload: (file: ProjectFile) => void;
  onShare: (file: ProjectFile) => void;
  onDelete: (file: ProjectFile) => void;
  onRename: (file: ProjectFile) => void;
  onVersionHistory: (file: ProjectFile) => void;
  onUploadNewVersion: (file: ProjectFile, picked: File) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const selectedInFolder = files.filter((f) => selectedIds.has(f.id)).length;
  const allSelected =
    files.length > 0 &&
    selectedInFolder === Math.min(files.length, maxSelectable) &&
    selectedInFolder > 0;
  const someSelected = selectedInFolder > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

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

  if (files.length === 0 && childFolders.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-[var(--ds-secondary-label)]">
        <Folder size={32} className="opacity-30" />
        <p className="text-[13px]">This folder is empty</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Column headers */}
      <div
        className={cn(
          "sticky top-0 z-10 grid h-9 items-center border-b border-[rgba(90,60,30,0.10)] bg-[var(--ds-bg)] px-4 text-[12px] text-[var(--ds-secondary-label)]",
          GRID_COLS
        )}
      >
        <span className="flex items-center justify-center">
          {files.length > 0 && (
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              title="Select all in this folder"
              aria-label="Select all in this folder"
              className="h-3.5 w-3.5 cursor-pointer accent-[var(--ds-accent)]"
            />
          )}
        </span>
        <span>Name</span>
        <span>Date</span>
        <span>Size</span>
        <span />
      </div>

      {childFolders.map((folder) => (
        <FolderRow
          key={folder.path}
          folder={folder}
          fileCount={fileCounts[folder.path]}
          hovered={hoveredId === folder.path}
          onMouseEnter={() => setHoveredId(folder.path)}
          onMouseLeave={() => setHoveredId(null)}
          onOpen={() => onOpenFolder(folder.path)}
        />
      ))}

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
          selected={selectedIds.has(file.id)}
          onToggleSelect={() => onToggleFile(file.id)}
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

function FolderRow({
  folder,
  fileCount,
  hovered,
  onMouseEnter,
  onMouseLeave,
  onOpen,
}: {
  folder: ProjectFolderNode;
  fileCount?: number;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "grid h-10 cursor-pointer items-center border-b border-[rgba(90,60,30,0.07)] px-4 transition-colors",
        GRID_COLS,
        hovered ? "bg-[var(--ds-bg)]" : "bg-transparent"
      )}
    >
      <span />
      <div className="flex min-w-0 items-center gap-2">
        <Folder size={15} style={{ color: "var(--ds-accent)", flexShrink: 0 }} />
        <span className="truncate text-[13px] font-medium text-[var(--ds-label)]">
          {folder.name}
        </span>
        {folder.isVersioned && (
          <span className="shrink-0 rounded-[3px] bg-[#F5E6D0] px-1 text-[9px] font-bold text-[var(--ds-accent)]">
            V
          </span>
        )}
        {fileCount != null && fileCount > 0 && (
          <span className="shrink-0 rounded-full bg-[#EDE3D4] px-1.5 text-[10px] text-[var(--ds-secondary-label)]">
            {fileCount}
          </span>
        )}
      </div>
      <span />
      <span />
      <span />
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
  selected,
  onToggleSelect,
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
  selected: boolean;
  onToggleSelect: () => void;
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
            "grid h-10 items-center border-b border-[rgba(90,60,30,0.07)] px-4 transition-colors",
            GRID_COLS,
            selected || hovered ? "bg-[var(--ds-bg)]" : "bg-transparent"
          )}
        >
          {/* Hidden file input for new-version upload */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Checkbox */}
          <span className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${file.fileName}`}
              className="h-3.5 w-3.5 cursor-pointer accent-[var(--ds-accent)]"
            />
          </span>

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
              hovered || selected ? "opacity-100" : "opacity-0"
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
