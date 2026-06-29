"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AccessRequestToast } from "@/components/notifications/access-request-toast";
import { HoldRequestToast } from "@/components/notifications/hold-request-toast";
import { useAuth } from "@/hooks/use-auth";
import type { ProcessHoldRequestPayload } from "@/hooks/use-project-hold-requests";
import { authApiClient } from "@/lib/api/authenticated-client";
import { accessRequestToNotification } from "@/lib/notifications/access-request-map";
import { fileVersionToNotification } from "@/lib/notifications/file-version-map";
import { holdRequestToNotification } from "@/lib/notifications/map";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import { toProjectsQueryString } from "@/lib/projects/query-string";
import { NAV_ROUTES, projectTabRoute } from "@/types/navigation";
import type { AccessRequestsListResponse } from "@/types/access-requests";
import type { HoldRequestsListResponse } from "@/types/hold-requests";
import type { AppNotification, FileVersionsListResponse } from "@/types/notifications";
import type { ProjectsListResponse } from "@/types/projects";
import { PROJECT_LEAD_ROLE } from "@/types/projects";
import type { ReviewAccessRequestPayload } from "@/types/access-requests";

const POLL_INTERVAL_MS = 30_000;

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  canReviewHolds: boolean;
  canReviewAccess: boolean;
  refetch: () => Promise<void>;
  processHoldRequest: (payload: ProcessHoldRequestPayload) => Promise<void>;
  processAccessRequest: (payload: ReviewAccessRequestPayload) => Promise<void>;
  markAllRead: () => void;
  markRead: (key: string) => void;
  isUnread: (key: string) => boolean;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  canReviewHolds: false,
  canReviewAccess: false,
  refetch: async () => {},
  processHoldRequest: async () => {},
  processAccessRequest: async () => {},
  markAllRead: () => {},
  markRead: () => {},
  isUnread: () => false,
});

