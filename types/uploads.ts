export type UploadStatus =
  | "queued"
  | "uploading"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export interface UploadJob {
  id: string;
  projectId: string;
  folderPath: string;
  folderLabel?: string;
  file: File;
  fileName: string;
  fileSize: number;
  replaceFileId?: string;
  status: UploadStatus;
  progress: number;
  bytesUploaded: number;
  error?: string;
  startedAt?: number;
  etaSeconds?: number | null;
  createdAt: number;
}

/** One file to enqueue; optional relativePath preserves nested folder structure. */
export interface UploadFileItem {
  file: File;
  relativePath?: string;
}

export interface EnqueueUploadInput {
  projectId: string;
  /** Base destination folder (current selection). */
  folderPath: string;
  folderLabel?: string;
  files: UploadFileItem[];
  replaceFileId?: string;
}

export type UploadCompleteListener = (job: UploadJob) => void;
