"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  Download,
  FolderInput,
  FolderPlus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProjectFiles } from "@/hooks/use-project-files";
import { useProjectMembers } from "@/hooks/use-project-members";
import { canDownloadProjectFiles, canManageProject } from "@/lib/projects/permissions";
import { isArchiveFolderPath, resolveUploadFolderPath } from "@/lib/files/archive-path";
import { ensureFolderPathsExist } from "@/lib/files/ensure-folder-path";
import { sortProjectFolderNodes } from "@/lib/files/sort-folders";
import { destinationFolderPath } from "@/lib/files/upload-relative-path";
import {
  subscribeOnComplete,
  useUploadStore,
} from "@/stores/upload-store";
import { projectFilesFolderRoute, projectTabRoute } from "@/types/navigation";
import type {
  BulkDownloadUrlItem,
  ProjectFile,
  ProjectFolderNode,
} from "@/types/files";
import type { UploadFileItem } from "@/types/uploads";

import { BulkMoveFileDialog } from "./bulk-move-file-dialog";
import { FileList } from "./file-list";
import { FileUploadDialog } from "./file-upload-dialog";
import { FileVersionHistoryDialog } from "./file-version-history-dialog";
import { FolderTree } from "./folder-tree";
import { FolderNameDialog } from "./folder-name-dialog";
import { ShareFileDialog } from "./share-file-dialog";

const MAX_SELECTABLE = 50;

type FolderDialogMode =
  | { type: "create-root" }
  | { type: "create-sub"; parentPath: string }
  | { type: "rename"; path: string; currentName: string }
  | null;

function findNode(
  nodes: ProjectFolderNode[],
  path: string
): ProjectFolderNode | null {
  for (const n of nodes) {
    if (n.path === path) return n;
    const found = findNode(n.children, path);
    if (found) return found;
  }
  return null;
}

function breadcrumbPath(
  nodes: ProjectFolderNode[],
  path: string,
  acc: ProjectFolderNode[] = []
): ProjectFolderNode[] | null {
  for (const n of nodes) {
    const trail = [...acc, n];
    if (n.path === path) return trail;
    const found = breadcrumbPath(n.children, path, trail);
    if (found) return found;
  }
  return null;
}

