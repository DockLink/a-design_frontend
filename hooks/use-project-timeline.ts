"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useProjectContext } from "@/components/projects/project-context";
import { useProjectMembers } from "@/hooks/use-project-members";
import { useProjectTaskables } from "@/hooks/use-project-taskables";
import { authApiClient } from "@/lib/api/authenticated-client";
import { canManageProject } from "@/lib/projects/permissions";
import { mapMilestoneToView, mapStageToView } from "@/lib/projects/map-stages";
import {
  buildTimelineGroups,
  computeChartBounds,
  deriveTimelineStatus,
  type TimelineStageGroup,
  type TimelineTaskItem,
} from "@/lib/projects/timeline";
import { withTaskEndDate } from "@/lib/tasks/create-task-payload";
import type { CreateTaskRequest, Task, TaskableStatus } from "@/types/tasks";

export function useProjectTimeline(projectId: string) {
  const { project } = useProjectContext();
  const { effectiveRole } = useProjectMembers();

  const {
    tasks: stageTasks,
    isLoading: stagesLoading,
    error: stagesError,
    refetch: refetchStages,
  } = useProjectTaskables(projectId, "STAGE");

  const {
    tasks: milestoneTasks,
    isLoading: milestonesLoading,
    error: milestonesError,
    refetch: refetchMilestones,
    createTaskable,
  } = useProjectTaskables(projectId, "MILESTONE");

  const [milestoneStageMap, setMilestoneStageMap] = useState<
    Record<string, { stageId: string; stageName: string }>
  >({});
  const [milestoneTasksMap, setMilestoneTasksMap] = useState<
    Record<string, TimelineTaskItem[]>
  >({});
  const [hierarchyLoading, setHierarchyLoading] = useState(false);

  const stages = useMemo(() => stageTasks.map((s) => mapStageToView(s)), [stageTasks]);
  const milestones = useMemo(
    () => milestoneTasks.map((m) => mapMilestoneToView(m)),
    [milestoneTasks]
  );

  const loadHierarchy = useCallback(async () => {
    if (stageTasks.length === 0) {
      setMilestoneStageMap({});
      setMilestoneTasksMap({});
      return;
    }
    setHierarchyLoading(true);
    try {
      const parentMap: Record<string, { stageId: string; stageName: string }> = {};
      const tasksByMilestone: Record<string, TimelineTaskItem[]> = {};

      await Promise.all(
        stageTasks.map(async (stage) => {
          try {
            const detail = await authApiClient<Task & { children?: Task[] }>(
              `/tasks/${stage.id}?include_children=true`
            );
            for (const child of detail.children ?? []) {
              if (child.taskableType === "MILESTONE") {
                parentMap[child.id] = { stageId: stage.id, stageName: stage.title };
                // Load tasks under this milestone
                try {
                  const milestoneDetail = await authApiClient<Task & { children?: Task[] }>(
                    `/tasks/${child.id}?include_children=true`
                  );
                  tasksByMilestone[child.id] = (milestoneDetail.children ?? [])
                    .filter((t) => t.taskableType === "TASK")
                    .map((t): TimelineTaskItem => {
                      const endIso = t.end_date ?? t.start_date;
                      return {
                        id: t.id,
                        title: t.title,
                        startDate: t.start_date,
                        endDate: endIso,
                        apiStatus: t.status,
                        status: deriveTimelineStatus(t.start_date, endIso, t.status),
                      };
                    });
                } catch {
                  // milestone may have no tasks yet
                }
              }
            }
          } catch {
            // stage may have no children yet
          }
        })
      );
      setMilestoneStageMap(parentMap);
      setMilestoneTasksMap(tasksByMilestone);
    } finally {
      setHierarchyLoading(false);
    }
  }, [stageTasks]);

  useEffect(() => {
    void loadHierarchy();
  }, [loadHierarchy]);

  const groups: TimelineStageGroup[] = useMemo(
    () => buildTimelineGroups(stages, milestones, milestoneStageMap, milestoneTasks, milestoneTasksMap),
    [stages, milestones, milestoneStageMap, milestoneTasks, milestoneTasksMap]
  );

  const chartBounds = useMemo(
    () => computeChartBounds(project, stages, milestones),
    [project, stages, milestones]
  );

  const canManage = canManageProject(effectiveRole);
  const isLoading = stagesLoading || milestonesLoading || hierarchyLoading;
  const error = stagesError ?? milestonesError;

  const createMilestone = useCallback(
    async (input: {
      title: string;
      description?: string;
      stageId: string;
      startDate: string;
      endDate: string;
      completed?: boolean;
    }) => {
      const stage = stages.find((s) => s.id === input.stageId);
      const order = milestoneTasks.filter(
        (m) => milestoneStageMap[m.id]?.stageId === input.stageId
      ).length;

      const payload = withTaskEndDate({
        project_id: projectId,
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        start_date: new Date(input.startDate).toISOString(),
        end_date: new Date(input.endDate + "T23:59:59").toISOString(),
        taskable_type: "MILESTONE",
        parent_taskable_id: input.stageId,
        order,
        status: (input.completed ? "COMPLETED" : "TODO") as TaskableStatus,
      });

      const created = await createTaskable(payload);
      await loadHierarchy();
      await refetchMilestones();
      return created;
    },
    [
      stages,
      milestoneTasks,
      milestoneStageMap,
      projectId,
      createTaskable,
      loadHierarchy,
      refetchMilestones,
    ]
  );

  const refetch = useCallback(async () => {
    await Promise.all([refetchStages(), refetchMilestones(), loadHierarchy()]);
  }, [refetchStages, refetchMilestones, loadHierarchy]);

  return {
    project,
    stages,
    groups,
    chartBounds,
    canManage,
    isLoading,
    error,
    createMilestone,
    refetch,
  };
}
