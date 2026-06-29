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
  Shield,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useNotifications } from "@/hooks/use-notifications";
import { dsVibrancy } from "@/lib/styles/dashboard-tokens";
import {
  HOME_ROUTE,
  ROLE_LABEL,
  toSidebarRole,
} from "@/lib/navigation/sidebar-role";
import { getUserDisplayName, getUserInitials } from "@/lib/user/display";
import { NAV_ROUTES } from "@/types/navigation";

const PROJECT_ROUTES = [NAV_ROUTES.projects];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user, primaryRole, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const hasUnreadNotifications = unreadCount > 0;

  if (!user || !primaryRole) return null;

  const sidebarRole = toSidebarRole(primaryRole);
  const homePage = HOME_ROUTE[sidebarRole];

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
        {sidebarRole !== "admin" && sidebarRole !== "superadmin" && (
          <TabBtn icon={<CheckSquare size={22} />} label="Tasks" active={isActive(NAV_ROUTES.myTasks)} onClick={() => go(NAV_ROUTES.myTasks)} />
        )}
        <TabBtn icon={<Bell size={22} />} label="Inbox" active={isActive(NAV_ROUTES.notifications)} onClick={() => go(NAV_ROUTES.notifications)} badge={hasUnreadNotifications} />
        {(sidebarRole === "admin" || sidebarRole === "superadmin") && (
          <TabBtn icon={<Users size={22} />} label="Team" active={isActive([NAV_ROUTES.userManagement, NAV_ROUTES.accessRequests])} onClick={() => go(NAV_ROUTES.userManagement)} />
        )}
        {sidebarRole === "lead" && (
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
        background: "rgba(247,241,235,0.88)",
        ...dsVibrancy,
        borderRight: "0.5px solid rgba(60,60,67,0.14)",
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
          padding: "0 18px",
          borderBottom: "0.5px solid rgba(60,60,67,0.08)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
        </div>
        <span
          style={{
            fontSize: "var(--ds-text-callout)",
            fontWeight: 600,
            color: "var(--ds-accent)",
            letterSpacing: "-0.02em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          A-Design Studio
        </span>
      </div>

      <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
        <div style={{ marginBottom: "6px" }}>
          <SidebarItem icon={Home} label="Home" active={isActive(homePage)} onClick={() => go(homePage)} />
          <SidebarItem icon={Folder} label="Projects" active={isActive(PROJECT_ROUTES)} onClick={() => go(NAV_ROUTES.projects)} />
          {sidebarRole !== "admin" && sidebarRole !== "superadmin" && (
            <SidebarItem icon={CheckSquare} label="My Tasks" active={isActive(NAV_ROUTES.myTasks)} onClick={() => go(NAV_ROUTES.myTasks)} />
          )}
          <SidebarItem icon={Bell} label="Notifications" active={isActive(NAV_ROUTES.notifications)} onClick={() => go(NAV_ROUTES.notifications)} badge={hasUnreadNotifications} />
        </div>

        {sidebarRole !== "member" && (
          <>
            <div style={{ height: "0.5px", background: "rgba(60,60,67,0.10)", margin: "8px 6px" }} />
            {sidebarRole === "superadmin" && (
              <SidebarItem
                icon={Shield}
                label="System Control"
                active={isActive(NAV_ROUTES.superAdminDashboard)}
                onClick={() => go(NAV_ROUTES.superAdminDashboard)}
              />
            )}
            {(sidebarRole === "admin" || sidebarRole === "superadmin") && (
              <SidebarItem icon={Users} label="Team" active={isActive([NAV_ROUTES.userManagement, NAV_ROUTES.accessRequests])} onClick={() => go(NAV_ROUTES.userManagement)} />
            )}
            {sidebarRole === "lead" && (
              <SidebarItem icon={ClipboardList} label="Access Requests" active={isActive(NAV_ROUTES.accessRequests)} onClick={() => go(NAV_ROUTES.accessRequests)} />
            )}
          </>
        )}
      </div>

      <div style={{ flexShrink: 0, padding: "10px", borderTop: "0.5px solid rgba(60,60,67,0.10)" }}>
        <SidebarItem icon={Settings} label="Settings" active={false} onClick={() => {}} />

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            height: "48px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "0 12px",
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
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(212,169,106,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--ds-text-caption-2)",
              fontWeight: 600,
              color: "var(--ds-accent)",
              flexShrink: 0,
            }}
          >
            {getUserInitials(user)}
          </div>
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
          <LogOut size={16} color="var(--ds-tertiary-label)" />
        </button>
      </div>
    </nav>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick, badge }: {
  icon: LucideIcon; label: string; active: boolean; onClick: () => void; badge?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        height: "38px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "0 12px",
        borderRadius: "var(--ds-radius-control)",
        background: active ? "rgba(212,169,106,0.14)" : hovered ? "rgba(60,60,67,0.06)" : "transparent",
        border: "none",
        cursor: "pointer",
        color: active ? "#C9894A" : "var(--ds-label)",
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
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--ds-accent)", flexShrink: 0 }} />
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
