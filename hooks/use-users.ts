"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import { toUsersQueryString } from "@/lib/users/query-string";
import type { User, UserRole, UserStatus } from "@/types/users";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UsersListResponse,
  UsersQueryParams,
} from "@/types/users-api";

function rolesKey(roles?: UserRole[]): string {
  return roles?.join(",") ?? "";
}

export function useUsers(params: UsersQueryParams = { page: 1, limit: 20 }) {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<UsersListResponse["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usersRef = useRef(users);
  usersRef.current = users;

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const search = params.search ?? "";
  const status = params.status;
  const rolesKeyStr = rolesKey(params.roles);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = toUsersQueryString({ page, limit, search, status, roles: params.roles });
      const response = await authApiClient<UsersListResponse>(`/users${query}`);
      setUsers(response.data);
      setMeta(response.meta);
    } catch (err) {
      setUsers([]);
      setMeta(null);
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, status, rolesKeyStr, params.roles]);

  const updateUser = useCallback(
    async (userId: string, payload: UpdateUserRequest, optimistic?: Partial<User>) => {
      const snapshot = usersRef.current.find((u) => u.id === userId);
      if (!snapshot) throw new Error("User not found");

      if (optimistic) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, ...optimistic } : u))
        );
      }

      setIsMutating(true);
      try {
        const updated = await authApiClient<User>(`/users/${userId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
        return updated;
      } catch (err) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? snapshot : u))
        );
        throw err;
      } finally {
        setIsMutating(false);
      }
    },
    []
  );

  const setUserRole = useCallback(
    async (userId: string, role: UserRole) => {
      return updateUser(userId, { role }, { roles: [role] });
    },
    [updateUser]
  );

  const setUserStatus = useCallback(
    async (userId: string, status: UserStatus) => {
      return updateUser(userId, { status }, { status });
    },
    [updateUser]
  );

  const deleteUser = useCallback(async (userId: string) => {
    setIsMutating(true);
    try {
      await authApiClient<{ id: string; deleted: true }>(`/users/${userId}`, {
        method: "DELETE",
      });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setMeta((prev) =>
        prev
          ? {
              ...prev,
              total: Math.max(0, prev.total - 1),
              totalPages: Math.ceil(Math.max(0, prev.total - 1) / limit),
            }
          : prev
      );
    } finally {
      setIsMutating(false);
    }
  }, [limit]);

  const createUser = useCallback(async (payload: CreateUserRequest) => {
    setIsMutating(true);
    try {
      const created = await authApiClient<User>("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (page === 1) {
        setUsers((prev) => [created, ...prev].slice(0, limit));
      }
      setMeta((prev) =>
        prev ? { ...prev, total: prev.total + 1, totalPages: Math.ceil((prev.total + 1) / limit) } : prev
      );
      return created;
    } finally {
      setIsMutating(false);
    }
  }, [page, limit]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    meta,
    isLoading,
    isMutating,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    setUserRole,
    setUserStatus,
    deleteUser,
  };
}
