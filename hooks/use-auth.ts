"use client";

import { useMemo } from "react";

import { getPrimaryRole } from "@/lib/auth/rbac";
import { useAuthStore } from "@/stores/auth-store";

export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const hasRole = useAuthStore((s) => s.hasRole);

  const primaryRole = useMemo(
    () => (session?.user.roles ? getPrimaryRole(session.user.roles) : null),
    [session?.user.roles]
  );

  return {
    session,
    user: session?.user ?? null,
    accessToken: session?.accessToken ?? null,
    isAuthenticated: Boolean(session?.accessToken),
    isLoading,
    isHydrated,
    login,
    logout,
    refreshUser,
    hasRole,
    primaryRole,
  };
}
