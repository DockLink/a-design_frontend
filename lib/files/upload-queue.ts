/**
 * Background upload queue pump.
 *
 * Processes Zustand upload jobs with limited file-level concurrency while
 * reusing the existing direct browser → S3 multipart uploader.
 */

import { toast } from "sonner";

import {
  abortUploadJob,
  registerUploadController,
  unregisterUploadController,
} from "@/lib/files/upload-abort";
import { dispatchOpenUploadFolder } from "@/lib/files/open-upload-folder";
import {
  UploadAbortedError,
  uploadFileMultipart,
} from "@/lib/files/multipart-upload";
import {
  getUploadStore,
  notifyUploadComplete,
  useUploadStore,
} from "@/stores/upload-store";
import type { UploadJob } from "@/types/uploads";

/** Job ids currently being executed by this pump (avoids double-start). */
const inFlight = new Set<string>();

/** How long a completed row stays in the bottom panel before auto-clear. */
const COMPLETED_CLEAR_MS = 1500;

export { abortUploadJob };

function computeEtaSeconds(
  startedAt: number,
  progress: number,
  fileSize: number
): number | null {
  if (progress < 2 || fileSize <= 0) return null;
  const elapsedSec = (Date.now() - startedAt) / 1000;
  if (elapsedSec <= 0) return null;
  const bytesUploaded = (progress / 100) * fileSize;
  const speed = bytesUploaded / elapsedSec;
  if (speed <= 0) return null;
  const remaining = fileSize - bytesUploaded;
  return Math.max(1, Math.ceil(remaining / speed));
}

function isAbortError(err: unknown): boolean {
  return err instanceof UploadAbortedError;
}

async function runJob(job: UploadJob): Promise<void> {
  const { updateJob } = getUploadStore();
  const controller = new AbortController();
  registerUploadController(job.id, controller);

  // Pause/cancel may have won the race between pump claim and worker start.
  const latest = getUploadStore().jobs.find((j) => j.id === job.id);
  if (
    !latest ||
    latest.status === "paused" ||
    latest.status === "cancelled"
  ) {
    return;
  }

  const startedAt = Date.now();
  updateJob(job.id, {
    status: "uploading",
    progress: 0,
    bytesUploaded: 0,
    startedAt,
    etaSeconds: null,
    error: undefined,
  });

  try {
    await uploadFileMultipart({
      projectId: job.projectId,
      folderPath: job.folderPath,
      file: job.file,
      replaceFileId: job.replaceFileId,
      signal: controller.signal,
      onProgress: (pct) => {
        // Ignore progress after user pause/cancel flipped status.
        const current = getUploadStore().jobs.find((j) => j.id === job.id);
        if (
          !current ||
          current.status === "paused" ||
          current.status === "cancelled"
        ) {
          return;
        }
        const bytesUploaded = Math.round((pct / 100) * job.fileSize);
        updateJob(job.id, {
          progress: pct,
          bytesUploaded,
          etaSeconds: computeEtaSeconds(startedAt, pct, job.fileSize),
        });
      },
    });

    const current = getUploadStore().jobs.find((j) => j.id === job.id);
    if (
      !current ||
      current.status === "paused" ||
      current.status === "cancelled"
    ) {
      return;
    }

    const completed: UploadJob = {
      ...job,
      status: "completed",
      progress: 100,
      bytesUploaded: job.fileSize,
      etaSeconds: 0,
      startedAt,
      error: undefined,
    };
    updateJob(job.id, {
      status: "completed",
      progress: 100,
      bytesUploaded: job.fileSize,
      etaSeconds: 0,
    });
    notifyUploadComplete(completed);
    toast.success(`${job.fileName} uploaded`, {
      description: job.folderLabel ?? job.folderPath,
      duration: 7000,
      action: {
        label: "View",
        onClick: () => {
          dispatchOpenUploadFolder(job.projectId, job.folderPath);
        },
      },
    });
    window.setTimeout(() => {
      const still = getUploadStore().jobs.find((j) => j.id === job.id);
      if (still?.status === "completed") {
        getUploadStore().removeJob(job.id);
      }
    }, COMPLETED_CLEAR_MS);
  } catch (err) {
    if (isAbortError(err)) {
      const current = getUploadStore().jobs.find((j) => j.id === job.id);
      // pauseJob / cancelJob already set the terminal status; keep progress.
      if (current?.status === "paused" || current?.status === "cancelled") {
        return;
      }
      updateJob(job.id, {
        status: "cancelled",
        etaSeconds: null,
      });
      return;
    }

    const message = err instanceof Error ? err.message : "Upload failed";
    const current = getUploadStore().jobs.find((j) => j.id === job.id);
    if (
      current?.status === "paused" ||
      current?.status === "cancelled"
    ) {
      return;
    }
    updateJob(job.id, {
      status: "failed",
      error: message,
      etaSeconds: null,
    });
    toast.error(`${job.fileName}: ${message}`);
  } finally {
    unregisterUploadController(job.id);
    inFlight.delete(job.id);
  }
}

export function pumpUploadQueue(): void {
  const { jobs, maxConcurrent, updateJob } = useUploadStore.getState();
  const busy = jobs.filter(
    (j) => j.status === "uploading" || inFlight.has(j.id)
  ).length;
  const slots = maxConcurrent - busy;
  if (slots <= 0) return;

  const next = jobs
    .filter((j) => j.status === "queued" && !inFlight.has(j.id))
    .slice(0, slots);

  for (const job of next) {
    inFlight.add(job.id);
    // Claim immediately so concurrent pumps do not pick the same job.
    updateJob(job.id, {
      status: "uploading",
      progress: 0,
      startedAt: Date.now(),
    });
    void runJob(job).then(() => {
      pumpUploadQueue();
    });
  }
}
