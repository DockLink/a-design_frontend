"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, MapPin, X } from "lucide-react";
import { toast } from "sonner";

import { LocationPickerModal, type LocationPickerValue } from "@/components/projects/location-picker-modal";
import { MemberSearchSelect } from "@/components/projects/member-search-select";
import { ProjectMilestonesEditor } from "@/components/projects/project-milestones-editor";
import { ProjectStagesEditor } from "@/components/projects/project-stages-editor";
import {
  ProjectBriefAttachmentsList,
  ProjectBriefAttachmentsEmptyHint,
  ProjectBriefUploadButton,
} from "@/components/projects/project-brief-attachments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProject } from "@/hooks/use-update-project";
import { useUploadFile } from "@/hooks/use-upload-file";
import { useUsers } from "@/hooks/use-users";
import { addIsoDuration } from "@/lib/projects/duration";
import { isValidVimeoUrl } from "@/lib/vimeo/parse-vimeo-url";
import { isGuestProjectMember } from "@/lib/user/guest";
import type {
  Project,
  ProjectBriefAttachment,
  ProjectImage,
  ProjectMember,
  ProjectMemberAssignRequest,
  ProjectMemberProjectRole,
  ProjectStatus,
} from "@/types/projects";
import { PROJECT_LEAD_ROLE } from "@/types/projects";

