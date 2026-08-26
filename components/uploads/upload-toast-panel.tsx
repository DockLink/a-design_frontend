"use client";

import { useEffect } from "react";
import {
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { formatFileSize } from "@/lib/files/format";
import {
  selectActiveJobCount,
  useUploadStore,
} from "@/stores/upload-store";
import type { UploadJob } from "@/types/uploads";

function formatEta(seconds: number | null | undefined): string {
  if (seconds == null) return "Calculating…";
  if (seconds <= 0) return "";
  if (seconds < 60) return `${seconds} sec left`;
  const mins = Math.ceil(seconds / 60);
  if (mins === 1) return "About 1 min left";
  return `About ${mins} min left`;
}

function statusIcon(job: UploadJob) {
  if (job.status === "completed") {
    return <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />;
  }
  if (job.status === "failed") {
    return <XCircle size={14} className="shrink-0 text-red-600" />;
  }
  if (job.status === "paused") {
    return (
      <Pause
        size={14}
        className="shrink-0"
        style={{ color: "var(--ds-secondary-label)" }}
      />
    );
  }
  if (job.status === "uploading") {
    return (
      <Loader2
        size={14}
        className="shrink-0 animate-spin"
        style={{ color: "var(--ds-accent)" }}
      />
    );
  }
  return (
    <Upload
      size={14}
      className="shrink-0"
      style={{ color: "var(--ds-secondary-label)" }}
    />
  );
}

function JobRow({ job }: { job: UploadJob }) {
  const pauseJob = useUploadStore((s) => s.pauseJob);
  const resumeJob = useUploadStore((s) => s.resumeJob);
  const cancelJob = useUploadStore((s) => s.cancelJob);

  const barWidth =
    job.status === "completed"
      ? 100
      : job.status === "uploading" || job.status === "paused"
        ? Math.max(job.progress, job.status === "paused" ? 0 : 2)
        : job.status === "failed"
          ? job.progress
          : 0;

  const showActions =
    job.status === "queued" ||
    job.status === "uploading" ||
    job.status === "paused";

  return (
    <div className="rounded-lg bg-[var(--ds-bg)] px-3 py-2">
      <div className="mb-1.5 flex items-start gap-2">
        {statusIcon(job)}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-[var(--ds-label)]">
            {job.fileName}
          </p>
          <p className="truncate text-[11px] text-[var(--ds-secondary-label)]">
            {job.folderLabel ?? job.folderPath}
            {" · "}
            {formatFileSize(job.fileSize)}
          </p>
        </div>
        {(job.status === "uploading" ||
          job.status === "queued" ||
          job.status === "paused") && (
          <span className="shrink-0 text-[11px] tabular-nums text-[var(--ds-secondary-label)]">
            {job.status === "queued"
              ? "Queued"
              : job.status === "paused"
                ? job.progress > 0
                  ? `Paused · ${job.progress}%`
                  : "Paused"
                : `${job.progress}%`}
          </span>
        )}
        {showActions && (
          <div className="flex shrink-0 items-center gap-0.5">
            {job.status === "paused" ? (
              <button
                type="button"
                onClick={() => resumeJob(job.id)}
                className="rounded p-1 text-[var(--ds-secondary-label)] hover:bg-[var(--ds-surface-elevated)] hover:text-[var(--ds-label)]"
                aria-label={`Resume ${job.fileName}`}
              >
                <Play size={12} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => pauseJob(job.id)}
                className="rounded p-1 text-[var(--ds-secondary-label)] hover:bg-[var(--ds-surface-elevated)] hover:text-[var(--ds-label)]"
                aria-label={`Pause ${job.fileName}`}
              >
                <Pause size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => cancelJob(job.id)}
              className="rounded p-1 text-[var(--ds-secondary-label)] hover:bg-[var(--ds-surface-elevated)] hover:text-[var(--ds-label)]"
              aria-label={`Cancel ${job.fileName}`}
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {(job.status === "uploading" ||
        job.status === "queued" ||
        job.status === "paused" ||
        job.status === "completed") && (
        <div
          className="overflow-hidden rounded-full bg-[#EDE3D4]"
          style={{ height: 4 }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${barWidth}%`,
              background:
                job.status === "completed"
                  ? "#059669"
                  : job.status === "paused"
                    ? "var(--ds-secondary-label)"
                    : "var(--ds-accent)",
            }}
          />
        </div>
      )}

      {job.status === "uploading" && (
        <p className="mt-1 text-[11px] text-[var(--ds-secondary-label)]">
          {formatEta(job.etaSeconds)}
        </p>
      )}
      {job.status === "failed" && job.error && (
        <p className="mt-1 text-[11px] text-red-600">{job.error}</p>
      )}
    </div>
  );
}

export function UploadToastPanel() {
  const jobs = useUploadStore((s) => s.jobs);
  const clearFinished = useUploadStore((s) => s.clearFinished);
  const activeCount = selectActiveJobCount(jobs);
  const failedCount = jobs.filter((j) => j.status === "failed").length;
  const finishedCount = jobs.filter(
    (j) => j.status === "completed" || j.status === "failed"
  ).length;
  const uploadingCount = jobs.filter((j) => j.status === "uploading").length;
  const pausedCount = jobs.filter((j) => j.status === "paused").length;
  const totalPendingOrDone = jobs.length;

  useEffect(() => {
    if (activeCount === 0) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [activeCount]);

  if (totalPendingOrDone === 0) return null;

  const visibleJobs = jobs.filter((j) => j.status !== "cancelled");
  const completedCount = visibleJobs.filter((j) => j.status === "completed").length;
  const headerLabel =
    activeCount > 0
      ? `Uploading ${Math.min(completedCount + uploadingCount, visibleJobs.length)} of ${visibleJobs.length}`
      : pausedCount > 0 && finishedCount === 0
        ? `${pausedCount} upload${pausedCount > 1 ? "s" : ""} paused`
        : `${finishedCount} upload${finishedCount > 1 ? "s" : ""} finished`;

  return (
    <div
      className="fixed z-[300] flex w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border shadow-lg"
      style={{
        right: 16,
        bottom: 16,
        borderColor: "rgba(90,60,30,0.12)",
        background: "var(--ds-surface-elevated)",
        maxHeight: "min(420px, calc(100vh - 6rem))",
      }}
      role="status"
      aria-live="polite"
    >
      <div
        className="flex items-center justify-between gap-2 border-b px-3 py-2.5"
        style={{ borderColor: "rgba(90,60,30,0.10)" }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Upload size={14} style={{ color: "var(--ds-accent)" }} />
          <p className="truncate text-[13px] font-semibold text-[var(--ds-label)]">
            {headerLabel}
          </p>
        </div>
        {failedCount > 0 && (
          <button
            type="button"
            onClick={() => clearFinished()}
            className="flex shrink-0 items-center gap-1 text-[11px] text-[var(--ds-secondary-label)] hover:text-[var(--ds-label)]"
            aria-label="Clear finished uploads"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1.5 overflow-y-auto p-2.5">
        {visibleJobs.map((job) => (
          <JobRow key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
