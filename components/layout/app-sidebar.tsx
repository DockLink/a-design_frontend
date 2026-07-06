"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CheckSquare,
  ClipboardList,
  Folder,
  Home,
  LogOut,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useNotifications } from "@/hooks/use-notifications";
import { dsVibrancy } from "@/lib/styles/dashboard-tokens";
import { BRAND_WORDMARK } from "@/lib/constants";
import {
  ROLE_LABEL,
  toSidebarRole,
} from "@/lib/navigation/sidebar-role";
import { resolveHomeRoute } from "@/lib/navigation/home-route";
import { getUserDisplayName } from "@/lib/user/display";
import { NAV_ROUTES } from "@/types/navigation";
import { UserAvatar } from "@/components/user-management/user-avatar";

const PROJECT_ROUTES = [NAV_ROUTES.projects];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user, primaryRole, logout } = useAuth();
  const { preferences } = useUserPreferences();
  const { unreadCount } = useNotifications();
  const hasUnreadNotifications = unreadCount > 0;
  const collapsed = preferences.sidebar_mode === "collapsed";

  if (!user || !primaryRole) return null;

  const sidebarRole = toSidebarRole(primaryRole);
  const homePage = resolveHomeRoute(primaryRole, preferences);

  const isActive = (routes: string | string[]) => {
    const list = Array.isArray(routes) ? routes : [routes];
    return list.some((r) => pathname === r || pathname.startsWith(`${r}/`));
  };

  const go = (href: string) => router.push(href);

  function handleLogout() {
    logout();
    router.replace(NAV_ROUTES.login);
  }

  if (isMobile) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: "rgba(247,241,235,0.95)",
          ...dsVibrancy,
          borderTop: "0.5px solid rgba(60,60,67,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 30,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <TabBtn icon={<Home size={22} />} label="Home" active={isActive(homePage)} onClick={() => go(homePage)} />
        <TabBtn icon={<Folder size={22} />} label="Projects" active={isActive(PROJECT_ROUTES)} onClick={() => go(NAV_ROUTES.projects)} />
        {sidebarRole !== "admin" && sidebarRole !== "superadmin" && sidebarRole !== "guest" && (
          <TabBtn icon={<CheckSquare size={22} />} label="Tasks" active={isActive(NAV_ROUTES.myTasks)} onClick={() => go(NAV_ROUTES.myTasks)} />
        )}
        {sidebarRole !== "guest" && (
          <TabBtn icon={<Bell size={22} />} label="Inbox" active={isActive(NAV_ROUTES.notifications)} onClick={() => go(NAV_ROUTES.notifications)} badge={hasUnreadNotifications} />
        )}
        {(sidebarRole === "admin" || sidebarRole === "superadmin") && (
          <>
            <TabBtn icon={<Users size={22} />} label="Team" active={isActive(NAV_ROUTES.userManagement)} onClick={() => go(NAV_ROUTES.userManagement)} />
            <TabBtn icon={<UserCheck size={22} />} label="Guests" active={isActive(NAV_ROUTES.guestUsers)} onClick={() => go(NAV_ROUTES.guestUsers)} />
          </>
        )}
        {sidebarRole !== "member" && sidebarRole !== "guest" && (
          <TabBtn icon={<ClipboardList size={22} />} label="Requests" active={isActive(NAV_ROUTES.accessRequests)} onClick={() => go(NAV_ROUTES.accessRequests)} />
        )}
      </div>
    );
  }

  return (
    <nav
      style={{
        width: "var(--ds-sidebar-width)",
        height: "100vh",
        background: "var(--ds-surface)",
        ...dsVibrancy,
        borderRight: "0.5px solid var(--ds-separator)",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: "var(--ds-header-height)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: collapsed ? "0 10px" : "0 18px",
          borderBottom: "0.5px solid var(--ds-separator)",
          justifyContent: collapsed ? "center" : "flex-start",
          flexShrink: 0,
        }}
      >
        {/* Removed three-dot window controls per design request */}
        {!collapsed ? (
        <span
          style={{
            fontSize: "var(--ds-text-callout)",
            fontWeight: 300,
            color: "var(--ds-accent)",
            letterSpacing: "0.02em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {BRAND_WORDMARK}
        </span>
        ) : null}
      </div>

      <div style={{ flex: 1, padding: collapsed ? "10px 6px" : "10px", overflowY: "auto" }}>
        <div style={{ marginBottom: "6px" }}>
          <SidebarItem collapsed={collapsed} icon={Home} label="Home" active={isActive(homePage)} onClick={() => go(homePage)} />
          <SidebarItem collapsed={collapsed} icon={Folder} label="Projects" active={isActive(PROJECT_ROUTES)} onClick={() => go(NAV_ROUTES.projects)} />
          {sidebarRole !== "admin" && sidebarRole !== "superadmin" && sidebarRole !== "guest" && (
            <SidebarItem collapsed={collapsed} icon={CheckSquare} label="My Tasks" active={isActive(NAV_ROUTES.myTasks)} onClick={() => go(NAV_ROUTES.myTasks)} />
          )}
          {sidebarRole !== "guest" && (
            <SidebarItem collapsed={collapsed} icon={Bell} label="Notifications" active={isActive(NAV_ROUTES.notifications)} onClick={() => go(NAV_ROUTES.notifications)} badge={hasUnreadNotifications} />
          )}
        </div>

        {sidebarRole !== "member" && sidebarRole !== "guest" && (
          <>
            <div style={{ height: "0.5px", background: "var(--ds-separator)", margin: "8px 6px" }} />
            {(sidebarRole === "admin" || sidebarRole === "superadmin") && (
              <>
                <SidebarItem collapsed={collapsed} icon={Users} label="Team" active={isActive(NAV_ROUTES.userManagement)} onClick={() => go(NAV_ROUTES.userManagement)} />
                <SidebarItem collapsed={collapsed} icon={UserCheck} label="Guest users" active={isActive(NAV_ROUTES.guestUsers)} onClick={() => go(NAV_ROUTES.guestUsers)} />
              </>
            )}
            <SidebarItem collapsed={collapsed} icon={ClipboardList} label="Access Requests" active={isActive(NAV_ROUTES.accessRequests)} onClick={() => go(NAV_ROUTES.accessRequests)} />
          </>
        )}
      </div>

      <div
        style={{
          flexShrink: 0,
          paddingTop: 10,
          paddingLeft: collapsed ? 6 : 10,
          paddingRight: collapsed ? 6 : 10,
          paddingBottom: "max(14px, env(safe-area-inset-bottom, 14px))",
          borderTop: "0.5px solid var(--ds-separator)",
        }}
      >
        <SidebarItem collapsed={collapsed} icon={Settings} label="Settings" active={isActive(NAV_ROUTES.settings)} onClick={() => go(NAV_ROUTES.settings)} />

        <button
          onClick={handleLogout}
          title={collapsed ? "Log out" : undefined}
          style={{
            width: "100%",
            height: collapsed ? "40px" : "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : "12px",
            padding: collapsed ? 0 : "0 12px",
            borderRadius: "var(--ds-radius-control)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            marginTop: "4px",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(60,60,67,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <UserAvatar user={user} size={32} avatarFileId={preferences.avatar_file_id} />
          {!collapsed ? (
          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--ds-text-footnote)",
                fontWeight: 500,
                color: "var(--ds-label)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {getUserDisplayName(user)}
            </div>
            <div style={{ fontSize: "var(--ds-text-caption-2)", color: "var(--ds-tertiary-label)" }}>
              {ROLE_LABEL[sidebarRole]}
            </div>
          </div>
          ) : null}
          {!collapsed ? <LogOut size={16} color="var(--ds-tertiary-label)" /> : null}
        </button>
      </div>
    </nav>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick, badge, collapsed }: {
  icon: LucideIcon; label: string; active: boolean; onClick: () => void; badge?: boolean; collapsed?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        height: collapsed ? "40px" : "38px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: collapsed ? 0 : "10px",
        padding: collapsed ? 0 : "0 12px",
        borderRadius: "var(--ds-radius-control)",
        background: active ? "color-mix(in srgb, var(--ds-accent) 14%, transparent)" : hovered ? "rgba(60,60,67,0.06)" : "transparent",
        border: "none",
        cursor: "pointer",
        color: active ? "var(--ds-accent)" : "var(--ds-label)",
        fontSize: "var(--ds-text-body)",
        fontWeight: active ? 500 : 400,
        textAlign: "left",
        transition: "background 0.12s",
        position: "relative",
        marginBottom: "2px",
        flexShrink: 0,
      }}
    >
      <Icon size={18} strokeWidth={active ? 2.25 : 2} />
      {!collapsed ? <span style={{ flex: 1 }}>{label}</span> : null}
      {badge && (
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--ds-accent)",
            flexShrink: 0,
            position: collapsed ? "absolute" : "static",
            top: collapsed ? "8px" : undefined,
            right: collapsed ? "10px" : undefined,
          }}
        />
      )}
    </button>
  );
}

function TabBtn({ icon, label, active, onClick, badge }: {
  icon: React.ReactNode; label: string; active: boolean; onClick: () => void; badge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px 12px",
        color: active ? "var(--ds-accent)" : "var(--ds-tertiary-label)",
        position: "relative",
        minWidth: "48px",
        transition: "color 0.12s",
      }}
    >
      {icon}
      <span style={{ fontSize: "10px", fontWeight: active ? 500 : 400 }}>{label}</span>
      {badge && (
        <span style={{ position: "absolute", top: "4px", right: "8px", width: "7px", height: "7px", borderRadius: "50%", background: "var(--ds-accent)" }} />
      )}
    </button>
  );
}
