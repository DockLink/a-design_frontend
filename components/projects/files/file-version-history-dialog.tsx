"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
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
import { formatFileDate, formatFileSize } from "@/lib/files/format";
import type { ProjectFile } from "@/types/files";

export function FileVersionHistoryDialog({
  open,
  onOpenChange,
  fileId,
  fileName,
  onGetVersions,
  onGetDownloadUrl,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string | null;
  fileName: string;
  onGetVersions: (fileId: string) => Promise<ProjectFile[]>;
  onGetDownloadUrl: (fileId: string) => Promise<string>;
}) {
  const [versions, setVersions] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !fileId) {
      setVersions([]);
      return;
    }
    setLoading(true);
    onGetVersions(fileId)
      .then((v) => setVersions([...v].reverse()))
      .catch(() => toast.error("Failed to load version history"))
      .finally(() => setLoading(false));
  }, [open, fileId, onGetVersions]);

  async function download(id: string) {
    setDownloadingId(id);
    try {
      const url = await onGetDownloadUrl(id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Could not get download link");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px] border-[rgba(90,60,30,0.10)] bg-[var(--ds-surface-elevated)]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <DialogTitle>Version history</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <DialogBody>
          <p className="mb-3 truncate text-[13px] font-medium text-[var(--ds-label)]">{fileName}</p>

          {loading && (
            <p className="py-6 text-center text-sm text-[var(--ds-secondary-label)]">Loading…</p>
          )}

          {!loading && versions.length === 0 && (
            <p className="py-6 text-center text-sm text-[var(--ds-secondary-label)]">No version history found.</p>
          )}

          {!loading && versions.length > 0 && (
            <div className="space-y-1.5">
              {versions.map((v, i) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5"
                  style={{ background: i === 0 ? "#F5E6D0" : "var(--ds-bg)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-[3px] px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                          background: i === 0 ? "var(--ds-accent)" : "#EDE3D4",
                          color: i === 0 ? "white" : "var(--ds-secondary-label)",
                        }}
                      >
                        v{v.version}
                      </span>
                      {i === 0 && (
                        <span className="text-[11px] font-medium text-[var(--ds-accent)]">Current</span>
                      )}
                      {v.isSuperseded && (
                        <span className="text-[11px] text-[var(--ds-secondary-label)]">Superseded</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-[var(--ds-secondary-label)]">
                      {formatFileDate(v.created_at)} · {formatFileSize(v.fileSize)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingId === v.id}
                    onClick={() => void download(v.id)}
                    className="ml-3 shrink-0 text-[var(--ds-secondary-label)] hover:text-[var(--ds-accent)]"
                    title="Download this version"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-[rgba(90,60,30,0.10)] bg-[var(--ds-bg)]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
