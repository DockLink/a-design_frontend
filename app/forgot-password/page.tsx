"use client";

import Image from "next/image";
import { HandwritingText } from "@/components/auth/handwriting-text";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { APP_NAME } from "@/lib/constants";

const LOGIN_BG = "#F9F5F1";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen w-full" style={{ background: LOGIN_BG }}>
      <div
        className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/3 lg:pl-10 lg:pr-24 lg:py-16"
        style={{ background: LOGIN_BG }}
      >
        <HandwritingText>
          <div className="mb-6">
            <h1 className="text-[22px] font-light tracking-tight text-[var(--ds-label)]">
              Reset password
            </h1>
            <p className="mt-1 text-[13px] font-light text-muted-foreground">
              Enter your {APP_NAME} account email to receive a reset link
            </p>
          </div>
          <ForgotPasswordForm />
        </HandwritingText>
      </div>

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
