import type { TaskableHoldRequestStatus } from "@/types/hold-requests";

const STATUS_LABEL: Record<TaskableHoldRequestStatus, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  APPROVED_MODIFIED: "Approved (modified)",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

const STATUS_STYLE: Record<TaskableHoldRequestStatus, { bg: string; color: string }> = {
  PENDING: { bg: "rgba(212,169,106,0.14)", color: "#C9894A" },
  APPROVED: { bg: "rgba(52,199,89,0.12)", color: "#248A3D" },
  APPROVED_MODIFIED: { bg: "rgba(52,199,89,0.12)", color: "#248A3D" },
  DECLINED: { bg: "rgba(255,59,48,0.10)", color: "#9B1C1C" },
  CANCELLED: { bg: "rgba(60,60,67,0.08)", color: "#6C6C70" },
  EXPIRED: { bg: "rgba(60,60,67,0.08)", color: "#6C6C70" },
};

export function holdRequestStatusLabel(status: TaskableHoldRequestStatus): string {
  return STATUS_LABEL[status] ?? status;
}

export function holdRequestStatusStyle(status: TaskableHoldRequestStatus) {
  return STATUS_STYLE[status] ?? { bg: "rgba(60,60,67,0.08)", color: "#6C6C70" };
}

export function formatHoldDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function toHoldRequestDateIso(dateOnly: string, endOfDay = false): string {
  const d = new Date(dateOnly + (dateOnly.includes("T") ? "" : "T00:00:00"));
  if (endOfDay) d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
