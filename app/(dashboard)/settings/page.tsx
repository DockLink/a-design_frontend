"use client";

import { useMemo, useState } from "react";
import { KeyRound, Mail, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { authApiClient } from "@/lib/api/authenticated-client";
import { ROLE_LABEL, toSidebarRole } from "@/lib/navigation/sidebar-role";
import { dsLargeTitle, dsSubtitle } from "@/lib/styles/dashboard-tokens";
import { getUserDisplayName } from "@/lib/user/display";

export default function SettingsPage() {
  const { user, primaryRole } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!newPassword) return null;
    if (newPassword.length < 8) return "New password must be at least 8 characters.";
    if (confirmPassword && newPassword !== confirmPassword)
      return "New password and confirmation do not match.";
    if (currentPassword && newPassword === currentPassword)
      return "New password must be different from your current password.";
    return null;
  }, [newPassword, confirmPassword, currentPassword]);

  const canSubmit =
    Boolean(currentPassword) &&
    Boolean(newPassword) &&
    Boolean(confirmPassword) &&
    !validationError &&
    !submitting;

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await authApiClient("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to change password.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  const roleLabel = primaryRole
    ? ROLE_LABEL[toSidebarRole(primaryRole)]
    : "Team Member";

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ ...dsLargeTitle, display: "flex", alignItems: "center", gap: 10 }}>
        <UserIcon size={26} color="#D4A96A" />
        Account settings
      </div>
      <div style={{ ...dsSubtitle, marginTop: 6 }}>
        Manage your profile and change your password.
      </div>

      {/* Profile card */}
      <section className="mt-7 rounded-2xl border border-[rgba(90,60,30,0.12)] bg-[#FDFAF6] p-5">
        <h2 className="mb-4 text-[15px] font-semibold text-[#1A1410]">Profile</h2>
        <div className="space-y-3">
          <ProfileRow
            icon={<UserIcon size={15} color="#9C8573" />}
            label="Name"
            value={getUserDisplayName(user)}
          />
          <ProfileRow
            icon={<Mail size={15} color="#9C8573" />}
            label="Email"
            value={user.email}
          />
          <ProfileRow
            icon={<Shield size={15} color="#9C8573" />}
            label="Role"
            value={roleLabel}
          />
        </div>
      </section>

      {/* Change password card */}
      <section className="mt-5 rounded-2xl border border-[rgba(90,60,30,0.12)] bg-[#FDFAF6] p-5">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={16} color="#D4A96A" />
          <h2 className="text-[15px] font-semibold text-[#1A1410]">
            Change password
          </h2>
        </div>
        <p className="mb-4 text-[13px] text-[#9C8573]">
          Update your password directly — no email required. You will stay
          signed in on this device.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setError(null);
              }}
              placeholder="Enter current password"
              className="h-10 bg-[#F5EFE6]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError(null);
              }}
              placeholder="At least 8 characters"
              className="h-10 bg-[#F5EFE6]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              placeholder="Re-enter new password"
              className="h-10 bg-[#F5EFE6]"
            />
          </div>

          {(validationError || error) && (
            <p className="text-[13px] text-[#9B1C1C]">
              {validationError ?? error}
            </p>
          )}

          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-10 rounded-lg bg-[#D4A96A] text-white hover:bg-[#C4956A]"
          >
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[#F5EFE6] px-3 py-2.5">
      {icon}
      <span className="w-16 text-[12px] font-medium uppercase tracking-wide text-[#9C8573]">
        {label}
      </span>
      <span className="flex-1 truncate text-[13px] text-[#1A1410]">{value}</span>
    </div>
  );
}
