"use client";

import type { ReactNode } from "react";

export function ConfirmDeleteDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  isDeleting = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div
        onClick={isDeleting ? undefined : onCancel}
        className="fixed inset-0 z-[220] bg-black/35"
      />
      <div className="fixed left-1/2 top-1/2 z-[221] w-[min(420px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[var(--ds-surface-elevated)] p-7 shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
        <div className="mb-2 text-[16px] font-semibold text-[var(--ds-destructive)]">{title}</div>
        <p className="mb-5 text-[14px] leading-relaxed text-[var(--ds-secondary-label)]">{description}</p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-10 flex-1 rounded-[10px] border-none bg-[var(--ds-destructive)] text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isDeleting ? "Deleting…" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-10 flex-1 rounded-[10px] border border-[rgba(90,60,30,0.15)] bg-white text-[14px] font-medium text-[var(--ds-secondary-label)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
