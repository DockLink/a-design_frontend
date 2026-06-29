"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

import {
  dayOffset,
  formatTimelineDate,
  GANTT_LEFT_COL,
  PX_PER_DAY,
  type TimelineMilestoneItem,
  type TimelineStageGroup,
  type TimelineTaskItem,
} from "@/lib/projects/timeline";

interface ChartBounds {
  chartStart: string;
  chartEnd: string;
  today: string;
}

export function TimelineGantt({
  groups,
  chartBounds,
  collapsedStages,
  onToggleStage,
}: {
  groups: TimelineStageGroup[];
  chartBounds: ChartBounds;
  collapsedStages: Set<string>;
  onToggleStage: (stageId: string) => void;
}) {
  const [tooltip, setTooltip] = useState<{
    item: TimelineMilestoneItem | TimelineTaskItem;
    x: number;
    y: number;
  } | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());

  function toggleMilestone(id: string) {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const chartWidth =
    (dayOffset(chartBounds.chartStart, chartBounds.chartEnd) + 1) * PX_PER_DAY;
  const todayPx = dayOffset(chartBounds.chartStart, chartBounds.today) * PX_PER_DAY;

  const months = useMemo(() => {
    const start = new Date(chartBounds.chartStart + "T00:00:00");
    const end = new Date(chartBounds.chartEnd + "T00:00:00");
    const markers: { label: string; px: number }[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10);
      markers.push({
        label: cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        px: dayOffset(chartBounds.chartStart, iso) * PX_PER_DAY,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return markers;
  }, [chartBounds.chartStart, chartBounds.chartEnd]);

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-[rgba(90,60,30,0.12)] bg-[#FDFAF6] px-6 py-16 text-center text-sm text-[#9C8573]">
        No stages yet. Add stages from the project overview or tasks board, then create milestones to
        build the timeline.
      </div>
    );
  }

  function barLeft(startDate: string) {
    return dayOffset(chartBounds.chartStart, startDate) * PX_PER_DAY;
  }

  function barWidth(startDate: string, endDate: string) {
    return Math.max(
      8,
      (dayOffset(chartBounds.chartStart, endDate) -
        dayOffset(chartBounds.chartStart, startDate)) *
        PX_PER_DAY
    );
  }

  return (
    <>
      <div className="h-[calc(100vh-220px)] overflow-auto rounded-xl border border-[rgba(90,60,30,0.12)] bg-[#FDFAF6]">
        <div
          className="relative"
          style={{ width: GANTT_LEFT_COL + chartWidth, minWidth: GANTT_LEFT_COL + chartWidth }}
        >
          {/* Header */}
          <div className="sticky top-0 z-[5] flex h-9 border-b border-[rgba(90,60,30,0.10)]">
            <div
              className="sticky left-0 z-[6] flex shrink-0 items-center border-r border-[rgba(90,60,30,0.12)] bg-[#F5EFE6] pl-3.5"
              style={{ width: GANTT_LEFT_COL }}
            >
              <span className="text-[11px] font-medium tracking-wide text-[#9C8573]">
                STAGE / MILESTONE / TASK
              </span>
            </div>
            <div className="relative bg-[#F5EFE6]" style={{ width: chartWidth }}>
              {months.map((m) => (
                <div
                  key={m.label + m.px}
                  className="absolute inset-y-0 flex items-center"
                  style={{ left: m.px }}
                >
                  <div className="absolute inset-y-0 left-0 w-px bg-[rgba(90,60,30,0.08)]" />
                  <span className="whitespace-nowrap pl-1.5 text-[11px] text-[#9C8573]">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today line */}
          <div
            className="pointer-events-none absolute bottom-0 z-[4]"
            style={{ top: 36, left: GANTT_LEFT_COL + todayPx }}
          >
            <div className="absolute inset-y-0 left-0 border-l border-dashed border-[#D4A96A]" />
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#D4A96A] px-1.5 py-0.5 text-[10px] text-white">
              Today
            </span>
          </div>

          {/* Stage rows */}
          {groups.map((group, groupIndex) => {
            const collapsed = collapsedStages.has(group.id);
            return (
              <div key={group.id}>
                {/* Stage header row */}
                <div
                  className={`flex h-9 border-b border-[rgba(90,60,30,0.10)] ${groupIndex > 0 ? "border-t border-[rgba(90,60,30,0.10)]" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleStage(group.id)}
                    className="sticky left-0 z-[3] flex shrink-0 cursor-pointer items-center gap-1.5 border-r border-[rgba(90,60,30,0.12)] bg-[#EDE3D4] px-3.5 text-left"
                    style={{ width: GANTT_LEFT_COL }}
                  >
                    <span className="flex-1 truncate text-[13px] font-medium text-[#1A1410]">
                      {group.name}
                    </span>
                    {collapsed ? (
                      <ChevronRight className="size-3.5 shrink-0 text-[#9C8573]" />
                    ) : (
                      <ChevronDown className="size-3.5 shrink-0 text-[#9C8573]" />
                    )}
                  </button>
                  <div className="bg-[#EDE3D4]" style={{ width: chartWidth }} />
                </div>

                {/* Milestones */}
                {!collapsed &&
                  group.milestones.map((ms) => {
                    const msExpanded = expandedMilestones.has(ms.id);
                    const hasTasks = (ms.tasks?.length ?? 0) > 0;
                    const barBg = ms.status === "completed" ? "#EDE3D4" : group.color;

                    return (
                      <div key={ms.id}>
                        {/* Milestone row */}
                        <div className="flex h-[30px] border-b border-[rgba(90,60,30,0.07)]">
                          <button
                            type="button"
                            disabled={!hasTasks}
                            onClick={() => hasTasks && toggleMilestone(ms.id)}
                            className="sticky left-0 z-[3] flex shrink-0 items-center gap-1 border-r border-[rgba(90,60,30,0.12)] bg-[#FDFAF6] px-3.5"
                            style={{ width: GANTT_LEFT_COL }}
                          >
                            {ms.status === "completed" && (
                              <Check className="size-2.5 shrink-0 text-[#2D6A4F]" />
                            )}
                            <span className="flex-1 truncate text-xs text-[#6B5744]">{ms.title}</span>
                            {hasTasks && (
                              msExpanded
                                ? <ChevronDown className="size-3 shrink-0 text-[#C4B5A5]" />
                                : <ChevronRight className="size-3 shrink-0 text-[#C4B5A5]" />
                            )}
                          </button>
                          <div className="relative" style={{ width: chartWidth, height: 30 }}>
                            <div
                              role="presentation"
                              onMouseEnter={(e) =>
                                setTooltip({ item: ms, x: e.clientX, y: e.clientY })
                              }
                              onMouseMove={(e) =>
                                setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
                              }
                              onMouseLeave={() => setTooltip(null)}
                              className="absolute top-1.5 h-[18px] cursor-pointer rounded-full"
                              style={{
                                left: barLeft(ms.startDate),
                                width: barWidth(ms.startDate, ms.endDate),
                                background: barBg,
                                opacity: ms.status === "completed" ? 0.85 : 1,
                                border:
                                  ms.status === "active"
                                    ? `1.5px solid ${group.color}`
                                    : undefined,
                              }}
                            />
                          </div>
                        </div>

                        {/* Task sub-rows */}
                        {msExpanded &&
                          ms.tasks?.map((task) => {
                            const taskBg =
                              task.status === "completed"
                                ? "#C4B5A5"
                                : task.status === "overdue"
                                ? "#DC2626"
                                : task.status === "active"
                                ? group.color
                                : "#D4C4B4";
                            return (
                              <div
                                key={task.id}
                                className="flex h-[26px] border-b border-[rgba(90,60,30,0.05)]"
                              >
                                <div
                                  className="sticky left-0 z-[3] flex shrink-0 items-center gap-1.5 border-r border-[rgba(90,60,30,0.12)] bg-[#FAFAF8] pl-8 pr-3"
                                  style={{ width: GANTT_LEFT_COL }}
                                >
                                  {task.status === "completed" && (
                                    <Check className="size-2 shrink-0 text-[#3D8B5E]" />
                                  )}
                                  <span className="truncate text-[11px] text-[#9C8573]">
                                    {task.title}
                                  </span>
                                </div>
                                <div className="relative" style={{ width: chartWidth, height: 26 }}>
                                  <div
                                    role="presentation"
                                    onMouseEnter={(e) =>
                                      setTooltip({ item: task, x: e.clientX, y: e.clientY })
                                    }
                                    onMouseMove={(e) =>
                                      setTooltip((t) =>
                                        t ? { ...t, x: e.clientX, y: e.clientY } : null
                                      )
                                    }
                                    onMouseLeave={() => setTooltip(null)}
                                    className="absolute top-[5px] h-[14px] rounded-sm cursor-pointer"
                                    style={{
                                      left: barLeft(task.startDate),
                                      width: barWidth(task.startDate, task.endDate),
                                      background: taskBg,
                                      opacity: task.status === "completed" ? 0.7 : 0.85,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] rounded-md bg-[#1A1410] px-2 py-1 text-[11px] leading-snug whitespace-nowrap text-white"
          style={{ left: tooltip.x + 12, top: tooltip.y - 44 }}
        >
          <div className="font-medium">{tooltip.item.title}</div>
          <div className="opacity-75">
            {formatTimelineDate(tooltip.item.startDate)} –{" "}
            {formatTimelineDate(tooltip.item.endDate)}
          </div>
        </div>
      )}
    </>
  );
}
