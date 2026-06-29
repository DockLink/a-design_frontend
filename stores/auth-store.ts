"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiClient } from "@/lib/api/client";
import { clearActivity, isInactiveTooLong, recordActivity } from "@/lib/auth/activity";
import { notifySessionExpired } from "@/lib/auth/session-expiry";
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
          // Fresh login counts as activity; start the inactivity window now.
          recordActivity(true);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        clearActivity();
        set({ session: null });
      },

      refreshSession: async () => {
        const session = get().session;
        if (!session?.refreshToken) {
          if (session) {
            set({ session: null });
            notifySessionExpired();
          }
          return null;
        }

        // Honour the hard inactivity ceiling: if the user hasn't interacted in
        // longer than the allowed window, force a logout instead of refreshing.
        if (isInactiveTooLong()) {
          clearActivity();
          set({ session: null });
          notifySessionExpired();
          return null;
        }

        try {
          const response = await apiClient<LoginResponse>("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({ refresh_token: session.refreshToken }),
          });

          const nextSession = toAuthSession(response);
          set((state) => ({
            // Preserve the freshest user profile we already hold if the refresh
            // response somehow lacks it.
            session: { ...nextSession, user: nextSession.user ?? state.session?.user },
          }));
          return nextSession.accessToken;
        } catch (error) {
          // Refresh token itself is dead → session is unrecoverable.
          if (error instanceof ApiError && (error.status === 401 || error.status === 400)) {
            clearActivity();
            set({ session: null });
            notifySessionExpired();
            return null;
          }
          // Transient/network error: keep the session so a later retry can work.
          throw error;
        }
      },

      refreshUser: async () => {
        const session = get().session;
        if (!session?.accessToken) return;

        set({ isLoading: true });

        const fetchMe = (token: string) =>
          apiClient<User>("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

        // If the persisted token is already expired (e.g. the tab was closed
        // for a while), refresh BEFORE calling /auth/me so a page reload never
        // bounces the user to login while a valid refresh token exists.
        let token = session.accessToken;
        const expiresAtMs = session.expiresAt ? session.expiresAt * 1000 : null;
        if (session.refreshToken && expiresAtMs && expiresAtMs - Date.now() <= 60_000) {
          const refreshed = await get().refreshSession().catch(() => null);
          if (!refreshed) {
            set({ isLoading: false });
            return; // refreshSession already cleared the session if unrecoverable
          }
          token = refreshed;
        }

        try {
          const user = await fetchMe(token);
          set((state) => ({
            session: state.session ? { ...state.session, user } : null,
            isLoading: false,
          }));
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            // Token rejected — try a one-shot refresh + retry before giving up.
            const refreshed = await get().refreshSession().catch(() => null);
            if (refreshed) {
              try {
                const user = await fetchMe(refreshed);
                set((state) => ({
                  session: state.session ? { ...state.session, user } : null,
                  isLoading: false,
                }));
                return;
              } catch {
                /* fall through to logout */
              }
            }
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
