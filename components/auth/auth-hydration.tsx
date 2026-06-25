"use client";

import { useEffect } from "react";

import { useAuthStore } from "@/stores/auth-store";

/** Ensures persisted auth state rehydrates on the client (Next.js App Router). */
export function AuthHydration() {
  useEffect(() => {
    const finishHydration = () => {
      useAuthStore.setState({ isHydrated: true });
    };

    if (useAuthStore.persist.hasHydrated()) {
      finishHydration();
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(finishHydration);
    void useAuthStore.persist.rehydrate();

    return unsub;
  }, []);

  return null;
}
