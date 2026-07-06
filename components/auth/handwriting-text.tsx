"use client";

import { BRAND_WORDMARK } from "@/lib/constants";

/**
 * Wordmark width is set by "ADS + MAD" (A→D). The flex column stretches
 * children to that exact width so the sign-in form aligns with the wordmark.
 */
export function HandwritingText({ children }: { children?: React.ReactNode }) {
  return (
    <div className="inline-flex w-fit max-w-full flex-col items-stretch">
      <div className="text-[68px] leading-[1.05] font-light tracking-[0.02em] text-[var(--ds-label)] whitespace-nowrap">
        {BRAND_WORDMARK}
      </div>

      <p className="mt-3.5 text-[14px] font-light tracking-wide text-[#6C6C70]">
        Project Management Platform
      </p>

      {children ? <div className="mt-8 w-full">{children}</div> : null}
    </div>
  );
}
