"use client";

import { create } from "zustand";

import { abortUploadJob } from "@/lib/files/upload-abort";
import {
  destinationFolderPath,
  folderLabelFromPath,
} from "@/lib/files/upload-relative-path";
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
  pauseJob: (id: string) => void;
  resumeJob: (id: string) => void;
  cancelJob: (id: string) => void;
}

function kickUploadPump() {
  // Dynamic import avoids a circular dependency with the queue worker.
  void import("@/lib/files/upload-queue").then(({ pumpUploadQueue }) => {
    pumpUploadQueue();
  });
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  jobs: [],
  maxConcurrent: 2,

  enqueue: (input) => {
    const createdAt = Date.now();
    const jobs: UploadJob[] = input.files.map((item) => {
      const folderPath = destinationFolderPath(
        input.folderPath,
        item.relativePath
      );
      const folderLabel =
        folderPath === input.folderPath
          ? input.folderLabel
          : folderLabelFromPath(folderPath);
      return {
        id: crypto.randomUUID(),
        projectId: input.projectId,
        folderPath,
        folderLabel,
        file: item.file,
        fileName: item.file.name,
        fileSize: item.file.size,
        replaceFileId: input.replaceFileId,
        status: "queued" as const,
        progress: 0,
        bytesUploaded: 0,
        etaSeconds: null,
        createdAt,
      };
    });

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
        (job) =>
          job.status === "queued" ||
          job.status === "uploading" ||
          job.status === "paused"
      ),
    }));
  },

  pauseJob: (id) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return;
    if (job.status !== "queued" && job.status !== "uploading") return;

    const wasUploading = job.status === "uploading";
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id
          ? { ...j, status: "paused" as const, etaSeconds: null }
          : j
      ),
    }));
    if (wasUploading) abortUploadJob(id);
    else kickUploadPump();
  },

  resumeJob: (id) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job || job.status !== "paused") return;

    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id
          ? {
              ...j,
              status: "queued" as const,
              progress: 0,
              bytesUploaded: 0,
              etaSeconds: null,
              error: undefined,
              startedAt: undefined,
            }
          : j
      ),
    }));
    kickUploadPump();
  },

  cancelJob: (id) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return;
    if (
      job.status !== "queued" &&
      job.status !== "uploading" &&
      job.status !== "paused"
    ) {
      return;
    }

    const wasUploading = job.status === "uploading";
    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id
          ? { ...j, status: "cancelled" as const, etaSeconds: null }
          : j
      ),
    }));
    if (wasUploading) abortUploadJob(id);
    else kickUploadPump();
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
