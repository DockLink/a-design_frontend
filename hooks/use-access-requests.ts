"use client";

import { useCallback, useEffect, useState } from "react";

import { authApiClient } from "@/lib/api/authenticated-client";
import type {
  AccessRequest,
  AccessRequestsListResponse,
  AccessRequestsQueryParams,
  CreateAccessRequestPayload,
  ReviewAccessRequestPayload,
} from "@/types/access-requests";

function toQueryString(params: AccessRequestsQueryParams = {}): string {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.status) qs.set("status", params.status);
  if (params.project_id) qs.set("project_id", params.project_id);
  if (params.requested_by_id) qs.set("requested_by_id", params.requested_by_id);
  const str = qs.toString();
  return str ? `?${str}` : "";
}

export function useAccessRequests(
  params: AccessRequestsQueryParams = { page: 1, limit: 50 },
  options: { enabled?: boolean } = {}
) {
  const enabled = options.enabled !== false;
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [meta, setMeta] = useState<Omit<AccessRequestsListResponse, "data"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApiClient<AccessRequestsListResponse>(
        `/access-requests${toQueryString(params)}`
      );
      setRequests(res.data ?? []);
      setMeta({
        total: res.total,
        page: res.page,
        limit: res.limit,
        totalPages: res.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load access requests");
      setRequests([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, params.page, params.limit, params.status, params.project_id, params.requested_by_id]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const createRequest = useCallback(async (payload: CreateAccessRequestPayload) => {
    const created = await authApiClient<AccessRequest>("/access-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await fetchRequests();
    return created;
  }, [fetchRequests]);

  const reviewRequest = useCallback(async (payload: ReviewAccessRequestPayload) => {
    const updated = await authApiClient<AccessRequest>("/access-requests/review", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    await fetchRequests();
    return updated;
  }, [fetchRequests]);

  const cancelRequest = useCallback(async (id: string) => {
    await authApiClient(`/access-requests/${id}`, { method: "DELETE" });
    await fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    meta,
    isLoading,
    error,
    refetch: fetchRequests,
    createRequest,
    reviewRequest,
    cancelRequest,
  };
}
