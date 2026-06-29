export type TaskableHoldRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "APPROVED_MODIFIED"
  | "DECLINED"
  | "CANCELLED"
  | "EXPIRED";

export interface TaskableHoldRequestUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface TaskableHoldRequestTask {
  id: string;
  title?: string;
  projectId?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface TaskableHoldRequest {
  id: string;
  taskId: string;
  requestedById: string;
  reason: string;
  requestedStartDate: string;
  requestedEndDate: string;
  requestedNote?: string | null;
  status: TaskableHoldRequestStatus;
  reviewedById?: string | null;
  approvedStartDate?: string | null;
  approvedEndDate?: string | null;
  adminNote?: string | null;
  holdHoursGranted?: string | number;
  reviewedAt?: string | null;
  appliedAt?: string | null;
  resumedAt?: string | null;
  created_at?: string;
  updated_at?: string;
  requestedBy?: TaskableHoldRequestUser;
  reviewedBy?: TaskableHoldRequestUser | null;
  task?: TaskableHoldRequestTask;
}

export interface HoldRequestsListResponse {
  data: TaskableHoldRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateHoldRequestPayload {
  task_id: string;
  reason: string;
  requested_start_date: string;
  requested_end_date: string;
  requested_note?: string;
}
