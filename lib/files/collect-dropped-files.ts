/**
 * Collect real File objects from a drag-drop DataTransfer.
 * Walks directory entries so dropping a folder does not enqueue the folder stub,
 * and preserves relative paths for nested structure.
 */

import type { CollectedUploadFile } from "@/lib/files/upload-relative-path";
import { normalizeRelativePath } from "@/lib/files/upload-relative-path";

function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const readBatch = () => {
      reader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(all);
          return;
        }
        all.push(...batch);
        readBatch();
      }, reject);
    };
    readBatch();
  });
}

function entryToFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

async function walkEntry(
  entry: FileSystemEntry,
  parentPath: string
): Promise<CollectedUploadFile[]> {
  const name = entry.name;
  const pathHere = parentPath ? `${parentPath}/${name}` : name;

  if (entry.isFile) {
    const file = await entryToFile(entry as FileSystemFileEntry);
    if (file.size <= 0) return [];
    return [{ file, relativePath: normalizeRelativePath(pathHere) }];
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await readAllEntries(reader);
    const nested = await Promise.all(
      children.map((child) => walkEntry(child, pathHere))
    );
    return nested.flat();
  }
  return [];
}

/** Prefer directory-entry walk; fall back to FileList without empty stubs. */
export async function collectDroppedFiles(
  dataTransfer: DataTransfer
): Promise<CollectedUploadFile[]> {
  const items = dataTransfer.items;
  if (items && items.length > 0) {
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind !== "file") continue;
      const entry = item.webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }
    if (entries.length > 0) {
      const nested = await Promise.all(entries.map((e) => walkEntry(e, "")));
      return nested.flat();
    }
  }

  const list = dataTransfer.files;
  if (!list) return [];
  return Array.from(list)
    .filter((f) => f.size > 0)
    .map((file) => ({
      file,
      relativePath: normalizeRelativePath(
        file.webkitRelativePath?.length ? file.webkitRelativePath : file.name
      ),
    }));
}
