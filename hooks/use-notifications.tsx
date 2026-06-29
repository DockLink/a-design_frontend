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

import { HoldRequestToast } from "@/components/notifications/hold-request-toast";
import { useAuth } from "@/hooks/use-auth";
import type { ProcessHoldRequestPayload } from "@/hooks/use-project-hold-requests";
import { authApiClient } from "@/lib/api/authenticated-client";
import { holdRequestToNotification } from "@/lib/notifications/map";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import { projectTabRoute } from "@/types/navigation";
import type { HoldRequestsListResponse } from "@/types/hold-requests";
import type { AppNotification } from "@/types/notifications";

const POLL_INTERVAL_MS = 30_000;

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  canReview: boolean;
  refetch: () => Promise<void>;
  processRequest: (payload: ProcessHoldRequestPayload) => Promise<void>;
  markAllRead: () => void;
  markRead: (key: string) => void;
  isUnread: (key: string) => boolean;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  canReview: false,
  refetch: async () => {},
  processRequest: async () => {},
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
  const canReview = sidebarRole === "admin" || sidebarRole === "superadmin";
  const userId = user?.id ?? null;

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [readKeys, setReadKeys] = useState<Set<string>>(new Set());

  const readStorageKey = userId ? `notif:read:${userId}` : null;
  const toastedStorageKey = userId ? `notif:toasted:${userId}` : null;

  // In-memory mirror of the toasted set; null until first poll seeds it.
  const toastedRef = useRef<Set<string> | null>(null);
  // Always-latest fetch fn so stable callbacks can trigger a refetch.
  const fetchRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    setReadKeys(readStorageKey ? new Set(readStorage(readStorageKey)) : new Set());
  }, [readStorageKey]);

  const processRequest = useCallback(async (payload: ProcessHoldRequestPayload) => {
    await authApiClient("/taskable-hold-requests/process", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await fetchRef.current();
  }, []);

  const fireToast = useCallback(
    (n: AppNotification) => {
      toast.custom(
        (t) => (
          <HoldRequestToast
            notification={n}
            onProcess={processRequest}
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
    [processRequest, router]
  );

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !userId) return;
    setIsLoading(true);
    try {
      const qs = new URLSearchParams({ page: "1", limit: "50" });
      // Members only see their own requests; reviewers see everything.
      if (!canReview) qs.set("requested_by_id", userId);

      const res = await authApiClient<HoldRequestsListResponse>(
        `/taskable-hold-requests?${qs}`
      );
      const mapped = (res.data ?? []).map((r) => holdRequestToNotification(r, canReview));
      setNotifications(mapped);

      // Toast newly-arrived pending requests for reviewers only.
      if (canReview && toastedStorageKey) {
        const pendingIds = mapped.filter((n) => n.actionable).map((n) => n.id);

        if (toastedRef.current === null) {
          // First poll this session.
          const stored = readStorage(toastedStorageKey);
          if (stored.length === 0) {
            // Very first run ever — seed without flooding old requests.
            toastedRef.current = new Set(pendingIds);
            writeStorage(toastedStorageKey, pendingIds);
          } else {
            toastedRef.current = new Set(stored);
          }
        }

        const seen = toastedRef.current;
        const fresh = pendingIds.filter((id) => !seen.has(id));
        for (const id of fresh) {
          const n = mapped.find((m) => m.id === id);
          if (n) fireToast(n);
          seen.add(id);
        }
        if (fresh.length) writeStorage(toastedStorageKey, [...seen]);
      }
    } catch {
      // Silent — notifications are non-critical; keep last good state.
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userId, canReview, toastedStorageKey, fireToast]);

  // Keep the ref pointed at the latest fetch implementation.
  useEffect(() => {
    fetchRef.current = fetchNotifications;
  }, [fetchNotifications]);

  // Reset the toasted mirror when the user changes so a re-login re-seeds.
  useEffect(() => {
    toastedRef.current = null;
  }, [userId]);

  // Initial fetch + polling loop.
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
      canReview,
      refetch: fetchNotifications,
      processRequest,
      markAllRead,
      markRead,
      isUnread,
    }),
    [notifications, unreadCount, isLoading, canReview, fetchNotifications, processRequest, markAllRead, markRead, isUnread]
  );

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
