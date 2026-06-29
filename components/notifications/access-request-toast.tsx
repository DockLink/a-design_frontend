"use client";

import { useState } from "react";
import { Check, UserPlus, X } from "lucide-react";

import type { ReviewAccessRequestPayload } from "@/types/access-requests";
import type { AccessAppNotification } from "@/types/notifications";

export function AccessRequestToast({
  notification,
  onReview,
  onView,
  onClose,
}: {
  notification: AccessAppNotification;
  onReview: (payload: ReviewAccessRequestPayload) => Promise<void>;
  onView: () => void;
  onClose: () => void;
}) {
  const req = notification.raw;
  const [busy, setBusy] = useState<null | "full" | "limited" | "reject">(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(
    action: ReviewAccessRequestPayload["action"],
    grantedRole?: ReviewAccessRequestPayload["grantedRole"],
    label?: "full" | "limited" | "reject"
  ) {
    setBusy(label ?? null);
    setErr(null);
    try {
      await onReview({
        accessRequestId: req.id,
        action,
        grantedRole,
      });
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to process request");
      setBusy(null);
    }
  }

  return (
    <div
      style={{
        width: 360,
        background: "#FDFAF6",
        border: "1px solid rgba(90,60,30,0.14)",
        borderRadius: 14,
        boxShadow: "0 12px 40px rgba(0,0,0,0.16)",
        padding: 14,
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "rgba(0,122,255,0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <UserPlus size={16} color="#0071E3" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1410" }}>
            {notification.title}
          </div>
          <div style={{ fontSize: 12, color: "#6B5744", marginTop: 2, lineHeight: 1.4 }}>
            Access to <strong>{notification.projectName}</strong>
          </div>
          {req.requestNote && (
            <div style={{ fontSize: 12, color: "#6B5744", marginTop: 4, lineHeight: 1.4 }}>
              {req.requestNote}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#9C8573", padding: 2, flexShrink: 0 }}
        >
          <X size={14} />
        </button>
      </div>

      {err && <div style={{ marginTop: 8, fontSize: 11, color: "#9B1C1C" }}>{err}</div>}

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("approve", "MEMBER", "full")}
          style={primaryBtn(busy === "full")}
        >
          <Check size={13} /> {busy === "full" ? "Granting…" : "Full access"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("approve", "VIEWER", "limited")}
          style={secondaryBtn(busy === "limited")}
        >
          <Check size={13} /> {busy === "limited" ? "Granting…" : "Limited"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("reject", undefined, "reject")}
          style={dangerBtn(busy === "reject")}
        >
          <X size={13} /> {busy === "reject" ? "Rejecting…" : "Reject"}
        </button>
        <button type="button" onClick={onView} style={linkBtn}>
          View
        </button>
      </div>
    </div>
  );
}

function primaryBtn(loading: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    height: 30,
    padding: "0 12px",
    borderRadius: 8,
    border: "none",
    background: "#3D8B5E",
    color: "white",
    fontSize: 12,
    fontWeight: 500,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
  };
}

function secondaryBtn(loading: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    height: 30,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid rgba(90,60,30,0.18)",
    background: "white",
    color: "#6B5744",
    fontSize: 12,
    fontWeight: 500,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
  };
}

function dangerBtn(loading: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    height: 30,
    padding: "0 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,59,48,0.3)",
    background: "white",
    color: "#C0392B",
    fontSize: 12,
    fontWeight: 500,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
  };
}

const linkBtn: React.CSSProperties = {
  marginLeft: "auto",
  background: "none",
  border: "none",
  color: "#C9894A",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  padding: "0 4px",
};
