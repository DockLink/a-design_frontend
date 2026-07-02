"use client";

import { useEffect, useRef, useState } from "react";
import { Mail, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { UserAvatar } from "@/components/user-management/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useUploadFile } from "@/hooks/use-upload-file";
import {
  getHomeRouteLabel,
  getSelectableHomeRoutes,
} from "@/lib/navigation/home-route";
import { ROLE_LABEL, toSidebarRole } from "@/lib/navigation/sidebar-role";
import { authApiClient } from "@/lib/api/authenticated-client";
import { normalizeUserFields } from "@/lib/user/display";
import { ROLE_DEFAULT_ROUTE } from "@/types/rbac";
import type { HomeRoutePreference, User } from "@/types/users";

export function ProfileSettingsSection() {
  const { user, primaryRole, refreshUser } = useAuth();
  const { preferences, savePreferences, isSaving: isSavingPrefs } = useUserPreferences();
  const { uploadFile } = useUploadFile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [defaultHome, setDefaultHome] = useState<HomeRoutePreference | "">(
    preferences.default_home_route ?? "",
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!user) return;
    const normalized = normalizeUserFields(user);
    setFirstName(normalized.first_name);
    setLastName(normalized.last_name);
  }, [user]);

  useEffect(() => {
    setDefaultHome(preferences.default_home_route ?? "");
  }, [preferences.default_home_route]);

  if (!user || !primaryRole) return null;

  const roleLabel = ROLE_LABEL[toSidebarRole(primaryRole)];
  const homeOptions = getSelectableHomeRoutes(primaryRole);

  const normalized = normalizeUserFields(user);
  const profileDirty =
    firstName !== normalized.first_name || lastName !== normalized.last_name;
  const homeDirty =
    (defaultHome || null) !== (preferences.default_home_route ?? null);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await authApiClient<User>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveHome() {
    try {
      await savePreferences({
        default_home_route: defaultHome ? defaultHome : null,
      });
      await refreshUser();
      toast.success("Default home page saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save preference");
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploadingAvatar(true);
    try {
      const { token } = await uploadFile(file);
      await savePreferences({ avatar_file_id: token });
      await refreshUser();
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    try {
      await savePreferences({ avatar_file_id: null });
      await refreshUser();
      toast.success("Avatar removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove avatar");
    }
  }

  return (
    <section className="rounded-2xl border border-[rgba(90,60,30,0.12)] bg-[var(--ds-surface-elevated,#FDFAF6)] p-5">
      <h2 className="mb-4 text-[15px] font-semibold text-[var(--ds-label,#1A1410)]">Profile</h2>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <UserAvatar user={user} size={72} avatarFileId={preferences.avatar_file_id} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleAvatarChange(e)}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingAvatar ? "Uploading…" : "Change photo"}
            </Button>
            {preferences.avatar_file_id ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleRemoveAvatar()}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 bg-[var(--ds-bg,#F5EFE6)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-10 bg-[var(--ds-bg,#F5EFE6)]"
              />
            </div>
          </div>

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

          {profileDirty ? (
            <Button
              type="button"
              disabled={savingProfile}
              onClick={() => void handleSaveProfile()}
              className="h-10 rounded-lg text-white"
              style={{ background: "var(--ds-accent, #D4A96A)" }}
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 border-t border-[rgba(90,60,30,0.1)] pt-5">
        <div className="mb-2 flex items-center gap-2">
          <UserIcon size={14} color="var(--ds-accent, #D4A96A)" />
          <span className="text-[13px] font-semibold text-[var(--ds-label,#1A1410)]">
            Default home page
          </span>
        </div>
        <p className="mb-3 text-[12px] text-[var(--ds-secondary-label,#9C8573)]">
          Where you land after signing in.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={defaultHome}
            onChange={(e) => setDefaultHome(e.target.value as HomeRoutePreference | "")}
            className="h-10 flex-1 rounded-lg border border-[rgba(90,60,30,0.15)] bg-[var(--ds-bg,#F5EFE6)] px-3 text-[13px] text-[var(--ds-label,#1A1410)]"
          >
            <option value="">
              Role default (
              {getHomeRouteLabel(
                ROLE_DEFAULT_ROUTE[primaryRole] as HomeRoutePreference,
              )}
              )
            </option>
            {homeOptions.map((route) => (
              <option key={route} value={route}>
                {getHomeRouteLabel(route)}
              </option>
            ))}
          </select>
          {homeDirty ? (
            <Button
              type="button"
              disabled={isSavingPrefs}
              onClick={() => void handleSaveHome()}
              className="h-10 shrink-0 rounded-lg text-white"
              style={{ background: "var(--ds-accent, #D4A96A)" }}
            >
              {isSavingPrefs ? "Saving…" : "Save"}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
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
    <div className="flex items-center gap-3 rounded-lg bg-[var(--ds-bg,#F5EFE6)] px-3 py-2.5">
      {icon}
      <span className="w-16 text-[12px] font-medium uppercase tracking-wide text-[var(--ds-secondary-label,#9C8573)]">
        {label}
      </span>
      <span className="flex-1 truncate text-[13px] text-[var(--ds-label,#1A1410)]">{value}</span>
    </div>
  );
}
