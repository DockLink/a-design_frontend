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
  Trash2,
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
import type { CreateShareLinkPayload, ProjectFile, ShareLinkResponse } from "@/types/files";

const EXPIRY_OPTIONS = [
  { label: "1 hour",   hours: 1 },
  { label: "24 hours", hours: 24 },
  { label: "3 days",   hours: 72 },
  { label: "7 days",   hours: 168 },
  { label: "30 days",  hours: 720 },
  { label: "Never",    hours: null },
] as const;

export function ShareFileDialog({
  open,
  onOpenChange,
  file,
  onCreateShareLink,
  onRevokeShareLink,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: ProjectFile | null;
  onCreateShareLink: (fileId: string, payload: CreateShareLinkPayload) => Promise<ShareLinkResponse>;
  onRevokeShareLink: (token: string) => Promise<void>;
}) {
  const [selectedHours, setSelectedHours] = useState<number | null>(24);
  const [allowDownload, setAllowDownload] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ShareLinkResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  // The share path is served by THIS frontend app, so always present the link
  // against the current origin — never the backend host the API returned.
  const shareUrl =
    result && file && typeof window !== "undefined"
      ? `${window.location.origin}/share/${result.token}/file/${file.id}/content`
      : result?.shareUrl ?? "";

  function resetForm() {
    setSelectedHours(24);
    setAllowDownload(true);
    setResult(null);
    setCopied(false);
  }

  async function handleCreate() {
    if (!file) return;
    setLoading(true);
    try {
      const payload: CreateShareLinkPayload = { allowDownload };
      if (selectedHours !== null) {
        const expiresAt = new Date(Date.now() + selectedHours * 3600 * 1000).toISOString();
        payload.expiresAt = expiresAt;
      }
      const res = await onCreateShareLink(file.id, payload);
      setResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create share link");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  }

  async function handleRevoke() {
    if (!result?.token) return;
    setRevoking(true);
    try {
      await onRevokeShareLink(result.token);
      toast.success("Share link revoked");
      resetForm();
    } catch {
      toast.error("Failed to revoke link");
    } finally {
      setRevoking(false);
    }
  }

  function handleClose() {
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="w-[440px] border-[rgba(90,60,30,0.10)] bg-[var(--ds-surface-elevated)]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <div className="flex items-center gap-2">
            <Link2 size={15} style={{ color: "var(--ds-accent)" }} />
            <DialogTitle>Share file</DialogTitle>
          </div>
          <DialogCloseButton onClick={handleClose} />
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* File name */}
          <p className="truncate text-[13px] font-medium text-[var(--ds-label)]">
            {file?.fileName ?? ""}
          </p>

          {!result ? (
            <>
              {/* Expiry */}
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

              {/* Download permission */}
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
            /* Generated link panel */
            <div className="space-y-3">
              {/* Success badge */}
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
                <Check size={13} className="shrink-0 text-green-600" />
                <span className="text-[12px] text-green-700">Share link created</span>
              </div>

              {/* URL */}
              <div>
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--ds-secondary-label)]">
                  Link
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-[var(--ds-separator)] bg-[var(--ds-bg)] p-2.5">
                  <span className="flex-1 truncate text-[12px] text-[var(--ds-label)]">
                    {shareUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    className="shrink-0 rounded-md bg-[var(--ds-accent)] px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[var(--ds-accent-hover)]"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Summary badges */}
              <div className="flex items-center gap-2 text-[12px] text-[var(--ds-secondary-label)]">
                <span className="flex items-center gap-1 rounded-full bg-[var(--ds-bg)] px-2.5 py-1">
                  <Clock size={11} />
                  {result.expiresAt
                    ? `Expires ${new Date(result.expiresAt).toLocaleDateString("en-US", { dateStyle: "medium" })}`
                    : "Never expires"}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-[var(--ds-bg)] px-2.5 py-1">
                  {result.allowDownload ? <Download size={11} /> : <EyeOff size={11} />}
                  {result.allowDownload ? "Download allowed" : "View only"}
                </span>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-[rgba(90,60,30,0.10)] bg-[var(--ds-bg)]">
          {result ? (
            <>
              <button
                type="button"
                disabled={revoking}
                onClick={() => void handleRevoke()}
                className="flex items-center gap-1.5 text-[12px] text-[#C4A090] hover:text-red-700 disabled:opacity-50"
              >
                <Trash2 size={12} />
                {revoking ? "Revoking…" : "Revoke link"}
              </button>
              <div className="flex-1" />
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                className="bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)]"
                onClick={() => void handleCopy()}
              >
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                disabled={loading}
                className="bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)]"
                onClick={() => void handleCreate()}
              >
                {loading ? "Creating…" : "Create link"}
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
