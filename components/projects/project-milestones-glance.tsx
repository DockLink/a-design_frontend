"use client";

import { useMemo } from "react";
import Link from "next/link";

import { TimelineStatusIcon } from "@/components/projects/timeline/timeline-status-icon";
import { useProjectTaskables } from "@/hooks/use-project-taskables";
import { isValidDateValue, mapMilestoneToView } from "@/lib/projects/map-stages";
import {
  daysRemainingLabel,
  deriveTimelineStatus,
  formatTimelineDate,
  type TimelineItemStatus,
} from "@/lib/projects/timeline";
import { projectTabRoute } from "@/types/navigation";

const MARKER_COLOR: Record<TimelineItemStatus, string> = {
  completed: "#2D6A4F",
  overdue: "#9B1C1C",
  active: "#D4A96A",
  upcoming: "#C4B5A5",
};

interface GlanceItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: TimelineItemStatus;
  percent: number;
}

function markerPercent(time: number, min: number, max: number): number {
  if (max <= min) return 50;
  const raw = ((time - min) / (max - min)) * 100;
  return Math.min(98, Math.max(2, raw));
}

export function ProjectMilestonesGlance({ projectId }: { projectId: string }) {
  const { tasks, isLoading, error } = useProjectTaskables(projectId, "MILESTONE");

  const items = useMemo<GlanceItem[]>(() => {
    const mapped = tasks.map((task) => {
      const view = mapMilestoneToView(task);
      return {
        id: view.id,
        name: view.name,
        startDate: view.startDate,
        endDate: view.endDate,
        status: deriveTimelineStatus(view.startDate, view.endDate, view.status),
      };
    });

    mapped.sort((a, b) => {
      const aTime = isValidDateValue(a.endDate) ? new Date(a.endDate).getTime() : Number.POSITIVE_INFINITY;
      const bTime = isValidDateValue(b.endDate) ? new Date(b.endDate).getTime() : Number.POSITIVE_INFINITY;
      return aTime - bTime;
    });

    const times = mapped.flatMap((item) => {
      const values: number[] = [];
      if (isValidDateValue(item.startDate)) values.push(new Date(item.startDate).getTime());
      if (isValidDateValue(item.endDate)) values.push(new Date(item.endDate).getTime());
      return values;
    });
    const min = times.length > 0 ? Math.min(...times) : 0;
    const max = times.length > 0 ? Math.max(...times) : 0;

    return mapped.map((item) => {
      const markerTime = isValidDateValue(item.endDate)
        ? new Date(item.endDate).getTime()
        : isValidDateValue(item.startDate)
          ? new Date(item.startDate).getTime()
          : min;
      return {
        ...item,
        percent: times.length > 0 ? markerPercent(markerTime, min, max) : 50,
      };
    });
  }, [tasks]);

  const rangeLabel = useMemo(() => {
    const dated = items.filter((item) => isValidDateValue(item.startDate) || isValidDateValue(item.endDate));
    if (dated.length === 0) return null;
    const first = dated[0];
    const last = dated[dated.length - 1];
    const start = isValidDateValue(first.startDate) ? first.startDate : first.endDate;
    const end = isValidDateValue(last.endDate) ? last.endDate : last.startDate;
    return `${formatTimelineDate(start)} – ${formatTimelineDate(end)}`;
  }, [items]);

  const showStrip = items.some(
    (item) => isValidDateValue(item.startDate) || isValidDateValue(item.endDate)
  );

  return (
    <div className="project-milestones-glance">
      <div className="project-milestones-glance__header">
        <div className="project-milestones-glance__title">Milestones</div>
        <Link href={projectTabRoute(projectId, "timeline")} className="project-milestones-glance__link">
          View timeline
        </Link>
      </div>

      <div className="project-milestones-glance__card">
        {isLoading && (
          <div className="project-milestones-glance__empty">Loading milestones…</div>
        )}

        {!isLoading && error && (
          <div className="project-milestones-glance__error">{error}</div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="project-milestones-glance__empty">No milestones yet.</div>
        )}

        {!isLoading && !error && items.length > 0 && (
          <>
            {showStrip && (
              <div className="project-milestones-glance__strip">
                {rangeLabel && (
                  <div className="project-milestones-glance__range">{rangeLabel}</div>
                )}
                <div className="project-milestones-glance__track" aria-hidden="true">
                  {items.map((item) => (
                    <span
                      key={item.id}
                      className="project-milestones-glance__marker"
                      title={`${item.name} · ${formatTimelineDate(item.endDate)}`}
                      style={{
                        left: `${item.percent}%`,
                        background: MARKER_COLOR[item.status],
                      }}
                    />
                  ))}
                </div>
                {items.length <= 8 && (
                  <div className="project-milestones-glance__labels">
                    {items.map((item) => (
                      <span
                        key={item.id}
                        className="project-milestones-glance__label"
                        title={item.name}
                        style={{ left: `${item.percent}%` }}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="project-milestones-glance__list">
              {items.map((item, index) => {
                const remaining = daysRemainingLabel(item.endDate, item.status);
                const dateRange =
                  isValidDateValue(item.startDate) && isValidDateValue(item.endDate)
                    ? `${formatTimelineDate(item.startDate)} – ${formatTimelineDate(item.endDate)}`
                    : formatTimelineDate(item.endDate || item.startDate);
                return (
                  <div
                    key={item.id}
                    className="project-milestones-glance__row"
                    style={{
                      borderBottom:
                        index < items.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                    }}
                  >
                    <TimelineStatusIcon status={item.status} />
                    <div className="project-milestones-glance__name">{item.name}</div>
                    <div className="project-milestones-glance__dates">{dateRange}</div>
                    <div
                      className="project-milestones-glance__remaining"
                      style={{ color: remaining.color }}
                    >
                      {remaining.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
