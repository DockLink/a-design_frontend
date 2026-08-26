import * as XLSX from "xlsx";

import type { TimelineStageGroup } from "@/lib/projects/timeline";

type ExportRow = {
  Type: "Stage" | "Milestone" | "Task";
  Title: string;
  Stage: string;
  Start: string;
  End: string;
  Status: string;
  Description: string;
};

function flattenTimelineGroups(groups: TimelineStageGroup[]): ExportRow[] {
  const rows: ExportRow[] = [];

  for (const group of groups) {
    rows.push({
      Type: "Stage",
      Title: group.name,
      Stage: group.name,
      Start: group.startDate,
      End: group.endDate,
      Status: group.isActive ? "active" : "upcoming",
      Description: "",
    });

    for (const ms of group.milestones) {
      rows.push({
        Type: "Milestone",
        Title: ms.title,
        Stage: group.name,
        Start: ms.startDate,
        End: ms.endDate,
        Status: ms.status,
        Description: ms.description ?? "",
      });

      for (const task of ms.tasks ?? []) {
        rows.push({
          Type: "Task",
          Title: task.title,
          Stage: group.name,
          Start: task.startDate,
          End: task.endDate,
          Status: task.status,
          Description: "",
        });
      }
    }

    for (const task of group.orphanTasks ?? []) {
      rows.push({
        Type: "Task",
        Title: task.title,
        Stage: group.name,
        Start: task.startDate,
        End: task.endDate,
        Status: task.status,
        Description: "",
      });
    }
  }

  return rows;
}

function sanitizeFilenamePart(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 60) || "project";
}

export function exportTimelineToXlsx(
  groups: TimelineStageGroup[],
  projectName: string
): void {
  const rows = flattenTimelineGroups(groups);
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Timeline");

  const today = new Date().toISOString().slice(0, 10);
  const filename = `${sanitizeFilenamePart(projectName)}-timeline-${today}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
