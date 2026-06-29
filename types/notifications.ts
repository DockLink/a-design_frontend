import type { AccessRequest, AccessRequestStatus } from "@/types/access-requests";
import type { TaskableHoldRequest, TaskableHoldRequestStatus } from "@/types/hold-requests";

export type NotificationType = "hold_request" | "access_request" | "file_version";

export interface FileVersionEvent {
  id: string;
  projectId: string;
  projectName: string;
  fileId: string;
  newFileName: string;
  replacedFileName: string;
  folderPath: string;
  version: number;
  uploadedByName: string;
  createdAt: string;
}

export interface FileVersionsListResponse {
  data: FileVersionEvent[];
}

interface BaseNotification {
  id: string;
  key: string;
  title: string;
  body: string;
  requesterName: string;
  createdAt: string;
  actionable: boolean;
}

export interface HoldAppNotification extends BaseNotification {
  type: "hold_request";
  status: TaskableHoldRequestStatus;
  taskTitle: string;
  taskId: string;
  projectId?: string;
  raw: TaskableHoldRequest;
}

export interface AccessAppNotification extends BaseNotification {
  type: "access_request";
  status: AccessRequestStatus;
  projectName: string;
  projectId: string;
  raw: AccessRequest;
}

export interface FileVersionAppNotification extends BaseNotification {
  type: "file_version";
  projectName: string;
  projectId: string;
  folderPath: string;
  newFileName: string;
  replacedFileName: string;
  raw: FileVersionEvent;
}

export type AppNotification =
  | HoldAppNotification
  | AccessAppNotification
  | FileVersionAppNotification;
