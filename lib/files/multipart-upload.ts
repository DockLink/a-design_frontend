/**
 * Direct browser → S3 multipart upload.
 *
 * The file bytes are split into parts and PUT straight to S3 using presigned
 * URLs, so they never pass through Next.js or NestJS. This removes every
 * app-level body-size limit and supports arbitrarily large files.
 *
 * Flow: initiate → presign part URLs in batches → PUT each part to S3 → complete.
 *
 * Control requests always use a fresh access token (with refresh-on-401) so
 * multi-GB uploads that run longer than the JWT lifetime can still finish.
 *
 * NOTE: the S3 bucket CORS policy MUST allow PUT from the app origin and
 * expose the `ETag` response header, otherwise the per-part ETag cannot be
 * read and the upload cannot be completed.
 */

import { recordActivity } from "@/lib/auth/activity";
import {
  ensureFreshToken,
  isAuthExpiryError,
  refreshAccessToken,
} from "@/lib/auth/token-refresh";
import { ApiError } from "@/types/api";

type ProgressCb = (pct: number) => void;

interface PartUrl {
  partNumber: number;
  url: string;
}

interface InitiateResponse {
  data: { uploadId: string; key: string; partSize: number };
}

interface PresignResponse {
  data: { urls: PartUrl[] };
}

/** Parallel S3 part uploads per file. */
const PART_CONCURRENCY = 6;

/** Presign this many parts at a time so JWT stays fresh on very large files. */
const PRESIGN_BATCH_SIZE = 24;

export class UploadAbortedError extends Error {
  constructor(message = "Upload aborted") {
    super(message);
    this.name = "UploadAbortedError";
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new UploadAbortedError();
  }
}

async function controlRequest<T>(path: string, body: unknown): Promise<T> {
  const attempt = async (token: string): Promise<T> => {
    const res = await fetch(path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const parsed = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        (parsed as { message?: string | string[] }).message ?? "Upload step failed";
      const text = Array.isArray(message) ? message.join(", ") : String(message);
      throw new ApiError(res.status, { message: text, statusCode: res.status });
    }
    return parsed as T;
  };

  const token = await ensureFreshToken();
  if (!token) throw new Error("Not authenticated");

  try {
    return await attempt(token);
  } catch (error) {
    if (isAuthExpiryError(error)) {
      const newToken = await refreshAccessToken();
      if (newToken) return attempt(newToken);
      throw new Error("Session expired, please log in");
    }
    throw error instanceof ApiError ? new Error(error.message) : error;
  }
}

function putPart(
  url: string,
  blob: Blob,
  onPartProgress: (loaded: number) => void,
  signal?: AbortSignal
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new UploadAbortedError());
      return;
    }

    const xhr = new XMLHttpRequest();
    const onAbort = () => {
      xhr.abort();
      reject(new UploadAbortedError());
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    xhr.open("PUT", url);
    if (xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onPartProgress(e.loaded);
      };
    }
    xhr.onload = () => {
      signal?.removeEventListener("abort", onAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag");
        if (!etag) {
          reject(
            new Error(
              "S3 did not return an ETag. Check the bucket CORS config exposes the ETag header."
            )
          );
          return;
        }
        onPartProgress(blob.size);
        resolve(etag);
      } else {
        reject(new Error(`A file part failed to upload (HTTP ${xhr.status}).`));
      }
    };
    xhr.onerror = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new Error("Network error during upload."));
    };
    xhr.onabort = () => {
      signal?.removeEventListener("abort", onAbort);
      reject(new UploadAbortedError());
    };
    xhr.send(blob);
  });
}

export async function uploadFileMultipart(opts: {
  projectId: string;
  folderPath: string;
  file: File;
  replaceFileId?: string;
  onProgress?: ProgressCb;
  signal?: AbortSignal;
}): Promise<unknown> {
  const { projectId, folderPath, file, replaceFileId, onProgress, signal } = opts;

  if (file.size === 0) {
    throw new Error("Cannot upload an empty file.");
  }

  throwIfAborted(signal);

  const base = `/api/projects/${projectId}/files/multipart`;

  const init = await controlRequest<InitiateResponse>(`${base}/initiate`, {
    folderPath,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  });
  const { uploadId, key, partSize } = init.data;

  try {
    throwIfAborted(signal);

    const totalParts = Math.max(1, Math.ceil(file.size / partSize));
    const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

    const loadedPerPart = new Array<number>(totalParts).fill(0);
    const reportProgress = () => {
      recordActivity();
      if (!onProgress) return;
      const loaded = loadedPerPart.reduce((a, b) => a + b, 0);
      // Reserve 100% for after the "complete" call succeeds.
      onProgress(Math.min(99, Math.round((loaded / file.size) * 100)));
    };

    const parts: { partNumber: number; etag: string }[] = [];

    const uploadOne = async (partNumber: number, url: string) => {
      throwIfAborted(signal);
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);
      const etag = await putPart(
        url,
        blob,
        (loaded) => {
          loadedPerPart[partNumber - 1] = loaded;
          reportProgress();
        },
        signal
      );
      parts.push({ partNumber, etag });
    };

    // Presign and upload in rolling batches so control calls use fresh tokens.
    for (let batchStart = 0; batchStart < partNumbers.length; batchStart += PRESIGN_BATCH_SIZE) {
      throwIfAborted(signal);
      const batch = partNumbers.slice(batchStart, batchStart + PRESIGN_BATCH_SIZE);
      const presigned = await controlRequest<PresignResponse>(`${base}/presign`, {
        key,
        uploadId,
        partNumbers: batch,
      });
      throwIfAborted(signal);
      const urlByPart = new Map(
        presigned.data.urls.map((u) => [u.partNumber, u.url])
      );

      let cursor = 0;
      const worker = async () => {
        while (cursor < batch.length) {
          throwIfAborted(signal);
          const partNumber = batch[cursor++];
          const url = urlByPart.get(partNumber);
          if (!url) throw new Error(`Missing presigned URL for part ${partNumber}.`);
          await uploadOne(partNumber, url);
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(PART_CONCURRENCY, batch.length) }, () => worker())
      );
    }

    throwIfAborted(signal);
    parts.sort((a, b) => a.partNumber - b.partNumber);

    const completed = await controlRequest<{ data: unknown }>(`${base}/complete`, {
      folderPath,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      replaceFileId,
      key,
      uploadId,
      parts,
      fileSize: file.size,
    });

    onProgress?.(100);
    return completed.data;
  } catch (err) {
    // Best-effort cleanup so we don't leave dangling multipart uploads in S3.
    await controlRequest(`${base}/abort`, { key, uploadId }).catch(() => undefined);
    throw err;
  }
}
