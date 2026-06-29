export type DurationUnit = "days" | "weeks" | "months" | "years";

export function toIsoDuration(value: number, unit: DurationUnit): string {
  const n = Math.max(1, Math.floor(value));
  switch (unit) {
    case "days":
      return `P${n}D`;
    case "weeks":
      return `P${n}W`;
    case "months":
      return `P${n}M`;
    case "years":
      return `P${n}Y`;
  }
}

/** Compute the end date ISO string from a start date + duration input. */
export function durationToEndDate(
  startDate: string,
  value: number,
  unit: DurationUnit
): string {
  const n = Math.max(1, Math.floor(value));
  const d = new Date(startDate);
  switch (unit) {
    case "days":
      d.setDate(d.getDate() + n);
      break;
    case "weeks":
      d.setDate(d.getDate() + n * 7);
      break;
    case "months":
      d.setMonth(d.getMonth() + n);
      break;
    case "years":
      d.setFullYear(d.getFullYear() + n);
      break;
  }
  return d.toISOString();
}

export const DURATION_UNIT_LABELS: Record<DurationUnit, string> = {
  days: "Days",
  weeks: "Weeks",
  months: "Months",
  years: "Years",
};
