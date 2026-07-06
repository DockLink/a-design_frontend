"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckSquare,
  ClipboardList,
  Folder,
  Home,
  Loader2,
  Search,
  Settings,
  UserCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { authApiClient } from "@/lib/api/authenticated-client";
import { resolveHomeRoute } from "@/lib/navigation/home-route";
import { canAccessRoute } from "@/lib/navigation/sidebar-role";
import { toProjectsQueryString } from "@/lib/projects/query-string";
import { toTasksQueryString } from "@/lib/tasks/query-string";
import { NAV_ROUTES, projectRoute, projectTabRoute } from "@/types/navigation";
import type { Project, ProjectsListResponse } from "@/types/projects";
import type { Task, TasksListResponse } from "@/types/tasks";

type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

const SECTION_LABELS: Record<ResultItem["type"], string> = {
  nav: "Pages",
  project: "Projects",
  task: "Tasks",
};

const SEARCH_LIMIT = 15;

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  keywords?: string;
}

interface ResultItem {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
  type: "nav" | "project" | "task";
}

function CommandPalette() {
  const router = useRouter();
  const { open, setOpen } = useCommandPalette();
  const { primaryRole } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [projectResults, setProjectResults] = useState<Project[]>([]);
  const [taskResults, setTaskResults] = useState<Task[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const homeHref = primaryRole ? resolveHomeRoute(primaryRole) : NAV_ROUTES.projects;

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { id: "nav-home", label: "Home", href: homeHref, icon: Home, keywords: "dashboard" },
      { id: "nav-projects", label: "Projects", href: NAV_ROUTES.projects, icon: Folder, keywords: "portfolio work" },
      { id: "nav-tasks", label: "My Tasks", href: NAV_ROUTES.myTasks, icon: CheckSquare, keywords: "todo assignments" },
      { id: "nav-notifications", label: "Notifications", href: NAV_ROUTES.notifications, icon: Bell, keywords: "alerts updates" },
      { id: "nav-team", label: "Team", href: NAV_ROUTES.userManagement, icon: Users, keywords: "users members staff" },
      { id: "nav-guests", label: "Guest users", href: NAV_ROUTES.guestUsers, icon: UserCheck, keywords: "external viewers" },
      { id: "nav-requests", label: "Access Requests", href: NAV_ROUTES.accessRequests, icon: ClipboardList, keywords: "permissions" },
      { id: "nav-settings", label: "Settings", href: NAV_ROUTES.settings, icon: Settings, keywords: "preferences account" },
    ];
    return items.filter((item) => primaryRole && canAccessRoute(primaryRole, item.href));
  }, [homeHref, primaryRole]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setDebouncedQuery("");
    setSelectedIndex(0);
    setProjectResults([]);
    setTaskResults([]);
    setSearchError(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 150);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const q = debouncedQuery;

    if (!q) {
      setProjectResults([]);
      setTaskResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);

    void (async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          authApiClient<ProjectsListResponse>(
            `/projects${toProjectsQueryString({ page: 1, limit: SEARCH_LIMIT, search: q, status: "ACTIVE" })}`
          ),
          authApiClient<TasksListResponse>(
            `/tasks${toTasksQueryString({ page: 1, limit: SEARCH_LIMIT, search: q, taskable_type: "TASK", depth: 1 })}`
          ),
        ]);
        if (cancelled) return;
        setProjectResults(projectsRes.data ?? []);
        setTaskResults(tasksRes.data ?? []);
      } catch {
        if (!cancelled) {
          setProjectResults([]);
          setTaskResults([]);
          setSearchError("Could not search right now. Try again.");
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  const filteredNav = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navItems;
    return navItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords?.toLowerCase().includes(q)
    );
  }, [navItems, query]);

  const results = useMemo<ResultItem[]>(() => {
    const items: ResultItem[] = [];

    for (const item of filteredNav) {
      items.push({
        id: item.id,
        label: item.label,
        href: item.href,
        type: "nav",
      });
    }

    for (const project of projectResults) {
      items.push({
        id: `project-${project.id}`,
        label: project.name,
        subtitle: [project.code?.toUpperCase(), project.client?.name].filter(Boolean).join(" · ") || undefined,
        href: projectRoute(project.id),
        type: "project",
      });
    }

    for (const task of taskResults) {
      const projectId = task.projectId;
      items.push({
        id: `task-${task.id}`,
        label: task.title,
        subtitle: task.code ?? undefined,
        href: projectId ? projectTabRoute(projectId, "tasks") : NAV_ROUTES.myTasks,
        type: "task",
      });
    }

    return items;
  }, [filteredNav, projectResults, taskResults]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length, query]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-result-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router, setOpen]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex].href);
    }
  }

  const hasQuery = query.trim().length > 0;
  const showProjectLoading = hasQuery && isSearching && projectResults.length === 0;
  const showTaskLoading = hasQuery && isSearching && taskResults.length === 0;

  if (!open) return null;

  let lastSection: ResultItem["type"] | null = null;

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 300,
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "12vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(560px, calc(100vw - 32px))",
          background: "var(--ds-surface-elevated)",
          borderRadius: "14px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          zIndex: 301,
          overflow: "hidden",
          border: "1px solid var(--ds-separator)",
        }}
        onKeyDown={handleKeyDown}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 16px",
            borderBottom: "1px solid var(--ds-separator)",
          }}
        >
          <Search size={18} color="var(--ds-secondary-label)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, or pages…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "15px",
              color: "var(--ds-label)",
            }}
          />
          {isSearching ? (
            <Loader2 size={16} className="animate-spin" color="var(--ds-tertiary-label)" />
          ) : null}
          <span
            style={{
              fontSize: "11px",
              color: "var(--ds-tertiary-label)",
              border: "1px solid var(--ds-separator)",
              borderRadius: "6px",
              padding: "2px 6px",
            }}
          >
            esc
          </span>
        </div>

        <div ref={listRef} style={{ maxHeight: "360px", overflowY: "auto", padding: "8px" }}>
          {searchError ? (
            <div
              style={{
                padding: "10px 12px",
                marginBottom: "4px",
                fontSize: "12px",
                color: "#9B1C1C",
                background: "#FEE2E2",
                borderRadius: "8px",
              }}
            >
              {searchError}
            </div>
          ) : null}

          {results.length === 0 && !isSearching ? (
            <div style={{ padding: "20px 12px", fontSize: "13px", color: "var(--ds-secondary-label)", textAlign: "center" }}>
              {hasQuery ? "No results found." : "Type to search or pick a destination below."}
            </div>
          ) : null}

          {results.map((item, index) => {
            const showHeader = item.type !== lastSection;
            lastSection = item.type;
            const active = index === selectedIndex;
            const NavIcon =
              item.type === "nav"
                ? navItems.find((n) => n.id === item.id)?.icon ?? Folder
                : item.type === "project"
                  ? Folder
                  : CheckSquare;

            return (
              <div key={item.id}>
                {showHeader ? (
                  <div
                    style={{
                      padding: "6px 12px 4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      color: "var(--ds-tertiary-label)",
                    }}
                  >
                    {SECTION_LABELS[item.type]}
                  </div>
                ) : null}
                <button
                  type="button"
                  data-result-index={index}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => navigate(item.href)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    border: "none",
                    borderRadius: "10px",
                    background: active ? "rgba(212,169,106,0.14)" : "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <NavIcon size={16} color={active ? "var(--ds-accent)" : "var(--ds-secondary-label)"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--ds-label)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </div>
                    {item.subtitle ? (
                      <div style={{ fontSize: "12px", color: "var(--ds-secondary-label)", marginTop: "1px" }}>
                        {item.subtitle}
                      </div>
                    ) : null}
                  </div>
                </button>
              </div>
            );
          })}

          {showProjectLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "var(--ds-secondary-label)",
              }}
            >
              <Loader2 size={12} className="animate-spin" />
              Searching projects…
            </div>
          ) : null}

          {showTaskLoading && !showProjectLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                fontSize: "12px",
                color: "var(--ds-secondary-label)",
              }}
            >
              <Loader2 size={12} className="animate-spin" />
              Searching tasks…
            </div>
          ) : null}
        </div>

        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--ds-separator)",
            fontSize: "11px",
            color: "var(--ds-tertiary-label)",
            display: "flex",
            gap: "12px",
          }}
        >
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>⌘K toggle</span>
        </div>
      </div>
    </>
  );
}
