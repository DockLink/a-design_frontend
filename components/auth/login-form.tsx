"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/types/api";
import { NAV_ROUTES } from "@/types/navigation";
import { resolveGuestLandingRoute } from "@/lib/navigation/guest-landing";
import { resolveHomeRoute } from "@/lib/navigation/home-route";

// Login Form

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    try {
      await login(email.trim(), password);

      const role = useAuthStore.getState().session?.user.roles
        ? getPrimaryRole(useAuthStore.getState().session!.user.roles)
        : null;
      const user = useAuthStore.getState().session?.user;

      if (role === "GUEST") {
        const route = await resolveGuestLandingRoute();
        router.replace(route);
        return;
      }

      router.replace(
        role
          ? resolveHomeRoute(role, user?.preferences)
          : NAV_ROUTES.adminDashboard,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          typeof err.body.message === "string"
            ? err.body.message
            : "Incorrect email or password."
        );
      } else {
        setError("Unable to sign in. Please try again.");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-light">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@adesign.lk"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          aria-invalid={Boolean(error)}
          className="h-9 text-sm"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-light">
          Password
        </Label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          invalid={Boolean(error)}
          className="h-9 pr-10 text-sm"
          required
        />
      </div>

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs font-light text-black hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        variant="outline"
        className="h-10 w-full rounded-xl border border-black bg-transparent text-sm font-normal text-black shadow-none hover:bg-black/[0.04]"
      >
        {isLoading ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Need an account?{" "}
        <span className="cursor-pointer font-light text-black">
          Contact your administrator.
        </span>
      </p>
    </form>
  );
}
