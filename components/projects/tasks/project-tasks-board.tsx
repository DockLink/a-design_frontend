"use client";

import { useMemo, useRef, useState } from "react";
import { Flag, LayoutGrid, List, ListTree, Plus, Settings, Users } from "lucide-react";
import { toast } from "sonner";

import { StageManagementModal } from "@/components/projects/stage-management-modal";
import { MilestoneManagementModal } from "@/components/projects/milestone-management-modal";
import { TaskCreateDialog } from "@/components/projects/tasks/task-create-dialog";
import { TaskDetailSheet } from "@/components/projects/tasks/task-detail-sheet";
import { TaskKanbanColumn } from "@/components/projects/tasks/task-kanban";
import { TaskListHeader, TaskListRow } from "@/components/projects/tasks/task-list";
import { TaskMilestoneView } from "@/components/projects/tasks/task-milestone-view";
import { TaskTeamView } from "@/components/projects/tasks/task-team-view";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useProjectTasksBoard } from "@/hooks/use-project-tasks-board";
import type { TaskablePriority } from "@/types/tasks";
import {
  apiStatusFromBoard,
  BOARD_COLUMNS,
  type BoardColumnId,
  type ProjectTaskView,
} from "@/lib/tasks/task-board";

type ViewMode = "kanban" | "list" | "milestones" | "team";

const ALL = "all";

