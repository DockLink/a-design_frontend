"use client";

import { useEffect, useRef, useState } from "react";
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
import { formatFileSize } from "@/lib/files/format";

interface QueuedFile {
  file: File;
  sizeLabel: string;
  uploading: boolean;
  /** Real upload progress 0-100 from XHR progress events. */
  progress: number;
  done: boolean;
  error?: string;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  folderPath,
  folderLabel,
  isVersioned,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderPath: string;
  folderLabel: string;
  isVersioned: boolean;
  onUpload: (
    folderPath: string,
    file: File,
    onProgress?: (pct: number) => void
  ) => Promise<unknown>;
}) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) setQueue([]);
  }, [open]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setQueue((q) => [
      ...q,
      ...Array.from(fileList).map((f) => ({
        file: f,
        sizeLabel: formatFileSize(f.size),
        uploading: false,
        progress: 0,
        done: false,
      })),
    ]);
  }

  function removeQueued(index: number) {
    setQueue((q) => q.filter((_, i) => i !== index));
  }

  async function handleUpload() {
    if (queue.length === 0 || busy) return;
    setBusy(true);

    const results = await Promise.allSettled(
      queue.map(async (qf, index) => {
        if (qf.done) return;
        setQueue((q) =>
          q.map((x, i) =>
            i === index ? { ...x, uploading: true, progress: 0, error: undefined } : x
          )
        );
        try {
          await onUpload(folderPath, qf.file, (pct) => {
            setQueue((q) =>
              q.map((x, i) => (i === index ? { ...x, progress: pct } : x))
            );
          });
          setQueue((q) =>
            q.map((x, i) =>
              i === index ? { ...x, uploading: false, progress: 100, done: true } : x
            )
          );
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          setQueue((q) =>
            q.map((x, i) =>
              i === index ? { ...x, uploading: false, error: msg } : x
            )
          );
          throw err;
        }
      })
    );

    setBusy(false);

    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.length - failed;

    if (succeeded > 0) {
      toast.success(`${succeeded} file${succeeded > 1 ? "s" : ""} uploaded`);
    }
    if (failed > 0) {
      toast.error(`${failed} file${failed > 1 ? "s" : ""} failed`);
    }

    if (failed === 0) onOpenChange(false);
  }

  const allDone = queue.length > 0 && queue.every((f) => f.done);

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
              addFiles(e.dataTransfer.files);
            }}
            className="flex h-36 flex-col items-center justify-center gap-2 rounded-xl transition-all"
            style={{
              border: `2px dashed ${dragOver ? "var(--ds-accent)" : "rgba(90,60,30,0.18)"}`,
              background: dragOver ? "#FDF4E7" : "transparent",
            }}
          >
            <Upload size={24} style={{ color: "var(--ds-accent)" }} />
            <span className="text-[14px] text-[var(--ds-secondary-label)]">Drag files here</span>
            <label className="cursor-pointer rounded-md bg-[#F5E6D0] px-3 py-1 text-[12px] font-medium text-[var(--ds-accent)]">
              Browse
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="max-h-44 space-y-1.5 overflow-y-auto">
              {queue.map((qf, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-[var(--ds-bg)] px-3 py-2"
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium text-[var(--ds-label)]">
                      {qf.file.name}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-[11px] text-[var(--ds-secondary-label)]">{qf.sizeLabel}</span>
                      {!qf.uploading && !qf.done && (
                        <button
                          type="button"
                          onClick={() => removeQueued(i)}
                          className="text-[var(--ds-secondary-label)] hover:text-[var(--ds-label)]"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 overflow-hidden rounded-full bg-[#EDE3D4]" style={{ height: 4 }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: qf.done
                            ? "100%"
                            : qf.uploading
                            ? `${Math.max(qf.progress, 2)}%`
                            : "0%",
                          background: qf.error ? "#DC2626" : "var(--ds-accent)",
                        }}
                      />
                    </div>
                    {qf.uploading && (
                      <span className="shrink-0 text-[10px] text-[var(--ds-secondary-label)]">
                        {qf.progress}%
                      </span>
                    )}
                  </div>
                  {qf.error && (
                    <p className="mt-1 text-[11px] text-red-600">{qf.error}</p>
                  )}
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
            disabled={queue.length === 0 || busy || allDone}
            onClick={() => void handleUpload()}
            className="bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)]"
          >
            {busy ? "Uploading…" : allDone ? "Done" : `Upload ${queue.length > 0 ? `(${queue.length})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
