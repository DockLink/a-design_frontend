/**
 * Background upload queue pump.
 *
 * Processes Zustand upload jobs with limited file-level concurrency while
 * reusing the existing direct browser → S3 multipart uploader.
 */

import { toast } from "sonner";

import { uploadFileMultipart } from "@/lib/files/multipart-upload";
import {
  getUploadStore,
  notifyUploadComplete,
  useUploadStore,
} from "@/stores/upload-store";
import type { UploadJob } from "@/types/uploads";

/** Job ids currently being executed by this pump (avoids double-start). */
const inFlight = new Set<string>();

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

async function runJob(job: UploadJob): Promise<void> {
  const { updateJob } = getUploadStore();
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
      onProgress: (pct) => {
        const bytesUploaded = Math.round((pct / 100) * job.fileSize);
        updateJob(job.id, {
          progress: pct,
          bytesUploaded,
          etaSeconds: computeEtaSeconds(startedAt, pct, job.fileSize),
        });
      },
    });

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
    toast.success(`${job.fileName} uploaded`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    updateJob(job.id, {
      status: "failed",
      error: message,
      etaSeconds: null,
    });
    toast.error(`${job.fileName}: ${message}`);
  } finally {
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
