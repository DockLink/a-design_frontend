"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({
  label,
  className,
  size = 28,
}: {
  label?: string;
  className?: string;
  size?: number;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-[var(--ds-secondary-label)]",
        className
      )}
    >
      <Loader2
        size={size}
        className="animate-spin text-[var(--ds-accent)]"
        aria-hidden
      />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
