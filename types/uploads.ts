export type UploadStatus =
  | "queued"
  | "uploading"
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

export interface EnqueueUploadInput {
  projectId: string;
  folderPath: string;
  folderLabel?: string;
  files: File[];
  replaceFileId?: string;
}

export type UploadCompleteListener = (job: UploadJob) => void;
