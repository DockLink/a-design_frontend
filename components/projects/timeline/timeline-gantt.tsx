"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import {
  dayOffset,
  deriveStageDisplayStatus,
  formatTimelineDate,
  GANTT_LEFT_COL,
  PX_PER_DAY,
  stageChildCount,
  stageStatusLabel,
  type TimelineMilestoneItem,
  type TimelineStageGroup,
  type TimelineTaskItem,
} from "@/lib/projects/timeline";

interface ChartBounds {
  chartStart: string;
  chartEnd: string;
  today: string;
}

const HEADER_H = 40;
const MIN_STAGE_H = 56;
const MIN_MS_H = 42;
const MIN_TASK_H = 36;

const W_STAGE = 1;
const W_MS = 0.82;
const W_TASK = 0.68;

const ROW_BORDER = "rgba(90,60,30,0.06)";
const STAGE_BORDER = "rgba(90,60,30,0.08)";
const GRID_LINE = "rgba(90,60,30,0.05)";

function statusDotColor(status: string, fallback: string): string {
  if (status === "completed") return "#5A8A7A";
  if (status === "overdue") return "#B87A6A";
  if (status === "active") return fallback;
  return "#C4B5A5";
}

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

  const { stageH, msH, taskH } = useMemo(() => {
    const bodyHeight = Math.max(0, containerSize.height - HEADER_H);
    const { stages, milestones, tasks } = rowsByType;
    const totalRows = stages + milestones + tasks;
    if (bodyHeight <= 0 || totalRows === 0) {
      return { stageH: MIN_STAGE_H, msH: MIN_MS_H, taskH: MIN_TASK_H };
    }

    const naturalMin =
      stages * MIN_STAGE_H + milestones * MIN_MS_H + tasks * MIN_TASK_H;
    if (naturalMin >= bodyHeight) {
      return { stageH: MIN_STAGE_H, msH: MIN_MS_H, taskH: MIN_TASK_H };
    }

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
        label: cursor.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        px: dayOffset(chartBounds.chartStart, iso) * pxPerDay,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return markers;
  }, [chartBounds.chartStart, chartBounds.chartEnd, pxPerDay]);

  if (groups.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-[rgba(90,60,30,0.08)] bg-[var(--ds-surface-elevated)] px-6 text-center text-sm text-[var(--ds-secondary-label)] shadow-[0_1px_3px_rgba(60,40,20,0.06)]">
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
      16,
      (dayOffset(chartBounds.chartStart, endDate) -
        dayOffset(chartBounds.chartStart, startDate)) *
        pxPerDay
    );
  }

  function renderTaskRow(task: TimelineTaskItem, color: string, indexLabel?: string) {
    const taskBg =
      task.status === "completed"
        ? "#C4B5A5"
        : task.status === "overdue"
          ? "#B87A6A"
          : task.status === "active"
            ? color
            : "#D4C4B4";
    const barH = Math.min(22, Math.max(14, taskH * 0.48));
    const left = barLeft(task.startDate);
    const width = barWidth(task.startDate, task.endDate);
    const showLabel = width >= 56;

    return (
      <div
        key={task.id}
        className="flex"
        style={{ height: taskH, borderBottom: `1px solid ${ROW_BORDER}` }}
      >
        <div
          className="sticky left-0 z-[3] flex shrink-0 items-center gap-2 border-r border-[rgba(90,60,30,0.08)] bg-[var(--ds-surface-elevated)] pl-10 pr-3"
          style={{ width: GANTT_LEFT_COL }}
        >
          <span className="truncate text-[12px] text-[var(--ds-tertiary-label,#9C8573)]">
            {indexLabel ? `${indexLabel} ` : ""}
            {task.title}
          </span>
        </div>
        <div className="relative flex-1" style={{ width: chartWidth, height: taskH }}>
          <div
            role="presentation"
            onMouseEnter={(e) => setTooltip({ item: task, x: e.clientX, y: e.clientY })}
            onMouseMove={(e) => setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null))}
            onMouseLeave={() => setTooltip(null)}
            className="absolute flex cursor-pointer items-center justify-center overflow-hidden rounded-full px-2"
            style={{
              top: (taskH - barH) / 2,
              height: barH,
              left,
              width,
              background: taskBg,
              opacity: task.status === "completed" ? 0.75 : 0.95,
            }}
          >
            {showLabel && (
              <span className="truncate text-[10px] font-medium text-white/95">{task.title}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="h-[calc(100vh-320px)] min-h-[420px] overflow-auto rounded-2xl border border-[rgba(90,60,30,0.08)] bg-[var(--ds-surface-elevated)] shadow-[0_1px_3px_rgba(60,40,20,0.06)]"
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
            className="pointer-events-none absolute top-0 bottom-0 z-[1] border-r border-[rgba(90,60,30,0.08)]"
            style={{ left: GANTT_LEFT_COL - 1, width: 0 }}
          />

          <div
            className="pointer-events-none absolute bottom-0 z-[1]"
            style={{ top: HEADER_H, left: GANTT_LEFT_COL, width: chartWidth, height: bodyMinHeight }}
          >
            {months.map((m) => (
              <div
                key={"grid" + m.label + m.px}
                className="absolute inset-y-0 w-px"
                style={{ left: m.px, background: GRID_LINE }}
              />
            ))}
          </div>

          {/* Header */}
          <div
            className="sticky top-0 z-[5] flex border-b border-[rgba(90,60,30,0.08)]"
            style={{ height: HEADER_H }}
          >
            <div
              className="sticky left-0 z-[6] flex shrink-0 items-center border-r border-[rgba(90,60,30,0.08)] bg-[var(--ds-bg)] pl-4"
              style={{ width: GANTT_LEFT_COL }}
            >
              <span className="text-[11px] font-medium tracking-wide text-[var(--ds-secondary-label)]">
                PHASE / MILESTONE
              </span>
            </div>
            <div className="relative flex-1 bg-[var(--ds-bg)]" style={{ width: chartWidth }}>
              {months.map((m) => (
                <div
                  key={m.label + m.px}
                  className="absolute inset-y-0 flex items-center"
                  style={{ left: m.px }}
                >
                  <div
                    className="absolute inset-y-0 left-0 w-px"
                    style={{ background: GRID_LINE }}
                  />
                  <span className="whitespace-nowrap pl-2 text-[11px] font-medium text-[var(--ds-secondary-label)]">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today line */}
          <div
            className="pointer-events-none absolute bottom-0 z-[4]"
            style={{ top: HEADER_H, left: GANTT_LEFT_COL + todayPx, height: bodyMinHeight }}
          >
            <div className="absolute inset-y-0 left-0 w-[2px] bg-[var(--ds-accent)] opacity-80" />
            <span className="absolute -top-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--ds-accent)] px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-white shadow-sm">
              Today
            </span>
          </div>

          {/* Stage rows */}
          {groups.map((group, groupIndex) => {
            const collapsed = collapsedStages.has(group.id);
            const stageLeft = barLeft(group.startDate);
            const stageW = barWidth(group.startDate, group.endDate);
            const stageBarH = Math.min(28, Math.max(18, stageH * 0.42));
            const displayStatus = deriveStageDisplayStatus(group);
            const statusLabel = stageStatusLabel(group);
            const childCount = stageChildCount(group);
            const showStageLabel = stageW >= 72;
            const dotColor = statusDotColor(displayStatus, group.color);

            return (
              <div key={group.id}>
                <div
                  className="flex"
                  style={{
                    height: stageH,
                    borderBottom: `1px solid ${STAGE_BORDER}`,
                    borderTop: groupIndex > 0 ? `1px solid ${STAGE_BORDER}` : undefined,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onToggleStage(group.id)}
                    className="sticky left-0 z-[3] flex shrink-0 cursor-pointer items-center gap-2.5 border-r border-[rgba(90,60,30,0.08)] bg-[var(--ds-surface-elevated)] px-3.5 text-left hover:bg-[var(--ds-bg)]"
                    style={{ width: GANTT_LEFT_COL }}
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: dotColor }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-[var(--ds-label)]">
                        {group.name}
                      </div>
                      <div className="truncate text-[11px] text-[var(--ds-secondary-label)]">
                        {statusLabel}
                      </div>
                    </div>
                    {childCount > 0 && (
                      <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--ds-bg)] px-1.5 text-[10px] font-medium text-[var(--ds-secondary-label)]">
                        {childCount}
                      </span>
                    )}
                    {collapsed ? (
                      <ChevronRight className="size-4 shrink-0 text-[var(--ds-secondary-label)]" />
                    ) : (
                      <ChevronDown className="size-4 shrink-0 text-[var(--ds-secondary-label)]" />
                    )}
                  </button>
                  <div
                    className="relative"
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
                            status: displayStatus === "completed" ? "completed" : displayStatus === "overdue" ? "overdue" : group.isActive ? "active" : "upcoming",
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
                      className="absolute flex cursor-pointer items-center justify-center overflow-hidden rounded-full px-3 shadow-[0_1px_2px_rgba(60,40,20,0.08)]"
                      style={{
                        top: (stageH - stageBarH) / 2,
                        height: stageBarH,
                        left: stageLeft,
                        width: stageW,
                        background: group.color,
                        opacity: displayStatus === "completed" ? 0.72 : 1,
                      }}
                    >
                      {showStageLabel && (
                        <span className="truncate text-[11px] font-medium text-white">
                          {group.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!collapsed && (
                  <>
                    {group.milestones.map((ms, msIndex) => {
                      const msExpanded = expandedMilestones.has(ms.id);
                      const hasTasks = (ms.tasks?.length ?? 0) > 0;
                      const barBg = ms.status === "completed" ? "#C4B5A5" : group.color;
                      const msBarH = Math.min(24, Math.max(16, msH * 0.5));
                      const msLeft = barLeft(ms.startDate);
                      const msW = barWidth(ms.startDate, ms.endDate);
                      const showMsLabel = msW >= 56;
                      const indexLabel = `${groupIndex + 1}.${msIndex + 1}`;

                      return (
                        <div key={ms.id}>
                          <div
                            className="flex"
                            style={{
                              height: msH,
                              borderBottom: `1px solid ${ROW_BORDER}`,
                            }}
                          >
                            <button
                              type="button"
                              disabled={!hasTasks}
                              onClick={() => hasTasks && toggleMilestone(ms.id)}
                              className="sticky left-0 z-[3] flex shrink-0 items-center gap-1.5 border-r border-[rgba(90,60,30,0.08)] bg-[var(--ds-surface-elevated)] pl-8 pr-3 text-left disabled:cursor-default"
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
                              <span className="flex-1 truncate text-[12px] text-[var(--ds-secondary-label)]">
                                <span className="mr-1 text-[var(--ds-tertiary-label,#9C8573)]">
                                  {indexLabel}
                                </span>
                                {ms.title}
                              </span>
                            </button>
                            <div
                              className="relative flex-1"
                              style={{ width: chartWidth, height: msH }}
                            >
                              <div
                                role="presentation"
                                onMouseEnter={(e) =>
                                  setTooltip({ item: ms, x: e.clientX, y: e.clientY })
                                }
                                onMouseMove={(e) =>
                                  setTooltip((t) =>
                                    t ? { ...t, x: e.clientX, y: e.clientY } : null
                                  )
                                }
                                onMouseLeave={() => setTooltip(null)}
                                className="absolute flex cursor-pointer items-center justify-center overflow-hidden rounded-full px-2.5"
                                style={{
                                  top: (msH - msBarH) / 2,
                                  height: msBarH,
                                  left: msLeft,
                                  width: msW,
                                  background: barBg,
                                  opacity: ms.status === "completed" ? 0.8 : 0.92,
                                }}
                              >
                                {showMsLabel && (
                                  <span className="truncate text-[10px] font-medium text-white">
                                    {ms.title}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {msExpanded &&
                            ms.tasks?.map((task, taskIndex) =>
                              renderTaskRow(
                                task,
                                group.color,
                                `${indexLabel}.${taskIndex + 1}`
                              )
                            )}
                        </div>
                      );
                    })}

                    {group.orphanTasks?.map((task, orphanIndex) =>
                      renderTaskRow(
                        task,
                        group.color,
                        `${groupIndex + 1}.${group.milestones.length + orphanIndex + 1}`
                      )
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-[999] rounded-lg bg-[var(--ds-label)] px-2.5 py-1.5 text-[11px] leading-snug whitespace-nowrap text-white shadow-lg"
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
