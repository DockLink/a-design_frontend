"use client";

import { useState } from "react";
import { AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProjectFiles } from "@/hooks/use-project-files";
import { useProjectMembers } from "@/hooks/use-project-members";
import { canDownloadProjectFiles, canManageProject } from "@/lib/projects/permissions";
import type { ProjectFile, ProjectFolderNode } from "@/types/files";

import { FileList } from "./file-list";
import { FileUploadDialog } from "./file-upload-dialog";
import { FileVersionHistoryDialog } from "./file-version-history-dialog";
import { FolderTree } from "./folder-tree";
import { ShareFileDialog } from "./share-file-dialog";

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

export function ProjectFilesBoard({ projectId }: { projectId: string }) {
  const { effectiveRole, isViewer } = useProjectMembers();
  const canManage = canManageProject(effectiveRole, isViewer);
  const canDownload = canDownloadProjectFiles(effectiveRole, isViewer);
  const isAdmin = effectiveRole === "admin";

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
    uploadFile,
    getDownloadUrl,
    getVersionHistory,
    deleteFile,
    renameFile,
    createShareLink,
    revokeShareLink,
  } = useProjectFiles(projectId);

  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [versionTarget, setVersionTarget] = useState<ProjectFile | null>(null);
  const [shareTarget, setShareTarget] = useState<ProjectFile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadingVersionId, setUploadingVersionId] = useState<string | null>(null);

  const tree = folderTree?.tree ?? [];
  const fileCounts = folderTree?.fileCounts ?? {};
  const selectedNode = currentFolderPath
    ? findNode(tree, currentFolderPath)
    : null;
  const breadcrumb = currentFolderPath
    ? breadcrumbPath(tree, currentFolderPath) ?? []
    : [];
  const isVersioned = selectedNode?.isVersioned ?? false;

  async function handleDownload(file: ProjectFile) {
    try {
      const url = await getDownloadUrl(file.id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not get download link");
    }
  }

  async function handleUploadNewVersion(file: ProjectFile, picked: File) {
    setUploadingVersionId(file.id);
    try {
      // Keep the uploaded file's own name; target the specific file being
      // replaced via its id so the backend supersedes the right record.
      await uploadFile(file.folderPath, picked, file.id);
      toast.success(`New version uploaded (replaced "${file.fileName}")`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingVersionId(null);
    }
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

  async function handleDelete(file: ProjectFile) {
    if (!confirm(`Delete "${file.fileName}"? This cannot be undone.`)) return;
    setDeletingId(file.id);
    try {
      await deleteFile(file.id);
      toast.success("File deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
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
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--ds-separator)] px-3.5">
            <span className="text-[15px] font-medium text-[var(--ds-label)]">Documents</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <FolderTree
              nodes={tree}
              selectedPath={currentFolderPath}
              fileCounts={fileCounts}
              onSelectPath={selectFolder}
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
            if (currentFolderPath) setShowUpload(true);
          } : undefined}
        >
          {/* Drag overlay */}
          {isDragging && canManage && currentFolderPath && (
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
                <span className="text-[11px] text-[var(--ds-secondary-label)]">Drop files here</span>
                <Button
                  size="sm"
                  className="h-7 gap-1 bg-[var(--ds-accent)] text-[12px] text-white hover:bg-[var(--ds-accent-hover)]"
                  onClick={() => setShowUpload(true)}
                >
                  <Upload size={11} />
                  Upload
                </Button>
              </div>
            )}
          </div>

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
          <div className="flex-1 overflow-hidden">
            <FileList
              files={files.filter((f) => f.id !== deletingId)}
              loading={filesLoading || uploadingVersionId !== null}
              error={filesError}
              folderPath={currentFolderPath}
              isVersioned={isVersioned}
              canDelete={isAdmin || canManage}
              canRename={isAdmin || canManage}
              canDownload={canDownload}
              canShare={canManage}
              canUploadVersion={canManage}
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
      {showUpload && currentFolderPath && (
        <FileUploadDialog
          open={showUpload}
          onOpenChange={setShowUpload}
          folderPath={currentFolderPath}
          folderLabel={selectedNode?.name ?? currentFolderPath}
          isVersioned={isVersioned}
          onUpload={(folderPath, file, onProgress) =>
            uploadFile(folderPath, file, undefined, onProgress)
          }
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

      {/* Version history dialog */}
      <FileVersionHistoryDialog
        open={!!versionTarget}
        onOpenChange={(o) => !o && setVersionTarget(null)}
        fileId={versionTarget?.id ?? null}
        fileName={versionTarget?.fileName ?? ""}
        onGetVersions={getVersionHistory}
        onGetDownloadUrl={getDownloadUrl}
      />
    </>
  );
}
