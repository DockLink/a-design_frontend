import { AlertCircle, Check } from "lucide-react";

import type { TimelineItemStatus } from "@/lib/projects/timeline";

export function TimelineStatusIcon({ status }: { status: TimelineItemStatus }) {
  if (status === "completed") return <Check className="size-4 shrink-0 text-[#2D6A4F]" />;
  if (status === "overdue") return <AlertCircle className="size-4 shrink-0 text-[#9B1C1C]" />;
  if (status === "active") {
    return (
      <div className="flex size-4 shrink-0 items-center justify-center rounded-full bg-[#D4A96A]">
        <div className="size-1.5 rounded-full bg-white" />
      </div>
    );
  }
  return <div className="size-4 shrink-0 rounded-full border-2 border-[rgba(90,60,30,0.22)]" />;
}
