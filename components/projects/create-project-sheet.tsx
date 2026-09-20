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
import {
  ProjectBriefAttachmentsList,
  ProjectBriefUploadButton,
} from "@/components/projects/project-brief-attachments";
import { LocationPickerModal, type LocationPickerValue } from "@/components/projects/location-picker-modal";
import { isValidVimeoUrl } from "@/lib/vimeo/parse-vimeo-url";
import type { ProjectBriefAttachment } from "@/types/projects";

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
  const briefInputRef = useRef<HTMLInputElement>(null);

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
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [vimeoUrl, setVimeoUrl] = useState("");
  const [thumbnailFiles, setThumbnailFiles] = useState<File[]>([]);
  const [thumbnailPreviews, setThumbnailPreviews] = useState<string[]>([]);
  const [briefAttachments, setBriefAttachments] = useState<ProjectBriefAttachment[]>([]);
  const [isUploadingBrief, setIsUploadingBrief] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState<number | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem("create_project_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setName(parsed.name || "");
        setDescription(parsed.description || "");
        setStartDate(parsed.startDate || "");
        setLocation(parsed.location || "");
        setLatitude(parsed.latitude);
        setLongitude(parsed.longitude);
        setVimeoUrl(parsed.vimeoUrl || "");
        setClientName(parsed.clientName || "");
        setProjectLeadId(parsed.projectLeadId || "");
        
        if (parsed.stageOptions) {
          setStageOptions(parsed.stageOptions);
        } else {
          setStageOptions(defaultStageOptions());
        }
        
        if (parsed.selectedStageIds) {
          setSelectedStageIds(new Set(parsed.selectedStageIds));
        } else {
          const defaults = defaultStageOptions();
          setSelectedStageIds(new Set(defaults.map((s) => s.id)));
        }
        
        setCustomStageName("");
        setShowAddStage(false);
        setThumbnailFiles([]);
        setThumbnailPreviews([]);
        setBriefAttachments([]);
        setIsUploadingBrief(false);
        setHasDraft(true);
        return;
      }
    } catch (e) {
      console.error("Failed to parse project draft", e);
    }

    const defaults = defaultStageOptions();
    setName("");
    setDescription("");
    setStartDate("");
    setLocation("");
    setLatitude(undefined);
    setLongitude(undefined);
    setVimeoUrl("");
    setClientName("");
    setProjectLeadId("");
    setStageOptions(defaults);
    setSelectedStageIds(new Set(defaults.map((s) => s.id)));
    setCustomStageName("");
    setShowAddStage(false);
    setThumbnailFiles([]);
    setThumbnailPreviews([]);
    setBriefAttachments([]);
    setBriefAttachments([]);
    setIsUploadingBrief(false);
    setHasDraft(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const draft = {
      name,
      description,
      startDate,
      location,
      latitude,
      longitude,
      vimeoUrl,
      clientName,
      projectLeadId,
      stageOptions,
      selectedStageIds: Array.from(selectedStageIds),
    };
    
    // Don't save empty drafts if they haven't typed anything
    const isModified = name || description || startDate || location || vimeoUrl || clientName || projectLeadId || selectedStageIds.size !== defaultStageOptions().length;
    
    if (isModified) {
      localStorage.setItem("create_project_draft", JSON.stringify(draft));
      setHasDraft(true);
    }
  }, [name, description, startDate, location, latitude, longitude, vimeoUrl, clientName, projectLeadId, stageOptions, selectedStageIds, open]);

  useEffect(() => {
    return () => {
      thumbnailPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [thumbnailPreviews]);

  useEffect(() => {
    return () => {
      briefAttachments.forEach((a) => {
        if (a.url && a.url.startsWith("blob:")) {
          URL.revokeObjectURL(a.url);
        }
      });
    };
  }, [briefAttachments]);

  const selectedCount = selectedStageIds.size;
  const projectStartDay = startDate;
  // The project end is driven by the stages — it's the latest stage end date.
  const projectEndDay = (() => {
    const ends = stageOptions
      .filter((s) => selectedStageIds.has(s.id) && s.endDate)
      .map((s) => s.endDate as string);
    if (ends.length === 0) return undefined;
    return ends.reduce((max, d) => (d > max ? d : max));
  })();

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

  function updateStageDate(id: string, field: "startDate" | "endDate", value: string) {
    setStageOptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function handleThumbnailChange(files: FileList | null) {
    if (!files?.length) return;
    const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    
    const existingNames = new Set(thumbnailFiles.map((f) => f.name));
    let skippedCount = 0;
    
    const validNewFiles = newFiles.filter(f => {
      if (existingNames.has(f.name)) {
        skippedCount++;
        return false;
      }
      return true;
    });

    if (validNewFiles.length === 0) {
      if (skippedCount > 0) {
        toast.error(skippedCount === 1 ? "1 duplicate photo was skipped" : `${skippedCount} duplicate photos were skipped`);
      }
      return;
    }

    const newPreviews = validNewFiles.map((f) => URL.createObjectURL(f));
    
    setThumbnailFiles(prev => [...prev, ...validNewFiles]);
    setThumbnailPreviews(prev => [...prev, ...newPreviews]);
    
    if (skippedCount > 0) {
      toast.error(skippedCount === 1 ? "1 duplicate photo was skipped" : `${skippedCount} duplicate photos were skipped`);
    }

    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  }

  function handleRemoveThumbnail(index: number) {
    setThumbnailFiles(prev => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
    setThumbnailPreviews(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[index]);
      next.splice(index, 1);
      return next;
    });
  }

  function handleLocationConfirm(value: LocationPickerValue) {
    setLocation(value.address);
    setLatitude(value.latitude);
    setLongitude(value.longitude);
  }

  async function handleBriefFilesSelected(files: FileList | null) {
    if (!files?.length) return;

    setIsUploadingBrief(true);
    try {
      const uploaded: ProjectBriefAttachment[] = [];
      const existingNames = new Set(briefAttachments.map((a) => a.file_name));
      let skippedCount = 0;

      for (const file of Array.from(files)) {
        if (existingNames.has(file.name)) {
          skippedCount++;
          continue;
        }
        existingNames.add(file.name);

        const { token } = await uploadFile(file);
        uploaded.push({
          id: token,
          url: URL.createObjectURL(file),
          file_name: file.name,
          mime_type: file.type || null,
        });
      }
      
      if (uploaded.length > 0) {
        setBriefAttachments((prev) => [...prev, ...uploaded]);
        toast.success(uploaded.length > 1 ? "Files added to brief" : "File added to brief");
      }
      
      if (skippedCount > 0) {
        toast.error(
          skippedCount === 1
            ? "1 duplicate file was skipped"
            : `${skippedCount} duplicate files were skipped`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setIsUploadingBrief(false);
      if (briefInputRef.current) briefInputRef.current.value = "";
    }
  }

  function handleRemoveBriefAttachment(id: string) {
    setBriefAttachments((prev) => prev.filter((item) => item.id !== id));
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

    if (vimeoUrl.trim() && !isValidVimeoUrl(vimeoUrl)) {
      toast.error("Enter a valid Vimeo URL");
      return;
    }

    const selectedStages = stageOptions.filter((s) => selectedStageIds.has(s.id));
    let latestEndDay = "";
    for (const stage of selectedStages) {
      if (!stage.startDate || !stage.endDate) {
        toast.error(`Set a start and end date for the "${stage.name}" stage`);
        return;
      }
      if (stage.startDate < startDate) {
        toast.error(
          `"${stage.name}" stage can't start before the project start (${new Date(startDate).toLocaleDateString()})`
        );
        return;
      }
      if (stage.endDate < stage.startDate) {
        toast.error(`"${stage.name}" stage end date must be on or after its start date`);
        return;
      }
      if (stage.endDate > latestEndDay) latestEndDay = stage.endDate;
    }

    // The project end is the latest stage end date.
    const projectEndIso = new Date(`${latestEndDay}T23:59:59`).toISOString();

    const stages = buildStagesFromOptions(startDate, stageOptions, selectedStageIds, projectEndIso);

    setIsSubmitting(true);
    try {
      let imageIds: string[] | undefined;
      if (thumbnailFiles.length > 0) {
        const tokens: string[] = [];
        for (const file of thumbnailFiles) {
          const { token } = await uploadFile(file);
          tokens.push(token);
        }
        imageIds = tokens;
      }

      const memberUserIds = projectLeadId ? [projectLeadId] : undefined;

      const project = await createProject(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          start_date: new Date(startDate).toISOString(),
          end_date: projectEndIso,
          location: location.trim() || undefined,
          latitude,
          longitude,
          vimeo_url: vimeoUrl.trim() || undefined,
          images: imageIds,
          brief_attachments: briefAttachments.length > 0 ? briefAttachments.map((item) => item.id) : undefined,
          client: { name: clientName.trim() },
        },
        {
          stages,
          memberUserIds,
          projectLeadUserId: projectLeadId || null,
        }
      );
      toast.success("Project created");
      localStorage.removeItem("create_project_draft");
      setHasDraft(false);
      onCreated?.(project.id);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClearDraft() {
    if (window.confirm("Are you sure you want to discard your draft?")) {
      localStorage.removeItem("create_project_draft");
      setHasDraft(false);
      
      // Reset all fields to default
      const defaults = defaultStageOptions();
      setName("");
      setDescription("");
      setStartDate("");
      setLocation("");
      setLatitude(undefined);
      setLongitude(undefined);
      setVimeoUrl("");
      setClientName("");
      setProjectLeadId("");
      setStageOptions(defaults);
      setSelectedStageIds(new Set(defaults.map((s) => s.id)));
      setCustomStageName("");
      setShowAddStage(false);
      setThumbnailFiles([]);
      setThumbnailPreviews([]);
      setBriefAttachments([]);
      setIsUploadingBrief(false);
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
          background: "var(--ds-surface-elevated)",
          borderLeft: "1px solid var(--ds-separator)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid var(--ds-separator)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "var(--ds-text-title-2)", fontWeight: 600 }}>New project</span>
            {hasDraft && (
              <button
                type="button"
                onClick={handleClearDraft}
                style={{
                  fontSize: "var(--ds-text-caption-1)",
                  color: "var(--ds-tertiary-label)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: "4px",
                }}
              >
                Clear draft
              </button>
            )}
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          style={{ flex: 1, overflowY: "auto", padding: "22px", display: "flex", flexDirection: "column", gap: "18px" }}
        >
          <div className="space-y-2">
            <Label htmlFor="proj-name">Project name <span className="text-red-500">*</span></Label>
            <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} className="bg-[var(--ds-bg)] h-10" required />
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
                background: "var(--ds-bg)",
                padding: "10px 12px",
                fontSize: "var(--ds-text-footnote)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "var(--ds-text-caption-1)", color: "var(--ds-tertiary-label)" }}>
                Attach PDFs, audio, images, or any reference files
              </span>
              <input
                ref={briefInputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => void handleBriefFilesSelected(e.target.files)}
              />
              <ProjectBriefUploadButton
                isUploading={isUploadingBrief}
                disabled={isSubmitting}
                onClick={() => briefInputRef.current?.click()}
              />
            </div>
            {briefAttachments.length > 0 ? (
              <ProjectBriefAttachmentsList
                attachments={briefAttachments}
                canEdit
                onRemove={handleRemoveBriefAttachment}
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-start">Start date <span className="text-red-500">*</span></Label>
            <Input
              id="proj-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[var(--ds-bg)] h-10"
              required
            />
            <p style={{ fontSize: "var(--ds-text-caption-1)", color: "var(--ds-tertiary-label)", lineHeight: 1.4 }}>
              The project end date is set automatically from the last stage&apos;s end date.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-location">Location</Label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                <MapPin size={16} color="var(--ds-tertiary-label)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <Input
                  id="proj-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search or enter address…"
                  className="bg-[var(--ds-bg)] h-10 pl-9"
                />
              </div>
              <Button type="button" variant="outline" className="h-10 shrink-0 whitespace-nowrap" onClick={() => setShowLocationPicker(true)}>
                Pick on map
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proj-vimeo">Vimeo link (optional)</Label>
            <Input
              id="proj-vimeo"
              value={vimeoUrl}
              onChange={(e) => setVimeoUrl(e.target.value)}
              placeholder="https://vimeo.com/123456789 or https://vimeo.com/123456789/abc123"
              className="bg-[var(--ds-bg)] h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client-name">Client name <span className="text-red-500">*</span></Label>
            <Input id="client-name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-[var(--ds-bg)] h-10" required />
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
            <p style={{ fontSize: "var(--ds-text-caption-1)", color: "var(--ds-tertiary-label)", lineHeight: 1.4 }}>
              This member gets <strong>lead access on this project only</strong>. On other projects they remain a regular member unless assigned as lead there too.
            </p>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <Label>Project stages ({selectedCount} selected) <span className="text-red-500">*</span></Label>
              <button
                type="button"
                onClick={() => setShowAddStage((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--ds-accent-hover)",
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
                  border: "1px solid var(--ds-separator)",
                }}
              >
                <Input
                  value={customStageName}
                  onChange={(e) => setCustomStageName(e.target.value)}
                  placeholder="Stage name"
                  className="bg-[var(--ds-bg)] flex-1"
                />
                <Button type="button" size="sm" onClick={addCustomStage} className="bg-[var(--ds-accent)] hover:bg-[#C4956A]">
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
                      border: `1px solid ${selected ? "var(--ds-accent)" : "rgba(212,169,106,0.35)"}`,
                      background: selected ? "rgba(212,169,106,0.10)" : "var(--ds-surface-elevated)",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "var(--ds-text-footnote)",
                      color: "var(--ds-secondary-label)",
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
                        background: selected ? "var(--ds-accent)" : "#FFFFFF",
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
                        style={{ color: "var(--ds-tertiary-label)", flexShrink: 0 }}
                      >
                        <X size={14} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedCount > 0 && (
            <div>
              <Label>Stage timeline</Label>
              <p style={{ fontSize: "var(--ds-text-caption-1)", color: "var(--ds-tertiary-label)", lineHeight: 1.4, margin: "4px 0 10px" }}>
                Set a start and end date for each stage.{projectStartDay
                  ? ` Stages can't start before the project start (${new Date(projectStartDay).toLocaleDateString()}).`
                  : " Set the project start date first."}
                {projectEndDay && ` Project end: ${new Date(projectEndDay).toLocaleDateString()}.`}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {stageOptions
                  .filter((s) => selectedStageIds.has(s.id))
                  .map((stage) => (
                    <div
                      key={stage.id}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        border: "1px solid var(--ds-separator)",
                        background: "#FFFFFF",
                      }}
                    >
                      <div style={{ fontSize: "var(--ds-text-footnote)", fontWeight: 500, color: "var(--ds-secondary-label)", marginBottom: "8px" }}>
                        {stage.name}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div>
                          <span style={{ fontSize: "var(--ds-text-caption-1)", color: "var(--ds-tertiary-label)" }}>Start</span>
                          <Input
                            type="date"
                            value={stage.startDate ?? ""}
                            min={projectStartDay}
                            onChange={(e) => updateStageDate(stage.id, "startDate", e.target.value)}
                            className="bg-[var(--ds-bg)] h-9 mt-1"
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "var(--ds-text-caption-1)", color: "var(--ds-tertiary-label)" }}>End</span>
                          <Input
                            type="date"
                            value={stage.endDate ?? ""}
                            min={stage.startDate ?? projectStartDay}
                            onChange={(e) => updateStageDate(stage.id, "endDate", e.target.value)}
                            className="bg-[var(--ds-bg)] h-9 mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Project photos (optional)</Label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleThumbnailChange(e.target.files)}
            />
            {thumbnailPreviews.length > 0 ? (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
                    gap: "8px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "12px",
                    border: "1px dashed rgba(90,60,30,0.25)",
                    background: "var(--ds-bg)",
                  }}
                >
                  {thumbnailPreviews.map((preview, index) => (
                    <div key={preview} style={{ position: "relative" }}>
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "8px", cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewPhotoIndex(index);
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveThumbnail(index);
                        }}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          border: "none",
                          background: "rgba(0,0,0,0.55)",
                          color: "white",
                          fontSize: 14,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        aria-label="Remove photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full"
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  Add more photos
                </Button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                style={{
                  width: "100%",
                  minHeight: "120px",
                  borderRadius: "12px",
                  border: "1px dashed rgba(90,60,30,0.25)",
                  background: "var(--ds-bg)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  overflow: "hidden",
                  position: "relative",
                  padding: "0",
                }}
              >
                <ImagePlus size={22} color="var(--ds-accent-hover)" />
                <span style={{ fontSize: "var(--ds-text-footnote)", color: "var(--ds-tertiary-label)" }}>Upload project photos</span>
              </button>
            )}
          </div>

          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingTop: "8px" }}>
            <Button type="submit" disabled={isSubmitting || isUploadingBrief} className="h-10 w-full bg-[var(--ds-accent)] hover:bg-[#C4956A] text-[15px]">
              {isSubmitting ? "Creating…" : "Create project"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="h-10 w-full">
              Cancel
            </Button>
          </div>
        </form>
      </aside>

      <LocationPickerModal
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        initialValue={location ? { address: location, latitude, longitude } : null}
        onConfirm={handleLocationConfirm}
      />
      {previewPhotoIndex !== null && (
        <div 
          onClick={() => setPreviewPhotoIndex(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px"
          }}
        >
          <img 
            src={thumbnailPreviews[previewPhotoIndex]} 
            alt="Preview fullscreen" 
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setPreviewPhotoIndex(null)}
            style={{
              position: "absolute",
              top: "24px",
              right: "24px",
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: "50%",
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "white",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          >
            <X size={28} />
          </button>
        </div>
      )}
    </>
  );
}