function readStorage(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(key: string, values: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(values));
  } catch {
    /* ignore quota errors */
  }
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, primaryRole, isAuthenticated } = useAuth();

  const sidebarRole = primaryRole ? toSidebarRole(primaryRole) : null;
  const canReviewHolds = sidebarRole === "admin" || sidebarRole === "superadmin";
  const isOrgAdmin = canReviewHolds;
  const userId = user?.id ?? null;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [readKeys, setReadKeys] = useState<Set<string>>(new Set());
  const [ledProjectIds, setLedProjectIds] = useState<Set<string>>(new Set());

  const canReviewAccess = isOrgAdmin || ledProjectIds.size > 0;

  const readStorageKey = userId ? `notif:read:${userId}` : null;
  const toastedStorageKey = userId ? `notif:toasted:${userId}` : null;

  const toastedRef = useRef<Set<string> | null>(null);
  const fetchRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    setReadKeys(readStorageKey ? new Set(readStorage(readStorageKey)) : new Set());
  }, [readStorageKey]);

  // Projects this user leads (PRU) — used to scope access-request review.
  useEffect(() => {
    if (!isAuthenticated || !userId || isOrgAdmin) {
      setLedProjectIds(new Set());
      return;
    }
    void (async () => {
      try {
        const qs = toProjectsQueryString({
          page: 1,
          limit: 100,
          status: "ACTIVE",
          as_member: true,
          as_member_role: PROJECT_LEAD_ROLE,
        });
        const res = await authApiClient<ProjectsListResponse>(`/projects${qs}`);
        setLedProjectIds(new Set(res.data.map((p) => p.id)));
      } catch {
        setLedProjectIds(new Set());
      }
    })();
  }, [isAuthenticated, userId, isOrgAdmin]);

  const processHoldRequest = useCallback(async (payload: ProcessHoldRequestPayload) => {
    await authApiClient("/taskable-hold-requests/process", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await fetchRef.current();
  }, []);

  const processAccessRequest = useCallback(async (payload: ReviewAccessRequestPayload) => {
    await authApiClient("/access-requests/review", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await fetchRef.current();
  }, []);

  const fireHoldToast = useCallback(
    (n: AppNotification) => {
      if (n.type !== "hold_request") return;
      toast.custom(
        (t) => (
          <HoldRequestToast
            notification={n}
            onProcess={processHoldRequest}
            onView={() => {
              if (n.projectId) router.push(projectTabRoute(n.projectId, "hold-requests"));
              else router.push("/notifications");
              toast.dismiss(t);
            }}
            onClose={() => toast.dismiss(t)}
          />
        ),
        { duration: Infinity }
      );
    },
    [processHoldRequest, router]
  );

  const fireAccessToast = useCallback(
    (n: AppNotification) => {
      if (n.type !== "access_request") return;
      toast.custom(
        (t) => (
          <AccessRequestToast
            notification={n}
            onReview={processAccessRequest}
            onView={() => {
              router.push(NAV_ROUTES.accessRequests);
              toast.dismiss(t);
            }}
            onClose={() => toast.dismiss(t)}
          />
        ),
        { duration: Infinity }
      );
    },
    [processAccessRequest, router]
  );

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !userId) return;
    setIsLoading(true);
    try {
      const mapped: AppNotification[] = [];

      // Hold requests
      const holdQs = new URLSearchParams({ page: "1", limit: "50" });
      if (!canReviewHolds) holdQs.set("requested_by_id", userId);
      try {
        const holdRes = await authApiClient<HoldRequestsListResponse>(
          `/taskable-hold-requests?${holdQs}`
        );
        mapped.push(...(holdRes.data ?? []).map((r) => holdRequestToNotification(r, canReviewHolds)));
      } catch {
        /* non-critical */
      }

      // Access requests — reviewers see pending; members see their own history.
      const accessQs = new URLSearchParams({ page: "1", limit: "50" });
      if (canReviewAccess) {
        accessQs.set("status", "PENDING");
      } else {
        accessQs.set("requested_by_id", userId);
      }
      try {
        const accessRes = await authApiClient<AccessRequestsListResponse>(
          `/access-requests?${accessQs}`
        );
        let items = accessRes.data ?? [];
        if (!isOrgAdmin && ledProjectIds.size > 0) {
          items = items.filter((r) => ledProjectIds.has(r.projectId));
        } else if (!isOrgAdmin && !canReviewAccess) {
          // member's own requests only (already filtered by requested_by_id)
        } else if (!isOrgAdmin) {
          items = [];
        }
        mapped.push(
          ...items.map((r) =>
            accessRequestToNotification(r, canReviewAccess && r.status === "PENDING")
          )
        );
      } catch {
        /* non-critical */
      }

      // File version events — every team member sees replacement activity for
      // the projects they belong to (admins see all). Non-actionable feed items.
      try {
        const fileRes = await authApiClient<FileVersionsListResponse>(
          `/file-notifications`
        );
        mapped.push(...(fileRes.data ?? []).map(fileVersionToNotification));
      } catch {
        /* non-critical */
      }

      mapped.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(mapped);

      // Toast newly-arrived actionable items for reviewers.
      if ((canReviewHolds || canReviewAccess) && toastedStorageKey) {
        const actionable = mapped.filter((n) => n.actionable);
        const pendingKeys = actionable.map((n) => n.key);

        if (toastedRef.current === null) {
          const stored = readStorage(toastedStorageKey);
          if (stored.length === 0) {
            toastedRef.current = new Set(pendingKeys);
            writeStorage(toastedStorageKey, pendingKeys);
          } else {
            toastedRef.current = new Set(stored);
          }
        }

        const seen = toastedRef.current;
        const fresh = pendingKeys.filter((key) => !seen.has(key));
        for (const key of fresh) {
          const n = mapped.find((m) => m.key === key);
          if (!n) continue;
          if (n.type === "hold_request") fireHoldToast(n);
          else if (n.type === "access_request") fireAccessToast(n);
          seen.add(key);
        }
        if (fresh.length) writeStorage(toastedStorageKey, [...seen]);
      }
    } catch {
      /* keep last good state */
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    userId,
    canReviewHolds,
    canReviewAccess,
    isOrgAdmin,
    ledProjectIds,
    toastedStorageKey,
    fireHoldToast,
    fireAccessToast,
  ]);

  useEffect(() => {
    fetchRef.current = fetchNotifications;
  }, [fetchNotifications]);

  useEffect(() => {
    toastedRef.current = null;
  }, [userId]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setNotifications([]);
      return;
    }
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, userId, fetchNotifications]);

  const persistRead = useCallback(
    (next: Set<string>) => {
      setReadKeys(new Set(next));
      if (readStorageKey) writeStorage(readStorageKey, [...next]);
    },
    [readStorageKey]
  );

  const markAllRead = useCallback(() => {
    const next = new Set(readKeys);
    for (const n of notifications) next.add(n.key);
    persistRead(next);
  }, [notifications, readKeys, persistRead]);

  const markRead = useCallback(
    (key: string) => {
      const next = new Set(readKeys);
      next.add(key);
      persistRead(next);
    },
    [readKeys, persistRead]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readKeys.has(n.key)).length,
    [notifications, readKeys]
  );

  const isUnread = useCallback((key: string) => !readKeys.has(key), [readKeys]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      canReviewHolds,
      canReviewAccess,
      refetch: fetchNotifications,
      processHoldRequest,
      processAccessRequest,
      markAllRead,
      markRead,
      isUnread,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      canReviewHolds,
      canReviewAccess,
      fetchNotifications,
      processHoldRequest,
      processAccessRequest,
      markAllRead,
      markRead,
      isUnread,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}

/** @deprecated Use canReviewHolds from context */
export function useCanReviewNotifications() {
  const { canReviewHolds } = useNotifications();
  return canReviewHolds;
}
