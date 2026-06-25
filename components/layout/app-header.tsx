"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Search } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { getUserDisplayName, getUserInitials } from "@/lib/user/display";
import { NAV_ROUTES } from "@/types/navigation";

const PAGE_TITLES: Record<string, string> = {
  [NAV_ROUTES.adminDashboard]: "Dashboard",
  [NAV_ROUTES.leadDashboard]: "Dashboard",
  [NAV_ROUTES.memberDashboard]: "Dashboard",
  [NAV_ROUTES.projects]: "Projects",
  [NAV_ROUTES.myTasks]: "My Tasks",
  [NAV_ROUTES.notifications]: "Notifications",
  [NAV_ROUTES.userManagement]: "Team",
  [NAV_ROUTES.accessRequests]: "Access Requests",
};

function getPageTitle(pathname: string): string {
  const match = Object.entries(PAGE_TITLES).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  if (match) return match[1];
  if (pathname.startsWith(`${NAV_ROUTES.projects}/`)) return "Project Detail";
  return "Dashboard";
}

export function AppHeader({ hasUnreadNotifications = false }: { hasUnreadNotifications?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const title = getPageTitle(pathname);

  return (
    <header
      style={{
        height: "52px",
        background: "rgba(252,248,244,0.88)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "0.5px solid rgba(60,60,67,0.14)",
        position: "fixed",
        top: 0,
        left: isMobile ? 0 : "216px",
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontSize: "17px",
          fontWeight: 600,
          color: "#1C1C1E",
          letterSpacing: "-0.2px",
        }}
      >
        {isMobile ? "A-Design" : title}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <HeaderBtn title="Search">
          <Search size={17} />
        </HeaderBtn>

        <HeaderBtn
          title="Notifications"
          onClick={() => router.push(NAV_ROUTES.notifications)}
        >
          <Bell size={17} />
          {hasUnreadNotifications && (
            <span
              style={{
                position: "absolute",
                top: "7px",
                right: "7px",
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#D4A96A",
              }}
            />
          )}
        </HeaderBtn>

        {user && (
          <div
            title={getUserDisplayName(user)}
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "50%",
              background: "rgba(212,169,106,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 600,
              color: "#C9894A",
              cursor: "default",
              flexShrink: 0,
            }}
          >
            {getUserInitials(user)}
          </div>
        )}
      </div>
    </header>
  );
}

function HeaderBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick?: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "#6C6C70",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(60,60,67,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}