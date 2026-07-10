"use client";

import { Flag, X } from "lucide-react";

import { ProjectMilestonesEditor } from "@/components/projects/project-milestones-editor";

export function MilestoneManagementModal({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
      />
      <div className="fixed left-1/2 top-1/2 z-[201] flex max-h-[88vh] w-[min(580px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-[var(--ds-surface-elevated)] shadow-[0_24px_70px_rgba(60,40,20,0.28)]">
        <div className="flex items-center justify-between border-b border-[rgba(90,60,30,0.10)] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#F5E6D0] text-[var(--ds-accent-hover)]">
              <Flag size={16} />
            </span>
            <h2 className="text-[16px] font-semibold text-[var(--ds-label)]">Manage milestones</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-[var(--ds-secondary-label)] hover:bg-[var(--ds-bg)]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <ProjectMilestonesEditor projectId={projectId} />
        </div>
      </div>
    </>
  );
}
