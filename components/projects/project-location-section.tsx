"use client";

import { useState } from "react";
import { ExternalLink, MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";

import { LocationPickerModal, type LocationPickerValue } from "@/components/projects/location-picker-modal";
import { ShareLocationDialog } from "@/components/projects/share-location-dialog";
import { TerrainMapPreview } from "@/components/projects/terrain-map-preview";
import { Button } from "@/components/ui/button";
import { useUpdateProject } from "@/hooks/use-update-project";
import { buildGoogleMapsUrl, getLocationShareTitle } from "@/lib/maps/share-location";

export function ProjectLocationSection({
  projectId,
  address,
  latitude,
  longitude,
  canEdit,
  onUpdated,
}: {
  projectId: string;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  canEdit: boolean;
  onUpdated?: () => void | Promise<void>;
}) {
  const { updateProject } = useUpdateProject(projectId);
  const [showPicker, setShowPicker] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const mapsUrl = buildGoogleMapsUrl({ address, latitude, longitude });
  const shareTitle = getLocationShareTitle({ address, latitude, longitude });
  const hasLocation = Boolean(address?.trim() || (latitude != null && longitude != null));
  const hasCoords = latitude != null && longitude != null;

  async function handleSaveLocation(value: LocationPickerValue) {
    setIsSaving(true);
    try {
      await updateProject({
        location: value.address,
        latitude: value.latitude,
        longitude: value.longitude,
      });
      toast.success("Location updated");
      await onUpdated?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update location");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="project-overview-panel">
        <div className="project-overview-panel__header">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--ds-label)" }}>
            <MapPin size={16} color="var(--ds-accent-hover)" />
            Project location
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {hasLocation && mapsUrl ? (
              <>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowShareDialog(true)}>
                  <Share2 size={14} />
                  Share
                </Button>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
                >
                  <ExternalLink size={14} />
                  Open
                </a>
              </>
            ) : null}
            {canEdit ? (
              <Button type="button" size="sm" className="bg-[var(--ds-accent)] hover:bg-[#C4956A]" disabled={isSaving} onClick={() => setShowPicker(true)}>
                {hasLocation ? "Edit" : "Add location"}
              </Button>
            ) : null}
          </div>
        </div>

        {!hasLocation ? (
          <div className="project-overview-panel__body" style={{ fontSize: "13px", color: "var(--ds-tertiary-label)" }}>
            No location set for this project.
          </div>
        ) : (
          <div className="project-overview-panel__body project-overview-panel__body--fill">
            <div style={{ fontSize: "14px", color: "var(--ds-label)", lineHeight: 1.5, marginBottom: 12 }}>
              {address || `${latitude}, ${longitude}`}
            </div>
            {hasCoords || address?.trim() ? (
              <div className="project-overview-panel__media">
                <TerrainMapPreview
                  latitude={latitude}
                  longitude={longitude}
                  address={address}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>

      <ShareLocationDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        title={shareTitle}
        url={mapsUrl ?? ""}
      />

      <LocationPickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        initialValue={
          hasLocation
            ? {
                address: address ?? "",
                latitude: latitude ?? undefined,
                longitude: longitude ?? undefined,
              }
            : null
        }
        onConfirm={(value) => void handleSaveLocation(value)}
      />
    </>
  );
}
