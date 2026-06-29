"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authApiClient } from "@/lib/api/authenticated-client";
import type {
  CreateShareLinkPayload,
  DownloadUrlResponse,
  ProjectFile,
  ProjectFolderTree,
  ShareLinkResponse,
} from "@/types/files";

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
    async (folderPath: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderPath", folderPath);

      const token = (await import("@/stores/auth-store")).useAuthStore
        .getState()
        .session?.accessToken;

      if (!token) throw new Error("Not authenticated");

      const res = await fetch(`/api/projects/${projectId}/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { message?: string }).message ?? "Upload failed"
        );
      }

      const body = await res.json();
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
    createShareLink,
    revokeShareLink,
    reloadFiles: () => currentFolderPath ? loadFiles(currentFolderPath) : Promise.resolve(),
    reloadTree: loadTree,
  };
}
