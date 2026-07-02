"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/hooks/use-auth";
import { authApiClient } from "@/lib/api/authenticated-client";
import {
  applyUserPreferences,
  clearAppliedUserPreferences,
  DEFAULT_USER_PREFERENCES,
  mergeUserPreferences,
} from "@/lib/theme/preferences";
import type { User, UserPreferences } from "@/types/users";

type UserPreferencesContextValue = {
  preferences: UserPreferences;
  setPreferences: (next: UserPreferences) => void;
  savePreferences: (patch: Partial<UserPreferences>) => Promise<UserPreferences>;
  isSaving: boolean;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferencesState] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAppliedUserPreferences();
      setPreferencesState(DEFAULT_USER_PREFERENCES);
      return;
    }
    const merged = mergeUserPreferences(user?.preferences);
    setPreferencesState(merged);
    applyUserPreferences(merged);
  }, [isAuthenticated, user?.preferences]);

  const setPreferences = useCallback((next: UserPreferences) => {
    setPreferencesState(next);
    applyUserPreferences(next);
  }, []);

  const savePreferences = useCallback(async (patch: Partial<UserPreferences>) => {
    setIsSaving(true);
    try {
      const updatedUser = await authApiClient<User>("/auth/me/preferences", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const merged = mergeUserPreferences(updatedUser.preferences);
      setPreferencesState(merged);
      applyUserPreferences(merged);
      return merged;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      setPreferences,
      savePreferences,
      isSaving,
    }),
    [preferences, setPreferences, savePreferences, isSaving],
  );

  return (
    <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error("useUserPreferences must be used within UserPreferencesProvider");
  }
  return ctx;
}
