import type { ProjectFolderNode } from "@/types/files";

function folderNameSortKey(name: string): number[] {
  const match = name.match(/^(\d+(?:\.\d+)*)/);
  if (!match) return [Number.MAX_SAFE_INTEGER];
  return match[1].split(".").map((part) => Number.parseInt(part, 10));
}

function compareFolderNames(a: string, b: string): number {
  const aKey = folderNameSortKey(a);
  const bKey = folderNameSortKey(b);
  const len = Math.max(aKey.length, bKey.length);

  for (let i = 0; i < len; i += 1) {
    const diff = (aKey[i] ?? 0) - (bKey[i] ?? 0);
    if (diff !== 0) return diff;
  }

  return a.localeCompare(b);
}

export function sortProjectFolderNodes(nodes: ProjectFolderNode[]): ProjectFolderNode[] {
  return nodes
    .slice()
    .sort((a, b) => compareFolderNames(a.name, b.name))
    .map((node) => ({
      ...node,
      children: sortProjectFolderNodes(node.children),
    }));
}
