"use client";

import { useState } from "react";
import {
  Check,
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  Link2,
} from "lucide-react";
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
import type {
  BulkShareLinkItem,
  CreateShareLinkPayload,
  ProjectFile,
} from "@/types/files";

const EXPIRY_OPTIONS = [
  { label: "1 hour",   hours: 1 },
  { label: "24 hours", hours: 24 },
  { label: "3 days",   hours: 72 },
  { label: "7 days",   hours: 168 },
  { label: "30 days",  hours: 720 },
  { label: "Never",    hours: null },
] as const;

function frontendShareUrl(item: BulkShareLinkItem): string {
  if (typeof window === "undefined") return item.shareUrl;
  return `${window.location.origin}/share/${item.token}/file/${item.fileId}/content`;
}

export function BulkShareFileDialog({
  open,
  onOpenChange,
  files,
  onCreateBulkShareLinks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: ProjectFile[];
  onCreateBulkShareLinks: (
    payload: CreateShareLinkPayload
  ) => Promise<BulkShareLinkItem[]>;
}) {
  const [selectedHours, setSelectedHours] = useState<number | null>(24);
  const [allowDownload, setAllowDownload] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkShareLinkItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const fileNameById = new Map(files.map((f) => [f.id, f.fileName]));

  function resetForm() {
    setSelectedHours(24);
    setAllowDownload(true);
    setResults([]);
    setCopiedId(null);
    setCopiedAll(false);
  }

  async function handleCreate() {
    setLoading(true);
    try {
      const payload: CreateShareLinkPayload = { allowDownload };
      if (selectedHours !== null) {
        payload.expiresAt = new Date(
          Date.now() + selectedHours * 3600 * 1000
        ).toISOString();
      }
      const res = await onCreateBulkShareLinks(payload);
      setResults(res);
      toast.success(
        res.length === 1
          ? "Share link created"
          : `${res.length} share links created`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create share links");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(item: BulkShareLinkItem) {
    const url = frontendShareUrl(item);
    await navigator.clipboard.writeText(url);
    setCopiedId(item.fileId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Link copied to clipboard");
  }

  async function handleCopyAll() {
    const urls = results.map(frontendShareUrl).join("\n");
    await navigator.clipboard.writeText(urls);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
    toast.success("All links copied to clipboard");
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="w-[480px] max-w-[calc(100vw-2rem)] border-[rgba(90,60,30,0.10)] bg-[var(--ds-surface-elevated)]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <div className="flex items-center gap-2">
            <Link2 size={15} style={{ color: "var(--ds-accent)" }} />
            <DialogTitle>
              Share {files.length} {files.length === 1 ? "file" : "files"}
            </DialogTitle>
          </div>
          <DialogCloseButton onClick={handleClose} />
        </DialogHeader>

        <DialogBody className="space-y-5">
          {results.length === 0 ? (
            <>
              <p className="text-[13px] text-[var(--ds-secondary-label)]">
                Create a share link for each selected file with the same settings.
              </p>

              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--ds-secondary-label)]">
                  <Clock size={11} />
                  Link expiry
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {EXPIRY_OPTIONS.map((opt) => {
                    const active = selectedHours === opt.hours;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => setSelectedHours(opt.hours)}
                        className="rounded-md px-2.5 py-1 text-[12px] transition-colors"
                        style={{
                          background: active ? "var(--ds-accent)" : "var(--ds-bg)",
                          color: active ? "white" : "var(--ds-secondary-label)",
                          fontWeight: active ? 600 : 400,
                          border: `1px solid ${active ? "var(--ds-accent)" : "rgba(90,60,30,0.15)"}`,
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {selectedHours !== null && (
                  <p className="mt-1.5 text-[11px] text-[var(--ds-secondary-label)]">
                    Expires{" "}
                    {new Date(Date.now() + selectedHours * 3600 * 1000).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--ds-secondary-label)]">
                  Recipient can
                </div>
                <div className="flex gap-2">
                  <PermissionToggle
                    active={!allowDownload}
                    icon={<Eye size={13} />}
                    label="View only"
                    description="Opens inline in browser"
                    onClick={() => setAllowDownload(false)}
                  />
                  <PermissionToggle
                    active={allowDownload}
                    icon={<Download size={13} />}
                    label="View & download"
                    description="Browser save dialog prompted"
                    onClick={() => setAllowDownload(true)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                <Check size={13} className="shrink-0 text-green-600" />
                <span className="text-[12px] text-green-700">
                  {results.length} share {results.length === 1 ? "link" : "links"} created
                </span>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto">
                {results.map((item) => {
                  const url = frontendShareUrl(item);
                  const name = fileNameById.get(item.fileId) ?? item.fileId;
                  return (
                    <div
                      key={item.fileId}
                      className="rounded-lg border border-[var(--ds-separator)] bg-[var(--ds-bg)] p-2.5"
                    >
                      <p className="mb-1.5 truncate text-[12px] font-medium text-[var(--ds-label)]">
                        {name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--ds-secondary-label)]">
                          {url}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopy(item)}
                          className="shrink-0 rounded-md bg-[var(--ds-accent)] px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-[var(--ds-accent-hover)]"
                        >
                          {copiedId === item.fileId ? <Check size={11} /> : <Copy size={11} />}
                        </button>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--ds-secondary-label)]">
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {item.expiresAt
                            ? `Expires ${new Date(item.expiresAt).toLocaleDateString("en-US", { dateStyle: "medium" })}`
                            : "Never expires"}
                        </span>
                        <span className="flex items-center gap-1">
                          {item.allowDownload ? <Download size={10} /> : <EyeOff size={10} />}
                          {item.allowDownload ? "Download allowed" : "View only"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-[rgba(90,60,30,0.10)] bg-[var(--ds-bg)]">
          {results.length > 0 ? (
            <>
              <div className="flex-1" />
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                className="bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)]"
                onClick={() => void handleCopyAll()}
              >
                {copiedAll ? "Copied!" : "Copy all"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                disabled={loading || files.length === 0}
                className="bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)]"
                onClick={() => void handleCreate()}
              >
                {loading ? "Creating…" : "Create links"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionToggle({
  active,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-start gap-1 rounded-xl p-3 text-left transition-all"
      style={{
        border: `2px solid ${active ? "var(--ds-accent)" : "var(--ds-separator)"}`,
        background: active ? "#FDF4E7" : "var(--ds-bg)",
      }}
    >
      <div
        className="flex items-center gap-1.5 text-[13px] font-medium"
        style={{ color: active ? "var(--ds-accent)" : "var(--ds-label)" }}
      >
        {icon}
        {label}
      </div>
      <p className="text-[11px] text-[var(--ds-secondary-label)]">{description}</p>
    </button>
  );
}
