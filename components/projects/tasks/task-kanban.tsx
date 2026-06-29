"use client";

import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  BOARD_COLUMNS,
  PRIORITY_DOT,
  dueDateColor,
  formatBoardDate,
  type BoardColumnId,
  type ProjectTaskView,
} from "@/lib/tasks/task-board";
import { cn } from "@/lib/utils";

import { TaskUserAvatar } from "./task-user-avatar";

export const TaskKanbanCard = memo(function TaskKanbanCard({
  task,
  isDragging,
  showAssigneeNames = false,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  task: ProjectTaskView;
  isDragging: boolean;
  showAssigneeNames?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const isOverdue = task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "done";
  const isDone = task.status === "done";
  const visibleAssignees = task.assignees.slice(0, showAssigneeNames ? 3 : 4);
  const overflow = task.assignees.length - visibleAssignees.length;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        // Delay so the browser captures the drag ghost at full opacity before React
        // re-renders the card as a faded placeholder.
        requestAnimationFrame(() => onDragStart());
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "mb-2 cursor-grab rounded-[10px] border border-[rgba(90,60,30,0.10)] bg-[#FDFAF6] p-3 shadow-sm active:cursor-grabbing select-none transition-opacity",
        isDragging && "opacity-20 pointer-events-none border-dashed"
      )}
    >
      <div className="mb-2.5 flex items-start gap-2">
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: PRIORITY_DOT[task.priority] }} />
        <span className={cn("text-[13px] leading-snug font-medium", isDone ? "text-[#9C8573] line-through" : "text-[#1A1410]")}>
          {task.title}
        </span>
      </div>

      {/* Assignees row */}
      <div className="flex items-center justify-between pl-3.5">
        {showAssigneeNames ? (
          <div className="flex flex-col gap-1 min-w-0">
            {visibleAssignees.map((a) => (
              <div key={a.userId} className="flex items-center gap-1.5 min-w-0">
                <TaskUserAvatar initials={a.initials} size={16} />
                <span className="truncate text-[11px] text-[#6B5744] font-medium leading-none">
                  {a.name}
                </span>
              </div>
            ))}
            {overflow > 0 && (
              <span className="text-[10px] text-[#9C8573] pl-5">+{overflow} more</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            {visibleAssignees.map((a) => (
              <div key={a.userId} title={a.name}>
                <TaskUserAvatar initials={a.initials} size={18} />
              </div>
            ))}
            {overflow > 0 && (
              <span className="flex size-[18px] items-center justify-center rounded-full bg-[#F5E6D0] text-[9px] font-semibold text-[#D4A96A]">
                +{overflow}
              </span>
            )}
          </div>
        )}
        <span
          className="ml-2 shrink-0 text-[11px]"
          style={{ color: dueDateColor(task.dueDate, task.status), fontWeight: isOverdue ? 500 : 400 }}
        >
          {formatBoardDate(task.dueDate)}
        </span>
      </div>
    </div>
  );
});

export const TaskKanbanColumn = memo(function TaskKanbanColumn({
  columnId,
  tasks,
  draggedId,
  isOver,
  showAssigneeNames,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddTask,
  onCardClick,
  onCardDragStart,
  onCardDragEnd,
  canAdd,
}: {
  columnId: BoardColumnId;
  tasks: ProjectTaskView[];
  draggedId: string | null;
  isOver: boolean;
  showAssigneeNames?: boolean;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onAddTask: (status: BoardColumnId) => void;
  onCardClick: (task: ProjectTaskView) => void;
  onCardDragStart: (id: string) => void;
  onCardDragEnd: () => void;
  canAdd: boolean;
}) {
  const column = BOARD_COLUMNS.find((c) => c.id === columnId)!;

  return (
    <div className="flex min-w-[220px] max-w-[320px] flex-1 flex-col">
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: column.accent }} />
          <span className="text-[13px] font-medium">{column.label}</span>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        {canAdd && (
          <button type="button" onClick={() => onAddTask(columnId)} className="text-[#C4B5A5]">
            +
          </button>
        )}
      </div>
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => {
          e.preventDefault();
          onDrop();
        }}
        className={cn(
          "min-h-[480px] flex-1 rounded-xl p-2",
          isOver ? "border border-dashed border-[#D4A96A]/60 bg-[#D4A96A]/5" : "bg-[#F5EFE6]/45"
        )}
      >
        {tasks.map((task) => (
          <TaskKanbanCard
            key={task.id}
            task={task}
            isDragging={task.id === draggedId}
            showAssigneeNames={showAssigneeNames}
            onDragStart={() => onCardDragStart(task.id)}
            onDragEnd={onCardDragEnd}
            onClick={() => onCardClick(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex h-20 items-center justify-center text-xs text-[#C4B5A5]">No tasks</div>
        )}
      </div>
    </div>
  );
});
