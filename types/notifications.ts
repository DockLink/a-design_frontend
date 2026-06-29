import type { TaskableHoldRequest, TaskableHoldRequestStatus } from "@/types/hold-requests";

export type NotificationType = "hold_request";

export interface AppNotification {
  /** Stable id for the notification (the hold request id). */
  id: string;
  /** Composite key including status so a status change surfaces as unread again. */
  key: string;
  type: NotificationType;
  status: TaskableHoldRequestStatus;
  title: string;
  body: string;
  requesterName: string;
  taskTitle: string;
  taskId: string;
  projectId?: string;
  createdAt: string;
  /** True when the current user can act on this (admin/lead + pending). */
  actionable: boolean;
  raw: TaskableHoldRequest;
}
