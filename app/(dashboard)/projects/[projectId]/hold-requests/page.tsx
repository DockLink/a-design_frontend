"use client";

import { useState } from "react";
import { Check, X, Play, Clock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useProjectHoldRequests,
  type ProcessHoldRequestPayload,
} from "@/hooks/use-project-hold-requests";
import { useProjectMembers } from "@/hooks/use-project-members";
import {
  formatHoldDate,
  holdRequestStatusLabel,
  holdRequestStatusStyle,
} from "@/lib/hold-requests/display";
import type { TaskableHoldRequest } from "@/types/hold-requests";

function HoldRequestCard({
  req,
  isProcessing,
  canProcess,
  onProcess,
}: {
  req: TaskableHoldRequest;
  isProcessing: boolean;
  canProcess: boolean;
  onProcess: (payload: ProcessHoldRequestPayload) => Promise<void>;
}) {
  const [remark, setRemark] = useState("");
  const style = holdRequestStatusStyle(req.status);

  const isPending = req.status === "PENDING";
  const isApproved = req.status === "APPROVED" || req.status === "APPROVED_MODIFIED";
  const canApproveReject = canProcess && isPending;
  const canResume = canProcess && isApproved && !req.resumedAt;

  async function handle(action: ProcessHoldRequestPayload["action"]) {
    try {
      await onProcess({
        taskableHoldRequestId: req.id,
        action,
        reviewRemark: remark.trim() || undefined,
      });
      toast.success(
        action === "approve"
          ? "Hold request approved — task timeline extended"
          : action === "reject"
          ? "Hold request rejected"
          : "Task resumed — unused hold time released"
      );
      setRemark("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process request");
    }
  }

  return (
    <div className="rounded-xl border border-[rgba(90,60,30,0.12)] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Badge
              variant="secondary"
              className="border-0 text-[11px]"
              style={{ background: style.bg, color: style.color }}
            >
              {holdRequestStatusLabel(req.status)}
            </Badge>
            <span className="text-xs text-[#9C8573]">
              {req.requestedBy?.firstName ?? ""} {req.requestedBy?.lastName ?? ""}
              {req.requestedBy?.email ? ` · ${req.requestedBy.email}` : ""}
            </span>
          </div>
          <p className="text-sm font-medium text-[#1A1410]">{req.reason}</p>
          {req.requestedNote && (
            <p className="mt-0.5 text-xs text-[#9C8573]">{req.requestedNote}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-[#9C8573]">
          <Clock className="size-3" />
          <span>
            {formatHoldDate(req.requestedStartDate)} – {formatHoldDate(req.requestedEndDate)}
          </span>
        </div>
      </div>

      {req.adminNote && (
        <p className="mb-3 rounded-lg bg-[#F5EFE6] px-3 py-2 text-xs text-[#6B5744]">
          <span className="font-medium">Admin note: </span>
          {req.adminNote}
        </p>
      )}

      {req.reviewedAt && (
        <p className="mb-2 text-xs text-[#9C8573]">
          Reviewed {formatHoldDate(req.reviewedAt)}
          {req.appliedAt ? ` · Applied ${formatHoldDate(req.appliedAt)}` : ""}
          {req.resumedAt ? ` · Resumed ${formatHoldDate(req.resumedAt)}` : ""}
        </p>
      )}

      {(canApproveReject || canResume) && (
        <div className="mt-3 border-t border-[rgba(90,60,30,0.08)] pt-3">
          <input
            type="text"
            placeholder="Optional remark…"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="mb-2 w-full rounded-lg border border-[rgba(90,60,30,0.15)] bg-[#F5EFE6] px-3 py-1.5 text-xs placeholder-[#C4B5A5] outline-none"
          />
          <div className="flex gap-2">
            {canApproveReject && (
              <>
                <Button
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => void handle("approve")}
                  className="h-7 gap-1 bg-[#3D8B5E] text-xs text-white hover:bg-[#2D7A4E]"
                >
                  <Check className="size-3" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isProcessing}
                  onClick={() => void handle("reject")}
                  className="h-7 gap-1 border-red-200 text-xs text-red-600 hover:bg-red-50"
                >
                  <X className="size-3" /> Reject
                </Button>
              </>
            )}
            {canResume && (
              <Button
                size="sm"
                disabled={isProcessing}
                onClick={() => void handle("resume")}
                className="h-7 gap-1 bg-[#D4A96A] text-xs text-white hover:bg-[#C4956A]"
              >
                <Play className="size-3" /> Resume task
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectHoldRequestsPage() {
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "all">("PENDING");
  const { effectiveRole } = useProjectMembers();
  const canProcess = effectiveRole === "admin" || effectiveRole === "lead";

  const { requests, isLoading, isProcessing, error, processRequest } = useProjectHoldRequests({
    status: filter === "all" ? undefined : filter,
    limit: 50,
  });

  const tabs = [
    { id: "PENDING" as const, label: "Pending" },
    { id: "APPROVED" as const, label: "Approved" },
    { id: "all" as const, label: "All" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#1A1410]">Hold Requests</h2>
        <p className="text-xs text-[#9C8573]">
          {canProcess
            ? "Review and process hold requests submitted by team members."
            : "Hold requests submitted for tasks in this project."}
        </p>
      </div>

      <div className="flex gap-1 rounded-lg bg-[#F5EFE6] p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              filter === tab.id
                ? "bg-white text-[#D4A96A] shadow-sm"
                : "text-[#9C8573] hover:text-[#6B5744]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-[#9C8573]">Loading hold requests…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && requests.length === 0 && (
        <div className="rounded-xl border border-[rgba(90,60,30,0.12)] bg-[#FDFAF6] px-6 py-12 text-center text-sm text-[#9C8573]">
          No{filter === "PENDING" ? " pending" : filter === "APPROVED" ? " approved" : ""} hold
          requests.
        </div>
      )}

      <div className="space-y-3">
        {requests.map((req) => (
          <HoldRequestCard
            key={req.id}
            req={req}
            isProcessing={isProcessing === req.id}
            canProcess={canProcess}
            onProcess={processRequest}
          />
        ))}
      </div>
    </div>
  );
}
