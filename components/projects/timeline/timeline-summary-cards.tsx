"use client";

import { AlertCircle, CheckCircle2, Flag, Target } from "lucide-react";

import type { TimelineSummary } from "@/lib/projects/timeline";

const CARDS = [
  {
    key: "phases" as const,
    label: "Phases Complete",
    icon: Flag,
    iconBg: "rgba(90, 138, 122, 0.14)",
    iconColor: "#5A8A7A",
  },
  {
    key: "milestones" as const,
    label: "Milestones Done",
    icon: CheckCircle2,
    iconBg: "rgba(212, 169, 106, 0.18)",
    iconColor: "var(--ds-accent)",
  },
  {
    key: "onTrack" as const,
    label: "On Track",
    icon: Target,
    iconBg: "rgba(107, 140, 174, 0.14)",
    iconColor: "#6B8CAE",
  },
  {
    key: "delayed" as const,
    label: "Delayed",
    icon: AlertCircle,
    iconBg: "rgba(184, 122, 106, 0.16)",
    iconColor: "#B87A6A",
  },
] as const;

function cardValue(key: (typeof CARDS)[number]["key"], summary: TimelineSummary): string {
  switch (key) {
    case "phases":
      return `${summary.phasesComplete}/${summary.phasesTotal}`;
    case "milestones":
      return `${summary.milestonesDone}/${summary.milestonesTotal}`;
    case "onTrack":
      return String(summary.onTrack);
    case "delayed":
      return String(summary.delayed);
  }
}

export function TimelineSummaryCards({ summary }: { summary: TimelineSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {CARDS.map(({ key, label, icon: Icon, iconBg, iconColor }) => (
        <div
          key={key}
          className="flex items-center gap-3 rounded-2xl border border-[rgba(90,60,30,0.08)] bg-[var(--ds-surface-elevated)] px-4 py-3.5 shadow-[0_1px_3px_rgba(60,40,20,0.06)]"
        >
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: iconBg }}
          >
            <Icon className="size-5" style={{ color: iconColor }} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] text-[var(--ds-secondary-label)]">{label}</div>
            <div className="text-[22px] font-semibold leading-tight tracking-tight text-[var(--ds-label)]">
              {cardValue(key, summary)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
