import { holdRequestStatusLabel } from "@/lib/hold-requests/display";
import type { TaskableHoldRequest } from "@/types/hold-requests";
import type { HoldAppNotification } from "@/types/notifications";

function requesterName(req: TaskableHoldRequest): string {
  const u = req.requestedBy;
  const full = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
  return full || u?.email || "A team member";
}

/** Maps a hold request into a notification feed item. */
export function holdRequestToNotification(
  req: TaskableHoldRequest,
  canProcess: boolean
): HoldAppNotification {
  const name = requesterName(req);
  const taskTitle = req.task?.title?.trim() || "a task";
  const actionable = canProcess && req.status === "PENDING";

  let title: string;
  let body: string;

  if (req.status === "PENDING") {
    title = `Hold request from ${name}`;
    body = `${name} requested a hold on "${taskTitle}". Reason: ${req.reason}`;
  } else {
    title = `Hold request ${holdRequestStatusLabel(req.status).toLowerCase()}`;
    body = `Hold on "${taskTitle}" was ${holdRequestStatusLabel(req.status).toLowerCase()}.`;
  }

  return {
    id: req.id,
    key: `${req.id}:${req.status}`,
    type: "hold_request",
    status: req.status,
    title,
    body,
    requesterName: name,
    taskTitle,
    taskId: req.taskId,
    projectId: req.task?.projectId,
    createdAt: req.updated_at || req.created_at || new Date().toISOString(),
    actionable,
    raw: req,
  };
}
