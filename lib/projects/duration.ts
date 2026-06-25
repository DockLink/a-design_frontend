/** Add ISO 8601 duration to a date (supports P{n}D, P{n}W, P{n}M simplified). */
export function addIsoDuration(startDate: string, duration: string): Date {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return start;

  const days = duration.match(/P(\d+)D/);
  const weeks = duration.match(/P(\d+)W/);
  const months = duration.match(/P(\d+)M/);

  const result = new Date(start);
  if (months) result.setMonth(result.getMonth() + Number(months[1]));
  else if (weeks) result.setDate(result.getDate() + Number(weeks[1]) * 7);
  else if (days) result.setDate(result.getDate() + Number(days[1]));
  else result.setDate(result.getDate() + 30);

  return result;
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatProjectStatus(status: string): string {
  return status === "ACTIVE" ? "Active" : "Inactive";
}
