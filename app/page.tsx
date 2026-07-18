"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { NAV_ROUTES } from "@/types/navigation";
import { resolveGuestLandingRoute } from "@/lib/navigation/guest-landing";
import { resolveHomeRoute } from "@/lib/navigation/home-route";
import { isGuestRole } from "@/lib/user/guest";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, session } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.replace(NAV_ROUTES.login);
      return;
    }

    const roles = session?.user.roles ?? [];
    const role = roles.length ? getPrimaryRole(roles) : null;

    if (isGuestRole(roles)) {
      void resolveGuestLandingRoute(roles).then((route) => router.replace(route));
      return;
    }

    router.replace(
      role
        ? resolveHomeRoute(role, session?.user.preferences)
        : NAV_ROUTES.adminDashboard,
    );
  }, [isAuthenticated, isHydrated, router, session]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F5F1]">
      <div className="size-8 animate-spin rounded-full border-2 border-[#D4A96A] border-t-transparent" />
    </div>
  );
}
