"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, GanttChart, List, Plus } from "lucide-react";

import { useProjectContext } from "@/components/projects/project-context";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { exportTimelineToXlsx } from "@/lib/projects/export-timeline-xlsx";
import {
  computeTimelineSummary,
  getActiveStageGroup,
} from "@/lib/projects/timeline";
import { useProjectTimeline } from "@/hooks/use-project-timeline";

import { TimelineActivePhaseBar } from "./timeline-active-phase-bar";
import { TimelineAddMilestoneDialog } from "./timeline-add-milestone-dialog";
import { TimelineGantt } from "./timeline-gantt";
import { TimelineList } from "./timeline-list";
import { TimelineSummaryCards } from "./timeline-summary-cards";

type ViewMode = "gantt" | "list";

export function ProjectTimelineBoard({ projectId }: { projectId: string }) {
  const { project } = useProjectContext();
  const { stages, groups, chartBounds, canManage, isLoading, error, createMilestone, refetch } =
    useProjectTimeline(projectId);

  const [viewMode, setViewMode] = useState<ViewMode>("gantt");
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);

  // Refresh timeline when the tab regains focus (e.g. after editing tasks elsewhere).
  useEffect(() => {
    function onFocus() {
      void refetch();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void refetch();
    });
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [refetch]);

  function toggleStage(stageId: string) {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  }

  function handleExport() {
    if (groups.length === 0) return;
    exportTimelineToXlsx(groups, project?.name ?? "project");
  }

  const canExport = !isLoading && !error && groups.length > 0;

  const summary = useMemo(() => computeTimelineSummary(groups), [groups]);
  const activeStage = useMemo(
    () => getActiveStageGroup(groups, chartBounds.today),
    [groups, chartBounds.today]
  );

  return (
    <div className="-mx-7 -mt-6">
      <div className="sticky top-[44px] z-[98] flex items-center justify-between gap-3 border-b border-[rgba(90,60,30,0.08)] bg-[#EDE3D4] px-7 py-3">
        <span className="text-[22px] font-medium text-[var(--ds-label)]">Timeline</span>
        <div className="flex items-center gap-2.5">
          <div className="inline-flex rounded-lg bg-[var(--ds-bg)] p-1">
            {(
              [
                { id: "gantt" as const, icon: GanttChart, label: "Gantt" },
                { id: "list" as const, icon: List, label: "List" },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md px-3 text-sm ${
                  viewMode === id
                    ? "bg-white text-[var(--ds-accent)] shadow-sm"
                    : "text-[var(--ds-secondary-label)]"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canExport}
            onClick={handleExport}
            className="h-8 gap-1 border-[rgba(90,60,30,0.22)] text-[var(--ds-secondary-label)]"
          >
            <Download className="size-3.5" />
            Export
          </Button>
          {canManage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdd(true)}
              className="h-8 gap-1 border-[rgba(90,60,30,0.22)] text-[var(--ds-secondary-label)]"
            >
              <Plus className="size-3.5" />
              Add milestone
            </Button>
          )}
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-140px)] flex-col gap-4 bg-[#EDE3D4] px-7 py-5 pb-20">
        {isLoading && <LoadingSpinner label="Loading timeline…" />}
        {error && !isLoading && (
          <div className="py-8 text-center text-sm text-red-700">{error}</div>
        )}
        {!isLoading && !error && (
          <>
            <TimelineSummaryCards summary={summary} />
            {viewMode === "gantt" && (
              <TimelineGantt
                groups={groups}
                chartBounds={chartBounds}
                collapsedStages={collapsedStages}
                onToggleStage={toggleStage}
              />
            )}
            {viewMode === "list" && (
              <TimelineList groups={groups} canManage={canManage} onAddClick={() => setShowAdd(true)} />
            )}
            {viewMode === "gantt" && activeStage && (
              <TimelineActivePhaseBar stage={activeStage} />
            )}
          </>
        )}
      </div>

      <TimelineAddMilestoneDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        stages={stages}
        onSave={createMilestone}
      />
    </div>
  );
}
