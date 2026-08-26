/**
 * Relative-path helpers for folder uploads (Browse folder / drag-drop).
 */

export interface CollectedUploadFile {
  file: File;
  /** Path relative to the selection root, e.g. "Docs/Sub/a.pdf". */
  relativePath: string;
}

/** Normalize path separators and strip leading/trailing slashes. */
export function normalizeRelativePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

/**
 * Destination folder for a file under a base upload folder.
 * `Docs/Sub/a.pdf` under `1.0 Design` → `1.0 Design/Docs/Sub`
 * `a.pdf` (no dirs) → base folder unchanged.
 */
export function destinationFolderPath(
  baseFolderPath: string,
  relativePath?: string | null
): string {
  const base = normalizeRelativePath(baseFolderPath);
  if (!relativePath) return base;

  const rel = normalizeRelativePath(relativePath);
  const slash = rel.lastIndexOf("/");
  if (slash <= 0) return base;

  const dir = rel.slice(0, slash);
  return base ? `${base}/${dir}` : dir;
}

/** Leaf folder name for toast/labels. */
export function folderLabelFromPath(folderPath: string): string {
  const normalized = normalizeRelativePath(folderPath);
  const slash = normalized.lastIndexOf("/");
  return slash >= 0 ? normalized.slice(slash + 1) : normalized;
}

/** Build items from an <input type="file"> FileList (uses webkitRelativePath when set). */
export function itemsFromFileList(
  list: FileList | File[] | null | undefined
): CollectedUploadFile[] {
  if (!list) return [];
  const files = Array.from(list);
  const out: CollectedUploadFile[] = [];
  for (const file of files) {
    if (file.size <= 0) continue;
    const rel =
      typeof file.webkitRelativePath === "string" && file.webkitRelativePath.length > 0
        ? normalizeRelativePath(file.webkitRelativePath)
        : file.name;
    out.push({ file, relativePath: rel });
  }
  return out;
}
