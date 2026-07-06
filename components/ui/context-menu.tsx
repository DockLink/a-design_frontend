"use client";

import * as React from "react";
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu";
import { cn } from "@/lib/utils";

function ContextMenu({ children }: { children: React.ReactNode }) {
  return (
    <ContextMenuPrimitive.Root>
      {children}
    </ContextMenuPrimitive.Root>
  );
}

function ContextMenuTrigger({
  children,
  className,
  asChild,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger> & { asChild?: boolean }) {
  // Base UI uses a `render` prop rather than Radix-style `asChild`. When
  // `asChild` is requested with a single element child, render that element as
  // the trigger so the menu's props/handlers merge onto it.
  if (asChild && React.isValidElement(children)) {
    return (
      <ContextMenuPrimitive.Trigger
        className={cn("select-none", className)}
        render={children as React.ReactElement}
        {...props}
      />
    );
  }

  return (
    <ContextMenuPrimitive.Trigger
      className={cn("select-none", className)}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Trigger>
  );
}

function ContextMenuContent({ children, className, ...props }: React.ComponentProps<typeof ContextMenuPrimitive.Popup>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner sideOffset={4}>
        <ContextMenuPrimitive.Popup
          className={cn(
            "z-50 min-w-[160px] overflow-hidden rounded-xl border border-[rgba(90,60,30,0.12)] bg-[#FDFAF6] p-1 shadow-xl outline-none",
            "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
            "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
            "transition-[opacity,transform] duration-100",
            className
          )}
          {...props}
        >
          {children}
        </ContextMenuPrimitive.Popup>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  );
}

function ContextMenuItem({
  children,
  className,
  danger,
  disabled,
  onSelect,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  danger?: boolean;
  onSelect?: () => void;
}) {
  return (
    <ContextMenuPrimitive.Item
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] outline-none transition-colors",
        "data-[highlighted]:bg-[#F5E6D0]",
        danger
          ? "text-red-700 data-[highlighted]:text-red-800"
          : "text-[#1A1410]",
        disabled && "pointer-events-none opacity-40",
        className
      )}
      disabled={disabled}
      onClick={onSelect}
      {...props}
    >
      {children}
    </ContextMenuPrimitive.Item>
  );
}

function ContextMenuSeparator({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      className={cn("my-1 h-px bg-[rgba(90,60,30,0.10)]", className)}
    />
  );
}

function ContextMenuLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-2.5 py-1 text-[11px] font-light uppercase tracking-wide text-[#9C8573]", className)}>
      {children}
    </div>
  );
}

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
};
