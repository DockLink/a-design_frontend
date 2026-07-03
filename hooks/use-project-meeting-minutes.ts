"use client";

import { useCallback, useEffect, useState } from "react";

import { useProjectMembers } from "@/hooks/use-project-members";
import { useUploadFile } from "@/hooks/use-upload-file";
import { authApiClient } from "@/lib/api/authenticated-client";
import { canManageProject } from "@/lib/projects/permissions";
import type {
  CreateMeetingMinutePayload,
  MeetingMinute,
  MeetingMinutesListResponse,
  UpdateMeetingMinutePayload,
} from "@/types/meeting-minutes";

export function useProjectMeetingMinutes(projectId: string) {
  const { effectiveRole } = useProjectMembers();
  const { uploadFile } = useUploadFile();

  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = canManageProject(effectiveRole);

  const fetchMinutes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApiClient<MeetingMinutesListResponse>(
        `/meeting-minutes/projects/${projectId}?page=1&limit=100`
      );
      setMinutes(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meeting minutes");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchMinutes();
  }, [fetchMinutes]);

  const createMinute = useCallback(
    async (payload: CreateMeetingMinutePayload) => {
      const created = await authApiClient<MeetingMinute>(
        `/meeting-minutes/projects/${projectId}`,
        { method: "POST", body: JSON.stringify(payload) }
      );
      await fetchMinutes();
      return created;
    },
    [projectId, fetchMinutes]
  );

  const updateMinute = useCallback(
    async (id: string, payload: UpdateMeetingMinutePayload) => {
      const updated = await authApiClient<MeetingMinute>(`/meeting-minutes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await fetchMinutes();
      return updated;
    },
    [fetchMinutes]
  );

  const removeMinute = useCallback(
    async (id: string) => {
      await authApiClient(`/meeting-minutes/${id}`, { method: "DELETE" });
      await fetchMinutes();
    },
    [fetchMinutes]
  );

  const setActionItemStatus = useCallback(
    async (minuteId: string, index: number, status: "PENDING" | "COMPLETED") => {
      const updated = await authApiClient<MeetingMinute>(
        `/meeting-minutes/${minuteId}/action-items/${index}/status`,
        { method: "PATCH", body: JSON.stringify({ status }) }
      );
      // Optimistically merge the returned record into the list.
      setMinutes((prev) => prev.map((m) => (m.id === minuteId ? updated : m)));
      return updated;
    },
    []
  );

  /** Uploads an attachment file and returns the floating storage token (id). */
  const uploadAttachment = useCallback(
    async (file: File) => {
      const { token } = await uploadFile(file);
      return token;
    },
    [uploadFile]
  );

  return {
    minutes,
    isLoading,
    error,
    canManage,
    refetch: fetchMinutes,
    createMinute,
    updateMinute,
    removeMinute,
    setActionItemStatus,
    uploadAudio: uploadAttachment,
    uploadAttachment,
  };
}
