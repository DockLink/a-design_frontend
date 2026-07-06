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
import { resolveHomeRoute } from "@/lib/navigation/home-route";

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
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
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
          className="h-11"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
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
          required
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm font-medium text-[var(--ds-accent)] hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="h-12 w-full rounded-xl bg-[var(--ds-accent)] text-base font-semibold text-white shadow-[0_4px_16px_rgba(212,169,106,0.4)] hover:bg-[#C4956A]"
      >
        {isLoading ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <span className="cursor-pointer font-medium text-[var(--ds-accent)]">
          Contact your administrator.
        </span>
      </p>
    </form>
  );
}