function triggerBrowserDownloads(items: BulkDownloadUrlItem[]) {
  items.forEach((item, index) => {
    window.setTimeout(() => {
      const a = document.createElement("a");
      a.href = item.downloadUrl;
      a.download = item.fileName;
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, index * 250);
  });
}

export function ProjectFilesBoard({ projectId }: { projectId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderFromUrl = searchParams.get("folder");

  const { effectiveRole, isViewer } = useProjectMembers();
  const canManage = canManageProject(effectiveRole, isViewer);
  const canDownload = canDownloadProjectFiles(effectiveRole, isViewer);
  const canManageFolders = canManage;
  const isAdmin = effectiveRole === "admin";
  const canDelete = isAdmin || canManage;
  const canShare = canManage;

  const {
    folderTree,
    treeLoading,
    treeError,
    currentFolderPath,
    files,
    filesLoading,
    filesError,
    isProvisioning,
    selectFolder,
    provisionFolders,
    getDownloadUrl,
    getVersionHistory,
    deleteFile,
    renameFile,
    createShareLink,
    revokeShareLink,
    bulkDeleteFiles,
    bulkMoveFiles,
    bulkGetDownloadUrls,
    createFolder,
    renameFolder,
    deleteFolder,
    reloadFiles,
    reloadTree,
  } = useProjectFiles(projectId);

  const navigateToFolder = useCallback(
    (path: string | null) => {
      selectFolder(path);
      if (path) {
        router.replace(projectFilesFolderRoute(projectId, path), { scroll: false });
      } else {
        router.replace(projectTabRoute(projectId, "files"), { scroll: false });
      }
    },
    [projectId, router, selectFolder]
  );

  // Open folder from ?folder= deep-link (upload toast View, shared links, etc.).
  useEffect(() => {
    if (!folderFromUrl) return;
    if (folderFromUrl === currentFolderPath) return;
    selectFolder(folderFromUrl);
  }, [folderFromUrl, currentFolderPath, selectFolder]);

  const enqueueUploads = useUploadStore((s) => s.enqueue);

  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [versionTarget, setVersionTarget] = useState<ProjectFile | null>(null);
  const [shareTarget, setShareTarget] = useState<ProjectFile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [folderDialog, setFolderDialog] = useState<FolderDialogMode>(null);
  const [folderDialogSaving, setFolderDialogSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);

  useEffect(() => {
    setSelectedIds(new Set());
    setBulkMoveOpen(false);
  }, [currentFolderPath]);

  useEffect(() => {
    return subscribeOnComplete((job) => {
      if (job.projectId !== projectId) return;
      void reloadTree();
      if (job.folderPath === currentFolderPath) {
        void reloadFiles();
      }
    });
  }, [projectId, currentFolderPath, reloadFiles, reloadTree]);

  const tree = folderTree?.tree ?? [];
  const fileCounts = folderTree?.fileCounts ?? {};
  const sourceByArchivePath = folderTree?.sourceByArchivePath ?? {};
  const selectedNode = currentFolderPath
    ? findNode(tree, currentFolderPath)
    : null;
  const breadcrumb = currentFolderPath
    ? breadcrumbPath(tree, currentFolderPath) ?? []
    : [];
  const parentFolderPath =
    breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2].path : null;
  const isArchiveFolder =
    !!currentFolderPath && isArchiveFolderPath(currentFolderPath);
  // Uploads/creates always target the live folder, never Superseded archives.
  const uploadFolderPath = currentFolderPath
    ? resolveUploadFolderPath(currentFolderPath, sourceByArchivePath)
    : null;
  const uploadTargetNode = uploadFolderPath
    ? findNode(tree, uploadFolderPath)
    : null;
  const uploadFolderLabel =
    uploadTargetNode?.name ??
    (uploadFolderPath
      ? uploadFolderPath.split("/").filter(Boolean).pop() ?? uploadFolderPath
      : "");
  const uploadsRedirectedFromArchive =
    isArchiveFolder &&
    !!uploadFolderPath &&
    uploadFolderPath !== currentFolderPath;
  const isVersioned = uploadTargetNode?.isVersioned ?? false;
  const canUploadHere = !!uploadFolderPath && !!currentFolderPath;

  const visibleFiles = useMemo(
    () => files.filter((f) => f.id !== deletingId),
    [files, deletingId]
  );

  // Drop ids that are no longer in the current folder list (e.g. after refresh).
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const valid = new Set(visibleFiles.map((f) => f.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (valid.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [visibleFiles]);

  const selectedFiles = useMemo(
    () => visibleFiles.filter((f) => selectedIds.has(f.id)),
    [visibleFiles, selectedIds]
  );

  function handleToggleFile(fileId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
        return next;
      }
      if (next.size >= MAX_SELECTABLE) {
        toast.error("You can select up to 50 files");
        return prev;
      }
      next.add(fileId);
      return next;
    });
  }

  function handleToggleAll() {
    const ids = visibleFiles.map((f) => f.id);
    const selectedInFolder = ids.filter((id) => selectedIds.has(id)).length;
    const allSelected =
      ids.length > 0 &&
      selectedInFolder === Math.min(ids.length, MAX_SELECTABLE) &&
      selectedInFolder > 0;

    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }

    if (ids.length > MAX_SELECTABLE) {
      toast.error("You can select up to 50 files");
    }
    setSelectedIds(new Set(ids.slice(0, MAX_SELECTABLE)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleDownload(file: ProjectFile) {
    try {
      const url = await getDownloadUrl(file.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not get download link");
    }
  }

  function handleUploadNewVersion(file: ProjectFile, picked: File) {
    enqueueUploads({
      projectId,
      folderPath: file.folderPath,
      folderLabel: file.folderPath,
      files: [{ file: picked }],
      replaceFileId: file.id,
    });
    toast.success("New version queued");
  }

  async function handleEnqueueUploads(items: UploadFileItem[]) {
    if (!uploadFolderPath || items.length === 0) return;

    const destinations = [
      ...new Set(
        items.map((item) =>
          destinationFolderPath(uploadFolderPath, item.relativePath)
        )
      ),
    ];

    await ensureFolderPathsExist({
      tree,
      destinationPaths: destinations,
      createFolder: async (name, parentPath) => {
        const created = await createFolder(name, parentPath);
        return { path: created.path };
      },
    });

    enqueueUploads({
      projectId,
      folderPath: uploadFolderPath,
      folderLabel: uploadFolderLabel || uploadFolderPath,
      files: items,
    });
  }

  async function handleRename(file: ProjectFile) {
    const next = window.prompt("Rename file", file.fileName);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === file.fileName) return;
    try {
      await renameFile(file.id, trimmed);
      toast.success("File renamed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed");
    }
  }

  async function handleDeleteFolder(path: string) {
    if (!confirm("Delete this empty folder? This cannot be undone.")) return;
    try {
      await deleteFolder(path);
      toast.success("Folder deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete folder");
    }
  }

  async function handleFolderDialogSubmit(name: string) {
    if (!folderDialog) return;
    if (
      folderDialog.type === "create-sub" &&
      isArchiveFolderPath(folderDialog.parentPath)
    ) {
      toast.error("Cannot create folders under Superseded. Use the live folder instead.");
      return;
    }
    if (
      folderDialog.type === "rename" &&
      isArchiveFolderPath(folderDialog.path)
    ) {
      toast.error("Cannot rename Superseded archive folders.");
      return;
    }
    setFolderDialogSaving(true);
    try {
      if (folderDialog.type === "create-root") {
        await createFolder(name, null);
        toast.success("Folder created");
      } else if (folderDialog.type === "create-sub") {
        await createFolder(name, folderDialog.parentPath);
        toast.success("Subfolder created");
      } else if (folderDialog.type === "rename") {
        await renameFolder(folderDialog.path, name);
        toast.success("Folder renamed");
      }
      setFolderDialog(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Folder action failed");
    } finally {
      setFolderDialogSaving(false);
    }
  }

  async function handleDelete(file: ProjectFile) {
    if (!confirm(`Delete "${file.fileName}"? This cannot be undone.`)) return;
    setDeletingId(file.id);
    try {
      await deleteFile(file.id);
      setSelectedIds((prev) => {
        if (!prev.has(file.id)) return prev;
        const next = new Set(prev);
        next.delete(file.id);
        return next;
      });
      toast.success("File deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleBulkDelete() {
    if (!currentFolderPath || selectedFiles.length === 0) return;
    const count = selectedFiles.length;
    if (
      !confirm(
        `Delete ${count} ${count === 1 ? "file" : "files"}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      const res = await bulkDeleteFiles(
        currentFolderPath,
        selectedFiles.map((f) => f.id)
      );
      clearSelection();
      toast.success(
        res.deletedCount === 1
          ? "1 file deleted"
          : `${res.deletedCount} files deleted`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk delete failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkDownload() {
    if (!currentFolderPath || selectedFiles.length === 0) return;
    setBulkBusy(true);
    try {
      const urls = await bulkGetDownloadUrls(
        currentFolderPath,
        selectedFiles.map((f) => f.id)
      );
      if (urls.length === 0) {
        toast.error("No download links returned");
        return;
      }
      triggerBrowserDownloads(urls);
      toast.success(
        urls.length === 1
          ? "Download started"
          : `${urls.length} downloads started`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk download failed");
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkMove(targetFolderPath: string) {
    if (!currentFolderPath || selectedFiles.length === 0) return;
    setBulkBusy(true);
    try {
      const res = await bulkMoveFiles(
        currentFolderPath,
        targetFolderPath,
        selectedFiles.map((f) => f.id)
      );
      clearSelection();
      toast.success(
        res.movedCount === 1
          ? "Moved 1 file"
          : `Moved ${res.movedCount} files`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Move failed");
      await Promise.all([reloadFiles(), reloadTree()]);
      throw err;
    } finally {
      setBulkBusy(false);
    }
  }

  if (treeLoading || isProvisioning) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center text-[13px] text-[var(--ds-secondary-label)]">
        {isProvisioning ? "Setting up project folders…" : "Loading…"}
      </div>
    );
  }

  if (treeError) {
    return (
      <div className="flex h-[calc(100vh-140px)] flex-col items-center justify-center gap-4 text-[13px]">
        <p className="text-red-600">{treeError}</p>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => void provisionFolders()}
          >
            Provision project folders
          </Button>
        )}
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="flex h-[calc(100vh-140px)] flex-col items-center justify-center gap-4 text-[13px]">
        <p className="text-[var(--ds-secondary-label)]">Project folders have not been set up yet.</p>
        {isAdmin && (
          <Button
            size="sm"
            className="bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)]"
            onClick={() => void provisionFolders()}
          >
            Set up project folders
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        className="flex overflow-hidden"
        style={{ height: "calc(100vh - 140px)" }}
      >
        {/* Left: folder panel */}
        <div className="flex w-60 shrink-0 flex-col overflow-hidden border-r border-[var(--ds-separator)] bg-[var(--ds-bg)]">
          <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-[var(--ds-separator)] px-3.5">
            <span className="text-[15px] font-medium text-[var(--ds-label)]">Documents</span>
            {canManageFolders && (
              <button
                type="button"
                title="New root folder"
                onClick={() => setFolderDialog({ type: "create-root" })}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ds-accent)] hover:bg-[#EDE3D4]"
              >
                <FolderPlus size={15} />
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <FolderTree
              nodes={tree}
              selectedPath={currentFolderPath}
              fileCounts={fileCounts}
              onSelectPath={navigateToFolder}
              canManageFolders={canManageFolders}
              onCreateSubfolder={(parentPath) =>
                setFolderDialog({ type: "create-sub", parentPath })
              }
              onRenameFolder={(path, currentName) =>
                setFolderDialog({ type: "rename", path, currentName })
              }
              onDeleteFolder={(path) => void handleDeleteFolder(path)}
            />
          </div>
        </div>

        {/* Right: file panel */}
        <div
          className="relative flex flex-1 flex-col overflow-hidden bg-[var(--ds-surface-elevated)]"
          onDragOver={canManage ? (e) => { e.preventDefault(); setIsDragging(true); } : undefined}
          onDragLeave={canManage ? (e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node))
              setIsDragging(false);
          } : undefined}
          onDrop={canManage ? (e) => {
            e.preventDefault();
            setIsDragging(false);
            if (currentFolderPath && canUploadHere) setShowUpload(true);
          } : undefined}
        >
          {/* Drag overlay */}
          {isDragging && canManage && currentFolderPath && canUploadHere && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-[3px] border-dashed border-[var(--ds-accent)] bg-[rgba(212,169,106,0.06)]">
              <div className="rounded-xl bg-[var(--ds-surface-elevated)] px-10 py-5 text-[15px] font-medium text-[var(--ds-accent)] shadow-lg">
                Drop to upload
              </div>
            </div>
          )}

          {/* Breadcrumb + action bar */}
          <div className="flex h-10 shrink-0 items-center justify-between border-b border-[rgba(90,60,30,0.10)] bg-[var(--ds-bg)] px-4">
            {/* Path */}
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
              {parentFolderPath && (
                <button
                  type="button"
                  title="Back to parent folder"
                  aria-label="Back to parent folder"
                  onClick={() => navigateToFolder(parentFolderPath)}
                  className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--ds-accent)] hover:bg-[#EDE3D4]"
                >
                  <ChevronLeft size={15} />
                </button>
              )}
              {breadcrumb.length === 0 ? (
                <span className="text-[13px] text-[var(--ds-secondary-label)]">Select a folder</span>
              ) : (
                breadcrumb.map((seg, i) => (
                  <span key={seg.path} className="flex shrink-0 items-center gap-1">
                    {i > 0 && <span className="text-[#C4B5A5]">/</span>}
                    <span
                      className="max-w-[140px] truncate text-[13px]"
                      style={{
                        color: i === breadcrumb.length - 1 ? "var(--ds-label)" : "var(--ds-secondary-label)",
                        fontWeight: i === breadcrumb.length - 1 ? 500 : 400,
                      }}
                    >
                      {seg.name}
                    </span>
                  </span>
                ))
              )}
            </div>

            {/* Actions */}
            {currentFolderPath && canManage && (
              <div className="ml-3 flex shrink-0 items-center gap-2">
                {canUploadHere ? (
                  <>
                    <span className="hidden text-[11px] text-[var(--ds-secondary-label)] sm:inline">Drop files here</span>
                    <Button
                      size="sm"
                      className="h-7 gap-1 bg-[var(--ds-accent)] text-[12px] text-white hover:bg-[var(--ds-accent-hover)]"
                      onClick={() => setShowUpload(true)}
                    >
                      <Upload size={11} />
                      Upload
                    </Button>
                  </>
                ) : (
                  <span className="text-[11px] text-[var(--ds-secondary-label)]">
                    Select a folder to upload
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Selection toolbar */}
          {selectedFiles.length > 0 && (
            <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-2 border-b border-[rgba(90,60,30,0.10)] bg-[#F5E6D0] px-4 py-1.5">
              <span className="text-[12px] font-medium text-[var(--ds-label)]">
                {selectedFiles.length} selected
              </span>
              <button
                type="button"
                disabled={bulkBusy}
                onClick={clearSelection}
                className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] text-[var(--ds-secondary-label)] hover:bg-[rgba(90,60,30,0.08)] hover:text-[var(--ds-label)] disabled:opacity-50"
              >
                <X size={12} />
                Clear
              </button>
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                {canDownload && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkBusy}
                    className="h-7 gap-1 text-[12px]"
                    onClick={() => void handleBulkDownload()}
                  >
                    <Download size={11} />
                    Download
                  </Button>
                )}
                {canManage && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkBusy}
                    className="h-7 gap-1 text-[12px]"
                    onClick={() => setBulkMoveOpen(true)}
                  >
                    <FolderInput size={11} />
                    Move
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={bulkBusy}
                    className="h-7 gap-1 text-[12px] text-red-700 hover:text-red-800"
                    onClick={() => void handleBulkDelete()}
                  >
                    <Trash2 size={11} />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Versioning banner */}
          {isVersioned && currentFolderPath && (
            <div className="flex h-8 shrink-0 items-center gap-2 border-b border-[rgba(90,60,30,0.08)] bg-amber-50 px-4">
              <AlertCircle size={12} className="shrink-0 text-amber-700" />
              <span className="text-[11px] text-amber-700">
                Versioning active — new uploads with matching filenames will supersede existing files.
              </span>
            </div>
          )}

          {/* File list */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <FileList
              files={visibleFiles}
              childFolders={sortProjectFolderNodes(selectedNode?.children ?? [])}
              fileCounts={fileCounts}
              loading={filesLoading}
              error={filesError}
              folderPath={currentFolderPath}
              isVersioned={isVersioned}
              canDelete={canDelete}
              canRename={canManageFolders}
              canDownload={canDownload}
              canShare={canShare}
              canUploadVersion={canManage}
              selectedIds={selectedIds}
              onToggleFile={handleToggleFile}
              onToggleAll={handleToggleAll}
              maxSelectable={MAX_SELECTABLE}
              onOpenFolder={navigateToFolder}
              onDownload={handleDownload}
              onShare={(f) => setShareTarget(f)}
              onDelete={handleDelete}
              onRename={handleRename}
              onVersionHistory={(f) => setVersionTarget(f)}
              onUploadNewVersion={handleUploadNewVersion}
            />
          </div>
        </div>
      </div>

      {/* Upload dialog */}
      {showUpload && uploadFolderPath && (
        <FileUploadDialog
          open={showUpload}
          onOpenChange={setShowUpload}
          folderPath={uploadFolderPath}
          folderLabel={uploadFolderLabel || uploadFolderPath}
          isVersioned={isVersioned}
          archiveRedirectNotice={
            uploadsRedirectedFromArchive
              ? `You're viewing Superseded — uploads go to ${uploadFolderLabel || "the live folder"}.`
              : undefined
          }
          onEnqueue={(files) => handleEnqueueUploads(files)}
        />
      )}

      {/* Share dialog */}
      <ShareFileDialog
        open={!!shareTarget}
        onOpenChange={(o) => !o && setShareTarget(null)}
        file={shareTarget}
        onCreateShareLink={createShareLink}
        onRevokeShareLink={revokeShareLink}
      />

      <BulkMoveFileDialog
        open={bulkMoveOpen}
        onOpenChange={setBulkMoveOpen}
        files={selectedFiles}
        tree={tree}
        fileCounts={fileCounts}
        currentFolderPath={currentFolderPath}
        onMove={handleBulkMove}
      />

      {/* Version history dialog */}
      <FileVersionHistoryDialog
        open={!!versionTarget}
        onOpenChange={(o) => !o && setVersionTarget(null)}
        fileId={versionTarget?.id ?? null}
        fileName={versionTarget?.fileName ?? ""}
        onGetVersions={getVersionHistory}
        onGetDownloadUrl={getDownloadUrl}
      />

      <FolderNameDialog
        open={folderDialog !== null}
        onOpenChange={(open) => !open && setFolderDialog(null)}
        title={
          folderDialog?.type === "create-root"
            ? "New root folder"
            : folderDialog?.type === "create-sub"
              ? "New subfolder"
              : "Rename folder"
        }
        description={
          folderDialog?.type === "create-root"
            ? 'Use the format "4.0 Folder Name" (number, dot, number, space, name).'
            : folderDialog?.type === "create-sub"
              ? "Enter a name for the new subfolder."
              : undefined
        }
        initialName={
          folderDialog?.type === "rename" ? folderDialog.currentName : ""
        }
        placeholder={
          folderDialog?.type === "create-root" ? "4.0 Contracts" : "Folder name"
        }
        confirmLabel={
          folderDialog?.type === "rename" ? "Rename" : "Create"
        }
        isSubmitting={folderDialogSaving}
        onSubmit={handleFolderDialogSubmit}
      />
    </>
  );
}
