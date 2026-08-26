"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sortProjectFolderNodes } from "@/lib/files/sort-folders";
import { isArchiveFolderPath } from "@/lib/files/archive-path";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { ProjectFolderNode } from "@/types/files";

function folderIsEmpty(path: string, fileCounts: Record<string, number>): boolean {
  const direct = fileCounts[path] ?? 0;
  const nested = Object.entries(fileCounts).some(
    ([p, count]) => p !== path && p.startsWith(`${path}/`) && count > 0,
  );
  return direct === 0 && !nested;
}

function folderHasChildren(node: ProjectFolderNode): boolean {
  return node.children.length > 0;
}

interface FolderItemProps {
  node: ProjectFolderNode;
  depth: number;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  fileCounts: Record<string, number>;
  canManageFolders: boolean;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
  onCreateSubfolder?: (parentPath: string) => void;
  onRenameFolder?: (path: string, currentName: string) => void;
  onDeleteFolder?: (path: string) => void;
}

function FolderItem({
  node,
  depth,
  selectedPath,
  expandedPaths,
  fileCounts,
  canManageFolders,
  onSelect,
  onToggle,
  onCreateSubfolder,
  onRenameFolder,
  onDeleteFolder,
}: FolderItemProps) {
  const [hovered, setHovered] = useState(false);
  const selected = selectedPath === node.path;
  const expanded = expandedPaths.has(node.path);
  const hasChildren = node.children.length > 0;
  const count = fileCounts[node.path];
  const isArchive = isArchiveFolderPath(node.path);
  const canMutateStructure = canManageFolders && !isArchive;
  const canDelete =
    canMutateStructure &&
    !folderHasChildren(node) &&
    folderIsEmpty(node.path, fileCounts);

  const row = (
    <div
      role="button"
      tabIndex={0}
      onClick={() => {
        onSelect(node.path);
        if (hasChildren) onToggle(node.path);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onSelect(node.path);
          if (hasChildren) onToggle(node.path);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex h-[30px] cursor-pointer select-none items-center gap-1 pr-2 box-border transition-colors"
      style={{
        paddingLeft: 14 + depth * 18,
        background: selected ? "#F5E6D0" : hovered ? "#EDE3D4" : "transparent",
        borderLeft: selected ? "3px solid var(--ds-accent)" : "3px solid transparent",
      }}
    >
      <span className="flex w-3 shrink-0 items-center text-[var(--ds-secondary-label)]">
        {hasChildren ? (
          expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />
        ) : null}
      </span>

      {hasChildren && expanded ? (
        <FolderOpen size={13} style={{ color: "var(--ds-accent)", flexShrink: 0 }} />
      ) : (
        <Folder size={13} style={{ color: "var(--ds-accent)", flexShrink: 0 }} />
      )}

      <span
        className={cn(
          "flex-1 truncate text-[13px]",
          selected ? "font-medium text-[var(--ds-accent)]" : "text-[var(--ds-label)]",
        )}
      >
        {node.name}
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {node.isVersioned && (
          <span className="rounded-[3px] bg-[#F5E6D0] px-1 text-[8px] font-bold text-[var(--ds-accent)]">
            V
          </span>
        )}
        {count != null && count > 0 && (
          <span className="rounded-full bg-[#EDE3D4] px-1.5 text-[10px] text-[var(--ds-secondary-label)]">
            {count}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {canMutateStructure ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
          <ContextMenuContent>
            {onCreateSubfolder ? (
              <ContextMenuItem onClick={() => onCreateSubfolder(node.path)}>
                <FolderPlus size={14} />
                New subfolder
              </ContextMenuItem>
            ) : null}
            {onRenameFolder ? (
              <ContextMenuItem onClick={() => onRenameFolder(node.path, node.name)}>
                <Pencil size={14} />
                Rename
              </ContextMenuItem>
            ) : null}
            {canDelete && onDeleteFolder ? (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem
                  danger
                  onClick={() => onDeleteFolder(node.path)}
                >
                  <Trash2 size={14} />
                  Delete
                </ContextMenuItem>
              </>
            ) : null}
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        row
      )}

      {hasChildren && expanded &&
        node.children.map((child) => (
          <FolderItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            expandedPaths={expandedPaths}
            fileCounts={fileCounts}
            canManageFolders={canManageFolders}
            onSelect={onSelect}
            onToggle={onToggle}
            onCreateSubfolder={onCreateSubfolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
          />
        ))}
    </>
  );
}

export function FolderTree({
  nodes,
  selectedPath,
  fileCounts,
  onSelectPath,
  canManageFolders = false,
  onCreateSubfolder,
  onRenameFolder,
  onDeleteFolder,
}: {
  nodes: ProjectFolderNode[];
  selectedPath: string | null;
  fileCounts: Record<string, number>;
  onSelectPath: (path: string) => void;
  canManageFolders?: boolean;
  onCreateSubfolder?: (parentPath: string) => void;
  onRenameFolder?: (path: string, currentName: string) => void;
  onDeleteFolder?: (path: string) => void;
}) {
  const sortedNodes = sortProjectFolderNodes(nodes);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(sortedNodes.slice(0, 2).map((n) => n.path)),
  );

  function toggle(path: string) {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  return (
    <div className="flex flex-col py-1">
      {sortedNodes.map((node) => (
        <FolderItem
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          expandedPaths={expandedPaths}
          fileCounts={fileCounts}
          canManageFolders={canManageFolders}
          onSelect={onSelectPath}
          onToggle={toggle}
          onCreateSubfolder={onCreateSubfolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
        />
      ))}
    </div>
  );
}
