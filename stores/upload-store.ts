"use client";

import { create } from "zustand";

import type {
  EnqueueUploadInput,
  UploadCompleteListener,
  UploadJob,
} from "@/types/uploads";

const onCompleteListeners = new Set<UploadCompleteListener>();

interface UploadStore {
  jobs: UploadJob[];
  maxConcurrent: number;
  enqueue: (input: EnqueueUploadInput) => string[];
  updateJob: (id: string, patch: Partial<UploadJob>) => void;
  removeJob: (id: string) => void;
  clearFinished: () => void;
}

function kickUploadPump() {
  // Dynamic import avoids a circular dependency with the queue worker.
  void import("@/lib/files/upload-queue").then(({ pumpUploadQueue }) => {
    pumpUploadQueue();
  });
}

export const useUploadStore = create<UploadStore>((set) => ({
  jobs: [],
  maxConcurrent: 2,

  enqueue: (input) => {
    const createdAt = Date.now();
    const jobs: UploadJob[] = input.files.map((file) => ({
      id: crypto.randomUUID(),
      projectId: input.projectId,
      folderPath: input.folderPath,
      folderLabel: input.folderLabel,
      file,
      fileName: file.name,
      fileSize: file.size,
      replaceFileId: input.replaceFileId,
      status: "queued",
      progress: 0,
      bytesUploaded: 0,
      etaSeconds: null,
      createdAt,
    }));

    set((state) => ({ jobs: [...state.jobs, ...jobs] }));
    kickUploadPump();
    return jobs.map((j) => j.id);
  },

  updateJob: (id, patch) => {
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, ...patch } : job
      ),
    }));
  },

  removeJob: (id) => {
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
    }));
  },

  clearFinished: () => {
    set((state) => ({
      jobs: state.jobs.filter(
        (job) => job.status === "queued" || job.status === "uploading"
      ),
    }));
  },
}));

export function subscribeOnComplete(listener: UploadCompleteListener): () => void {
  onCompleteListeners.add(listener);
  return () => {
    onCompleteListeners.delete(listener);
  };
}

export function notifyUploadComplete(job: UploadJob): void {
  for (const listener of onCompleteListeners) {
    try {
      listener(job);
    } catch {
      // Listeners must not break the upload queue.
    }
  }
}

export function selectActiveJobCount(jobs: UploadJob[]): number {
  return jobs.filter(
    (j) => j.status === "queued" || j.status === "uploading"
  ).length;
}

/** Imperative helper for the worker — avoids circular imports via getState. */
export function getUploadStore() {
  return useUploadStore.getState();
}
