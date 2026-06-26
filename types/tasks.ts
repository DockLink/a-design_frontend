export type TaskableStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "ON_HOLD"
  | "COMPLETED"
  | "REOPENED";
export type TaskableType = "MILESTONE" | "STAGE" | "TASK";
export type TaskablePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Task {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  start_date: string;
  duration: string;
  status: TaskableStatus;
  taskableType: TaskableType;
  taskablePriority: TaskablePriority;
  order: number;
  depth: number;
  projectId: string;
  created_at?: string;
  updated_at?: string;
  subtasks?: Task[];
  children?: Task[];
}

export interface TaskAssigneeRecord {
  taskable_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: string;
  status: string;
  assignee?: {
    id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface TaskWithAssignees extends Task {
  assignees: TaskAssigneeRecord[];
}

export interface TaskAssigneeUpdate {
  user_id: string;
  status?: "ACTIVE" | "INACTIVE";
}

export interface TasksListResponse {
  data: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TasksQueryParams {
  page?: number;
  limit?: number;
  status?: TaskableStatus;
  taskable_type?: TaskableType;
  search?: string;
  projects?: string[];
  depth?: number;
}

export interface CreateTaskRequest {
  project_id: string;
  title: string;
  start_date: string;
  duration: string;
  code?: string;
  parent_taskable_id?: string;
  taskable_type?: TaskableType;
  taskable_priority?: TaskablePriority;
  order?: number;
  description?: string;
  status?: TaskableStatus;
}

/** UI row for lead dashboard */
export interface LeadTaskRow {
  id: string;
  project: string;
  title: string;
  due: string;
  dueColor: string;
}

export type TaskUrgency = "overdue" | "today" | "soon";

/** UI row for member dashboard */
export interface MemberTaskRow extends LeadTaskRow {
  urgency: TaskUrgency;
}