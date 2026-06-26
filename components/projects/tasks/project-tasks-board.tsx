"use client";

import { useRef, useState } from "react";
import { LayoutGrid, List, Plus, Settings, Users } from "lucide-react";
import { toast } from "sonner";

import { StageManagementModal } from "@/components/projects/stage-management-modal";
import { TaskCreateDialog } from "@/components/projects/tasks/task-create-dialog";
import { TaskDetailSheet } from "@/components/projects/tasks/task-detail-sheet";
import { TaskKanbanColumn } from "@/components/projects/tasks/task-kanban";
import { TaskListHeader, TaskListRow } from "@/components/projects/tasks/task-list";
import { TaskTeamView } from "@/components/projects/tasks/task-team-view";
import { Button } from "@/components/ui/button";
import { useProjectTasksBoard } from "@/hooks/use-project-tasks-board";
import { BOARD_COLUMNS, type BoardColumnId, type ProjectTaskView } from "@/lib/tasks/task-board";

type ViewMode = "kanban" | "list" | "team";

export function ProjectTasksBoard({ projectId }: { projectId: string }) {
  const {
    stages,
    milestones,
    milestoneParents,
    visibleTasks,
    myTasks,
    memberUsers,
    canManage,
    isAdmin,
    isLoading,
    error,
    createProjectTask,
    updateTaskAssignees,
  } = useProjectTasksBoard(projectId);

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedTask, setSelectedTask] = useState<ProjectTaskView | null>(null);
  const [createStatus, setCreateStatus] = useState<BoardColumnId | null>(null);
  const [showStageManagement, setShowStageManagement] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<BoardColumnId | null>(null);
  const dragCounter = useRef<Record<string, number>>({});

  const teamMembers = memberUsers.map((m) => ({
    userId: m.id,
    name: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email,
    initials: `${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`.toUpperCase() || "?",
  }));

  function handleDrop(toStatus: BoardColumnId) {
    if (draggedId) {
      toast.message("Status updates are not available via API yet");
    }
    setDraggedId(null);
    setOverColumn(null);
    dragCounter.current = {};
  }

  return (
    <div className="-mx-7 -mt-6">
      <div className="sticky top-[44px] z-[98] flex items-center justify-between gap-3 border-b border-[rgba(90,60,30,0.08)] bg-[#EDE3D4] px-7 py-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-[#F5EFE6] p-1">
            {([
              { id: "kanban" as const, icon: LayoutGrid, label: "Kanban" },
              { id: "list" as const, icon: List, label: "List" },
              { id: "team" as const, icon: Users, label: "Team" },
            ]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-sm ${viewMode === id ? "bg-white text-[#D4A96A] shadow-sm" : "text-[#9C8573]"}`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
          <span className="rounded-lg bg-[#F5EFE6] px-3 py-1.5 text-xs font-medium text-[#6B5744]">
            {isAdmin ? `All tasks: ${visibleTasks.length}` : `My tasks: ${myTasks.length}`}
          </span>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowStageManagement(true)}>
              <Settings className="size-3.5" /> Stages
            </Button>
            <Button size="sm" onClick={() => setCreateStatus("todo")}>
              <Plus className="size-3.5" /> New task
            </Button>
          </div>
        )}
      </div>

      <div className="px-7 py-5">
        {isLoading && <p className="text-sm text-[#8E8E93]">Loading tasks…</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}

        {!isLoading && viewMode === "kanban" && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {BOARD_COLUMNS.map((col) => (
              <TaskKanbanColumn
                key={col.id}
                columnId={col.id}
                tasks={visibleTasks.filter((t) => t.status === col.id)}
                draggedId={draggedId}
                isOver={overColumn === col.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverColumn(col.id);
                }}
                onDragLeave={() => setOverColumn(null)}
                onDrop={() => handleDrop(col.id)}
                onAddTask={canManage ? setCreateStatus : () => undefined}
                onCardClick={setSelectedTask}
                onCardDragStart={setDraggedId}
                onCardDragEnd={() => {
                  setDraggedId(null);
                  setOverColumn(null);
                }}
                canAdd={canManage}
              />
            ))}
          </div>
        )}

        {!isLoading && viewMode === "list" && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <TaskListHeader />
            {visibleTasks.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#8E8E93]">No tasks yet.</div>
            ) : (
              visibleTasks.map((task, i) => (
                <div key={task.id} className={i < visibleTasks.length - 1 ? "border-b" : ""}>
                  <TaskListRow task={task} onClick={() => setSelectedTask(task)} />
                </div>
              ))
            )}
          </div>
        )}

        {!isLoading && viewMode === "team" && (
          <TaskTeamView tasks={visibleTasks} members={teamMembers} onTaskClick={setSelectedTask} />
        )}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        canManage={canManage}
        members={memberUsers}
        onUpdateAssignees={updateTaskAssignees}
      />

      {createStatus && (
        <TaskCreateDialog
          open={!!createStatus}
          onOpenChange={(open) => !open && setCreateStatus(null)}
          defaultStatus={createStatus}
          stages={stages}
          milestones={milestones}
          milestoneParents={milestoneParents}
          members={memberUsers}
          onCreate={createProjectTask}
        />
      )}

      {showStageManagement && (
        <StageManagementModal projectId={projectId} onClose={() => setShowStageManagement(false)} />
      )}
    </div>
  );
}
