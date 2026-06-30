/**
 * Direct browser → S3 multipart upload.
 *
 * The file bytes are split into parts and PUT straight to S3 using presigned
 * URLs, so they never pass through Next.js or NestJS. This removes every
 * app-level body-size limit and supports arbitrarily large files.
 *
 * Flow: initiate → presign part URLs → PUT each part to S3 → complete.
 *
 * NOTE: the S3 bucket CORS policy MUST allow PUT from the app origin and
 * expose the `ETag` response header, otherwise the per-part ETag cannot be
 * read and the upload cannot be completed.
 */

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

// Upload up to this many parts in parallel to keep large uploads fast.
const PART_CONCURRENCY = 4;

async function controlRequest<T>(
  path: string,
  token: string,
  body: unknown
): Promise<T> {
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
    throw new Error(
      (parsed as { message?: string }).message ?? "Upload step failed"
    );
  }
  return parsed as T;
}

function putPart(
  url: string,
  blob: Blob,
  onPartProgress: (loaded: number) => void
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onPartProgress(e.loaded);
      };
    }
    xhr.onload = () => {
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
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(blob);
  });
}

export async function uploadFileMultipart(opts: {
  projectId: string;
  folderPath: string;
  file: File;
  replaceFileId?: string;
  token: string;
  onProgress?: ProgressCb;
}): Promise<unknown> {
  const { projectId, folderPath, file, replaceFileId, token, onProgress } = opts;

  if (file.size === 0) {
    throw new Error("Cannot upload an empty file.");
  }

  const base = `/api/projects/${projectId}/files/multipart`;

  const init = await controlRequest<InitiateResponse>(`${base}/initiate`, token, {
    folderPath,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  });
  const { uploadId, key, partSize } = init.data;

  try {
    const totalParts = Math.max(1, Math.ceil(file.size / partSize));
    const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

    const presigned = await controlRequest<PresignResponse>(
      `${base}/presign`,
      token,
      { key, uploadId, partNumbers }
    );
    const urlByPart = new Map(
      presigned.data.urls.map((u) => [u.partNumber, u.url])
    );

    const loadedPerPart = new Array<number>(totalParts).fill(0);
    const reportProgress = () => {
      if (!onProgress) return;
      const loaded = loadedPerPart.reduce((a, b) => a + b, 0);
      // Reserve 100% for after the "complete" call succeeds.
      onProgress(Math.min(99, Math.round((loaded / file.size) * 100)));
    };

    const parts: { partNumber: number; etag: string }[] = [];

    const uploadOne = async (partNumber: number) => {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, file.size);
      const blob = file.slice(start, end);
      const url = urlByPart.get(partNumber);
      if (!url) throw new Error(`Missing presigned URL for part ${partNumber}.`);
      const etag = await putPart(url, blob, (loaded) => {
        loadedPerPart[partNumber - 1] = loaded;
        reportProgress();
      });
      parts.push({ partNumber, etag });
    };

    // Bounded-concurrency worker pool over the part numbers.
    let cursor = 0;
    const worker = async () => {
      while (cursor < partNumbers.length) {
        const next = partNumbers[cursor++];
        await uploadOne(next);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(PART_CONCURRENCY, partNumbers.length) }, () =>
        worker()
      )
    );

    parts.sort((a, b) => a.partNumber - b.partNumber);

    const completed = await controlRequest<{ data: unknown }>(
      `${base}/complete`,
      token,
      {
        folderPath,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        replaceFileId,
        key,
        uploadId,
        parts,
        fileSize: file.size,
      }
    );

    onProgress?.(100);
    return completed.data;
  } catch (err) {
    // Best-effort cleanup so we don't leave dangling multipart uploads in S3.
    await controlRequest(`${base}/abort`, token, { key, uploadId }).catch(
      () => undefined
    );
    throw err;
  }
}
