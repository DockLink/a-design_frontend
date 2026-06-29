"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateUserRequest } from "@/types/users-api";
import type { UserRole } from "@/types/users";

// Only super admins can mint admins; the safe default offers members only.
const DEFAULT_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "MEMBER", label: "Member" },
];

export function CreateUserSheet({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  roleOptions = DEFAULT_ROLE_OPTIONS,
  defaultRole = "MEMBER",
  title = "Create user",
  subtitle = "Project lead is assigned per project, not here.",
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserRequest) => Promise<void>;
  isSubmitting?: boolean;
  roleOptions?: { value: UserRole; label: string }[];
  defaultRole?: UserRole;
  title?: string;
  subtitle?: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => firstName.trim() && email.trim() && password.trim(),
    [email, firstName, password]
  );

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await onSubmit({
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        email: email.trim(),
        password,
        role,
      });
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setRole(defaultRole);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
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
          width: "400px",
          height: "calc(100vh - 52px)",
          background: "#FDFAF6",
          borderLeft: "1px solid rgba(90,60,30,0.12)",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.10)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: "52px",
            borderBottom: "1px solid rgba(90,60,30,0.12)",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: "17px", fontWeight: 500, color: "#1A1410" }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9C8573",
              display: "flex",
              padding: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="space-y-2">
              <Label htmlFor="create-first-name">First name</Label>
              <Input
                id="create-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First"
                className="h-9 bg-[#F5EFE6]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-last-name">Last name (optional)</Label>
              <Input
                id="create-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last"
                className="h-9 bg-[#F5EFE6]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-email">Email address</Label>
            <Input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@studio.lk"
              className="h-9 bg-[#F5EFE6]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-password">Password</Label>
            <Input
              id="create-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 chars with symbols"
              className="h-9 bg-[#F5EFE6]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-role">Organisation role</Label>
            <select
              id="create-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              style={{
                width: "100%",
                height: "36px",
                borderRadius: "8px",
                border: "1px solid rgba(90,60,30,0.15)",
                background: "#F5EFE6",
                padding: "0 10px",
                fontSize: "13px",
                color: "#1A1410",
              }}
            >
              {roleOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p style={{ fontSize: "12px", color: "#9C8573", margin: 0 }}>
              {subtitle}
            </p>
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#9B1C1C", marginTop: "-2px" }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="h-9 w-full rounded-lg bg-[#D4A96A] hover:bg-[#C4956A]"
            >
              {isSubmitting ? "Creating…" : "Create user"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 w-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
