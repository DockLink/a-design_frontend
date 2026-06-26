"use client";

import { Badge } from "@/components/ui/badge";
import { BOARD_COLUMNS, PRIORITY_DOT, dueDateColor, formatBoardDate, type ProjectTaskView } from "@/lib/tasks/task-board";
import { cn } from "@/lib/utils";

import { TaskUserAvatar } from "./task-user-avatar";

export function TaskTeamView({
  tasks,
  members,
  onTaskClick,
}: {
  tasks: ProjectTaskView[];
  members: { userId: string; name: string; initials: string }[];
  onTaskClick: (task: ProjectTaskView) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-4">
      {members.map((member) => {
        const memberTasks = tasks.filter((t) => t.assignees.some((a) => a.userId === member.userId));
        return (
          <div key={member.userId} className="overflow-hidden rounded-[14px] border bg-[#FDFAF6]">
            <div className="flex items-center gap-3 border-b bg-[#F5EFE6] px-4 py-3.5">
              <TaskUserAvatar initials={member.initials} size={36} />
              <div>
                <div className="text-[15px] font-medium">{member.name}</div>
                <div className="text-xs text-[#9C8573]">{memberTasks.length} tasks</div>
              </div>
            </div>
            {memberTasks.length === 0 ? (
              <div className="px-4 py-3.5 text-sm text-[#C4B5A5]">No tasks assigned</div>
            ) : (
              memberTasks.map((task, i) => {
                const column = BOARD_COLUMNS.find((c) => c.id === task.status)!;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onTaskClick(task)}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F5EFE6]",
                      i < memberTasks.length - 1 && "border-b"
                    )}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: PRIORITY_DOT[task.priority] }} />
                    <span className="flex-1 truncate text-sm font-medium">{task.title}</span>
                    <Badge variant="secondary" style={{ color: column.accent }}>
                      {column.label}
                    </Badge>
                    <span className="text-xs" style={{ color: dueDateColor(task.dueDate, task.status) }}>
                      {formatBoardDate(task.dueDate)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}
