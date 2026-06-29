"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectFolderNode } from "@/types/files";

interface FolderItemProps {
  node: ProjectFolderNode;
  depth: number;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  fileCounts: Record<string, number>;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
}

function FolderItem({
  node,
  depth,
  selectedPath,
  expandedPaths,
  fileCounts,
  onSelect,
  onToggle,
}: FolderItemProps) {
  const [hovered, setHovered] = useState(false);
  const selected = selectedPath === node.path;
  const expanded = expandedPaths.has(node.path);
  const hasChildren = node.children.length > 0;
  const count = fileCounts[node.path];

  return (
    <>
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
          borderLeft: selected ? "3px solid #D4A96A" : "3px solid transparent",
        }}
      >
        <span className="flex w-3 shrink-0 items-center text-[#9C8573]">
          {hasChildren ? (
            expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />
          ) : null}
        </span>

        {hasChildren && expanded ? (
          <FolderOpen size={13} style={{ color: "#D4A96A", flexShrink: 0 }} />
        ) : (
          <Folder size={13} style={{ color: "#D4A96A", flexShrink: 0 }} />
        )}

        <span
          className={cn(
            "flex-1 truncate text-[13px]",
            selected ? "font-medium text-[#D4A96A]" : "text-[#1A1410]"
          )}
        >
          {node.name}
        </span>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {node.isVersioned && (
            <span className="rounded-[3px] bg-[#F5E6D0] px-1 text-[8px] font-bold text-[#D4A96A]">
              V
            </span>
          )}
          {count != null && count > 0 && (
            <span className="rounded-full bg-[#EDE3D4] px-1.5 text-[10px] text-[#9C8573]">
              {count}
            </span>
          )}
        </div>
      </div>

      {hasChildren && expanded &&
        node.children.map((child) => (
          <FolderItem
            key={child.path}
            node={child}
            depth={depth + 1}
            selectedPath={selectedPath}
            expandedPaths={expandedPaths}
            fileCounts={fileCounts}
            onSelect={onSelect}
            onToggle={onToggle}
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
}: {
  nodes: ProjectFolderNode[];
  selectedPath: string | null;
  fileCounts: Record<string, number>;
  onSelectPath: (path: string) => void;
}) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(nodes.slice(0, 2).map((n) => n.path))
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
      {nodes.map((node) => (
        <FolderItem
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          expandedPaths={expandedPaths}
          fileCounts={fileCounts}
          onSelect={onSelectPath}
          onToggle={toggle}
        />
      ))}
    </div>
  );
}
