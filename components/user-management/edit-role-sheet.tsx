"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { User, UserRole } from "@/types/users";

// Only super admins can assign admin roles; the safe default is members only.
const DEFAULT_ASSIGNABLE_ROLES: { value: UserRole; label: string }[] = [
  { value: "MEMBER", label: "Member" },
];

export function EditRoleSheet({
  user,
  open,
  onClose,
  onSave,
  isSaving,
  roleOptions = DEFAULT_ASSIGNABLE_ROLES,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (userId: string, role: UserRole) => Promise<void>;
  isSaving?: boolean;
  roleOptions?: { value: UserRole; label: string }[];
}) {
  const [role, setRole] = useState<UserRole>("MEMBER");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const current = user.roles[0] ?? "MEMBER";
      const assignable = roleOptions.some((r) => r.value === current)
        ? current
        : roleOptions[0]?.value ?? "MEMBER";
      setRole(assignable);
      setError(null);
    }
  }, [user, roleOptions]);

  if (!open || !user) return null;

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;

  const userId = user.id;
  const isSuperAdminTarget = user.roles.includes("SUPER_ADMIN");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSave(userId, role);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.12)",
          zIndex: 29,
        }}
      />
      <aside
        style={{
          position: "fixed",
          right: 0,
          top: "52px",
          width: "360px",
          height: "calc(100vh - 52px)",
          background: "var(--ds-surface-elevated)",
          borderLeft: "1px solid var(--ds-separator)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.10)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: "52px",
            borderBottom: "1px solid var(--ds-separator)",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "17px", fontWeight: 500, color: "var(--ds-label)" }}>
            Edit role
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ds-secondary-label)",
              display: "flex",
              padding: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <p style={{ fontSize: "14px", color: "var(--ds-secondary-label)", margin: 0 }}>
            Update role for <strong style={{ color: "var(--ds-label)" }}>{displayName}</strong>
          </p>

          {isSuperAdminTarget ? (
            <p style={{ fontSize: "13px", color: "var(--ds-secondary-label)", margin: 0 }}>
              Super admin roles cannot be changed from this panel.
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="edit-role">Organisation role</Label>
              <select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                style={{
                  width: "100%",
                  height: "36px",
                  borderRadius: "8px",
                  border: "1px solid rgba(90,60,30,0.15)",
                  background: "var(--ds-bg)",
                  padding: "0 10px",
                  fontSize: "13px",
                  color: "var(--ds-label)",
                }}
              >
                {roleOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p style={{ fontSize: "13px", color: "var(--ds-destructive)", margin: 0 }}>{error}</p>
          )}

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            {!isSuperAdminTarget && (
              <Button
                type="submit"
                disabled={isSaving}
                className="h-9 w-full rounded-lg bg-[var(--ds-accent)] hover:bg-[#C4956A]"
              >
                {isSaving ? "Saving…" : "Save role"}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} className="h-9 w-full">
              Cancel
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
