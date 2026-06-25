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
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
  HOME_ROUTE,
  ROLE_LABEL,
  toSidebarRole,
} from "@/lib/navigation/sidebar-role";
import { getUserDisplayName, getUserInitials } from "@/lib/user/display";
import { NAV_ROUTES } from "@/types/navigation";

const PROJECT_ROUTES = [NAV_ROUTES.projects];

export function AppSidebar({ hasUnreadNotifications = false }: { hasUnreadNotifications?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user, primaryRole, logout } = useAuth();

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
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
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
        {sidebarRole !== "admin" && (
          <TabBtn icon={<CheckSquare size={22} />} label="Tasks" active={isActive(NAV_ROUTES.myTasks)} onClick={() => go(NAV_ROUTES.myTasks)} />
        )}
        <TabBtn icon={<Bell size={22} />} label="Inbox" active={isActive(NAV_ROUTES.notifications)} onClick={() => go(NAV_ROUTES.notifications)} badge={hasUnreadNotifications} />
        {sidebarRole === "admin" && (
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
        width: "216px",
        height: "100vh",
        background: "rgba(247,241,235,0.92)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
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
          height: "52px",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "0.5px solid rgba(60,60,67,0.08)",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#D4A96A", letterSpacing: "-0.2px" }}>
          A-Design Studio
        </span>
      </div>

      <div style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
        <div style={{ marginBottom: "4px" }}>
          <SidebarItem icon={Home} label="Home" active={isActive(homePage)} onClick={() => go(homePage)} />
          <SidebarItem icon={Folder} label="Projects" active={isActive(PROJECT_ROUTES)} onClick={() => go(NAV_ROUTES.projects)} />
          {sidebarRole !== "admin" && (
            <SidebarItem icon={CheckSquare} label="My Tasks" active={isActive(NAV_ROUTES.myTasks)} onClick={() => go(NAV_ROUTES.myTasks)} />
          )}
          <SidebarItem icon={Bell} label="Notifications" active={isActive(NAV_ROUTES.notifications)} onClick={() => go(NAV_ROUTES.notifications)} badge={hasUnreadNotifications} />
        </div>

        {sidebarRole !== "member" && (
          <>
            <div style={{ height: "0.5px", background: "rgba(60,60,67,0.10)", margin: "6px 4px" }} />
            {sidebarRole === "admin" && (
              <SidebarItem icon={Users} label="Team" active={isActive([NAV_ROUTES.userManagement, NAV_ROUTES.accessRequests])} onClick={() => go(NAV_ROUTES.userManagement)} />
            )}
            {sidebarRole === "lead" && (
              <SidebarItem icon={ClipboardList} label="Access Requests" active={isActive(NAV_ROUTES.accessRequests)} onClick={() => go(NAV_ROUTES.accessRequests)} />
            )}
          </>
        )}
      </div>

      <div style={{ flexShrink: 0, padding: "8px", borderTop: "0.5px solid rgba(60,60,67,0.10)" }}>
        <SidebarItem icon={Settings} label="Settings" active={false} onClick={() => {}} />

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            height: "44px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "0 10px",
            borderRadius: "10px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            marginTop: "2px",
            transition: "background 0.12s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(60,60,67,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(212,169,106,0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 600,
              color: "#D4A96A",
              flexShrink: 0,
            }}
          >
            {getUserInitials(user)}
          </div>
          <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#1C1C1E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getUserDisplayName(user)}
            </div>
            <div style={{ fontSize: "11px", color: "#8E8E93" }}>{ROLE_LABEL[sidebarRole]}</div>
          </div>
          <LogOut size={14} color="#8E8E93" />
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
        height: "34px",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "0 10px",
        borderRadius: "8px",
        background: active ? "rgba(212,169,106,0.14)" : hovered ? "rgba(60,60,67,0.06)" : "transparent",
        border: "none",
        cursor: "pointer",
        color: active ? "#C9894A" : "#3C3C43",
        fontSize: "14px",
        fontWeight: active ? 500 : 400,
        textAlign: "left",
        transition: "background 0.12s",
        position: "relative",
        marginBottom: "1px",
        flexShrink: 0,
      }}
    >
      <Icon size={16} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge && (
        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#D4A96A", flexShrink: 0 }} />
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
        color: active ? "#D4A96A" : "#8E8E93",
        position: "relative",
        minWidth: "48px",
        transition: "color 0.12s",
      }}
    >
      {icon}
      <span style={{ fontSize: "10px", fontWeight: active ? 500 : 400 }}>{label}</span>
      {badge && (
        <span style={{ position: "absolute", top: "4px", right: "8px", width: "7px", height: "7px", borderRadius: "50%", background: "#D4A96A" }} />
      )}
    </button>
  );
}