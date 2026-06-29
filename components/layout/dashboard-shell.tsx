"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Toaster } from "sonner";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { NotificationsProvider } from "@/hooks/use-notifications";
import { canAccessRoute, HOME_ROUTE, toSidebarRole } from "@/lib/navigation/sidebar-role";
import { NAV_ROUTES } from "@/types/navigation";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { isAuthenticated, isHydrated, primaryRole } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace(NAV_ROUTES.login);
      return;
    }
    if (primaryRole && !canAccessRoute(primaryRole, pathname)) {
      router.replace(HOME_ROUTE[toSidebarRole(primaryRole)]);
    }
  }, [isAuthenticated, isHydrated, pathname, primaryRole, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FCF8F4" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid #D4A96A", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <NotificationsProvider>
      <div className="ds-app" style={{ minHeight: "100vh", background: "var(--ds-bg)" }}>
        <Toaster position="top-right" richColors />
        <AppSidebar />
        <AppHeader />
        <main
          style={{
            minHeight: "100vh",
            paddingTop: "var(--ds-header-height)",
            paddingBottom: isMobile ? "72px" : "40px",
            marginLeft: isMobile ? 0 : "var(--ds-sidebar-width)",
          }}
        >
          <div
            style={{
              padding: "var(--ds-content-padding-y) var(--ds-content-padding-x)",
              maxWidth: "var(--ds-content-max-width)",
              margin: "0 auto",
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </NotificationsProvider>
  );
}