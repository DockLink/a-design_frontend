"use client";

import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import { toast } from "sonner";

import { VimeoEmbed } from "@/components/projects/vimeo-embed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateProject } from "@/hooks/use-update-project";
import { isValidVimeoUrl } from "@/lib/vimeo/parse-vimeo-url";

export function ProjectVimeoSection({
  projectId,
  vimeoUrl,
  canEdit,
  onUpdated,
}: {
  projectId: string;
  vimeoUrl: string | null | undefined;
  canEdit: boolean;
  onUpdated?: () => void | Promise<void>;
}) {
  const { updateProject } = useUpdateProject(projectId);
  const [draft, setDraft] = useState(vimeoUrl ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(vimeoUrl ?? "");
  }, [vimeoUrl]);

  const hasVideo = Boolean(vimeoUrl?.trim());
  const draftValid = !draft.trim() || isValidVimeoUrl(draft);

  async function handleSave() {
    if (draft.trim() && !isValidVimeoUrl(draft)) {
      toast.error("Enter a valid Vimeo URL");
      return;
    }
    setIsSaving(true);
    try {
      await updateProject({ vimeo_url: draft.trim() || undefined });
      toast.success(draft.trim() ? "Vimeo link saved" : "Vimeo link removed");
      setIsEditing(false);
      await onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Vimeo link");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "#1C1C1E" }}>
          <Video size={16} color="#C9894A" />
          Project video
        </div>
        {canEdit && !isEditing ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            {hasVideo ? "Edit link" : "Add Vimeo link"}
          </Button>
        ) : null}
      </div>

      {isEditing ? (
        <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://vimeo.com/123456789 or https://vimeo.com/123456789/abc123"
            className="bg-[#F5EFE6] h-10"
          />
          {!draftValid ? (
            <div style={{ fontSize: "12px", color: "#C62828" }}>Enter a valid Vimeo URL</div>
          ) : null}
          <div style={{ display: "flex", gap: "8px" }}>
            <Button type="button" className="bg-[#D4A96A] hover:bg-[#C4956A]" disabled={isSaving || !draftValid} onClick={() => void handleSave()}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft(vimeoUrl ?? "");
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
          {draft.trim() && draftValid ? <VimeoEmbed url={draft} /> : null}
        </div>
      ) : hasVideo ? (
        <div style={{ padding: "0 18px 18px" }}>
          <VimeoEmbed url={vimeoUrl!} />
        </div>
      ) : (
        <div style={{ padding: "0 18px 18px", fontSize: "13px", color: "#8E8E93" }}>
          No project video added yet.
        </div>
      )}
    </div>
  );
}