function toDateInputValue(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function projectEndDateInput(project: Project): string {
  const withEnd = project as Project & { end_date?: string };
  if (withEnd.end_date) return toDateInputValue(withEnd.end_date);
  if (project.start_date && project.duration) {
    return toDateInputValue(addIsoDuration(project.start_date, project.duration).toISOString());
  }
  return "";
}

export function EditProjectSheet({
  project,
  members,
  projectLeadUserIds,
  open,
  onClose,
  onSaved,
  onUpdateMembers,
}: {
  project: Project;
  members: ProjectMember[];
  projectLeadUserIds: string[];
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onUpdateMembers: (payload: ProjectMemberAssignRequest, leadUserIds?: string[] | null) => Promise<unknown>;
}) {
  const { updateProject } = useUpdateProject(project.id);
  const { uploadFile } = useUploadFile();
  const { users: orgMembers, isLoading: membersLoading } = useUsers({
    page: 1,
    limit: 100,
    status: "ACTIVE",
  });

  const briefInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(project.name);
  const [clientName, setClientName] = useState(project.client?.name ?? "");
  const [clientEmail, setClientEmail] = useState(project.client?.contact_email ?? "");
  const [clientPhone, setClientPhone] = useState(project.client?.contact_number ?? "");
  const [startDate, setStartDate] = useState(toDateInputValue(project.start_date));
  const [endDate, setEndDate] = useState(projectEndDateInput(project));
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [description, setDescription] = useState(project.description ?? "");
  const [location, setLocation] = useState(project.location ?? "");
  const [latitude, setLatitude] = useState<number | undefined>(project.latitude ?? undefined);
  const [longitude, setLongitude] = useState<number | undefined>(project.longitude ?? undefined);
  const [vimeoUrl, setVimeoUrl] = useState(project.vimeo_url ?? "");
  const [projectLeadId, setProjectLeadId] = useState(projectLeadUserIds[0] ?? "");
  const [images, setImages] = useState<ProjectImage[]>(project.images ?? []);
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([]);
  const [pendingImagePreviews, setPendingImagePreviews] = useState<string[]>([]);
  const [briefAttachments, setBriefAttachments] = useState<ProjectBriefAttachment[]>(
    project.brief_attachments ?? []
  );
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isUploadingBrief, setIsUploadingBrief] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(project.name);
    setClientName(project.client?.name ?? "");
    setClientEmail(project.client?.contact_email ?? "");
    setClientPhone(project.client?.contact_number ?? "");
    setStartDate(toDateInputValue(project.start_date));
    setEndDate(projectEndDateInput(project));
    setStatus(project.status);
    setDescription(project.description ?? "");
    setLocation(project.location ?? "");
    setLatitude(project.latitude ?? undefined);
    setLongitude(project.longitude ?? undefined);
    setVimeoUrl(project.vimeo_url ?? "");
    setProjectLeadId(projectLeadUserIds[0] ?? "");
    setImages(project.images ?? []);
    setPendingImageFiles([]);
    setPendingImagePreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setBriefAttachments(project.brief_attachments ?? []);
  }, [open, project, projectLeadUserIds]);

  useEffect(() => {
    return () => {
      pendingImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [pendingImagePreviews]);

  if (!open) return null;

  function handleLocationConfirm(value: LocationPickerValue) {
    setLocation(value.address);
    setLatitude(value.latitude);
    setLongitude(value.longitude);
  }

  function handleThumbnailChange(files: FileList | null) {
    if (!files?.length) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Please choose image files");
      return;
    }
    pendingImagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setPendingImageFiles(imageFiles);
    setPendingImagePreviews(imageFiles.map((f) => URL.createObjectURL(f)));
  }

  function handleRemoveExistingImage(imageId: string) {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
  }

  async function handleBriefFilesSelected(files: FileList | null) {
    if (!files?.length) return;
    setIsUploadingBrief(true);
    try {
      const uploaded: ProjectBriefAttachment[] = [];
      for (const file of Array.from(files)) {
        const { token } = await uploadFile(file);
        uploaded.push({
          id: token,
          url: "",
          file_name: file.name,
          mime_type: file.type || null,
        });
      }
      setBriefAttachments((prev) => [...prev, ...uploaded]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload files");
    } finally {
      setIsUploadingBrief(false);
      if (briefInputRef.current) briefInputRef.current.value = "";
    }
  }

  async function saveProjectLead(newLeadId: string) {
    if (!newLeadId) return;

    const leadSet = new Set([...projectLeadUserIds, newLeadId]);

    const activeTeam = members.filter(
      (m) => m.status === "ACTIVE" && !isGuestProjectMember(m)
    );
    const teamUserIds = new Set(activeTeam.map((m) => m.user_id));
    teamUserIds.add(newLeadId);

    const guestRows = members
      .filter((m) => m.status === "ACTIVE" && isGuestProjectMember(m))
      .map((m) => ({
        user_id: m.user_id,
        status: "ACTIVE" as const,
        role: "VIEWER" as const,
      }));

    const teamRows = [...teamUserIds].map((user_id) => ({
      user_id,
      status: "ACTIVE" as const,
      role: (leadSet.has(user_id) ? PROJECT_LEAD_ROLE : "MEMBER") as ProjectMemberProjectRole,
    }));

    await onUpdateMembers({ members: [...teamRows, ...guestRows] }, [...leadSet]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !clientName.trim() || !startDate || !endDate) {
      toast.error("Project name, client name, and dates are required");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date must be on or after start date");
      return;
    }
    if (vimeoUrl.trim() && !isValidVimeoUrl(vimeoUrl)) {
      toast.error("Enter a valid Vimeo URL");
      return;
    }

    setIsSaving(true);
    try {
      let imageIds = images.map((img) => ({ id: img.id }));
      if (pendingImageFiles.length > 0) {
        for (const file of pendingImageFiles) {
          const { token } = await uploadFile(file);
          imageIds.push({ id: token });
        }
      }

      await updateProject({
        name: name.trim(),
        description: description.trim() || undefined,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(`${endDate}T23:59:59`).toISOString(),
        status,
        location: location.trim() || undefined,
        latitude,
        longitude,
        vimeo_url: vimeoUrl.trim() || undefined,
        images: imageIds,
        brief_attachments: briefAttachments.map((a) => ({ id: a.id })),
        client: project.client?.id
          ? {
              id: project.client.id,
              name: clientName.trim(),
              contact_email: clientEmail.trim() || undefined,
              contact_number: clientPhone.trim() || undefined,
            }
          : undefined,
      });

      if (projectLeadId) {
        await saveProjectLead(projectLeadId);
      }

      toast.success("Project updated");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update project");
    } finally {
      setIsSaving(false);
    }
  }

  const allImagePreviews = [
    ...images.map((img) => ({ key: img.id, src: img.url, existing: true as const, id: img.id })),
    ...pendingImagePreviews.map((src, i) => ({
      key: `pending-${i}`,
      src,
      existing: false as const,
      id: null as string | null,
    })),
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          zIndex: 200,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(640px, 100vw)",
          background: "var(--ds-surface-elevated)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid var(--ds-separator)",
          }}
        >
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--ds-label)" }}>
              Edit project
            </div>
            <div style={{ fontSize: "12px", color: "var(--ds-secondary-label)", marginTop: "2px" }}>
              {project.code?.toUpperCase()} · All project details
            </div>
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
            <Label htmlFor="edit-project-name">Project name</Label>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[var(--ds-bg)] h-10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-brief">Description / brief</Label>
            <textarea
              id="edit-brief"
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
                Attach PDFs, audio, images, or reference files
              </span>
              <input
                ref={briefInputRef}
                type="file"
                multiple
                hidden
                onChange={(e) => void handleBriefFilesSelected(e.target.files)}
              />
              <ProjectBriefUploadButton
                disabled={isSaving}
                isUploading={isUploadingBrief}
                onClick={() => briefInputRef.current?.click()}
              />
            </div>
            {briefAttachments.length > 0 ? (
              <ProjectBriefAttachmentsList
                attachments={briefAttachments}
                canEdit
                onRemove={(id) => setBriefAttachments((prev) => prev.filter((a) => a.id !== id))}
              />
            ) : (
              <ProjectBriefAttachmentsEmptyHint />
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="space-y-2">
              <Label htmlFor="edit-start-date">Start date</Label>
              <Input
                id="edit-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[var(--ds-bg)] h-10"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-date">End date</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[var(--ds-bg)] h-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="h-10 w-full rounded-md border border-input bg-[var(--ds-bg)] px-3 text-sm"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-location">Location</Label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                <MapPin
                  size={16}
                  color="var(--ds-tertiary-label)"
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
                />
                <Input
                  id="edit-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search or enter address…"
                  className="bg-[var(--ds-bg)] h-10 pl-9"
                />
              </div>
              <Button type="button" variant="outline" className="h-10 shrink-0" onClick={() => setShowLocationPicker(true)}>
                Pick on map
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-vimeo">Vimeo link (optional)</Label>
            <Input
              id="edit-vimeo"
              value={vimeoUrl}
              onChange={(e) => setVimeoUrl(e.target.value)}
              placeholder="https://vimeo.com/123456789"
              className="bg-[var(--ds-bg)] h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-client-name">Client name</Label>
            <Input
              id="edit-client-name"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="bg-[var(--ds-bg)] h-10"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="space-y-2">
              <Label htmlFor="edit-client-email">Client email</Label>
              <Input
                id="edit-client-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="bg-[var(--ds-bg)] h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client-phone">Client phone</Label>
              <Input
                id="edit-client-phone"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="bg-[var(--ds-bg)] h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-project-lead">Project lead</Label>
            <MemberSearchSelect
              id="edit-project-lead"
              users={orgMembers}
              value={projectLeadId}
              onChange={setProjectLeadId}
              loading={membersLoading}
              placeholder="Select project lead…"
            />
          </div>

          <div className="space-y-2">
            <Label>Project photos</Label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => handleThumbnailChange(e.target.files)}
            />
            {allImagePreviews.length > 0 ? (
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
                  {allImagePreviews.map((preview) => (
                    <div key={preview.key} style={{ position: "relative" }}>
                      <img
                        src={preview.src}
                        alt=""
                        style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "8px" }}
                      />
                      {preview.existing && preview.id ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(preview.id!)}
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
                          }}
                          aria-label="Remove photo"
                        >
                          ×
                        </button>
                      ) : null}
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
                }}
              >
                <ImagePlus size={22} color="var(--ds-accent-hover)" />
                <span style={{ fontSize: "var(--ds-text-footnote)", color: "var(--ds-tertiary-label)" }}>
                  Upload project photos
                </span>
              </button>
            )}
          </div>

          <div
            style={{
              paddingTop: "4px",
              borderTop: "1px solid var(--ds-separator)",
            }}
          >
            <ProjectStagesEditor projectId={project.id} onUpdated={onSaved} />
          </div>

          <div
            style={{
              paddingTop: "4px",
              borderTop: "1px solid var(--ds-separator)",
            }}
          >
            <ProjectMilestonesEditor projectId={project.id} onUpdated={onSaved} />
          </div>
        </form>

        <div
          style={{
            padding: "16px 22px",
            borderTop: "1px solid var(--ds-separator)",
            display: "flex",
            gap: "10px",
          }}
        >
          <Button type="button" variant="outline" className="flex-1 h-10" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1 h-10 bg-[var(--ds-accent)] text-white hover:bg-[var(--ds-accent-hover)]"
            disabled={isSaving || isUploadingBrief}
            onClick={(e) => void handleSubmit(e as unknown as React.FormEvent)}
          >
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>

      <LocationPickerModal
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        initialValue={
          location || latitude != null
            ? { address: location, latitude, longitude }
            : null
        }
        onConfirm={handleLocationConfirm}
      />
    </>
  );
}
