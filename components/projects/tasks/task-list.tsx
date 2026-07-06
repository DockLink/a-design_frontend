"use client";

import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  BOARD_COLUMNS,
  PRIORITY_DOT,
  dueDateColor,
  formatBoardDate,
  type ProjectTaskView,
} from "@/lib/tasks/task-board";
import { cn } from "@/lib/utils";

import { TaskUserAvatar } from "./task-user-avatar";

export const TaskListRow = memo(function TaskListRow({ task, onClick }: { task: ProjectTaskView; onClick: () => void }) {
  const column = BOARD_COLUMNS.find((c) => c.id === task.status)!;
  const done = task.status === "done";

  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-12 w-full grid-cols-[1fr_140px_110px_80px] items-center gap-3 px-4 text-left hover:bg-[var(--ds-bg)]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="size-1.5 rounded-full" style={{ background: PRIORITY_DOT[task.priority] }} />
        <span className={cn("truncate text-sm font-medium", done && "line-through text-[var(--ds-secondary-label)]")}>{task.title}</span>
      </div>
      <div className="flex items-center gap-1">
        {task.assignees.slice(0, 2).map((a) => (
          <TaskUserAvatar key={a.userId} initials={a.initials} size={20} />
        ))}
      </div>
      <Badge variant="secondary" style={{ color: column.accent, justifySelf: "start" }}>
        {column.label}
      </Badge>
      <span className="text-right text-xs" style={{ color: dueDateColor(task.dueDate, task.status) }}>
        {formatBoardDate(task.dueDate)}
      </span>
    </button>
  );
});

export function TaskListHeader() {
  return (
    <div className="grid h-10 grid-cols-[1fr_140px_110px_80px] items-center gap-3 border-b bg-[var(--ds-bg)] px-4 text-[11px] font-medium text-[var(--ds-secondary-label)] uppercase">
      <span>Task</span>
      <span>Assignee</span>
      <span>Status</span>
      <span className="text-right">Due</span>
    </div>
  );
}
