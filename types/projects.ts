export type ProjectStatus = "ACTIVE" | "INACTIVE";

export interface ProjectImage {
  id: string;
  url: string;
}

export interface ProjectBriefAttachment {
  id: string;
  url: string;
  file_name?: string | null;
  mime_type?: string | null;
}

export interface ProjectClient {
  id: string;
  name: string;
  code?: string;
  contact_email?: string | null;
  contact_number?: string | null;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  start_date: string;
  duration: string;
  location: string | null;
  latitude?: number | null;
  longitude?: number | null;
  vimeo_url?: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  client: ProjectClient | null;
  images: ProjectImage[];
  brief_attachments?: ProjectBriefAttachment[];
  current_stage?: string | null;
}

export interface ProjectsListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProjectsListResponse {
  data: Project[];
  meta: ProjectsListMeta;
}

export interface ProjectsQueryParams {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  search?: string;
  clients?: string[];
  as_member?: boolean;
  as_member_role?: ProjectMemberProjectRole;
}

/** UI card — maps from real API data */
export interface ProjectCardView {
  id: string;
  name: string;
  client: string;
  thumbnail: string;
  status: "Active" | "Inactive";
  number: string;
  location?: string | null;
  currentStage?: string | null;
  currentPhase?: number;
  lead?: string;
  teamSize?: number;
  completion?: number;
  created_at?: string;
}
export interface ProjectMember {
  project_id: string;
  user_id: string;
  assigned_by: string;
  status: "ACTIVE" | "INACTIVE";
  role?: ProjectMemberProjectRole;
  assignee?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    first_name?: string;
    last_name?: string;
    roles?: import("./users").UserRole[];
  };
}

export interface ProjectWithMembers extends Project {
  members?: ProjectMember[];
}

export interface CreateProjectRequest {
  code?: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  vimeo_url?: string;
  images?: string[];
  brief_attachments?: string[];
  client: {
    code?: string;
    name: string;
    contact_number?: string;
    contact_email?: string;
  };
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  vimeo_url?: string;
  status?: ProjectStatus;
  images?: { id: string }[];
  brief_attachments?: { id: string }[];
  client?: { id: string; name?: string; contact_number?: string; contact_email?: string };
}

export interface ProjectMemberAssignRequest {
  members: ProjectMemberAssignItem[];
}

/** DB enum value for per-project lead (Project Responsible User). */
export const PROJECT_LEAD_ROLE = "PRU" as const;

export type ProjectMemberProjectRole = "PRU" | "MEMBER" | "VIEWER";

export interface ProjectMemberAssignItem {
  user_id: string;
  status?: "ACTIVE" | "INACTIVE";
  role?: ProjectMemberProjectRole;
}

export interface CreateProjectStageInput {
  name: string;
  start_date: string;
  /** Either an explicit end date or a duration must be provided. */
  end_date?: string;
  duration?: string;
  order: number;
}

export interface LeadProjectView {
  id: string;
  name: string;
  status: "In Progress" | "Review" | "Planning" | "Completed";
  progress: number;
  tasks: number;
  isAssigned: boolean;
}

export interface MemberProjectView {
  id: string;
  name: string;
  progress?: number;
  isAssigned: boolean;
}