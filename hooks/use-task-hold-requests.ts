"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import { toHoldRequestDateIso } from "@/lib/hold-requests/display";
import type {
  CreateHoldRequestPayload,
  HoldRequestsListResponse,
  TaskableHoldRequest,
} from "@/types/hold-requests";

export function useTaskHoldRequests(taskId: string | null, enabled: boolean) {
  const [holds, setHolds] = useState<TaskableHoldRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHolds = useCallback(async () => {
    if (!taskId) {
      setHolds([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        task_id: taskId,
        page: "1",
        limit: "20",
      });
      const res = await authApiClient<HoldRequestsListResponse>(`/taskable-hold-requests?${qs}`);
      setHolds(res.data ?? []);
    } catch (err) {
      setHolds([]);
      setError(err instanceof Error ? err.message : "Failed to load hold requests");
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (enabled && taskId) {
      void fetchHolds();
    } else {
      setHolds([]);
    }
  }, [enabled, taskId, fetchHolds]);

  const pendingHold = useMemo(
    () => holds.find((h) => h.status === "PENDING") ?? null,
    [holds]
  );

  const createHoldRequest = useCallback(
    async (input: {
      taskId: string;
      reason: string;
      startDate: string;
      endDate: string;
      note?: string;
    }) => {
      const payload: CreateHoldRequestPayload = {
        task_id: input.taskId,
        reason: input.reason.trim(),
        requested_start_date: toHoldRequestDateIso(input.startDate),
        requested_end_date: toHoldRequestDateIso(input.endDate, true),
        requested_note: input.note?.trim() || undefined,
      };

      const created = await authApiClient<TaskableHoldRequest>("/taskable-hold-requests", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await fetchHolds();
      return created;
    },
    [fetchHolds]
  );

  return {
    holds,
    pendingHold,
    isLoading,
    error,
    createHoldRequest,
    refetch: fetchHolds,
  };
}
