"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Clock, Pencil, X } from "lucide-react";
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
  dsCallout,
  dsLargeTitle,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { projectTabRoute } from "@/types/navigation";
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

function NotificationRow({
  n,
  isUnread,
  canReview,
  onProcess,
  onOpen,
}: {
  n: AppNotification;
  isUnread: boolean;
  canReview: boolean;
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
          background: "rgba(212,169,106,0.16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Clock size={17} color="#C9894A" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1A1410" }}>{n.title}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 8,
              padding: "2px 8px",
              background: style.bg,
              color: style.color,
            }}
          >
            {holdRequestStatusLabel(n.status)}
          </span>
          {isUnread && (
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--ds-accent)" }} />
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#9C8573" }}>
            {relativeTime(n.createdAt)}
          </span>
        </div>

        <p style={{ fontSize: 13, color: "#6B5744", margin: "4px 0 0", lineHeight: 1.45 }}>
          {n.body}
        </p>
        <div style={{ fontSize: 12, color: "#9C8573", marginTop: 4 }}>
          {formatHoldDate(n.raw.requestedStartDate)} – {formatHoldDate(n.raw.requestedEndDate)}
        </div>

        {mode === "adjust" && (
          <div style={{ display: "flex", gap: 8, marginTop: 10, maxWidth: 320 }}>
            <label style={{ flex: 1, fontSize: 11, color: "#9C8573" }}>
              Start
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                style={dateInput}
              />
            </label>
            <label style={{ flex: 1, fontSize: 11, color: "#9C8573" }}>
              End
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                style={dateInput}
              />
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
                  run(
                    "approve",
                    { taskableHoldRequestId: n.id, action: "approve" },
                    "Hold request approved — task timeline extended"
                  )
                }
                style={btnPrimary(busy === "approve")}
              >
                <Check size={13} /> {busy === "approve" ? "Approving…" : "Accept"}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() =>
                  run(
                    "reject",
                    { taskableHoldRequestId: n.id, action: "reject" },
                    "Hold request rejected"
                  )
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
                    "Hold approved with adjusted dates — timeline updated"
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
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, canReview, processRequest, markAllRead, markRead, isUnread } =
    useNotifications();

  const [filter, setFilter] = useState<"all" | "unread" | "action">("all");

  const visible = notifications.filter((n) => {
    if (filter === "action") return n.actionable;
    return true;
  });

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
              ? "Hold requests and team activity. Review pending requests below."
              : "Updates on your hold requests and activity."}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            style={{
              background: "none",
              border: "1px solid rgba(90,60,30,0.18)",
              borderRadius: 10,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              color: "#6B5744",
              cursor: "pointer",
            }}
          >
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
        <div
          style={{
            ...dsCallout,
            textAlign: "center",
            padding: "48px 24px",
            color: "#9C8573",
          }}
        >
          {filter === "action" ? "No requests need your action." : "No notifications yet."}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map((n) => (
          <NotificationRow
            key={n.key}
            n={n}
            isUnread={isUnread(n.key)}
            canReview={canReview}
            onProcess={async (payload) => {
              await processRequest(payload);
              markRead(n.key);
            }}
            onOpen={() => {
              markRead(n.key);
              if (n.projectId) router.push(projectTabRoute(n.projectId, "hold-requests"));
            }}
          />
        ))}
      </div>
    </div>
  );
}

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
