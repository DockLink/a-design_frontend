"use client";

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

export function TaskKanbanCard({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  task: ProjectTaskView;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const isOverdue = task.dueDate < new Date().toISOString().slice(0, 10) && task.status !== "done";
  const isDone = task.status === "done";

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        "mb-2 cursor-grab rounded-[10px] border border-[rgba(90,60,30,0.10)] bg-[#FDFAF6] p-3 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-0"
      )}
    >
      <div className="mb-2.5 flex items-start gap-2">
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: PRIORITY_DOT[task.priority] }} />
        <span className={cn("text-[13px] leading-snug font-medium", isDone ? "text-[#9C8573] line-through" : "text-[#1A1410]")}>
          {task.title}
        </span>
      </div>
      <div className="flex items-center justify-between pl-3.5">
        <div className="flex items-center gap-1">
          {task.assignees.slice(0, 2).map((a) => (
            <TaskUserAvatar key={a.userId} initials={a.initials} size={18} />
          ))}
        </div>
        <span className="text-[11px]" style={{ color: dueDateColor(task.dueDate, task.status), fontWeight: isOverdue ? 500 : 400 }}>
          {formatBoardDate(task.dueDate)}
        </span>
      </div>
    </div>
  );
}

export function TaskKanbanColumn({
  columnId,
  tasks,
  draggedId,
  isOver,
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
        {tasks.map((task) =>
          task.id !== draggedId ? (
            <TaskKanbanCard
              key={task.id}
              task={task}
              isDragging={task.id === draggedId}
              onDragStart={() => onCardDragStart(task.id)}
              onDragEnd={onCardDragEnd}
              onClick={() => onCardClick(task)}
            />
          ) : null
        )}
        {tasks.length === 0 && <div className="flex h-20 items-center justify-center text-xs text-[#C4B5A5]">No tasks</div>}
      </div>
    </div>
  );
}
