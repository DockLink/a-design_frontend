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

/** Placeholder duration for API-required fields; timelines are set per stage later. */
const STAGE_PLACEHOLDER_DURATION = "P1D";

export interface ProjectStageOption {
  id: string;
  name: string;
  isCustom?: boolean;
}

export function defaultStageOptions(): ProjectStageOption[] {
  return DEFAULT_PROJECT_STAGE_NAMES.map((name, idx) => ({
    id: `default-${idx}`,
    name,
  }));
}

export function buildStagesFromOptions(
  startDate: string,
  options: ProjectStageOption[],
  selectedIds: Set<string>
): CreateProjectStageInput[] {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return [];

  const startIso = start.toISOString();
  const selected = options.filter((o) => selectedIds.has(o.id));

  return selected.map((stage, idx) => ({
    name: stage.name,
    order: idx,
    start_date: startIso,
    duration: STAGE_PLACEHOLDER_DURATION,
  }));
}
