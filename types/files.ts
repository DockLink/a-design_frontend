export interface ProjectFolderNode {
  name: string;
  path: string;
  isVersioned: boolean;
  children: ProjectFolderNode[];
}

export interface ProjectFolderTree {
  tree: ProjectFolderNode[];
  fileCounts: Record<string, number>;
  /** Live source folder path for each Superseded archive mirror path. */
  sourceByArchivePath?: Record<string, string>;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  s3ObjectKey: string;
  folderCategory: string;
  folderPath: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  version: number;
  isSuperseded: boolean;
  uploadedById: string;
  supersededById: string | null;
  deletedAt: string | null;
  created_at: string;
  updated_at: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  expiresAt: string;
}

export interface ShareLinkResponse {
  token: string;
  shareUrl: string;
  expiresAt: string | null;
  allowDownload: boolean;
}

export interface CreateShareLinkPayload {
  expiresAt?: string;
  allowDownload?: boolean;
}

export interface ProvisionFoldersResponse {
  s3RootPrefix: string;
}

export interface ProjectFolderRecord {
  path: string;
  name: string;
  parentPath: string | null;
  isSystem: boolean;
  isVersioned: boolean;
  archivePath: string | null;
}
