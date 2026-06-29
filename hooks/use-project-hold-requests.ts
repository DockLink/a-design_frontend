"use client";

import { useCallback, useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import type { HoldRequestsListResponse, TaskableHoldRequest, TaskableHoldRequestStatus } from "@/types/hold-requests";

export interface ProcessHoldRequestPayload {
  taskableHoldRequestId: string;
  action: "approve" | "reject" | "resume";
  reviewRemark?: string;
  approvedStartDate?: string;
  approvedEndDate?: string;
  resumeDate?: string;
}

export function useProjectHoldRequests(options?: {
  status?: TaskableHoldRequestStatus;
  limit?: number;
}) {
  const [requests, setRequests] = useState<TaskableHoldRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: "1",
        limit: String(options?.limit ?? 50),
        ...(options?.status ? { status: options.status } : {}),
      });
      const res = await authApiClient<HoldRequestsListResponse>(
        `/taskable-hold-requests?${qs}`
      );
      setRequests(res.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hold requests");
    } finally {
      setIsLoading(false);
    }
  }, [options?.status, options?.limit]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const processRequest = useCallback(
    async (payload: ProcessHoldRequestPayload) => {
      setIsProcessing(payload.taskableHoldRequestId);
      try {
        await authApiClient("/taskable-hold-requests/process", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await fetchRequests();
      } finally {
        setIsProcessing(null);
      }
    },
    [fetchRequests]
  );

  return {
    requests,
    isLoading,
    isProcessing,
    error,
    refetch: fetchRequests,
    processRequest,
  };
}
