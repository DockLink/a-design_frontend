import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-light transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary",
        secondary: "bg-muted text-muted-foreground",
        outline: "border-border text-foreground",
        success: "bg-emerald-500/12 text-emerald-700",
        warning: "bg-amber-500/12 text-amber-700",
        danger: "bg-red-500/12 text-red-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
