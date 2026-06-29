import type { AccessRequest, AccessRequestStatus } from "@/types/access-requests";
import type { AccessAppNotification } from "@/types/notifications";

function requesterName(req: AccessRequest): string {
  const u = req.requestedBy;
  const full = [u?.firstName ?? u?.first_name, u?.lastName ?? u?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return full || u?.email || "A team member";
}

const STATUS_LABEL: Record<AccessRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DECLINED: "Declined",
};

/** Maps an access request into a notification feed item. */
export function accessRequestToNotification(
  req: AccessRequest,
  canProcess: boolean
): AccessAppNotification {
  const name = requesterName(req);
  const projectName = req.project?.name?.trim() || "a project";
  const actionable = canProcess && req.status === "PENDING";

  let title: string;
  let body: string;

  if (req.status === "PENDING") {
    title = `Access request from ${name}`;
    body = `${name} requested access to "${projectName}".${req.requestNote ? ` Note: ${req.requestNote}` : ""}`;
  } else {
    title = `Access request ${STATUS_LABEL[req.status].toLowerCase()}`;
    body = `Access to "${projectName}" was ${STATUS_LABEL[req.status].toLowerCase()}.`;
  }

  return {
    id: req.id,
    key: `${req.id}:${req.status}`,
    type: "access_request",
    status: req.status,
    title,
    body,
    requesterName: name,
    projectName,
    projectId: req.projectId,
    createdAt: req.updated_at || req.created_at || new Date().toISOString(),
    actionable,
    raw: req,
  };
}

export function accessRequestStatusLabel(status: AccessRequestStatus): string {
  return STATUS_LABEL[status] ?? status;
}

export function accessRequestStatusStyle(status: AccessRequestStatus): { bg: string; color: string } {
  switch (status) {
    case "APPROVED":
      return { bg: "rgba(52,199,89,0.12)", color: "#248A3D" };
    case "DECLINED":
      return { bg: "rgba(255,59,48,0.10)", color: "#C0392B" };
    default:
      return { bg: "rgba(212,169,106,0.14)", color: "#C9894A" };
  }
}
