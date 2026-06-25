export type ProjectStatus = "ACTIVE" | "INACTIVE";

export interface ProjectImage {
  id: string;
  url: string;
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
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  client: ProjectClient | null;
  images: ProjectImage[];
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
}

/** UI card — maps from real API data */
export interface ProjectCardView {
  id: string;
  name: string;
  client: string;
  thumbnail: string;
  status: "Active" | "Inactive";
  number: string;
  currentPhase?: number;
  lead?: string;
  teamSize?: number;
  completion?: number;
}
export interface ProjectMember {
  project_id: string;
  user_id: string;
  assigned_by: string;
  status: "ACTIVE" | "INACTIVE";
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
  duration: string;
  location?: string;
  images?: string[];
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
  duration?: string;
  location?: string;
  status?: ProjectStatus;
  images?: { id: string }[];
  client?: { id: string; name?: string; contact_number?: string; contact_email?: string };
}

export interface ProjectMemberAssignRequest {
  members: { user_id: string; status?: "ACTIVE" | "INACTIVE" }[];
}

export interface CreateProjectStageInput {
  name: string;
  start_date: string;
  duration: string;
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