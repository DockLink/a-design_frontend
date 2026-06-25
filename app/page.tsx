"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { NAV_ROUTES } from "@/types/navigation";
import { ROLE_DEFAULT_ROUTE } from "@/types/rbac";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, session } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace(NAV_ROUTES.login);
      return;
    }

    const role = session?.user.roles
      ? getPrimaryRole(session.user.roles)
      : null;
    router.replace(role ? ROLE_DEFAULT_ROUTE[role] : NAV_ROUTES.adminDashboard);
  }, [isAuthenticated, isHydrated, router, session]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F5F1]">
      <div className="size-8 animate-spin rounded-full border-2 border-[#D4A96A] border-t-transparent" />
    </div>
  );
}
