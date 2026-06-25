"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { FloatingShapes } from "@/components/auth/floating-shapes";
import { HandwritingText } from "@/components/auth/handwriting-text";
import { LoginForm } from "@/components/auth/login-form";
import { useAuth } from "@/hooks/use-auth";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { NAV_ROUTES } from "@/types/navigation";
import { ROLE_DEFAULT_ROUTE } from "@/types/rbac";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, session } = useAuth();

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    const role = session?.user.roles
      ? getPrimaryRole(session.user.roles)
      : null;
    router.replace(role ? ROLE_DEFAULT_ROUTE[role] : NAV_ROUTES.adminDashboard);
  }, [isAuthenticated, isHydrated, router, session]);

  if (!isHydrated || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F5F1]">
        <div className="size-8 animate-spin rounded-full border-2 border-[#D4A96A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-[#F5EFE6] via-[#EAD9C8] to-[#E8D8C2] lg:flex lg:flex-col lg:justify-center lg:px-[70px] lg:py-20">
        <FloatingShapes />
        <div className="relative z-10">
          <HandwritingText />
        </div>
      </div>

      <div className="flex w-full items-center justify-center bg-[#F9F5F1] px-8 py-12 lg:w-1/2">
        <div className="w-full max-w-[380px] animate-in fade-in zoom-in-95 duration-500">
          <div className="mb-8">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#1C1C1E]">
              Sign in
            </h1>
            <p className="mt-1.5 text-[15px] text-muted-foreground">
              Use your A-Design account
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
