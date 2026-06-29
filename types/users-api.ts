import type { User, UserRole, UserStatus } from "./users";

export interface UsersListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsersListResponse {
  data: User[];
  meta: UsersListMeta;
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  status?: UserStatus;
  search?: string;
  roles?: UserRole[];
}

export interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name?: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  roles?: UserRole[];
  status?: UserStatus;
}
