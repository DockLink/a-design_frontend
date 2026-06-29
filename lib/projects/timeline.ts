import { addIsoDuration } from "@/lib/projects/duration";
import type { ProjectMilestoneView, ProjectStageView } from "@/lib/projects/map-stages";
import type { Task, TaskableStatus } from "@/types/tasks";
import type { Project } from "@/types/projects";

export type TimelineItemStatus = "completed" | "active" | "upcoming" | "overdue";

export interface TimelineTaskItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: TimelineItemStatus;
  apiStatus: TaskableStatus;
}

export interface TimelineMilestoneItem {
  id: string;
  title: string;
  description?: string;
  stageId: string;
  stageName: string;
  startDate: string;
  endDate: string;
  status: TimelineItemStatus;
  apiStatus: TaskableStatus;
  tasks?: TimelineTaskItem[];
}

export interface TimelineStageGroup {
  id: string;
  name: string;
  order: number;
  color: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  milestones: TimelineMilestoneItem[];
  /** Tasks attached directly to the stage (no milestone). */
  orphanTasks?: TimelineTaskItem[];
}

export const STAGE_CHART_COLORS = [
  "#D4A96A",
  "#9B8FA8",
  "#5A8A7A",
  "#7A9E6A",
  "#6B8CAE",
  "#B87A6A",
] as const;

export const PX_PER_DAY = 4;
export const GANTT_LEFT_COL = 220;

export function stageColor(index: number): string {
  return STAGE_CHART_COLORS[index % STAGE_CHART_COLORS.length];
}

export function toDateOnlyIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isoDurationBetween(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000));
  return `P${days}D`;
}

export function formatTimelineDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function deriveTimelineStatus(
  startDate: string,
  endDate: string,
  apiStatus: TaskableStatus,
  now = new Date()
): TimelineItemStatus {
  if (apiStatus === "COMPLETED") return "completed";
  const end = new Date(endDate);
  const start = new Date(startDate);
  if (end < now) return "overdue";
  if (start <= now && end >= now) return "active";
  return "upcoming";
}

export function daysRemainingLabel(
  endDate: string,
  status: TimelineItemStatus,
  now = new Date()
): { text: string; color: string } {
  if (status === "completed") return { text: "Done", color: "#2D6A4F" };
  const diff = Math.round(
    (new Date(endDate).getTime() - now.getTime()) / 86400000
  );
  if (diff < 0) return { text: `${Math.abs(diff)}d late`, color: "#9B1C1C" };
  if (diff === 0) return { text: "Due today", color: "#7B5E0A" };
  return { text: `${diff}d`, color: "#9C8573" };
}

export function dayOffset(chartStart: string, dateStr: string): number {
  const start = new Date(chartStart + "T00:00:00").getTime();
  const target = new Date(dateStr.slice(0, 10) + "T00:00:00").getTime();
  return Math.round((target - start) / 86400000);
}

export function computeChartBounds(
  project: Project | null,
  stages: ProjectStageView[],
  milestones: ProjectMilestoneView[]
): { chartStart: string; chartEnd: string; today: string } {
  const dates: number[] = [];
  const now = new Date();

  if (project?.start_date) {
    dates.push(new Date(project.start_date).getTime());
  }
  if ((project as any)?.end_date) {
    dates.push(new Date((project as any).end_date).getTime());
  } else if (project?.start_date && (project as any)?.duration) {
    dates.push(addIsoDuration(project.start_date, (project as any).duration).getTime());
  }

  for (const s of stages) {
    dates.push(new Date(s.startDate).getTime(), new Date(s.endDate).getTime());
  }
  for (const m of milestones) {
    dates.push(new Date(m.startDate).getTime(), new Date(m.endDate).getTime());
  }

  if (dates.length === 0) {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    const end = new Date(now);
    end.setMonth(end.getMonth() + 3);
    return {
      chartStart: toDateOnlyIso(start),
      chartEnd: toDateOnlyIso(end),
      today: toDateOnlyIso(now),
    };
  }

  const min = Math.min(...dates);
  const max = Math.max(...dates, now.getTime());
  const padStart = new Date(min);
  padStart.setDate(padStart.getDate() - 7);
  const padEnd = new Date(max);
  padEnd.setDate(padEnd.getDate() + 14);

  return {
    chartStart: toDateOnlyIso(padStart),
    chartEnd: toDateOnlyIso(padEnd),
    today: toDateOnlyIso(now),
  };
}

