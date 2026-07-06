"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-lg">{children}</div>
    </div>
  );
}

function DialogContent({ className, children }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

function DialogHeader({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("shrink-0 border-b border-border px-5 py-4", className)}>{children}</div>;
}

function DialogTitle({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("text-base font-light text-foreground", className)}>{children}</div>;
}

function DialogBody({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-y-auto px-5 py-4", className)}>{children}</div>;
}

function DialogFooter({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4", className)}>{children}</div>;
}

function DialogCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={onClick} className="absolute top-3 right-3">
      <X className="size-4" />
    </Button>
  );
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseButton };
