"use client";

import { useState } from "react";
import { Check, Copy, MapPin, Share2 } from "lucide-react";
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
import { copyTextToClipboard, shareViaDevice } from "@/lib/maps/share-location";

export function ShareLocationDialog({
  open,
  onOpenChange,
  title,
  url,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function handleCopy() {
    const ok = await copyTextToClipboard(url);
    if (!ok) {
      toast.error("Could not copy link");
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  }

  async function handleNativeShare() {
    const ok = await shareViaDevice({ title, url });
    if (ok) toast.success("Location shared");
    else toast.error("Could not share location");
  }

  function handleClose() {
    setCopied(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <DialogContent className="w-[min(440px,100vw)] border-[rgba(90,60,30,0.10)] bg-[#FDFAF6]">
        <DialogHeader className="relative border-[rgba(90,60,30,0.10)]">
          <div className="flex items-center gap-2">
            <MapPin size={15} style={{ color: "var(--ds-accent, #D4A96A)" }} />
            <DialogTitle>Share location</DialogTitle>
          </div>
          <DialogCloseButton onClick={handleClose} />
        </DialogHeader>

        <DialogBody className="space-y-4">
          <p className="text-[13px] font-medium text-[#1A1410]">{title}</p>
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-[#9C8573]">
              Google Maps link
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-[rgba(90,60,30,0.12)] bg-[#F5EFE6] p-2.5">
              <span className="flex-1 break-all text-[12px] text-[#1A1410]">{url}</span>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="shrink-0 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-white transition-colors"
                style={{ background: "var(--ds-accent, #D4A96A)" }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="border-[rgba(90,60,30,0.10)] bg-[#F5EFE6]">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {canNativeShare ? (
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => void handleNativeShare()}
            >
              <Share2 size={14} />
              Share via device
            </Button>
          ) : null}
          <Button
            className="text-white"
            style={{ background: "var(--ds-accent, #D4A96A)" }}
            onClick={() => void handleCopy()}
          >
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
