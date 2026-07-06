"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MoreHorizontal } from "lucide-react";

export function UserActionMenu({
  disabled,
  onEditRole,
  onDeactivate,
  onDelete,
  canDeactivate = true,
}: {
  disabled?: boolean;
  onEditRole?: () => void;
  onDeactivate: () => void;
  /** When provided, shows a "Delete permanently" action (super admin only). */
  onDelete?: () => void;
  /** Hide the Deactivate action (e.g. for already-inactive users). */
  canDeactivate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const itemStyle: CSSProperties = {
    display: "block",
    width: "100%",
    padding: "8px 12px",
    background: "none",
    border: "none",
    textAlign: "left",
    fontSize: "13px",
    color: "var(--ds-label)",
    cursor: "pointer",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          background: "none",
          border: "none",
          cursor: disabled ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ds-secondary-label)",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "32px",
            width: "170px",
            background: "var(--ds-surface-elevated)",
            border: "1px solid rgba(90,60,30,0.14)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            zIndex: 20,
            overflow: "hidden",
          }}
        >
          {onEditRole && (
            <button
              type="button"
              style={itemStyle}
              onClick={() => {
                setOpen(false);
                onEditRole();
              }}
            >
              Edit role
            </button>
          )}
          {canDeactivate && (
            <button
              type="button"
              style={{ ...itemStyle, color: "var(--ds-destructive)" }}
              onClick={() => {
                setOpen(false);
                onDeactivate();
              }}
            >
              Deactivate
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              style={{ ...itemStyle, color: "var(--ds-destructive)", fontWeight: 500 }}
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              Delete permanently
            </button>
          )}
        </div>
      )}
    </div>
  );
}
