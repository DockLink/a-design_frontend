"use client";

import { BRAND_WORDMARK } from "@/lib/constants";

export function HandwritingText() {
  return (
    <div className="relative w-fit">
      <div className="font-sans text-[72px] leading-[1.05] font-light tracking-[0.02em] text-[var(--ds-label)]">
        {BRAND_WORDMARK}
      </div>

      <p className="mt-5 font-sans text-[17px] font-light tracking-wide text-[#6C6C70]">
        Project Management Platform
      </p>
    </div>
  );
}
