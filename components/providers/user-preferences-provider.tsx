"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/hooks/use-auth";
import { authApiClient } from "@/lib/api/authenticated-client";
import {
  applyUserPreferences,
  clearAppliedUserPreferences,
  DEFAULT_APP_APPEARANCE,
  DEFAULT_USER_PREFERENCES,
  mergeAppAppearance,
  mergeEffectivePreferences,
  mergeUserPreferences,
} from "@/lib/theme/preferences";
import type { AppAppearanceSettings } from "@/types/app-settings";
import type { User, UserPreferences } from "@/types/users";

const APPEARANCE_POLL_MS = 30_000;

type UserPreferencesContextValue = {
  preferences: UserPreferences;
  appAppearance: AppAppearanceSettings;
  setPreferences: (next: UserPreferences) => void;
  savePreferences: (patch: Partial<UserPreferences>) => Promise<UserPreferences>;
  saveAppAppearance: (patch: Partial<AppAppearanceSettings>) => Promise<AppAppearanceSettings>;
  refreshAppAppearance: () => Promise<AppAppearanceSettings>;
  pausePolling: () => void;
  resumePolling: () => void;
  isSaving: boolean;
  isSavingAppearance: boolean;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(null);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [appAppearance, setAppAppearance] = useState<AppAppearanceSettings>(DEFAULT_APP_APPEARANCE);
  const [preferences, setPreferencesState] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);
  const pollingPausedRef = useRef(false);

  const pausePolling = useCallback(() => {
    pollingPausedRef.current = true;
  }, []);
  const resumePolling = useCallback(() => {
    pollingPausedRef.current = false;
  }, []);

  const applyEffective = useCallback(
    (appearance: AppAppearanceSettings, stored?: Partial<UserPreferences> | null) => {
      const effective = mergeEffectivePreferences(appearance, stored);
      setAppAppearance(appearance);
      setPreferencesState(effective);
      applyUserPreferences(effective);
      return effective;
    },
    [],
  );

  const refreshAppAppearance = useCallback(async () => {
    const data = await authApiClient<AppAppearanceSettings>("/app-settings/appearance");
    const merged = mergeAppAppearance(data);
    applyEffective(merged, user?.preferences);
    return merged;
  }, [applyEffective, user?.preferences]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAppliedUserPreferences();
      setAppAppearance(DEFAULT_APP_APPEARANCE);
      setPreferencesState(DEFAULT_USER_PREFERENCES);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const data = await authApiClient<AppAppearanceSettings>("/app-settings/appearance");
        if (cancelled) return;
        applyEffective(mergeAppAppearance(data), user?.preferences);
      } catch {
        if (!cancelled) {
          applyEffective(DEFAULT_APP_APPEARANCE, user?.preferences);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.preferences, applyEffective]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const onFocus = () => {
      if (!pollingPausedRef.current) {
        void refreshAppAppearance().catch(() => undefined);
      }
    };

    const intervalId = window.setInterval(() => {
      if (!pollingPausedRef.current) {
        void refreshAppAppearance().catch(() => undefined);
      }
    }, APPEARANCE_POLL_MS);

    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, refreshAppAppearance]);

  const setPreferences = useCallback(
    (next: UserPreferences) => {
      setPreferencesState(next);
      applyUserPreferences(next);
    },
    [],
  );

  const savePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      setIsSaving(true);
      try {
        const updatedUser = await authApiClient<User>("/auth/me/preferences", {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        const personal = mergeUserPreferences(updatedUser.preferences);
        const effective = applyEffective(appAppearance, personal);
        return effective;
      } finally {
        setIsSaving(false);
      }
    },
    [appAppearance, applyEffective],
  );

  const saveAppAppearance = useCallback(
    async (patch: Partial<AppAppearanceSettings>) => {
      setIsSavingAppearance(true);
      try {
        const updated = await authApiClient<AppAppearanceSettings>("/app-settings/appearance", {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        const merged = mergeAppAppearance(updated);
        applyEffective(merged, user?.preferences);
        return merged;
      } finally {
        setIsSavingAppearance(false);
      }
    },
    [applyEffective, user?.preferences],
  );

  const value = useMemo(
    () => ({
      preferences,
      appAppearance,
      setPreferences,
      savePreferences,
      saveAppAppearance,
      refreshAppAppearance,
      pausePolling,
      resumePolling,
      isSaving,
      isSavingAppearance,
    }),
    [
      preferences,
      appAppearance,
      setPreferences,
      savePreferences,
      saveAppAppearance,
      refreshAppAppearance,
      pausePolling,
      resumePolling,
      isSaving,
      isSavingAppearance,
    ],
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
