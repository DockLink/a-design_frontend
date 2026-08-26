"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { AlertCircle, Folder, Upload, X } from "lucide-react";
import { toast } from "sonner";
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
import { collectDroppedFiles } from "@/lib/files/collect-dropped-files";
import { formatFileSize } from "@/lib/files/format";
import { itemsFromFileList } from "@/lib/files/upload-relative-path";
import type { UploadFileItem } from "@/types/uploads";

/** Non-standard attrs for folder picker (Chromium / WebKit). */
const folderInputAttrs = {
  webkitdirectory: "",
  directory: "",
} as InputHTMLAttributes<HTMLInputElement>;

interface QueuedFile {
  file: File;
  relativePath: string;
  sizeLabel: string;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  folderPath: _folderPath,
  folderLabel,
  isVersioned,
  archiveRedirectNotice,
  onEnqueue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderPath: string;
  folderLabel: string;
  isVersioned: boolean;
  /** Shown when uploading from a Superseded view into the live folder. */
  archiveRedirectNotice?: string;
  onEnqueue: (files: UploadFileItem[]) => void | Promise<void>;
}) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [enqueueing, setEnqueueing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setQueue([]);
      setEnqueueing(false);
    }
  }, [open]);

  function addItems(items: UploadFileItem[]) {
    if (items.length === 0) return;
    setQueue((q) => [
      ...q,
      ...items.map((item) => ({
        file: item.file,
        relativePath: item.relativePath?.trim() || item.file.name,
        sizeLabel: formatFileSize(item.file.size),
      })),
    ]);
  }

  function removeQueued(index: number) {
    setQueue((q) => q.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (queue.length === 0 || enqueueing) return;
    setEnqueueing(true);
    try {
      const files: UploadFileItem[] = queue.map((q) => ({
        file: q.file,
        relativePath: q.relativePath,
      }));
      await onEnqueue(files);
      const n = files.length;
      toast.success(`${n} file${n > 1 ? "s" : ""} queued`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to queue uploads");
      setEnqueueing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px] border-[rgba(90,60,30,0.10)] bg-[var(--ds-surface-elevated)]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <DialogTitle>Upload files</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <DialogBody className="space-y-3.5">
          {/* Destination */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--ds-secondary-label)]">
              Destination
            </p>
            <div className="flex items-center gap-1.5 rounded-md bg-[var(--ds-bg)] px-2.5 py-2 text-[13px] text-[var(--ds-label)]">
              <Folder size={13} style={{ color: "var(--ds-accent)" }} />
              {folderLabel}
            </div>
          </div>

          {archiveRedirectNotice && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-700" />
              <p className="text-[12px] leading-snug text-amber-700">
                {archiveRedirectNotice}
              </p>
            </div>
          )}

          {isVersioned && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2">
              <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-700" />
              <p className="text-[12px] leading-snug text-amber-700">
                Versioning active — new uploads with matching filenames will supersede existing files.
              </p>
            </div>
          )}

          {/* Drop zone */}
          <div
            role="presentation"
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void collectDroppedFiles(e.dataTransfer).then(addItems);
            }}
            className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl transition-all"
            style={{
              border: `2px dashed ${dragOver ? "var(--ds-accent)" : "rgba(90,60,30,0.18)"}`,
              background: dragOver ? "#FDF4E7" : "transparent",
            }}
          >
            <Upload size={24} style={{ color: "var(--ds-accent)" }} />
            <span className="text-[14px] text-[var(--ds-secondary-label)]">
              Drag files or folders here
            </span>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer rounded-md bg-[#F5E6D0] px-3 py-1 text-[12px] font-medium text-[var(--ds-accent)]">
                Browse
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addItems(itemsFromFileList(e.target.files));
                    e.target.value = "";
                  }}
                />
              </label>
              <label className="cursor-pointer rounded-md bg-[#F5E6D0] px-3 py-1 text-[12px] font-medium text-[var(--ds-accent)]">
                Browse folder
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  {...folderInputAttrs}
                  onChange={(e) => {
                    addItems(itemsFromFileList(e.target.files));
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="max-h-44 space-y-1.5 overflow-y-auto">
              {queue.map((qf, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg bg-[var(--ds-bg)] px-3 py-2"
                >
                  <span
                    className="truncate text-[13px] font-medium text-[var(--ds-label)]"
                    title={qf.relativePath}
                  >
                    {qf.relativePath.includes("/") ? qf.relativePath : qf.file.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] text-[var(--ds-secondary-label)]">{qf.sizeLabel}</span>
                    <button
                      type="button"
                      onClick={() => removeQueued(i)}
                      className="text-[var(--ds-secondary-label)] hover:text-[var(--ds-label)]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-[rgba(90,60,30,0.10)] bg-[var(--ds-bg)]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={queue.length === 0 || enqueueing}
            onClick={() => void handleUpload()}
            className="bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)]"
          >
            {enqueueing
              ? "Preparing…"
              : `Upload ${queue.length > 0 ? `(${queue.length})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
