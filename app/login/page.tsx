"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { HandwritingText } from "@/components/auth/handwriting-text";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/hooks/use-auth";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { APP_NAME } from "@/lib/constants";
import { NAV_ROUTES } from "@/types/navigation";
import { resolveHomeRoute } from "@/lib/navigation/home-route";

const LOGIN_BG = "#F9F5F1";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, session } = useAuth();

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    const role = session?.user.roles
      ? getPrimaryRole(session.user.roles)
      : null;
    router.replace(
      role
        ? resolveHomeRoute(role, session?.user.preferences)
        : NAV_ROUTES.adminDashboard,
    );
  }, [isAuthenticated, isHydrated, router, session]);

  if (!isHydrated || isAuthenticated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: LOGIN_BG }}
      >
        <div className="size-8 animate-spin rounded-full border-2 border-[var(--ds-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full" style={{ background: LOGIN_BG }}>
      {/* Left: brand + sign-in — tighter to viewport left, more space before hero */}
      <div
        className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/3 lg:pl-10 lg:pr-24 lg:py-16"
        style={{ background: LOGIN_BG }}
      >
        <HandwritingText>
          <div className="mb-6">
            <h1 className="text-[22px] font-light tracking-tight text-[var(--ds-label)]">
              Sign in
            </h1>
            <p className="mt-1 text-[13px] font-light text-muted-foreground">
              Use your {APP_NAME} account
            </p>
          </div>
          <LoginForm />
        </HandwritingText>
      </div>

      {/* Right: hero image — extra inset from the form column */}
      <div className="relative hidden min-h-screen lg:block lg:w-2/3 lg:pl-8">
        <Image
          src="/images/heroimage.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="66vw"
        />
      </div>
    </div>
  );
}
