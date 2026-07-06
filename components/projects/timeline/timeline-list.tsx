"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  daysRemainingLabel,
  formatTimelineDate,
  type TimelineMilestoneItem,
  type TimelineStageGroup,
} from "@/lib/projects/timeline";

import { TimelineStatusIcon } from "./timeline-status-icon";

export function TimelineList({
  groups,
  canManage,
  onAddClick,
}: {
  groups: TimelineStageGroup[];
  canManage: boolean;
  onAddClick: () => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const items = useMemo(() => {
    const flat: (TimelineMilestoneItem & { stageColor: string })[] = [];
    for (const g of groups) {
      for (const m of g.milestones) {
        flat.push({ ...m, stageColor: g.color });
      }
    }
    return flat.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [groups]);

  if (items.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--ds-separator)] bg-[var(--ds-surface-elevated)]">
        <div className="px-6 py-16 text-center text-sm text-[var(--ds-secondary-label)]">
          No milestones yet.
          {canManage && (
            <>
              {" "}
              <button
                type="button"
                onClick={onAddClick}
                className="font-medium text-[var(--ds-accent)] underline-offset-2 hover:underline"
              >
                Add a milestone
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--ds-separator)] bg-[var(--ds-surface-elevated)]">
      <div className="grid h-10 grid-cols-[44px_1fr_140px_120px_100px] items-center border-b border-[rgba(90,60,30,0.10)] bg-[var(--ds-bg)] px-4 text-xs text-[var(--ds-secondary-label)]">
        <span />
        <span>Title</span>
        <span>Stage</span>
        <span>Target date</span>
        <span>Days left</span>
      </div>

      {items.map((ms) => {
        const rem = daysRemainingLabel(ms.endDate, ms.status);
        const hovered = hoveredId === ms.id;
        return (
          <div
            key={ms.id}
            onMouseEnter={() => setHoveredId(ms.id)}
            onMouseLeave={() => setHoveredId(null)}
            className={`grid h-11 grid-cols-[44px_1fr_140px_120px_100px] items-center border-b border-[rgba(90,60,30,0.07)] px-4 transition-colors ${hovered ? "bg-[var(--ds-bg)]" : ""}`}
          >
            <div className="flex items-center">
              <TimelineStatusIcon status={ms.status} />
            </div>
            <span className="truncate text-sm font-medium text-[var(--ds-label)]">{ms.title}</span>
            <Badge
              variant="secondary"
              className="w-fit border-0 text-[11px] font-medium"
              style={{ background: `${ms.stageColor}22`, color: ms.stageColor }}
            >
              {ms.stageName}
            </Badge>
            <span className="text-[13px] text-[var(--ds-secondary-label)]">{formatTimelineDate(ms.endDate)}</span>
            <span className="text-[13px] font-medium" style={{ color: rem.color }}>
              {rem.text}
            </span>
          </div>
        );
      })}

      {canManage && (
        <button
          type="button"
          onClick={onAddClick}
          className="flex h-11 w-full cursor-pointer items-center gap-2 border-t border-dashed border-[rgba(90,60,30,0.18)] px-4 text-[13px] text-[var(--ds-accent)]"
        >
          <Plus className="size-3.5" />
          Add milestone
        </button>
      )}
    </div>
  );
}
