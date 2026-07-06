"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LogOut, Monitor, Smartphone, ShieldCheck, Globe, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { authApiClient } from "@/lib/api/authenticated-client";
import { NAV_ROUTES } from "@/types/navigation";

interface SessionInfo {
  id: string;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  is_current?: boolean;
}

function parseDeviceSummary(ua?: string | null): {
  browser: string;
  os: string;
  label: string;
  isMobile: boolean;
} {
  const raw = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");

  let browser = "Unknown browser";
  if (/Edg\//.test(raw)) browser = "Microsoft Edge";
  else if (/Chrome\//.test(raw)) browser = "Chrome";
  else if (/Safari\//.test(raw) && !/Chrome/.test(raw)) browser = "Safari";
  else if (/Firefox\//.test(raw)) browser = "Firefox";
  else if (/OPR\//.test(raw)) browser = "Opera";

  let os = "Unknown OS";
  if (/Mac OS X/.test(raw)) os = "macOS";
  else if (/Windows/.test(raw)) os = "Windows";
  else if (/Android/.test(raw)) os = "Android";
  else if (/iPhone|iPad/.test(raw)) os = "iOS";
  else if (/Linux/.test(raw)) os = "Linux";
  else if (/CrOS/.test(raw)) os = "ChromeOS";

  const isMobile = /Android|iPhone|iPad|Mobile/.test(raw);

  return { browser, os, label: `${browser} on ${os}`, isMobile };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function SecuritySettingsSection() {
  const router = useRouter();
  const { logout } = useAuth();
  const browserDevice = useMemo(() => parseDeviceSummary(), []);

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const currentSession = useMemo(
    () => sessions.find((s) => s.is_current),
    [sessions],
  );

  const currentDevice = useMemo(() => {
    if (currentSession?.user_agent) {
      return parseDeviceSummary(currentSession.user_agent);
    }
    return browserDevice;
  }, [browserDevice, currentSession?.user_agent]);

  const otherSessions = useMemo(
    () => sessions.filter((s) => !s.is_current),
    [sessions],
  );

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const data = await authApiClient<SessionInfo[]>("/auth/sessions");
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  function handleSignOutThisDevice() {
    logout();
    router.replace(NAV_ROUTES.login);
  }

  async function handleSignOutEverywhere() {
    try {
      await authApiClient<{ success: boolean }>("/auth/sign-out-all", {
        method: "POST",
      });
      toast.success("Signed out on all devices");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign out everywhere");
    } finally {
      logout();
      router.replace(NAV_ROUTES.login);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    setRevokingId(sessionId);
    try {
      await authApiClient<{ success: boolean }>(`/auth/sessions/${sessionId}`, {
        method: "DELETE",
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success("Session signed out");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--ds-separator)] bg-[var(--ds-surface-elevated,#FDFAF6)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck size={16} color="var(--ds-accent, #D4A96A)" />
        <h2 className="text-[15px] font-semibold text-[var(--ds-label,#1A1410)]">Security</h2>
      </div>

      <div className="space-y-4">
        {/* Current device */}
        <div className="rounded-lg bg-[var(--ds-bg,#F5EFE6)] px-3 py-3">
          <div className="flex items-center gap-2">
            {currentDevice.isMobile ? (
              <Smartphone size={14} className="text-[var(--ds-accent)]" />
            ) : (
              <Monitor size={14} className="text-[var(--ds-accent)]" />
            )}
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ds-secondary-label,#9C8573)]">
              This device
            </div>
          </div>
          <div className="mt-1 text-[13px] text-[var(--ds-label,#1A1410)]">{currentDevice.label}</div>
          <div className="mt-1 text-[12px] text-[var(--ds-secondary-label,#9C8573)]">
            You are currently signed in here.
            {currentSession?.ip ? ` · ${currentSession.ip}` : ""}
          </div>
        </div>

        {/* Other active sessions */}
        {sessionsLoading ? (
          <div className="flex items-center gap-2 px-1 py-2 text-[12px] text-[var(--ds-secondary-label,#9C8573)]">
            <Loader2 size={14} className="animate-spin" />
            Loading active sessions…
          </div>
        ) : otherSessions.length > 0 ? (
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--ds-secondary-label,#9C8573)]">
              Other active sessions ({otherSessions.length})
            </div>
            <div className="space-y-2">
              {otherSessions.map((session) => {
                const device = parseDeviceSummary(session.user_agent);
                const isRevoking = revokingId === session.id;
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-[var(--ds-separator)] px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      {device.isMobile ? (
                        <Smartphone size={14} className="mt-0.5 shrink-0 text-[var(--ds-secondary-label)]" />
                      ) : (
                        <Monitor size={14} className="mt-0.5 shrink-0 text-[var(--ds-secondary-label)]" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-[13px] text-[var(--ds-label,#1A1410)]">
                          {device.label}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[var(--ds-secondary-label,#9C8573)]">
                          {session.ip ? (
                            <span className="inline-flex items-center gap-0.5">
                              <Globe size={10} />
                              {session.ip}
                            </span>
                          ) : null}
                          <span>Last active {timeAgo(session.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isRevoking}
                      onClick={() => void handleRevokeSession(session.id)}
                      className="shrink-0 text-[12px]"
                    >
                      {isRevoking ? (
                        <Loader2 size={12} className="mr-1 animate-spin" />
                      ) : (
                        <LogOut size={12} className="mr-1" />
                      )}
                      Sign out
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : sessions.length > 0 || currentSession ? (
          <p className="text-[12px] text-[var(--ds-secondary-label,#9C8573)]">
            No other active sessions. You are only signed in on this device.
          </p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={handleSignOutThisDevice}
          >
            <LogOut size={15} className="mr-2" />
            Sign out on this device
          </Button>
          {otherSessions.length > 0 ? (
            <Button
              type="button"
              variant="destructive"
              className="h-10"
              onClick={() => void handleSignOutEverywhere()}
            >
              Sign out everywhere
            </Button>
          ) : null}
        </div>

        <p className="text-[12px] text-[var(--ds-secondary-label,#9C8573)]">
          Signing out everywhere ends all active sessions on other browsers and devices.
        </p>
      </div>
    </section>
  );
}
