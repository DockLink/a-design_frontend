"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/types/api";
import { apiClient } from "@/lib/api/client";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await apiClient("/v1/auth/password-reset-request", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      
      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          typeof err.body.message === "string"
            ? err.body.message
            : "An error occurred. Please try again."
        );
      } else {
        setError("Unable to process request. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="w-full space-y-4">
        <p className="text-sm font-light text-black">
          If an account exists for that email, we have sent instructions to reset your password.
        </p>
        <Button
          onClick={() => router.push("/login")}
          variant="outline"
          className="h-10 w-full rounded-xl border border-black bg-transparent text-sm font-normal text-black shadow-none hover:bg-black/[0.04]"
        >
          Return to login
        </Button>
      </div>
    );
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

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading || !email}
        variant="outline"
        className="h-10 w-full rounded-xl border border-black bg-transparent text-sm font-normal text-black shadow-none hover:bg-black/[0.04]"
      >
        {isLoading ? "Sending..." : "Send reset link"}
      </Button>

      <div className="text-center">
        <Link href="/login" className="text-xs font-light text-black hover:underline">
          Return to sign in
        </Link>
      </div>
    </form>
  );
}
