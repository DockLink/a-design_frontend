"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiClient } from "@/lib/api/client";
import { getPrimaryRole, hasAnyRole } from "@/lib/auth/rbac";
import { toAuthSession } from "@/lib/auth/sessions";
import { AUTH_STORAGE_KEY } from "@/lib/constants";
import { ApiError } from "@/types/api";
import type { AuthState } from "@/types/auth";
import type { LoginResponse } from "@/types/auth";
import type { User, UserRole } from "@/types/users";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: null,
      isLoading: false,
      isHydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await apiClient<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });

          set({
            session: toAuthSession(response),
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ session: null });
      },

      refreshUser: async () => {
        const session = get().session;
        if (!session?.accessToken) return;

        set({ isLoading: true });
        try {
          const user = await apiClient<User>("/auth/me", {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });

          set((state) => ({
            session: state.session ? { ...state.session, user } : null,
            isLoading: false,
          }));
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            set({ session: null, isLoading: false });
            return;
          }
          set({ isLoading: false });
          throw error;
        }
      },

      hasRole: (...roles: UserRole[]) => {
        const userRoles = get().session?.user.roles ?? [];
        return hasAnyRole(userRoles, ...roles);
      },

      get primaryRole() {
        const roles = get().session?.user.roles ?? [];
        return getPrimaryRole(roles);
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ session: state.session }),
      skipHydration: true,
      onRehydrateStorage: () => (state, error) => {
        const finishHydration = () => {
          useAuthStore.setState({ isHydrated: true });
        };

        if (error) {
          finishHydration();
          return;
        }

        const session = state?.session;
        if (!session?.accessToken || !state) {
          return;
        }

        void state.refreshUser().catch(() => {});
      },
    }
  )
);
