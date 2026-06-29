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

export function buildStagesFromOptions(
  startDate: string,
  options: ProjectStageOption[],
  selectedIds: Set<string>,
  projectEndDate?: string
): CreateProjectStageInput[] {
  const start = new Date(startDate);
  if (Number.isNaN(start.getTime())) return [];

  const projectStartIso = start.toISOString();
  const projectEndIso = projectEndDate ?? start.toISOString();
  const selected = options.filter((o) => selectedIds.has(o.id));

  return selected.map((stage, idx) => {
    const stageStartIso = stage.startDate ? toIsoStart(stage.startDate) : projectStartIso;
    const stageEndIso = stage.endDate ? toIsoEnd(stage.endDate) : projectEndIso;
    return {
      name: stage.name,
      order: idx,
      start_date: stageStartIso,
      end_date: stageEndIso,
    };
  });
}
