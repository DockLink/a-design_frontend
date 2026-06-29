"use client";

import { Badge } from "@/components/ui/badge";
import { BOARD_COLUMNS, PRIORITY_DOT, dueDateColor, formatBoardDate, type ProjectTaskView } from "@/lib/tasks/task-board";
import { cn } from "@/lib/utils";

import { TaskUserAvatar } from "./task-user-avatar";

function memberCompletedTask(task: ProjectTaskView, userId: string): boolean {
  if (task.status === "done") return true;
  const assignee = task.assignees.find((a) => a.userId === userId);
  return Boolean(assignee?.completedAt);
}

export function TaskTeamView({
  tasks,
  members,
  currentUserId,
  onTaskClick,
}: {
  tasks: ProjectTaskView[];
  members: { userId: string; name: string; initials: string }[];
  currentUserId?: string;
  onTaskClick: (task: ProjectTaskView) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {members.map((member) => {
        const memberTasks = tasks.filter((t) =>
          t.assignees.some((a) => a.userId === member.userId)
        );
        const doneCount = memberTasks.filter((t) =>
          memberCompletedTask(t, member.userId)
        ).length;
        const total = memberTasks.length;
        const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
        const isCurrentUser = member.userId === currentUserId;

        return (
          <div key={member.userId} className="overflow-hidden rounded-[14px] border bg-[#FDFAF6]">
            <div className="flex items-center gap-3 border-b bg-[#F5EFE6] px-4 py-3.5">
              <TaskUserAvatar initials={member.initials} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[15px] font-medium">{member.name}</span>
                  {isCurrentUser && (
                    <Badge variant="secondary" className="bg-[#EDE3D4] text-[#9C8573]">
                      You
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-[#9C8573]">
                  {doneCount} of {total} done
                </div>
              </div>
              <div className="flex w-32 shrink-0 items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EDE3D4]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: "#3D8B5E" }}
                  />
                </div>
                <span className="w-9 text-right text-xs font-medium text-[#6B5744]">{pct}%</span>
              </div>
            </div>
            {memberTasks.length === 0 ? (
              <div className="px-4 py-3.5 text-sm text-[#C4B5A5]">No tasks assigned</div>
            ) : (
              memberTasks.map((task, i) => {
                const column = BOARD_COLUMNS.find((c) => c.id === task.status)!;
                const memberDone = memberCompletedTask(task, member.userId);
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
                    <span
                      className={cn(
                        "flex-1 truncate text-sm font-medium",
                        memberDone && task.status !== "done" && "text-[#3D8B5E]"
                      )}
                    >
                      {task.title}
                    </span>
                    {memberDone && task.status !== "done" && (
                      <span className="text-xs text-[#3D8B5E]">Your part done</span>
                    )}
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
