"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useProjectTimeline } from "@/hooks/use-project-timeline";

import { TimelineAddMilestoneDialog } from "./timeline-add-milestone-dialog";
import { TimelineGantt } from "./timeline-gantt";
import { TimelineList } from "./timeline-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type ViewMode = "gantt" | "list";

export function ProjectTimelineBoard({ projectId }: { projectId: string }) {
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

  return (
    <div className="-mx-7 -mt-6">
      <div className="sticky top-[44px] z-[98] flex items-center justify-between gap-3 border-b border-[rgba(90,60,30,0.08)] bg-[#EDE3D4] px-7 py-3">
        <span className="text-[22px] font-medium text-[var(--ds-label)]">Timeline</span>
        <div className="flex items-center gap-2.5">
          <div className="inline-flex h-[38px] rounded-lg bg-[var(--ds-bg)] p-0.5">
            {(["gantt", "list"] as ViewMode[]).map((mode) => {
              const active = viewMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`h-full rounded-md px-4 text-[13px] capitalize transition-all ${active ? "border border-[var(--ds-accent)] bg-[var(--ds-surface-elevated)] font-medium text-[var(--ds-accent)]" : "text-[var(--ds-secondary-label)]"}`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
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

      <div className="flex min-h-[calc(100vh-140px)] flex-col bg-[#EDE3D4] px-7 py-5">
        {isLoading && <LoadingSpinner label="Loading timeline…" />}
        {error && !isLoading && (
          <div className="py-8 text-center text-sm text-red-700">{error}</div>
        )}
        {!isLoading && !error && viewMode === "gantt" && (
          <TimelineGantt
            groups={groups}
            chartBounds={chartBounds}
            collapsedStages={collapsedStages}
            onToggleStage={toggleStage}
          />
        )}
        {!isLoading && !error && viewMode === "list" && (
          <TimelineList groups={groups} canManage={canManage} onAddClick={() => setShowAdd(true)} />
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
