"use client";

import { useMemo } from "react";
import { Flag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ProjectStageView } from "@/lib/projects/map-stages";
import { BOARD_COLUMNS, PRIORITY_DOT, dueDateColor, formatBoardDate, type ProjectTaskView } from "@/lib/tasks/task-board";
import { cn } from "@/lib/utils";

import { TaskUserAvatar } from "./task-user-avatar";

const NO_MILESTONE = "__none__";
const UNASSIGNED_STAGE = "__unassigned__";

/**
 * Groups tasks by Stage → Milestone so every role can see what work sits under
 * each milestone. Read-only overview; clicking a task opens its detail sheet.
 */
export function TaskMilestoneView({
  tasks,
  stages,
  onTaskClick,
}: {
  tasks: ProjectTaskView[];
  stages: ProjectStageView[];
  onTaskClick: (task: ProjectTaskView) => void;
}) {
  const grouped = useMemo(() => {
    // stageName -> milestoneName -> tasks
    const map = new Map<string, Map<string, ProjectTaskView[]>>();
    for (const t of tasks) {
      const stageKey = t.stageName ?? UNASSIGNED_STAGE;
      const milestoneKey = t.milestoneName ?? NO_MILESTONE;
      if (!map.has(stageKey)) map.set(stageKey, new Map());
      const milestoneMap = map.get(stageKey)!;
      if (!milestoneMap.has(milestoneKey)) milestoneMap.set(milestoneKey, []);
      milestoneMap.get(milestoneKey)!.push(t);
    }
    return map;
  }, [tasks]);

  // Order stages by their defined order, then any extra/unassigned at the end.
  const orderedStageNames = useMemo(() => {
    const fromStages = [...stages].sort((a, b) => a.order - b.order).map((s) => s.name);
    const present = Array.from(grouped.keys());
    const ordered = fromStages.filter((n) => grouped.has(n));
    for (const n of present) {
      if (!ordered.includes(n)) ordered.push(n);
    }
    return ordered;
  }, [stages, grouped]);

  if (tasks.length === 0) {
    return <div className="py-10 text-center text-sm text-[#C4B5A5]">No tasks match the current filters.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {orderedStageNames.map((stageName) => {
        const milestoneMap = grouped.get(stageName)!;
        const milestoneNames = Array.from(milestoneMap.keys()).sort((a, b) => {
          if (a === NO_MILESTONE) return 1;
          if (b === NO_MILESTONE) return -1;
          return a.localeCompare(b);
        });
        const stageTaskCount = Array.from(milestoneMap.values()).reduce((n, arr) => n + arr.length, 0);

        return (
          <div key={stageName} className="overflow-hidden rounded-[14px] border bg-[var(--ds-surface-elevated)]">
            <div className="flex items-center gap-2 border-b bg-[var(--ds-bg)] px-4 py-3">
              <span className="text-[15px] font-medium text-[var(--ds-label)]">
                {stageName === UNASSIGNED_STAGE ? "Unassigned" : stageName}
              </span>
              <Badge variant="secondary" className="bg-[#EDE3D4] text-[var(--ds-secondary-label)]">
                {stageTaskCount} task{stageTaskCount === 1 ? "" : "s"}
              </Badge>
            </div>

            <div className="divide-y">
              {milestoneNames.map((milestoneName) => {
                const list = milestoneMap.get(milestoneName)!;
                const done = list.filter((t) => t.status === "done").length;
                return (
                  <div key={milestoneName} className="px-4 py-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Flag className="size-3.5 text-[var(--ds-accent)]" />
                      <span className="text-[13px] font-medium text-[var(--ds-secondary-label)]">
                        {milestoneName === NO_MILESTONE ? "No milestone (directly on stage)" : milestoneName}
                      </span>
                      <span className="text-[11px] text-[var(--ds-secondary-label)]">
                        {done}/{list.length} done
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {list.map((task) => {
                        const column = BOARD_COLUMNS.find((c) => c.id === task.status)!;
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => onTaskClick(task)}
                            className="flex w-full items-center gap-3 rounded-lg border border-transparent bg-[var(--ds-bg)] px-3 py-2 text-left hover:border-[var(--ds-accent)]/40"
                          >
                            <span className="size-1.5 shrink-0 rounded-full" style={{ background: PRIORITY_DOT[task.priority] }} />
                            <span className={cn("flex-1 truncate text-sm", task.status === "done" && "text-[#6C6C70] line-through")}>
                              {task.title}
                            </span>
                            <div className="flex -space-x-1.5">
                              {task.assignees.slice(0, 3).map((a) => (
                                <TaskUserAvatar key={a.userId} initials={a.initials} size={20} />
                              ))}
                            </div>
                            <Badge variant="secondary" style={{ color: column.accent }}>
                              {column.label}
                            </Badge>
                            <span className="w-12 text-right text-xs" style={{ color: dueDateColor(task.dueDate, task.status) }}>
                              {formatBoardDate(task.dueDate)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
