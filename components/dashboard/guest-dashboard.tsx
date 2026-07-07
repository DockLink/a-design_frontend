"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { resolveGuestLandingRoute } from "@/lib/navigation/guest-landing";

/** Legacy guest dashboard URL — immediately forwards to the guest's project(s). */
export function GuestDashboard() {
  const router = useRouter();

  useEffect(() => {
    void resolveGuestLandingRoute().then((route) => router.replace(route));
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--ds-secondary-label)]">
      Opening your project…
    </div>
  );
}
