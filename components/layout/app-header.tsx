"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Search, Settings } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useCommandPalette } from "@/components/layout/command-palette";
import { useNotifications } from "@/hooks/use-notifications";
import { dsVibrancy } from "@/lib/styles/dashboard-tokens";
import { BRAND_WORDMARK } from "@/lib/constants";
import { getUserDisplayName, getUserInitials } from "@/lib/user/display";
import { NAV_ROUTES } from "@/types/navigation";

const PAGE_TITLES: Record<string, string> = {
  [NAV_ROUTES.superAdminDashboard]: "Dashboard",
  [NAV_ROUTES.adminDashboard]: "Dashboard",
  [NAV_ROUTES.leadDashboard]: "Dashboard",
  [NAV_ROUTES.memberDashboard]: "Dashboard",
  [NAV_ROUTES.projects]: "Projects",
  [NAV_ROUTES.myTasks]: "My Tasks",
  [NAV_ROUTES.notifications]: "Notifications",
  [NAV_ROUTES.userManagement]: "Team",
  [NAV_ROUTES.accessRequests]: "Access Requests",
  [NAV_ROUTES.settings]: "Settings",
};

function getPageTitle(pathname: string): string {
  const match = Object.entries(PAGE_TITLES).find(([route]) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
  if (match) return match[1];
  if (pathname.startsWith(`${NAV_ROUTES.projects}/`)) return "Project Detail";
  return "Dashboard";
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const { setOpen: setCommandPaletteOpen } = useCommandPalette();
  const { unreadCount } = useNotifications();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const hasUnreadNotifications = unreadCount > 0;

  const title = getPageTitle(pathname);

  useEffect(() => {
    if (!accountOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  function handleLogout() {
    setAccountOpen(false);
    logout();
    router.replace(NAV_ROUTES.login);
  }

  function goSettings() {
    setAccountOpen(false);
    router.push(NAV_ROUTES.settings);
  }

  return (
    <header
      style={{
        height: "var(--ds-header-height)",
        background: "color-mix(in srgb, var(--ds-bg) 82%, transparent)",
        ...dsVibrancy,
        borderBottom: "0.5px solid var(--ds-separator)",
        position: "fixed",
        top: 0,
        left: isMobile ? 0 : "var(--ds-sidebar-width)",
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--ds-content-padding-x)",
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontSize: "var(--ds-text-title-2)",
          fontWeight: isMobile ? 300 : 600,
          color: "var(--ds-label)",
          letterSpacing: isMobile ? "0.02em" : "-0.02em",
        }}
      >
        {isMobile ? BRAND_WORDMARK : title}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <HeaderBtn title="Search (⌘K)" onClick={() => setCommandPaletteOpen(true)}>
          <Search size={18} />
        </HeaderBtn>

        <HeaderBtn
          title="Notifications"
          onClick={() => router.push(NAV_ROUTES.notifications)}
        >
          <Bell size={18} />
          {hasUnreadNotifications && (
            <span
              style={{
                position: "absolute",
                top: "3px",
                right: "3px",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                borderRadius: "9999px",
                background: "var(--ds-destructive)",
                color: "white",
                fontSize: "10px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </HeaderBtn>

        {user && (
          <div ref={accountRef} style={{ position: "relative", flexShrink: 0 }}>
            <button
              type="button"
              title={getUserDisplayName(user)}
              aria-label="Account"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              onClick={() => setAccountOpen((open) => !open)}
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "rgba(212,169,106,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "var(--ds-text-caption-2)",
                fontWeight: 600,
                color: "var(--ds-accent-hover)",
                cursor: "pointer",
                border: "none",
                padding: 0,
              }}
            >
              {getUserInitials(user)}
            </button>

            {accountOpen ? (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: "180px",
                  padding: "4px",
                  borderRadius: "12px",
                  background: "var(--ds-surface)",
                  border: "0.5px solid var(--ds-separator)",
                  boxShadow: "0 8px 24px rgba(26, 20, 16, 0.12)",
                  zIndex: 40,
                }}
              >
                <AccountMenuItem
                  icon={<Settings size={15} />}
                  label="Settings"
                  onClick={goSettings}
                />
                <AccountMenuItem
                  icon={<LogOut size={15} />}
                  label="Log out"
                  onClick={handleLogout}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}

function AccountMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 10px",
        borderRadius: "8px",
        border: "none",
        background: hovered ? "rgba(60,60,67,0.06)" : "transparent",
        color: "var(--ds-label)",
        fontSize: "var(--ds-text-footnote)",
        fontWeight: 500,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ color: "var(--ds-tertiary-label)", display: "flex" }}>{icon}</span>
      {label}
    </button>
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
        width: "36px",
        height: "36px",
        borderRadius: "var(--ds-radius-control)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--ds-secondary-label)",
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
