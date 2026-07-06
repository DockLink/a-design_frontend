"use client";

import { BRAND_WORDMARK } from "@/lib/constants";

/**
 * Wordmark width is set by "ADS + MAD" (A→D). Children use the same column width
 * via inline-grid + min-w-full so the sign-in form aligns with the wordmark.
 */
export function HandwritingText({ children }: { children?: React.ReactNode }) {
  return (
    <div className="inline-grid max-w-full">
      <div className="col-start-1 row-start-1 font-sans text-[72px] leading-[1.05] font-light tracking-[0.02em] text-[var(--ds-label)] whitespace-nowrap">
        {BRAND_WORDMARK}
      </div>

      <p className="col-start-1 row-start-2 mt-5 w-0 min-w-full font-sans text-[17px] font-light tracking-wide text-[#6C6C70]">
        Project Management Platform
      </p>

      {children ? (
        <div className="col-start-1 row-start-3 mt-10 w-0 min-w-full">
          {children}
        </div>
      ) : null}
    </div>
  );
}
