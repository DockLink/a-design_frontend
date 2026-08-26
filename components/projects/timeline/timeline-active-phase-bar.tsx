"use client";

import {
  stageDurationWeeks,
  stageProgressPercent,
  type TimelineStageGroup,
} from "@/lib/projects/timeline";

export function TimelineActivePhaseBar({ stage }: { stage: TimelineStageGroup }) {
  const weeks = stageDurationWeeks(stage);
  const progress = stageProgressPercent(stage);

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[90] -translate-x-1/2">
      <div className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full bg-[var(--ds-label)] px-4 py-2.5 text-[13px] text-white shadow-[0_8px_28px_rgba(60,40,20,0.28)]">
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: stage.color }}
          aria-hidden
        />
        <span className="font-medium">{stage.name}</span>
        <span className="opacity-50">·</span>
        <span className="opacity-80">{weeks}w</span>
        <span className="opacity-50">·</span>
        <span className="opacity-80">{progress}% complete</span>
      </div>
    </div>
  );
}
