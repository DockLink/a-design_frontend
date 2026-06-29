"use client";

import { useState } from "react";
import { Check, Clock, Pencil, X } from "lucide-react";

import type { ProcessHoldRequestPayload } from "@/hooks/use-project-hold-requests";
import { formatHoldDate, toHoldRequestDateIso } from "@/lib/hold-requests/display";
import type { AppNotification } from "@/types/notifications";

function isoToDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function HoldRequestToast({
  notification,
  onProcess,
  onView,
  onClose,
}: {
  notification: AppNotification;
  onProcess: (payload: ProcessHoldRequestPayload) => Promise<void>;
  onView: () => void;
  onClose: () => void;
}) {
  const req = notification.raw;
  const [mode, setMode] = useState<"default" | "adjust">("default");
  const [start, setStart] = useState(() => isoToDateInput(req.requestedStartDate));
  const [end, setEnd] = useState(() => isoToDateInput(req.requestedEndDate));
  const [busy, setBusy] = useState<null | "approve" | "reject" | "adjust">(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(
    action: "approve" | "reject" | "adjust",
    payload: ProcessHoldRequestPayload
  ) {
    setBusy(action);
    setErr(null);
    try {
      await onProcess(payload);
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
            background: "rgba(212,169,106,0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Clock size={16} color="#C9894A" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1410" }}>
            {notification.title}
          </div>
          <div style={{ fontSize: 12, color: "#6B5744", marginTop: 2, lineHeight: 1.4 }}>
            Hold on <strong>{notification.taskTitle}</strong>
          </div>
          <div style={{ fontSize: 12, color: "#9C8573", marginTop: 2 }}>
            {formatHoldDate(req.requestedStartDate)} – {formatHoldDate(req.requestedEndDate)}
          </div>
          {req.reason && (
            <div style={{ fontSize: 12, color: "#6B5744", marginTop: 4, lineHeight: 1.4 }}>
              {req.reason}
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

      {mode === "adjust" && (
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <label style={{ flex: 1, fontSize: 11, color: "#9C8573" }}>
            Start
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={{
                width: "100%",
                marginTop: 2,
                height: 30,
                borderRadius: 8,
                border: "1px solid rgba(90,60,30,0.18)",
                background: "#F5EFE6",
                padding: "0 8px",
                fontSize: 12,
                color: "#1A1410",
                outline: "none",
              }}
            />
          </label>
          <label style={{ flex: 1, fontSize: 11, color: "#9C8573" }}>
            End
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={{
                width: "100%",
                marginTop: 2,
                height: 30,
                borderRadius: 8,
                border: "1px solid rgba(90,60,30,0.18)",
                background: "#F5EFE6",
                padding: "0 8px",
                fontSize: 12,
                color: "#1A1410",
                outline: "none",
              }}
            />
          </label>
        </div>
      )}

      {err && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#9B1C1C" }}>{err}</div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {mode === "default" ? (
          <>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run("approve", { taskableHoldRequestId: req.id, action: "approve" })
              }
              style={primaryBtn(busy === "approve")}
            >
              <Check size={13} /> {busy === "approve" ? "Approving…" : "Accept"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run("reject", { taskableHoldRequestId: req.id, action: "reject" })
              }
              style={dangerBtn(busy === "reject")}
            >
              <X size={13} /> {busy === "reject" ? "Rejecting…" : "Reject"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setMode("adjust")}
              style={ghostBtn}
            >
              <Pencil size={13} /> Adjust date
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={busy !== null || !start || !end}
              onClick={() =>
                run("adjust", {
                  taskableHoldRequestId: req.id,
                  action: "approve",
                  approvedStartDate: toHoldRequestDateIso(start),
                  approvedEndDate: toHoldRequestDateIso(end, true),
                })
              }
              style={primaryBtn(busy === "adjust")}
            >
              <Check size={13} /> {busy === "adjust" ? "Saving…" : "Save & accept"}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => setMode("default")}
              style={ghostBtn}
            >
              Back
            </button>
          </>
        )}
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

const ghostBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  height: 30,
  padding: "0 12px",
  borderRadius: 8,
  border: "1px solid rgba(90,60,30,0.18)",
  background: "transparent",
  color: "#6B5744",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
};

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
