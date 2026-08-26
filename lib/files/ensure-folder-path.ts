/**
 * Ensure nested folder paths exist under a project by creating missing segments.
 */

import {
  isArchiveFolderPath,
  isReservedSketchUpChild,
} from "@/lib/files/archive-path";
import { normalizeRelativePath } from "@/lib/files/upload-relative-path";
import type { ProjectFolderNode } from "@/types/files";

function collectExistingPaths(
  nodes: ProjectFolderNode[],
  into: Set<string>
): void {
  for (const n of nodes) {
    into.add(n.path);
    if (n.children?.length) collectExistingPaths(n.children, into);
  }
}

function parentOf(path: string): string | null {
  const normalized = normalizeRelativePath(path);
  const slash = normalized.lastIndexOf("/");
  if (slash <= 0) return null;
  return normalized.slice(0, slash);
}

function segmentName(path: string): string {
  const normalized = normalizeRelativePath(path);
  const slash = normalized.lastIndexOf("/");
  return slash >= 0 ? normalized.slice(slash + 1) : normalized;
}

/**
 * Create any missing folders among `destinationPaths` (full project paths),
 * parent-before-child. Idempotent against the current tree.
 * Skips archive paths and SketchUp reserved names (Current / Superseded).
 */
export async function ensureFolderPathsExist(opts: {
  tree: ProjectFolderNode[];
  destinationPaths: string[];
  createFolder: (
    name: string,
    parentPath: string | null
  ) => Promise<{ path: string }>;
}): Promise<void> {
  const existing = new Set<string>();
  collectExistingPaths(opts.tree, existing);

  const needed = new Set<string>();
  for (const raw of opts.destinationPaths) {
    const path = normalizeRelativePath(raw);
    if (!path) continue;
    // Add every ancestor segment of this path.
    const parts = path.split("/").filter(Boolean);
    let acc = "";
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      needed.add(acc);
    }
  }

  const ordered = [...needed].sort(
    (a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b)
  );

  for (const path of ordered) {
    if (existing.has(path)) continue;
    // Never create under or as Superseded archive branches.
    if (isArchiveFolderPath(path)) {
      existing.add(path);
      continue;
    }
    const parent = parentOf(path);
    const name = segmentName(path);
    if (!name) continue;
    if (isReservedSketchUpChild(parent, name)) {
      existing.add(path);
      continue;
    }
    const created = await opts.createFolder(name, parent);
    existing.add(created.path);
    existing.add(path);
  }
}
