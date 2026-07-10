/** True when the path is inside a Superseded archive branch. */
export function isArchiveFolderPath(path: string): boolean {
  return path.split("/").some((seg) => seg.toLowerCase().includes("superseded"));
}

/** Map a Superseded mirror path to its live upload folder when known. */
export function resolveUploadFolderPath(
  folderPath: string,
  sourceByArchivePath: Record<string, string>,
): string {
  return sourceByArchivePath[folderPath] ?? folderPath;
}