export function buildMonthMarkers(chartStart: string, chartEnd: string) {
  const start = new Date(chartStart + "T00:00:00");
  const end = new Date(chartEnd + "T00:00:00");
  const markers: { label: string; date: string }[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

  while (cursor <= end) {
    const iso = toDateOnlyIso(cursor);
    markers.push({
      date: iso,
      label: cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return markers;
}

export function mapTaskToTimelineItem(t: Task): TimelineTaskItem {
  const endIso = t.end_date ?? t.start_date;
  return {
    id: t.id,
    title: t.title,
    startDate: t.start_date,
    endDate: endIso,
    apiStatus: t.status,
    status: deriveTimelineStatus(t.start_date, endIso, t.status),
  };
}

export function buildTimelineGroups(
  stages: ProjectStageView[],
  milestones: ProjectMilestoneView[],
  milestoneStageMap: Record<string, { stageId: string; stageName: string }>,
  rawMilestones: Task[],
  milestoneTasksMap: Record<string, TimelineTaskItem[]> = {},
  stageOrphanTasksMap: Record<string, TimelineTaskItem[]> = {}
): TimelineStageGroup[] {
  const statusById = Object.fromEntries(rawMilestones.map((m) => [m.id, m.status]));
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

  const groups: TimelineStageGroup[] = sortedStages.map((stage, index) => ({
    id: stage.id,
    name: stage.name,
    order: stage.order,
    color: stageColor(index),
    startDate: stage.startDate,
    endDate: stage.endDate,
    isActive: stage.isActive,
    milestones: [],
    orphanTasks: stageOrphanTasksMap[stage.id] ?? [],
  }));

  const groupById = Object.fromEntries(groups.map((g) => [g.id, g]));
  const unassigned: TimelineMilestoneItem[] = [];

  for (const m of milestones) {
    const parent = milestoneStageMap[m.id];
    const apiStatus = statusById[m.id] ?? "ACTIVE";
    const tasks = milestoneTasksMap[m.id] ?? [];

    // Span the milestone bar across its tasks so changes (e.g. a task whose
    // end date was extended by an approved hold request) move the parent bar.
    const startCandidates = [new Date(m.startDate).getTime(), ...tasks.map((t) => new Date(t.startDate).getTime())];
    const endCandidates = [new Date(m.endDate).getTime(), ...tasks.map((t) => new Date(t.endDate).getTime())];
    const startDate = toDateOnlyIso(new Date(Math.min(...startCandidates)));
    const endDate = toDateOnlyIso(new Date(Math.max(...endCandidates)));

    const item: TimelineMilestoneItem = {
      id: m.id,
      title: m.name,
      description: m.description,
      stageId: parent?.stageId ?? "",
      stageName: parent?.stageName ?? "Unassigned",
      startDate,
      endDate,
      status: deriveTimelineStatus(startDate, endDate, apiStatus),
      apiStatus,
      tasks,
    };

    if (parent && groupById[parent.stageId]) {
      groupById[parent.stageId].milestones.push(item);
    } else {
      unassigned.push(item);
    }
  }

  for (const g of groups) {
    g.milestones.sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Tasks attached directly to the stage (no milestone) are rendered as their
    // own rows under the stage — no synthetic "Tasks (no milestone)" parent.
    const orphans = (g.orphanTasks ?? [])
      .slice()
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    g.orphanTasks = orphans;

    // Roll the stage bar up across every child (milestones + their tasks + orphan
    // tasks) so it always reflects the true span, even after a hold extends a task.
    const childStarts = [
      ...g.milestones.map((m) => new Date(m.startDate).getTime()),
      ...orphans.map((t) => new Date(t.startDate).getTime()),
    ];
    const childEnds = [
      ...g.milestones.map((m) => new Date(m.endDate).getTime()),
      ...orphans.map((t) => new Date(t.endDate).getTime()),
    ];
    if (childStarts.length > 0) {
      g.startDate = toDateOnlyIso(
        new Date(Math.min(new Date(g.startDate).getTime(), ...childStarts))
      );
      g.endDate = toDateOnlyIso(
        new Date(Math.max(new Date(g.endDate).getTime(), ...childEnds))
      );
    }
  }

  if (unassigned.length > 0) {
    groups.push({
      id: "__unassigned__",
      name: "Unassigned milestones",
      order: 9999,
      color: "#9C8573",
      startDate: unassigned[0].startDate,
      endDate: unassigned[unassigned.length - 1].endDate,
      isActive: false,
      milestones: unassigned,
    });
  }

  return groups.filter((g) => g.id !== "__unassigned__" || g.milestones.length > 0);
}
