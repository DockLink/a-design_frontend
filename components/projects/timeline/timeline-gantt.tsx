"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const HEADER_H = 36;
const MIN_STAGE_H = 48;
const MIN_MS_H = 40;
const MIN_TASK_H = 34;

// Relative weights used to distribute available height across row types so
// stages read larger than milestones, which read larger than tasks.
const W_STAGE = 1;
const W_MS = 0.82;
const W_TASK = 0.68;

function countRowsByType(
  groups: TimelineStageGroup[],
  collapsedStages: Set<string>,
  expandedMilestones: Set<string>
): { stages: number; milestones: number; tasks: number } {
  let stages = 0;
  let milestones = 0;
  let tasks = 0;
  for (const group of groups) {
    stages += 1;
    if (collapsedStages.has(group.id)) continue;
    for (const ms of group.milestones) {
      milestones += 1;
      if (expandedMilestones.has(ms.id)) {
        tasks += ms.tasks?.length ?? 0;
      }
    }
    tasks += group.orphanTasks?.length ?? 0;
  }
  return { stages, milestones, tasks };
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

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function toggleMilestone(id: string) {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalDays = dayOffset(chartBounds.chartStart, chartBounds.chartEnd) + 1;

  const pxPerDay = useMemo(() => {
    const available = containerSize.width - GANTT_LEFT_COL;
    if (available <= 0 || totalDays <= 0) return PX_PER_DAY;
    return Math.max(PX_PER_DAY, available / totalDays);
  }, [containerSize.width, totalDays]);

  const chartWidth = totalDays * pxPerDay;
  const todayPx = dayOffset(chartBounds.chartStart, chartBounds.today) * pxPerDay;

  const rowsByType = useMemo(
    () => countRowsByType(groups, collapsedStages, expandedMilestones),
    [groups, collapsedStages, expandedMilestones]
  );

  // Distribute the FULL available body height across visible rows (weighted by
  // type) so the chart always fills the viewport with no empty space below —
  // Jira/ClickUp style. When the content is taller than the viewport we fall
  // back to per-type minimums and let the area scroll.
  const { stageH, msH, taskH } = useMemo(() => {
    const bodyHeight = Math.max(0, containerSize.height - HEADER_H);
    const { stages, milestones, tasks } = rowsByType;
    const totalRows = stages + milestones + tasks;
    if (bodyHeight <= 0 || totalRows === 0) {
      return { stageH: MIN_STAGE_H, msH: MIN_MS_H, taskH: MIN_TASK_H };
    }

    // Natural (minimum) total height of all rows.
    const naturalMin =
      stages * MIN_STAGE_H + milestones * MIN_MS_H + tasks * MIN_TASK_H;
    if (naturalMin >= bodyHeight) {
      return { stageH: MIN_STAGE_H, msH: MIN_MS_H, taskH: MIN_TASK_H };
    }

    // Solve unit * (Σ weights) = bodyHeight, then heights = unit * weight.
    const totalWeight = stages * W_STAGE + milestones * W_MS + tasks * W_TASK;
    const unit = bodyHeight / totalWeight;
    return {
      stageH: Math.max(MIN_STAGE_H, unit * W_STAGE),
      msH: Math.max(MIN_MS_H, unit * W_MS),
      taskH: Math.max(MIN_TASK_H, unit * W_TASK),
    };
  }, [containerSize.height, rowsByType]);

  const contentHeight =
    rowsByType.stages * stageH +
    rowsByType.milestones * msH +
    rowsByType.tasks * taskH;

  const bodyMinHeight = Math.max(containerSize.height - HEADER_H, contentHeight);

  const months = useMemo(() => {
    const start = new Date(chartBounds.chartStart + "T00:00:00");
    const end = new Date(chartBounds.chartEnd + "T00:00:00");
    const markers: { label: string; px: number }[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const iso = cursor.toISOString().slice(0, 10);
      markers.push({
        label: cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        px: dayOffset(chartBounds.chartStart, iso) * pxPerDay,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return markers;
  }, [chartBounds.chartStart, chartBounds.chartEnd, pxPerDay]);

  if (groups.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-[var(--ds-separator)] bg-[var(--ds-surface-elevated)] px-6 text-center text-sm text-[var(--ds-secondary-label)]">
        No stages yet. Add stages from the project overview or tasks board, then create milestones to
        build the timeline.
      </div>
    );
  }

  function barLeft(startDate: string) {
    return dayOffset(chartBounds.chartStart, startDate) * pxPerDay;
  }

  function barWidth(startDate: string, endDate: string) {
    return Math.max(
      12,
      (dayOffset(chartBounds.chartStart, endDate) -
        dayOffset(chartBounds.chartStart, startDate)) *
        pxPerDay
    );
  }

  function renderTaskRow(task: TimelineTaskItem, color: string) {
    const taskBg =
      task.status === "completed"
        ? "#C4B5A5"
        : task.status === "overdue"
          ? "#DC2626"
          : task.status === "active"
            ? color
            : "#D4C4B4";
    const barH = Math.min(22, Math.max(14, taskH * 0.42));
    return (
      <div
        key={task.id}
        className="flex border-b border-[rgba(90,60,30,0.05)]"
        style={{ height: taskH }}
      >
        <div
          className="sticky left-0 z-[3] flex shrink-0 items-center gap-2 border-r border-[var(--ds-separator)] bg-[#FAFAF8] pl-9 pr-3"
          style={{ width: GANTT_LEFT_COL }}
        >
          {task.status === "completed" && <Check className="size-3 shrink-0 text-[#3D8B5E]" />}
          <span className="truncate text-[12px] text-[var(--ds-secondary-label)]">{task.title}</span>
        </div>
        <div className="relative flex-1" style={{ width: chartWidth, height: taskH }}>
          <div
            role="presentation"
            onMouseEnter={(e) => setTooltip({ item: task, x: e.clientX, y: e.clientY })}
            onMouseMove={(e) => setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))}
            onMouseLeave={() => setTooltip(null)}
            className="absolute cursor-pointer rounded-md"
            style={{
              top: (taskH - barH) / 2,
              height: barH,
              left: barLeft(task.startDate),
              width: barWidth(task.startDate, task.endDate),
              background: taskBg,
              opacity: task.status === "completed" ? 0.7 : 0.92,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="h-[calc(100vh-180px)] min-h-[420px] overflow-auto rounded-xl border border-[var(--ds-separator)] bg-[var(--ds-surface-elevated)]"
      >
        <div
          className="relative"
          style={{
            width: GANTT_LEFT_COL + chartWidth,
            minWidth: GANTT_LEFT_COL + chartWidth,
            minHeight: HEADER_H + bodyMinHeight,
          }}
        >
          <div
            className="pointer-events-none absolute top-0 bottom-0 z-[1] border-r border-[var(--ds-separator)]"
            style={{ left: GANTT_LEFT_COL - 1, width: 0 }}
          />

          <div
            className="pointer-events-none absolute bottom-0 z-[1]"
            style={{ top: HEADER_H, left: GANTT_LEFT_COL, width: chartWidth, height: bodyMinHeight }}
          >
            {months.map((m) => (
              <div
                key={"grid" + m.label + m.px}
                className="absolute inset-y-0 w-px bg-[rgba(90,60,30,0.06)]"
                style={{ left: m.px }}
              />
            ))}
          </div>

          {/* Header */}
          <div
            className="sticky top-0 z-[5] flex border-b border-[rgba(90,60,30,0.10)]"
            style={{ height: HEADER_H }}
          >
            <div
              className="sticky left-0 z-[6] flex shrink-0 items-center border-r border-[var(--ds-separator)] bg-[var(--ds-bg)] pl-3.5"
              style={{ width: GANTT_LEFT_COL }}
            >
              <span className="text-[11px] font-medium tracking-wide text-[var(--ds-secondary-label)]">
                STAGE / MILESTONE / TASK
              </span>
            </div>
            <div className="relative flex-1 bg-[var(--ds-bg)]" style={{ width: chartWidth }}>
              {months.map((m) => (
                <div
                  key={m.label + m.px}
                  className="absolute inset-y-0 flex items-center"
                  style={{ left: m.px }}
                >
                  <div className="absolute inset-y-0 left-0 w-px bg-[rgba(90,60,30,0.08)]" />
                  <span className="whitespace-nowrap pl-1.5 text-[11px] text-[var(--ds-secondary-label)]">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Today line */}
          <div
            className="pointer-events-none absolute bottom-0 z-[4]"
            style={{ top: HEADER_H, left: GANTT_LEFT_COL + todayPx, height: bodyMinHeight }}
          >
            <div className="absolute inset-y-0 left-0 border-l border-dashed border-[var(--ds-accent)]" />
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--ds-accent)] px-1.5 py-0.5 text-[10px] text-white">
              Today
            </span>
          </div>

          {/* Stage rows */}
          {groups.map((group, groupIndex) => {
            const collapsed = collapsedStages.has(group.id);
            const stageLeft = barLeft(group.startDate);
            const stageW = barWidth(group.startDate, group.endDate);
            const rollupH = Math.min(26, Math.max(8, stageH * 0.22));
            return (
              <div key={group.id}>
                <div
                  className={`flex border-b border-[rgba(90,60,30,0.10)] ${groupIndex > 0 ? "border-t border-[rgba(90,60,30,0.10)]" : ""}`}
                  style={{ height: stageH }}
                >
                  <button
                    type="button"
                    onClick={() => onToggleStage(group.id)}
                    className="sticky left-0 z-[3] flex shrink-0 cursor-pointer items-center gap-2 border-r border-[var(--ds-separator)] bg-[#EDE3D4] px-3.5 text-left"
                    style={{ width: GANTT_LEFT_COL }}
                  >
                    {collapsed ? (
                      <ChevronRight className="size-4 shrink-0 text-[var(--ds-secondary-label)]" />
                    ) : (
                      <ChevronDown className="size-4 shrink-0 text-[var(--ds-secondary-label)]" />
                    )}
                    <span className="flex-1 truncate text-[14px] font-semibold text-[var(--ds-label)]">
                      {group.name}
                    </span>
                  </button>
                  <div
                    className="relative bg-[#EDE3D4]"
                    style={{ width: chartWidth, height: stageH }}
                  >
                    <div
                      role="presentation"
                      onMouseEnter={(e) =>
                        setTooltip({
                          item: {
                            id: group.id,
                            title: group.name,
                            startDate: group.startDate,
                            endDate: group.endDate,
                            status: group.isActive ? "active" : "upcoming",
                            apiStatus: "ACTIVE",
                          },
                          x: e.clientX,
                          y: e.clientY,
                        })
                      }
                      onMouseMove={(e) =>
                        setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
                      }
                      onMouseLeave={() => setTooltip(null)}
                      className="absolute cursor-pointer rounded-sm"
                      style={{
                        top: (stageH - rollupH) / 2,
                        height: rollupH,
                        left: stageLeft,
                        width: stageW,
                        background: group.color,
                      }}
                    />
                    <div
                      className="absolute w-[4px]"
                      style={{
                        top: (stageH - rollupH) / 2 - 2,
                        height: rollupH + 4,
                        left: stageLeft,
                        background: group.color,
                      }}
                    />
                    <div
                      className="absolute w-[4px]"
                      style={{
                        top: (stageH - rollupH) / 2 - 2,
                        height: rollupH + 4,
                        left: stageLeft + stageW - 4,
                        background: group.color,
                      }}
                    />
                  </div>
                </div>

                {!collapsed && (
                  <>
                    {group.milestones.map((ms) => {
                      const msExpanded = expandedMilestones.has(ms.id);
                      const hasTasks = (ms.tasks?.length ?? 0) > 0;
                      const barBg = ms.status === "completed" ? "#EDE3D4" : group.color;
                      const msBarH = Math.min(28, Math.max(16, msH * 0.48));

                      return (
                        <div key={ms.id}>
                          <div
                            className="flex border-b border-[rgba(90,60,30,0.07)]"
                            style={{ height: msH }}
                          >
                            <button
                              type="button"
                              disabled={!hasTasks}
                              onClick={() => hasTasks && toggleMilestone(ms.id)}
                              className="sticky left-0 z-[3] flex shrink-0 items-center gap-1.5 border-r border-[var(--ds-separator)] bg-[var(--ds-surface-elevated)] pl-7 pr-3"
                              style={{ width: GANTT_LEFT_COL }}
                            >
                              {hasTasks ? (
                                msExpanded ? (
                                  <ChevronDown className="size-3.5 shrink-0 text-[#C4B5A5]" />
                                ) : (
                                  <ChevronRight className="size-3.5 shrink-0 text-[#C4B5A5]" />
                                )
                              ) : (
                                <span className="size-3.5 shrink-0" />
                              )}
                              {ms.status === "completed" && (
                                <Check className="size-3 shrink-0 text-[#2D6A4F]" />
                              )}
                              <span className="flex-1 truncate text-[13px] text-[var(--ds-secondary-label)]">{ms.title}</span>
                            </button>
                            <div className="relative flex-1" style={{ width: chartWidth, height: msH }}>
                              <div
                                role="presentation"
                                onMouseEnter={(e) =>
                                  setTooltip({ item: ms, x: e.clientX, y: e.clientY })
                                }
                                onMouseMove={(e) =>
                                  setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))
                                }
                                onMouseLeave={() => setTooltip(null)}
                                className="absolute cursor-pointer rounded-full"
                                style={{
                                  top: (msH - msBarH) / 2,
                                  height: msBarH,
                                  left: barLeft(ms.startDate),
                                  width: barWidth(ms.startDate, ms.endDate),
                                  background: barBg,
                                  opacity: ms.status === "completed" ? 0.85 : 1,
                                  border:
                                    ms.status === "active"
                                      ? `2px solid ${group.color}`
                                      : undefined,
                                }}
                              />
                            </div>
                          </div>

                          {msExpanded && ms.tasks?.map((task) => renderTaskRow(task, group.color))}
                        </div>
                      );
                    })}

                    {group.orphanTasks?.map((task) => renderTaskRow(task, group.color))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] rounded-md bg-[var(--ds-label)] px-2 py-1 text-[11px] leading-snug whitespace-nowrap text-white"
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
