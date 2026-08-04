"use client";

import { useEffect, useState } from "react";
import { FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProjectFile, ProjectFolderNode } from "@/types/files";
import { FolderTree } from "./folder-tree";

export function BulkMoveFileDialog({
  open,
  onOpenChange,
  files,
  tree,
  fileCounts,
  currentFolderPath,
  onMove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: ProjectFile[];
  tree: ProjectFolderNode[];
  fileCounts: Record<string, number>;
  currentFolderPath: string | null;
  onMove: (targetFolderPath: string) => Promise<void>;
}) {
  const [targetPath, setTargetPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTargetPath(null);
      setLoading(false);
    }
  }, [open]);

  const sameFolder = !!targetPath && targetPath === currentFolderPath;
  const canConfirm = !!targetPath && !sameFolder && !loading && files.length > 0;

  async function handleMove() {
    if (!targetPath || sameFolder) return;
    setLoading(true);
    try {
      await onMove(targetPath);
      onOpenChange(false);
    } catch {
      // Board already toasts and refreshes; keep dialog open for another destination.
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    onOpenChange(false);
  }

  const count = files.length;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="w-[480px] max-w-[calc(100vw-2rem)] border-[rgba(90,60,30,0.10)] bg-[var(--ds-surface-elevated)]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <div className="flex items-center gap-2">
            <FolderInput size={15} style={{ color: "var(--ds-accent)" }} />
            <DialogTitle>
              Move {count} {count === 1 ? "file" : "files"}
            </DialogTitle>
          </div>
          <DialogCloseButton onClick={handleClose} />
        </DialogHeader>

        <DialogBody className="space-y-3">
          {currentFolderPath && (
            <p className="text-[12px] text-[var(--ds-secondary-label)]">
              From{" "}
              <span className="font-medium text-[var(--ds-label)]">
                {currentFolderPath}
              </span>
            </p>
          )}

          <p className="text-[12px] text-[var(--ds-secondary-label)]">
            Choose a destination folder
          </p>

          <div className="max-h-[280px] overflow-y-auto rounded-md border border-[rgba(90,60,30,0.12)] bg-[var(--ds-surface)]">
            <FolderTree
              nodes={tree}
              selectedPath={targetPath}
              fileCounts={fileCounts}
              onSelectPath={setTargetPath}
              canManageFolders={false}
            />
          </div>

          {targetPath && (
            <p className="truncate text-[12px] text-[var(--ds-secondary-label)]">
              Destination:{" "}
              <span className="font-medium text-[var(--ds-label)]">
                {targetPath}
              </span>
            </p>
          )}

          {sameFolder && (
            <p className="text-[12px] text-red-600">
              Destination must be a different folder.
            </p>
          )}
        </DialogBody>

        <DialogFooter className="border-[rgba(90,60,30,0.10)]">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!canConfirm}
            className="bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)]"
            onClick={() => void handleMove()}
          >
            {loading ? "Moving…" : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
