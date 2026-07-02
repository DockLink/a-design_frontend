"use client";

import { useMemo } from "react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { authApiClient } from "@/lib/api/authenticated-client";
import { NAV_ROUTES } from "@/types/navigation";

function parseDeviceSummary(): string {
  if (typeof navigator === "undefined") return "This device";

  const ua = navigator.userAgent;
  let browser = "Browser";
  if (/Edg\//.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Firefox\//.test(ua)) browser = "Firefox";

  let os = "Unknown OS";
  if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return `${browser} on ${os}`;
}

export function SecuritySettingsSection() {
  const router = useRouter();
  const { logout } = useAuth();
  const deviceSummary = useMemo(() => parseDeviceSummary(), []);

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

  return (
    <section className="rounded-2xl border border-[rgba(90,60,30,0.12)] bg-[var(--ds-surface-elevated,#FDFAF6)] p-5">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck size={16} color="var(--ds-accent, #D4A96A)" />
        <h2 className="text-[15px] font-semibold text-[var(--ds-label,#1A1410)]">Security</h2>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg bg-[var(--ds-bg,#F5EFE6)] px-3 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ds-secondary-label,#9C8573)]">
            This device
          </div>
          <div className="mt-1 text-[13px] text-[var(--ds-label,#1A1410)]">{deviceSummary}</div>
          <div className="mt-1 text-[12px] text-[var(--ds-secondary-label,#9C8573)]">
            You are currently signed in here.
          </div>
        </div>

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
          <Button
            type="button"
            variant="destructive"
            className="h-10"
            onClick={() => void handleSignOutEverywhere()}
          >
            Sign out everywhere
          </Button>
        </div>

        <p className="text-[12px] text-[var(--ds-secondary-label,#9C8573)]">
          Signing out everywhere ends all active sessions on other browsers and devices.
        </p>
      </div>
    </section>
  );
}
