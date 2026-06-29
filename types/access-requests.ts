export type AccessRequestStatus = "PENDING" | "APPROVED" | "DECLINED";

export type ProjectMemberRole = "VIEWER" | "MEMBER" | "PRU";

export interface AccessRequestUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
}

export interface AccessRequestProject {
  id: string;
  name: string;
  code?: string;
}

export interface AccessRequest {
  id: string;
  projectId: string;
  requestedById: string;
  requestNote?: string | null;
  status: AccessRequestStatus;
  reviewedById?: string | null;
  grantedRole?: ProjectMemberRole | null;
  reviewedAt?: string | null;
  created_at: string;
  updated_at: string;
  project?: AccessRequestProject;
  requestedBy?: AccessRequestUser;
  reviewedBy?: AccessRequestUser | null;
}

export interface AccessRequestsListResponse {
  data: AccessRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AccessRequestsQueryParams {
  page?: number;
  limit?: number;
  status?: AccessRequestStatus;
  project_id?: string;
  requested_by_id?: string;
}

export interface CreateAccessRequestPayload {
  project_id: string;
  request_note?: string;
}

export type AccessRequestReviewAction = "approve" | "reject";

export interface ReviewAccessRequestPayload {
  accessRequestId: string;
  action: AccessRequestReviewAction;
  grantedRole?: ProjectMemberRole;
}
