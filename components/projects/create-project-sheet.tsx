"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, MapPin, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProject } from "@/hooks/use-create-project";
import { useUploadFile } from "@/hooks/use-upload-file";
import { useUsers } from "@/hooks/use-users";
import {
  buildStagesFromOptions,
  defaultStageOptions,
  type ProjectStageOption,
} from "@/lib/projects/default-stages";
import { MemberSearchSelect } from "@/components/projects/member-search-select";

export function CreateProjectSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (projectId: string) => void;
}) {
  const { createProject } = useCreateProject();
  const { uploadFile } = useUploadFile();
  const { users: orgMembers, isLoading: membersLoading } = useUsers({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [location, setLocation] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectLeadId, setProjectLeadId] = useState("");
  const [stageOptions, setStageOptions] = useState<ProjectStageOption[]>([]);
  const [selectedStageIds, setSelectedStageIds] = useState<Set<string>>(new Set());
  const [customStageName, setCustomStageName] = useState("");
  const [showAddStage, setShowAddStage] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const defaults = defaultStageOptions();
    setName("");
    setDescription("");
    setStartDate("");
    setLocation("");
    setClientName("");
    setProjectLeadId("");
    setStageOptions(defaults);
    setSelectedStageIds(new Set(defaults.map((s) => s.id)));
    setCustomStageName("");
    setShowAddStage(false);
    setThumbnailFile(null);
    setThumbnailPreview(null);
  }, [open]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  const selectedCount = selectedStageIds.size;

  if (!open) return null;

  function toggleStage(id: string) {
    setSelectedStageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addCustomStage() {
    const trimmed = customStageName.trim();
    if (!trimmed) {
      toast.error("Enter a stage name");
      return;
    }
    const id = `custom-${Date.now()}`;
    setStageOptions((prev) => [...prev, { id, name: trimmed, isCustom: true }]);
    setSelectedStageIds((prev) => new Set([...prev, id]));
    setCustomStageName("");
    setShowAddStage(false);
  }

  function removeCustomStage(id: string) {
    setStageOptions((prev) => prev.filter((s) => s.id !== id));
    setSelectedStageIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleThumbnailChange(file: File | null) {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(file);
    setThumbnailPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clientName.trim() || !startDate) {
      toast.error("Project name, client name, and start date are required");
      return;
    }
    if (selectedCount === 0) {
      toast.error("Select at least one project stage");
      return;
    }

    const stages = buildStagesFromOptions(startDate, stageOptions, selectedStageIds);

    setIsSubmitting(true);
    try {
      let imageIds: string[] | undefined;
      if (thumbnailFile) {
        const { token } = await uploadFile(thumbnailFile);
        imageIds = [token];
      }

      const memberUserIds = projectLeadId ? [projectLeadId] : undefined;

      const project = await createProject(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          start_date: new Date(startDate).toISOString(),
          duration: "P1Y",
          location: location.trim() || undefined,
          images: imageIds,
          client: { name: clientName.trim() },
        },
        {
          stages,
          memberUserIds,
          projectLeadUserId: projectLeadId || null,
        }
      );
      toast.success("Project created");
      onCreated?.(project.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.12)", zIndex: 29 }} />
      <aside
        style={{
          position: "fixed",
          right: 0,
          top: "var(--ds-header-height)",
          width: "min(480px, 100vw)",
          height: "calc(100vh - var(--ds-header-height))",
          background: "#FDFAF6",
          borderLeft: "1px solid rgba(90,60,30,0.12)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid rgba(90,60,30,0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "var(--ds-text-title-2)", fontWeight: 600 }}>New project</span>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ flex: 1, overflowY: "auto", padding: "22px", display: "flex", flexDirection: "column", gap: "18px" }}
        >
          <div className="space-y-2">
            <Label htmlFor="proj-name">Project name</Label>
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} className="bg-[#F5EFE6] h-10" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-desc">Description / brief</Label>
            <textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "1px solid rgba(90,60,30,0.15)",
                background: "#F5EFE6",
                padding: "10px 12px",
                fontSize: "var(--ds-text-footnote)",
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-start">Start date</Label>
            <Input id="proj-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-[#F5EFE6] h-10" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-location">Location</Label>
            <div style={{ position: "relative" }}>
              <MapPin size={16} color="#8E8E93" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <Input
                id="proj-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter location…"
                className="bg-[#F5EFE6] h-10 pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-name">Client name</Label>
            <Input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-[#F5EFE6] h-10" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-lead">Project lead</Label>
            <MemberSearchSelect
              id="project-lead"
              users={orgMembers}
              value={projectLeadId}
              onChange={setProjectLeadId}
              loading={membersLoading}
              placeholder="Select project lead…"
            />
            <p style={{ fontSize: "var(--ds-text-caption-1)", color: "#8E8E93", lineHeight: 1.4 }}>
              This member gets <strong>lead access on this project only</strong>. On other projects they remain a regular member unless assigned as lead there too.
            </p>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <Label>Project stages ({selectedCount} selected)</Label>
              <button
                type="button"
                onClick={() => setShowAddStage((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#C9894A",
                  cursor: "pointer",
                  fontSize: "var(--ds-text-caption-1)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontWeight: 500,
                }}
              >
                <Plus size={14} /> Add stage
              </button>
            </div>

            {showAddStage && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "12px",
                  padding: "12px",
                  background: "#FFFFFF",
                  borderRadius: "10px",
                  border: "1px solid rgba(90,60,30,0.12)",
                }}
              >
                <Input
                  value={customStageName}
                  onChange={(e) => setCustomStageName(e.target.value)}
                  placeholder="Stage name"
                  className="bg-[#F5EFE6] flex-1"
                />
                <Button type="button" size="sm" onClick={addCustomStage} className="bg-[#D4A96A] hover:bg-[#C4956A]">
                  Add
                </Button>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {stageOptions.map((stage) => {
                const selected = selectedStageIds.has(stage.id);
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => toggleStage(stage.id)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "14px",
                      borderRadius: "12px",
                      border: `1px solid ${selected ? "#D4A96A" : "rgba(212,169,106,0.35)"}`,
                      background: selected ? "rgba(212,169,106,0.10)" : "#FDFAF6",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "var(--ds-text-footnote)",
                      color: "#5A3C1E",
                      lineHeight: 1.35,
                      minHeight: "52px",
                    }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "5px",
                        flexShrink: 0,
                        marginTop: "1px",
                        background: selected ? "#D4A96A" : "#FFFFFF",
                        border: selected ? "none" : "1.5px solid rgba(212,169,106,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && <Check size={13} color="white" strokeWidth={3} />}
                    </span>
                    <span style={{ flex: 1 }}>{stage.name}</span>
                    {stage.isCustom && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomStage(stage.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            removeCustomStage(stage.id);
                          }
                        }}
                        style={{ color: "#8E8E93", flexShrink: 0 }}
                      >
                        <X size={14} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Project thumbnail (optional)</Label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleThumbnailChange(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              style={{
                width: "100%",
                height: "120px",
                borderRadius: "12px",
                border: "1px dashed rgba(90,60,30,0.25)",
                background: "#F5EFE6",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              {thumbnailPreview ? (
                <>
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                  />
                  <span
                    style={{
                      position: "relative",
                      zIndex: 1,
                      fontSize: "var(--ds-text-caption-1)",
                      background: "rgba(0,0,0,0.5)",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "6px",
                    }}
                  >
                    Change image
                  </span>
                </>
              ) : (
                <>
                  <ImagePlus size={22} color="#C9894A" />
                  <span style={{ fontSize: "var(--ds-text-footnote)", color: "#8E8E93" }}>Upload project thumbnail</span>
                </>
              )}
            </button>
          </div>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingTop: "8px" }}>
            <Button type="submit" disabled={isSubmitting} className="h-10 w-full bg-[#D4A96A] hover:bg-[#C4956A] text-[15px]">
              {isSubmitting ? "Creating…" : "Create project"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-10 w-full">
              Cancel
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
