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
      <DialogContent className="w-[480px] border-[rgba(90,60,30,0.10)] bg-[#FDFAF6]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <DialogTitle>Version history</DialogTitle>
          <DialogCloseButton onClick={() => onOpenChange(false)} />
        </DialogHeader>

        <DialogBody>
          <p className="mb-3 truncate text-[13px] font-medium text-[#1A1410]">{fileName}</p>

          {loading && (
            <p className="py-6 text-center text-sm text-[#9C8573]">Loading…</p>
          )}

          {!loading && versions.length === 0 && (
            <p className="py-6 text-center text-sm text-[#9C8573]">No version history found.</p>
          )}

          {!loading && versions.length > 0 && (
            <div className="space-y-1.5">
              {versions.map((v, i) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5"
                  style={{ background: i === 0 ? "#F5E6D0" : "#F5EFE6" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-[3px] px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                          background: i === 0 ? "#D4A96A" : "#EDE3D4",
                          color: i === 0 ? "white" : "#9C8573",
                        }}
                      >
                        v{v.version}
                      </span>
                      {i === 0 && (
                        <span className="text-[11px] font-medium text-[#D4A96A]">Current</span>
                      )}
                      {v.isSuperseded && (
                        <span className="text-[11px] text-[#9C8573]">Superseded</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] text-[#6B5744]">
                      {formatFileDate(v.created_at)} · {formatFileSize(v.fileSize)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingId === v.id}
                    onClick={() => void download(v.id)}
                    className="ml-3 shrink-0 text-[#9C8573] hover:text-[#D4A96A]"
                    title="Download this version"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-[rgba(90,60,30,0.10)] bg-[#F5EFE6]">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
