"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authApiClient } from "@/lib/api/authenticated-client";
import { queryKeys } from "@/lib/query/keys";
import { toUsersQueryString } from "@/lib/users/query-string";
import type { User, UserRole, UserStatus } from "@/types/users";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UsersListResponse,
  UsersQueryParams,
} from "@/types/users-api";

async function fetchUsersPage(params: UsersQueryParams): Promise<UsersListResponse> {
  const query = toUsersQueryString(params);
  return authApiClient<UsersListResponse>(`/users${query}`);
}

export function useUsers(params: UsersQueryParams = { page: 1, limit: 20 }) {
  const qc = useQueryClient();
  const [isMutating, setIsMutating] = useState(false);

  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const search = params.search ?? "";
  const status = params.status;
  const normalizedParams: UsersQueryParams = { page, limit, search, status, roles: params.roles };
  const qKey = queryKeys.users.list(normalizedParams);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: qKey,
    queryFn: () => fetchUsersPage(normalizedParams),
    staleTime: 20_000,
  });

  const users = data?.data ?? [];
  const meta = data?.meta ?? null;

  type UpdateUserVars = { userId: string; payload: UpdateUserRequest; optimistic?: Partial<User> };

  const updateMutation = useMutation({
    mutationFn: async ({ userId, payload }: UpdateUserVars) =>
      authApiClient<User>(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onMutate: async ({ userId, optimistic }: UpdateUserVars) => {
      if (!optimistic) return;
      qc.setQueryData<UsersListResponse>(qKey, (prev) =>
        prev
          ? { ...prev, data: prev.data.map((u) => (u.id === userId ? { ...u, ...optimistic } : u)) }
          : prev
      );
    },
    onSuccess: (updated) => {
      qc.setQueryData<UsersListResponse>(qKey, (prev) =>
        prev ? { ...prev, data: prev.data.map((u) => (u.id === updated.id ? updated : u)) } : prev
      );
    },
    onError: () => {
      void qc.invalidateQueries({ queryKey: qKey });
    },
  });

  const updateUser = useCallback(
    async (userId: string, payload: UpdateUserRequest, optimistic?: Partial<User>) => {
      setIsMutating(true);
      try {
        return await updateMutation.mutateAsync({ userId, payload, optimistic });
      } finally {
        setIsMutating(false);
      }
    },
    [updateMutation]
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

  const deleteMutation = useMutation({
    mutationFn: (userId: string) =>
      authApiClient<{ id: string; deleted: true }>(`/users/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: (_result, userId) => {
      qc.setQueryData<UsersListResponse>(qKey, (prev) =>
        prev
          ? {
              ...prev,
              data: prev.data.filter((u) => u.id !== userId),
              meta: prev.meta
                ? {
                    ...prev.meta,
                    total: Math.max(0, prev.meta.total - 1),
                    totalPages: Math.ceil(Math.max(0, prev.meta.total - 1) / limit),
                  }
                : prev.meta,
            }
          : prev
      );
    },
  });

  const deleteUser = useCallback(
    async (userId: string) => {
      setIsMutating(true);
      try {
        await deleteMutation.mutateAsync(userId);
      } finally {
        setIsMutating(false);
      }
    },
    [deleteMutation]
  );

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserRequest) =>
      authApiClient<User>("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (created) => {
      qc.setQueryData<UsersListResponse>(qKey, (prev) => {
        if (!prev) return prev;
        const nextData = page === 1 ? [created, ...prev.data].slice(0, limit) : prev.data;
        return {
          ...prev,
          data: nextData,
          meta: prev.meta
            ? { ...prev.meta, total: prev.meta.total + 1, totalPages: Math.ceil((prev.meta.total + 1) / limit) }
            : prev.meta,
        };
      });
    },
  });

  const createUser = useCallback(
    async (payload: CreateUserRequest) => {
      setIsMutating(true);
      try {
        return await createMutation.mutateAsync(payload);
      } finally {
        setIsMutating(false);
      }
    },
    [createMutation]
  );

  return {
    users,
    meta,
    isLoading,
    isMutating,
    error: error ? (error instanceof Error ? error.message : "Failed to load users") : null,
    refetch: () => refetch().then(() => undefined),
    createUser,
    updateUser,
    setUserRole,
    setUserStatus,
    deleteUser,
  };
}