export function ProjectTasksBoard({ projectId }: { projectId: string }) {
  const {
    stages,
    milestones,
    milestoneParents,
    tasks,
    visibleTasks,
    myTasks,
    memberUsers,
    canManage,
    isAdmin,
    isLoading,
    isAssigneesLoading,
    error,
    createProjectTask,
    updateTaskAssignees,
    updateTaskStatus,
    markMyCompletion,
    reopenTask,
    currentUser,
  } = useProjectTasksBoard(projectId);

  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedTask, setSelectedTask] = useState<ProjectTaskView | null>(null);
  const [createStatus, setCreateStatus] = useState<BoardColumnId | null>(null);
  const [showStageManagement, setShowStageManagement] = useState(false);
  const [showMilestoneManagement, setShowMilestoneManagement] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const draggedIdRef = useRef<string | null>(null);
  const [overColumn, setOverColumn] = useState<BoardColumnId | null>(null);
  // Per-column enter counters to prevent dragLeave flicker when moving over children.
  const dragEnterCount = useRef<Record<string, number>>({});

  // Filters
  const [filterStage, setFilterStage] = useState<string>(ALL);
  const [filterMilestone, setFilterMilestone] = useState<string>(ALL);
  const [filterAssignee, setFilterAssignee] = useState<string>(ALL);
  const [filterPriority, setFilterPriority] = useState<string>(ALL);

  const teamMembers = memberUsers.map((m) => ({
    userId: m.id,
    name: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email,
    initials: `${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`.toUpperCase() || "?",
  }));

  const stageNameById = useMemo(
    () => Object.fromEntries(stages.map((s) => [s.id, s.name])),
    [stages]
  );

  // Milestones available in the stage filter (or all when no stage chosen).
  const milestoneOptions = useMemo(() => {
    return milestones.filter((m) => {
      if (filterStage === ALL) return true;
      return milestoneParents[m.id]?.stageId === filterStage;
    });
  }, [milestones, milestoneParents, filterStage]);

  const hasActiveFilters =
    filterStage !== ALL || filterMilestone !== ALL || filterAssignee !== ALL || filterPriority !== ALL;

  function applyFilters(list: ProjectTaskView[]): ProjectTaskView[] {
    const stageName = filterStage === ALL ? null : stageNameById[filterStage];
    return list.filter((t) => {
      if (stageName && t.stageName !== stageName) return false;
      if (filterMilestone !== ALL && t.milestoneId !== filterMilestone) return false;
      if (filterAssignee !== ALL && !t.assignees.some((a) => a.userId === filterAssignee)) return false;
      if (filterPriority !== ALL && t.priority !== (filterPriority as TaskablePriority)) return false;
      return true;
    });
  }

  const filteredVisible = useMemo(
    () => applyFilters(visibleTasks),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleTasks, filterStage, filterMilestone, filterAssignee, filterPriority, stageNameById]
  );
  const filteredAll = useMemo(
    () => applyFilters(tasks),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, filterStage, filterMilestone, filterAssignee, filterPriority, stageNameById]
  );

  function clearFilters() {
    setFilterStage(ALL);
    setFilterMilestone(ALL);
    setFilterAssignee(ALL);
    setFilterPriority(ALL);
  }

  const selectClass =
    "h-8 rounded-md border border-[rgba(90,60,30,0.18)] bg-[var(--ds-bg)] px-2 text-xs text-[var(--ds-secondary-label)] outline-none";

  // Date window of the selected task's parent STAGE, used to bound hold
  // requests. Holds may fall outside the milestone window but must stay within
  // the stage range, so we resolve the stage (milestone → stage) here.
  const selectedTaskStageRange = useMemo(() => {
    if (!selectedTask) return null;
    const stageId = selectedTask.milestoneId
      ? milestoneParents[selectedTask.milestoneId]?.stageId
      : undefined;
    const stage = stageId ? stages.find((s) => s.id === stageId) : undefined;
    if (!stage) return null;
    return { start: stage.startDate, end: stage.endDate };
  }, [selectedTask, milestoneParents, stages]);

  async function handleSheetStatusChange(taskId: string, toStatus: BoardColumnId) {
    await updateTaskStatus(taskId, toStatus);
    setSelectedTask((prev) =>
      prev?.id === taskId
        ? { ...prev, status: toStatus, apiStatus: apiStatusFromBoard(toStatus) }
        : prev
    );
  }

  function handleDrop(toStatus: BoardColumnId) {
    const taskId = draggedIdRef.current;
    draggedIdRef.current = null;
    setDraggedId(null);
    setOverColumn(null);
    dragEnterCount.current = {};

    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === toStatus) return;

    setSelectedTask((prev) =>
      prev?.id === taskId
        ? { ...prev, status: toStatus, apiStatus: apiStatusFromBoard(toStatus) }
        : prev
    );

    void updateTaskStatus(taskId, toStatus).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update task status");
    });
  }

  return (
    <div className="-mx-7 -mt-6">
      <div className="sticky top-[44px] z-[98] flex items-center justify-between gap-3 border-b border-[rgba(90,60,30,0.08)] bg-[#EDE3D4] px-7 py-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg bg-[var(--ds-bg)] p-1">
            {([
              { id: "kanban" as const, icon: LayoutGrid, label: "Kanban" },
              { id: "list" as const, icon: List, label: "List" },
              { id: "milestones" as const, icon: ListTree, label: "Milestones" },
              { id: "team" as const, icon: Users, label: "Team" },
            ]).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-sm ${viewMode === id ? "bg-white text-[var(--ds-accent)] shadow-sm" : "text-[var(--ds-secondary-label)]"}`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
          <span className="rounded-lg bg-[var(--ds-bg)] px-3 py-1.5 text-xs font-medium text-[var(--ds-secondary-label)]">
            {viewMode === "milestones" || viewMode === "team"
              ? `Tasks: ${filteredAll.length}`
              : isAdmin
                ? `All tasks: ${filteredVisible.length}`
                : `My tasks: ${filteredVisible.length}`}
          </span>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowStageManagement(true)}>
              <Settings className="size-3.5" /> Stages
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowMilestoneManagement(true)}>
              <Flag className="size-3.5" /> Milestones
            </Button>
            <Button size="sm" onClick={() => setCreateStatus("todo")}>
              <Plus className="size-3.5" /> New task
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(90,60,30,0.08)] bg-[#F2E9DA] px-7 py-2.5">
        <span className="text-[11px] font-medium tracking-wide text-[var(--ds-secondary-label)] uppercase">Filters</span>
        <select
          value={filterStage}
          onChange={(e) => {
            setFilterStage(e.target.value);
            setFilterMilestone(ALL);
          }}
          className={selectClass}
        >
          <option value={ALL}>All stages</option>
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select value={filterMilestone} onChange={(e) => setFilterMilestone(e.target.value)} className={selectClass}>
          <option value={ALL}>All milestones</option>
          {milestoneOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className={selectClass}>
          <option value={ALL}>All assignees</option>
          {teamMembers.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className={selectClass}>
          <option value={ALL}>Any priority</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-[var(--ds-accent-hover)] hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      <div className="px-7 py-5">
        {isLoading && <LoadingSpinner label="Loading tasks…" />}
        {error && <p className="text-sm text-red-700">{error}</p>}

        {!isLoading && isAssigneesLoading && (
          <div className="mb-3 flex items-center gap-2 text-xs text-[var(--ds-secondary-label)]">
            <span className="inline-block size-3.5 animate-spin rounded-full border-2 border-[var(--ds-accent)] border-t-transparent" />
            Loading assignees…
          </div>
        )}

        {!isLoading && viewMode === "kanban" && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {BOARD_COLUMNS.map((col) => (
              <TaskKanbanColumn
                key={col.id}
                columnId={col.id}
                tasks={filteredVisible.filter((t) => t.status === col.id)}
                draggedId={draggedId}
                isOver={overColumn === col.id}
                showAssigneeNames={isAdmin || canManage}
                onDragEnter={(e) => {
                  e.preventDefault();
                  dragEnterCount.current[col.id] = (dragEnterCount.current[col.id] ?? 0) + 1;
                  setOverColumn(col.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overColumn !== col.id) setOverColumn(col.id);
                }}
                onDragLeave={() => {
                  dragEnterCount.current[col.id] = (dragEnterCount.current[col.id] ?? 1) - 1;
                  if ((dragEnterCount.current[col.id] ?? 0) <= 0) {
                    dragEnterCount.current[col.id] = 0;
                    setOverColumn(null);
                  }
                }}
                onDrop={() => handleDrop(col.id)}
                onAddTask={canManage ? setCreateStatus : () => undefined}
                onCardClick={setSelectedTask}
                onCardDragStart={(id) => {
                  draggedIdRef.current = id;
                  setDraggedId(id);
                }}
                onCardDragEnd={() => {
                  draggedIdRef.current = null;
                  setDraggedId(null);
                  setOverColumn(null);
                  dragEnterCount.current = {};
                }}
                canAdd={canManage}
              />
            ))}
          </div>
        )}

        {!isLoading && viewMode === "list" && (
          <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
            <TaskListHeader />
            {filteredVisible.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--ds-tertiary-label)]">No tasks match the current filters.</div>
            ) : (
              filteredVisible.map((task, i) => (
                <div key={task.id} className={i < filteredVisible.length - 1 ? "border-b" : ""}>
                  <TaskListRow task={task} onClick={() => setSelectedTask(task)} />
                </div>
              ))
            )}
          </div>
        )}

        {!isLoading && viewMode === "milestones" && (
          <TaskMilestoneView tasks={filteredAll} stages={stages} onTaskClick={setSelectedTask} />
        )}

        {!isLoading && viewMode === "team" && (
          <TaskTeamView
            tasks={filteredAll}
            members={teamMembers}
            currentUserId={currentUser?.userId}
            onTaskClick={setSelectedTask}
          />
        )}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        canManage={canManage}
        currentUserId={currentUser?.userId}
        members={memberUsers}
        stageRange={selectedTaskStageRange}
        onUpdateAssignees={updateTaskAssignees}
        onMarkMyCompletion={markMyCompletion}
        onUpdateStatus={handleSheetStatusChange}
        onReopen={async (taskId) => {
          await reopenTask(taskId);
          setSelectedTask((prev) =>
            prev?.id === taskId
              ? { ...prev, status: "in-progress", apiStatus: "REOPENED" }
              : prev
          );
        }}
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

      {showMilestoneManagement && (
        <MilestoneManagementModal projectId={projectId} onClose={() => setShowMilestoneManagement(false)} />
      )}
    </div>
  );
}
