"use client";

import { useMemo, useState } from "react";
import { KeyRound, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { PasswordInput } from "@/components/auth/password-input";
import { AppearanceSettingsSection } from "@/components/settings/appearance-settings-section";
import { ProfileSettingsSection } from "@/components/settings/profile-settings-section";
import { SecuritySettingsSection } from "@/components/settings/security-settings-section";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { authApiClient } from "@/lib/api/authenticated-client";
import { isSuperAdminRole } from "@/lib/navigation/sidebar-role";
import { dsLargeTitle, dsSubtitle } from "@/lib/styles/dashboard-tokens";

export default function SettingsPage() {
  const { user, primaryRole } = useAuth();
  const isSuperAdmin = isSuperAdminRole(primaryRole);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!newPassword) return null;
    if (newPassword.length < 8) return "New password must be at least 8 characters.";
    if (confirmPassword && newPassword !== confirmPassword)
      return "New password and confirmation do not match.";
    return null;
  }, [newPassword, confirmPassword]);

  const canSubmit =
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
        body: JSON.stringify({ newPassword }),
      });
      toast.success("Password changed successfully.");
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

  return (
    <div className="w-full">
      <div style={{ ...dsLargeTitle, display: "flex", alignItems: "center", gap: 10 }}>
        <UserIcon size={26} color="var(--ds-accent)" />
        Account settings
      </div>
      <div style={{ ...dsSubtitle, marginTop: 6 }}>
        {isSuperAdmin
          ? "Manage your profile, security, and organization-wide appearance."
          : "Manage your profile and security."}
      </div>

      <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ProfileSettingsSection />
        <SecuritySettingsSection />
      </div>

      {isSuperAdmin ? <AppearanceSettingsSection /> : null}

      <section className="mt-5 rounded-2xl border border-[var(--ds-separator)] bg-[var(--ds-surface-elevated,#FDFAF6)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound size={16} color="var(--ds-accent, #D4A96A)" />
          <h2 className="text-[15px] font-semibold text-[var(--ds-label,#1A1410)]">
            Change password
          </h2>
        </div>
        <p className="mb-4 text-[13px] text-[var(--ds-secondary-label,#9C8573)]">
          Enter a new password below. You will stay signed in on this device.
        </p>

        <form
          onSubmit={handleChangePassword}
          className="grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-2"
        >
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
              className="h-10 bg-[var(--ds-bg,#F5EFE6)]"
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
              className="h-10 bg-[var(--ds-bg,#F5EFE6)]"
            />
          </div>

          <div className="sm:col-span-2">
            {(validationError || error) && (
              <p className="mb-3 text-[13px] text-[var(--ds-destructive)]">
                {validationError ?? error}
              </p>
            )}

            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-10 rounded-lg text-white"
              style={{ background: "var(--ds-accent, #D4A96A)" }}
            >
              {submitting ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
