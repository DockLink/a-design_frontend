"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, FileStack, Link2, Pencil, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { useNotifications } from "@/hooks/use-notifications";
import type { ProcessHoldRequestPayload } from "@/hooks/use-project-hold-requests";
import {
  formatHoldDate,
  holdRequestStatusLabel,
  holdRequestStatusStyle,
  toHoldRequestDateIso,
} from "@/lib/hold-requests/display";
import {
  accessRequestStatusLabel,
  accessRequestStatusStyle,
} from "@/lib/notifications/access-request-map";
import {
  dsCallout,
  dsLargeTitle,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { NAV_ROUTES, projectTabRoute } from "@/types/navigation";
import type { ReviewAccessRequestPayload } from "@/types/access-requests";
import type { AppNotification } from "@/types/notifications";

function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (Number.isNaN(diff)) return "";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isoToDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function HoldNotificationRow({
  n,
  isUnread,
  onProcess,
  onOpen,
}: {
  n: Extract<AppNotification, { type: "hold_request" }>;
  isUnread: boolean;
  onProcess: (payload: ProcessHoldRequestPayload) => Promise<void>;
  onOpen: () => void;
}) {
  const style = holdRequestStatusStyle(n.status);
  const [mode, setMode] = useState<"default" | "adjust">("default");
  const [start, setStart] = useState(() => isoToDateInput(n.raw.requestedStartDate));
  const [end, setEnd] = useState(() => isoToDateInput(n.raw.requestedEndDate));
  const [busy, setBusy] = useState<null | string>(null);

  async function run(label: string, payload: ProcessHoldRequestPayload, successMsg: string) {
    setBusy(label);
    try {
      await onProcess(payload);
      toast.success(successMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to process request");
    } finally {
      setBusy(null);
    }
  }

  return (
    <NotificationShell
      isUnread={isUnread}
      icon={<Clock size={17} color="#C9894A" />}
      iconBg="rgba(212,169,106,0.16)"
      title={n.title}
      statusLabel={holdRequestStatusLabel(n.status)}
      statusStyle={style}
      createdAt={n.createdAt}
      body={n.body}
      extra={
        <div style={{ fontSize: 12, color: "#9C8573", marginTop: 4 }}>
          {formatHoldDate(n.raw.requestedStartDate)} – {formatHoldDate(n.raw.requestedEndDate)}
        </div>
      }
      actions={
        <>
          {mode === "adjust" && (
            <div style={{ display: "flex", gap: 8, marginTop: 10, maxWidth: 320 }}>
              <label style={{ flex: 1, fontSize: 11, color: "#9C8573" }}>
                Start
                <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={dateInput} />
              </label>
              <label style={{ flex: 1, fontSize: 11, color: "#9C8573" }}>
                End
                <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={dateInput} />
              </label>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {n.actionable && mode === "default" && (
              <>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    run("approve", { taskableHoldRequestId: n.id, action: "approve" }, "Hold request approved")
                  }
                  style={btnPrimary(busy === "approve")}
                >
                  <Check size={13} /> {busy === "approve" ? "Approving…" : "Accept"}
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    run("reject", { taskableHoldRequestId: n.id, action: "reject" }, "Hold request rejected")
                  }
                  style={btnDanger(busy === "reject")}
                >
                  <X size={13} /> {busy === "reject" ? "Rejecting…" : "Reject"}
                </button>
                <button type="button" disabled={busy !== null} onClick={() => setMode("adjust")} style={btnGhost}>
                  <Pencil size={13} /> Adjust date
                </button>
              </>
            )}
            {n.actionable && mode === "adjust" && (
              <>
                <button
                  type="button"
                  disabled={busy !== null || !start || !end}
                  onClick={() =>
                    run(
                      "adjust",
                      {
                        taskableHoldRequestId: n.id,
                        action: "approve",
                        approvedStartDate: toHoldRequestDateIso(start),
                        approvedEndDate: toHoldRequestDateIso(end, true),
                      },
                      "Hold approved with adjusted dates"
                    )
                  }
                  style={btnPrimary(busy === "adjust")}
                >
                  <Check size={13} /> {busy === "adjust" ? "Saving…" : "Save & accept"}
                </button>
                <button type="button" disabled={busy !== null} onClick={() => setMode("default")} style={btnGhost}>
                  Back
                </button>
              </>
            )}
            {n.projectId && (
              <button type="button" onClick={onOpen} style={btnLink}>
                View in project
              </button>
            )}
          </div>
        </>
      }
    />
  );
}

function AccessNotificationRow({
  n,
  isUnread,
  onReview,
  onOpen,
}: {
  n: Extract<AppNotification, { type: "access_request" }>;
  isUnread: boolean;
  onReview: (payload: ReviewAccessRequestPayload) => Promise<void>;
  onOpen: () => void;
}) {
  const style = accessRequestStatusStyle(n.status);
  const [busy, setBusy] = useState<null | string>(null);

  async function run(
    label: string,
    payload: ReviewAccessRequestPayload,
    successMsg: string
  ) {
    setBusy(label);
    try {
      await onReview(payload);
      toast.success(successMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to process request");
    } finally {
      setBusy(null);
    }
  }

  return (
    <NotificationShell
      isUnread={isUnread}
      icon={<UserPlus size={17} color="#0071E3" />}
      iconBg="rgba(0,122,255,0.12)"
      title={n.title}
      statusLabel={accessRequestStatusLabel(n.status)}
      statusStyle={style}
      createdAt={n.createdAt}
      body={n.body}
      actions={
        n.actionable ? (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run(
                  "full",
                  { accessRequestId: n.id, action: "approve", grantedRole: "MEMBER" },
                  "Full access granted"
                )
              }
              style={btnPrimary(busy === "full")}
            >
              <Check size={13} /> {busy === "full" ? "Granting…" : "Full access"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run(
                  "limited",
                  { accessRequestId: n.id, action: "approve", grantedRole: "VIEWER" },
                  "Limited access granted"
                )
              }
              style={btnGhost}
            >
              <Check size={13} /> {busy === "limited" ? "Granting…" : "Limited"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run("reject", { accessRequestId: n.id, action: "reject" }, "Access request rejected")
              }
              style={btnDanger(busy === "reject")}
            >
              <X size={13} /> {busy === "reject" ? "Rejecting…" : "Reject"}
            </button>
            <button type="button" onClick={onOpen} style={btnLink}>
              Review page
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={onOpen} style={btnLink}>
              View requests
            </button>
          </div>
        )
      }
    />
  );
}

function FileVersionNotificationRow({
  n,
  isUnread,
  onOpen,
}: {
  n: Extract<AppNotification, { type: "file_version" }>;
  isUnread: boolean;
  onOpen: () => void;
}) {
  return (
    <NotificationShell
      isUnread={isUnread}
      icon={<FileStack size={17} color="#6B5744" />}
      iconBg="rgba(107,87,68,0.12)"
      title={n.title}
      statusLabel="File"
      statusStyle={{ bg: "rgba(107,87,68,0.12)", color: "#6B5744" }}
      createdAt={n.createdAt}
      body={n.body}
      actions={
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={onOpen} style={btnLink}>
            View in documents
          </button>
        </div>
      }
    />
  );
}

function ShareLinkNotificationRow({
  n,
  isUnread,
  onOpen,
}: {
  n: Extract<AppNotification, { type: "share_link" }>;
  isUnread: boolean;
  onOpen: () => void;
}) {
  return (
    <NotificationShell
      isUnread={isUnread}
      icon={<Link2 size={17} color="#D4A96A" />}
      iconBg="rgba(212,169,106,0.15)"
      title={n.title}
      statusLabel="Share link"
      statusStyle={{ bg: "rgba(212,169,106,0.15)", color: "#B07D3C" }}
      createdAt={n.createdAt}
      body={n.body}
      actions={
        <div style={{ marginTop: 12 }}>
          <button type="button" onClick={onOpen} style={btnLink}>
            View in documents
          </button>
        </div>
      }
    />
  );
}

function NotificationShell({
  isUnread,
  icon,
  iconBg,
  title,
  statusLabel,
  statusStyle,
  createdAt,
  body,
  extra,
  actions,
}: {
  isUnread: boolean;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  statusLabel: string;
  statusStyle: { bg: string; color: string };
  createdAt: string;
  body: string;
  extra?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "12px",
        background: isUnread ? "rgba(212,169,106,0.07)" : "#FDFAF6",
        border: `1px solid ${isUnread ? "rgba(212,169,106,0.3)" : "rgba(90,60,30,0.1)"}`,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1410" }}>{title}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 8,
              padding: "2px 8px",
              background: statusStyle.bg,
              color: statusStyle.color,
            }}
          >
            {statusLabel}
          </span>
          {isUnread && (
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ds-accent)" }} />
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9C8573" }}>
            {relativeTime(createdAt)}
          </span>
        </div>
        <p style={{ fontSize: 13, color: "#6B5744", margin: "4px 0 0", lineHeight: 1.45 }}>{body}</p>
        {extra}
        {actions}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    canReviewHolds,
    canReviewAccess,
    processHoldRequest,
    processAccessRequest,
    markAllRead,
    markRead,
    isUnread,
  } = useNotifications();

  const [filter, setFilter] = useState<"all" | "action">("all");

  const visible = useMemo(() => {
    if (filter === "action") return notifications.filter((n) => n.actionable);
    return notifications;
  }, [notifications, filter]);

  const canReview = canReviewHolds || canReviewAccess;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ ...dsLargeTitle, display: "flex", alignItems: "center", gap: 10 }}>
            <Bell size={26} color="#D4A96A" />
            Notifications
          </div>
          <div style={{ ...dsSubtitle, marginTop: 6 }}>
            {canReview
              ? "Hold requests, access requests, and team activity."
              : "Updates on your requests and project activity."}
          </div>
        </div>
        {unreadCount > 0 && (
          <button type="button" onClick={markAllRead} style={markAllBtn}>
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 18, marginBottom: 16 }}>
        {([
          { id: "all" as const, label: "All" },
          ...(canReview ? [{ id: "action" as const, label: "Needs action" }] : []),
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            style={{
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              background: filter === t.id ? "#fff" : "transparent",
              color: filter === t.id ? "#C9894A" : "#9C8573",
              boxShadow: filter === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && notifications.length === 0 && <div style={dsCallout}>Loading notifications…</div>}

      {!isLoading && visible.length === 0 && (
        <div style={{ ...dsCallout, textAlign: "center", padding: "48px 24px", color: "#9C8573" }}>
          {filter === "action" ? "No requests need your action." : "No notifications yet."}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((n) => {
          if (n.type === "hold_request") {
            return (
              <HoldNotificationRow
                key={n.key}
                n={n}
                isUnread={isUnread(n.key)}
                onProcess={async (payload) => {
                  await processHoldRequest(payload);
                  markRead(n.key);
                }}
                onOpen={() => {
                  markRead(n.key);
                  if (n.projectId) router.push(projectTabRoute(n.projectId, "hold-requests"));
                }}
              />
            );
          }
          if (n.type === "file_version") {
            return (
              <FileVersionNotificationRow
                key={n.key}
                n={n}
                isUnread={isUnread(n.key)}
                onOpen={() => {
                  markRead(n.key);
                  router.push(projectTabRoute(n.projectId, "files"));
                }}
              />
            );
          }
          if (n.type === "share_link") {
            return (
              <ShareLinkNotificationRow
                key={n.key}
                n={n}
                isUnread={isUnread(n.key)}
                onOpen={() => {
                  markRead(n.key);
                  router.push(projectTabRoute(n.projectId, "files"));
                }}
              />
            );
          }
          return (
            <AccessNotificationRow
              key={n.key}
              n={n}
              isUnread={isUnread(n.key)}
              onReview={async (payload) => {
                await processAccessRequest(payload);
                markRead(n.key);
              }}
              onOpen={() => {
                markRead(n.key);
                router.push(NAV_ROUTES.accessRequests);
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const markAllBtn: React.CSSProperties = {
  background: "none",
  border: "1px solid rgba(90,60,30,0.18)",
  borderRadius: 10,
  padding: "8px 14px",
  fontSize: 13,
  fontWeight: 500,
  color: "#6B5744",
  cursor: "pointer",
};

const dateInput: React.CSSProperties = {
  width: "100%",
  marginTop: 2,
  height: 32,
  borderRadius: 8,
  border: "1px solid rgba(90,60,30,0.18)",
  background: "#F5EFE6",
  padding: "0 8px",
  fontSize: 13,
  color: "#1A1410",
  outline: "none",
};

function btnPrimary(loading: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    height: 32,
    padding: "0 14px",
    borderRadius: 8,
    border: "none",
    background: "#3D8B5E",
    color: "white",
    fontSize: 13,
    fontWeight: 500,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
  };
}

function btnDanger(loading: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    height: 32,
    padding: "0 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,59,48,0.3)",
    background: "white",
    color: "#C0392B",
    fontSize: 13,
    fontWeight: 500,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
  };
}

const btnGhost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  height: 32,
  padding: "0 14px",
  borderRadius: 8,
  border: "1px solid rgba(90,60,30,0.18)",
  background: "transparent",
  color: "#6B5744",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const btnLink: React.CSSProperties = {
  marginLeft: "auto",
  background: "none",
  border: "none",
  color: "#C9894A",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};
