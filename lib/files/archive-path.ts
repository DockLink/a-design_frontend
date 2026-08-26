/** True when the path is inside a Superseded archive branch. */
export function isArchiveFolderPath(path: string): boolean {
  return path.split("/").some((seg) => seg.toLowerCase().includes("superseded"));
}

/**
 * Strip the first path segment whose name includes "superseded" (case-insensitive),
 * keeping any suffix after that segment.
 * `A/SketchUp/Superseded` → `A/SketchUp`
 * `A/Superseded/SketchUp/Sub` → `A/SketchUp/Sub`
 */
export function stripSupersededSegment(folderPath: string): string {
  const parts = folderPath.split("/").filter(Boolean);
  const idx = parts.findIndex((seg) => seg.toLowerCase().includes("superseded"));
  if (idx < 0) return folderPath;
  const before = parts.slice(0, idx);
  const after = parts.slice(idx + 1);
  return [...before, ...after].join("/");
}

/**
 * Map a Superseded mirror path to its live upload folder.
 * Prefers `sourceByArchivePath`, then strips the Superseded segment as fallback.
 */
export function resolveUploadFolderPath(
  folderPath: string,
  sourceByArchivePath: Record<string, string> = {},
): string {
  const mapped = sourceByArchivePath[folderPath];
  if (mapped) return mapped;
  if (!isArchiveFolderPath(folderPath)) return folderPath;
  const stripped = stripSupersededSegment(folderPath);
  return stripped || folderPath;
}

/** Live SketchUp source path — reserved child names cannot be created under it. */
export const SKETCHUP_SOURCE_PATH = "3.0 DTP/3.11 SketchUp";

const SKETCHUP_RESERVED_CHILD_NAMES = new Set(["Current", "Superseded"]);

/** True when creating this leaf under this parent would be rejected by the API. */
export function isReservedSketchUpChild(
  parentPath: string | null,
  name: string,
): boolean {
  if (!parentPath) return false;
  if (parentPath !== SKETCHUP_SOURCE_PATH) return false;
  return SKETCHUP_RESERVED_CHILD_NAMES.has(name);
}
