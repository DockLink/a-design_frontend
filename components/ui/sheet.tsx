"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Sheet({
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
    <div className="fixed inset-0 z-[200]">
      <button
        type="button"
        aria-label="Close sheet"
        className="absolute inset-0 bg-black/30"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

function SheetContent({
  className,
  children,
  side = "right",
}: {
  className?: string;
  children: React.ReactNode;
  side?: "right" | "left";
}) {
  return (
    <aside
      className={cn(
        "fixed top-[52px] flex h-[calc(100vh-52px)] w-full max-w-md flex-col border-border bg-[#FDFAF6] shadow-2xl",
        side === "right" ? "right-0 border-l" : "left-0 border-r",
        className
      )}
    >
      {children}
    </aside>
  );
}

function SheetHeader({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("border-b border-border px-5 py-4", className)}>{children}</div>;
}

function SheetTitle({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("pr-8 text-base font-medium text-foreground", className)}>{children}</div>;
}

function SheetBody({ className, children }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-y-auto px-5 py-4", className)}>{children}</div>;
}

function SheetCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={onClick} className="absolute top-3 right-3">
      <X className="size-4" />
    </Button>
  );
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetCloseButton };
