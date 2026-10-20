import type { CreateProjectStageInput } from "@/types/projects";

/** Default project stage names (order only — no per-stage durations). */
export const DEFAULT_PROJECT_STAGE_NAMES = [
  "Concept Design",
  "Design Development Stage",
  "Contract Administration",
  "Tender Stage",
  "Construction",
  "Post Construction",
] as const;

export const STAGE_START_REQUIRED_WITH_END =
  "Start date is required when end date is set";

export interface ProjectStageOption {
  id: string;
  name: string;
  isCustom?: boolean;
  /** Per-stage time range (yyyy-mm-dd). Optional until the user sets it. */
  startDate?: string;
  endDate?: string;
}

export function defaultStageOptions(): ProjectStageOption[] {
  return DEFAULT_PROJECT_STAGE_NAMES.map((name, idx) => ({
    id: `default-${idx}`,
    name,
  }));
}

function toIsoStart(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

function toIsoEnd(date: string): string {
  return new Date(`${date}T23:59:59`).toISOString();
}

function filledDate(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function buildStagesFromOptions(
  options: ProjectStageOption[],
  selectedIds: Set<string>
): CreateProjectStageInput[] {
  const selected = options.filter((o) => selectedIds.has(o.id));

  return selected.map((stage, idx) => {
    const start = filledDate(stage.startDate);
    const end = filledDate(stage.endDate);
    return {
      name: stage.name,
      order: idx,
      ...(start ? { start_date: toIsoStart(start) } : {}),
      ...(end ? { end_date: toIsoEnd(end) } : {}),
    };
  });
}
