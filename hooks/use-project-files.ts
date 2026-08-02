"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authApiClient } from "@/lib/api/authenticated-client";
import { uploadFileMultipart } from "@/lib/files/multipart-upload";
import type {
  BulkDeleteResponse,
  BulkDownloadUrlItem,
  BulkShareLinkItem,
  CreateShareLinkPayload,
  DownloadUrlResponse,
  ProjectFile,
  ProjectFolderRecord,
  ProjectFolderTree,
  ShareLinkResponse,
} from "@/types/files";

function dedupeIds(fileIds: string[]): string[] {
  return [...new Set(fileIds)];
}

export function useProjectFiles(projectId: string) {
  const [folderTree, setFolderTree] = useState<ProjectFolderTree | null>(null);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);

  const [currentFolderPath, setCurrentFolderPath] = useState<string | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState<string | null>(null);

  const [isProvisioning, setIsProvisioning] = useState(false);
  const hasProvisionedRef = useRef(false);

  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    setTreeError(null);
    try {
      const res = await authApiClient<{ data: ProjectFolderTree }>(
        `/projects/${projectId}/files/tree`
      );
      setFolderTree(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load file tree";
      setTreeError(msg);
    } finally {
      setTreeLoading(false);
    }
  }, [projectId]);

  const provisionFolders = useCallback(async () => {
    if (hasProvisionedRef.current || isProvisioning) return;
    hasProvisionedRef.current = true;
    setIsProvisioning(true);
    try {
      await authApiClient(`/projects/${projectId}/folders`, { method: "POST" });
      await loadTree();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to provision folders");
    } finally {
      setIsProvisioning(false);
    }
  }, [projectId, loadTree, isProvisioning]);

  const loadFiles = useCallback(async (folderPath: string) => {
    setFilesLoading(true);
    setFilesError(null);
    try {
      const qs = new URLSearchParams({ folderPath });
      const res = await authApiClient<{ data: ProjectFile[] }>(
        `/projects/${projectId}/files?${qs}`
      );
      setFiles(res.data ?? []);
    } catch (err) {
      setFiles([]);
      setFilesError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setFilesLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadTree();
  }, [loadTree]);

  useEffect(() => {
    if (currentFolderPath) {
      void loadFiles(currentFolderPath);
    } else {
      setFiles([]);
    }
  }, [currentFolderPath, loadFiles]);

  const selectFolder = useCallback((path: string | null) => {
    setCurrentFolderPath(path);
  }, []);

  const uploadFile = useCallback(
    async (
      folderPath: string,
      file: File,
      replaceFileId?: string,
      onProgress?: (pct: number) => void,
    ) => {
      // Direct browser → S3 multipart upload: the file bytes never pass through
      // Next.js or NestJS, so there is no app-level size limit.
      const body = await uploadFileMultipart({
        projectId,
        folderPath,
        file,
        replaceFileId,
        onProgress,
      });

      if (currentFolderPath === folderPath) {
        await loadFiles(folderPath);
      }
      return body;
    },
    [projectId, currentFolderPath, loadFiles]
  );

  const getDownloadUrl = useCallback(async (fileId: string): Promise<string> => {
    const res = await authApiClient<{ data: DownloadUrlResponse }>(
      `/files/${fileId}/download-url`
    );
    return res.data.downloadUrl;
  }, []);

  const getVersionHistory = useCallback(async (fileId: string): Promise<ProjectFile[]> => {
    const res = await authApiClient<{ data: ProjectFile[] }>(
      `/files/${fileId}/versions`
    );
    return res.data ?? [];
  }, []);

  const deleteFile = useCallback(
    async (fileId: string) => {
      await authApiClient(`/files/${fileId}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    },
    []
  );

  const renameFile = useCallback(
    async (fileId: string, fileName: string): Promise<ProjectFile> => {
      const res = await authApiClient<{ data: ProjectFile }>(
        `/files/${fileId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ fileName }),
        }
      );
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? res.data : f))
      );
      return res.data;
    },
    []
  );

  const createShareLink = useCallback(
    async (fileId: string, payload: CreateShareLinkPayload): Promise<ShareLinkResponse> => {
      const res = await authApiClient<{ data: ShareLinkResponse }>(
        `/files/${fileId}/share`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      return res.data;
    },
    []
  );

  const revokeShareLink = useCallback(async (token: string): Promise<void> => {
    await authApiClient(`/share/${token}`, { method: "DELETE" });
  }, []);

  const bulkDeleteFiles = useCallback(
    async (folderPath: string, fileIds: string[]): Promise<BulkDeleteResponse> => {
      const ids = dedupeIds(fileIds);
      const res = await authApiClient<BulkDeleteResponse>(
        `/projects/${projectId}/files/bulk-delete`,
        {
          method: "POST",
          body: JSON.stringify({ folderPath, fileIds: ids }),
        }
      );
      const idSet = new Set(ids);
      setFiles((prev) => prev.filter((f) => !idSet.has(f.id)));
      await loadTree();
      return res;
    },
    [projectId, loadTree]
  );

  const bulkCreateShareLinks = useCallback(
    async (
      folderPath: string,
      fileIds: string[],
      payload: CreateShareLinkPayload
    ): Promise<BulkShareLinkItem[]> => {
      const ids = dedupeIds(fileIds);
      const res = await authApiClient<{ data: BulkShareLinkItem[] }>(
        `/projects/${projectId}/files/bulk-share`,
        {
          method: "POST",
          body: JSON.stringify({ folderPath, fileIds: ids, ...payload }),
        }
      );
      return res.data ?? [];
    },
    [projectId]
  );

  const bulkGetDownloadUrls = useCallback(
    async (folderPath: string, fileIds: string[]): Promise<BulkDownloadUrlItem[]> => {
      const ids = dedupeIds(fileIds);
      const res = await authApiClient<{ data: BulkDownloadUrlItem[] }>(
        `/projects/${projectId}/files/bulk-download-urls`,
        {
          method: "POST",
          body: JSON.stringify({ folderPath, fileIds: ids }),
        }
      );
      return res.data ?? [];
    },
    [projectId]
  );

  const createFolder = useCallback(
    async (name: string, parentPath: string | null) => {
      const res = await authApiClient<{ data: ProjectFolderRecord }>(
        `/projects/${projectId}/folders/custom`,
        {
          method: "POST",
          body: JSON.stringify({ name, parentPath }),
        },
      );
      await loadTree();
      return res.data;
    },
    [projectId, loadTree],
  );

  const renameFolder = useCallback(
    async (path: string, newName: string) => {
      const res = await authApiClient<{ data: ProjectFolderRecord }>(
        `/projects/${projectId}/folders`,
        {
          method: "PATCH",
          body: JSON.stringify({ path, newName }),
        },
      );
      await loadTree();
      if (currentFolderPath?.startsWith(path)) {
        const suffix = currentFolderPath.slice(path.length);
        const newPath =
          path === currentFolderPath
            ? res.data.path
            : res.data.path + suffix;
        setCurrentFolderPath(newPath);
      }
      return res.data;
    },
    [projectId, loadTree, currentFolderPath],
  );

  const deleteFolder = useCallback(
    async (path: string) => {
      const qs = new URLSearchParams({ path });
      await authApiClient(`/projects/${projectId}/folders?${qs}`, {
        method: "DELETE",
      });
      if (currentFolderPath === path || currentFolderPath?.startsWith(`${path}/`)) {
        setCurrentFolderPath(null);
      }
      await loadTree();
    },
    [projectId, loadTree, currentFolderPath],
  );

  return {
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
    bulkDeleteFiles,
    bulkCreateShareLinks,
    bulkGetDownloadUrls,
    createFolder,
    renameFolder,
    deleteFolder,
    reloadFiles: () => currentFolderPath ? loadFiles(currentFolderPath) : Promise.resolve(),
    reloadTree: loadTree,
  };
}
