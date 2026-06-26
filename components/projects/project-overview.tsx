"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Clock,
  Edit2,
  FileText,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";

import { useProjectContext } from "@/components/projects/project-context";
import { EditProjectBriefSheet } from "@/components/projects/edit-project-brief-sheet";
import { ManageTeamSheet } from "@/components/projects/manage-team-sheet";
import { ProjectPhaseBar } from "@/components/projects/project-phase-bar";
import { ProjectRecentFiles } from "@/components/projects/project-recent-files";
import { ProjectRecentTasks } from "@/components/projects/project-recent-tasks";
import { ProjectStatCard } from "@/components/projects/project-stat-card";
import { ProjectTeamPanel } from "@/components/projects/project-team-panel";
import { StageManagementModal } from "@/components/projects/stage-management-modal";
import { useProjectMembers } from "@/hooks/use-project-members";
import { useProjectTaskables } from "@/hooks/use-project-taskables";
import { formatProjectStatus } from "@/lib/projects/duration";
import {
  canManageProject,
  canViewAdminInsights,
} from "@/lib/projects/permissions";
import { computeProjectStats, mapStageToView } from "@/lib/projects/map-stages";
import { projectTabRoute } from "@/types/navigation";
import { PROJECT_LEAD_ROLE } from "@/types/projects";

const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  Active: { bg: "rgba(52,199,89,0.12)", color: "#248A3D" },
  Inactive: { bg: "rgba(142,142,147,0.12)", color: "#6C6C70" },
};

export function ProjectOverview() {
  const { project, refetch } = useProjectContext();
  const { members, updateMembers, effectiveRole, projectLeadUserIds, isLoading: membersSaving } = useProjectMembers();
  const canManage = canManageProject(effectiveRole);
  const showAdminInsights = canViewAdminInsights(effectiveRole);

  const [showManageTeam, setShowManageTeam] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showEditBrief, setShowEditBrief] = useState(false);

  const projectId = project!.id;
  const { tasks: projectTasks } = useProjectTaskables(projectId, "TASK", { depth: 1, limit: 100 });
  const { tasks: stageTasks } = useProjectTaskables(projectId, "STAGE", { limit: 100 });

  const stages = useMemo(() => stageTasks.map((s) => mapStageToView(s)), [stageTasks]);
  const stats = useMemo(
    () => computeProjectStats(projectTasks, members.filter((m) => m.status === "ACTIVE").length, project!.images.length),
    [projectTasks, members, project]
  );

  const statusLabel = formatProjectStatus(project!.status);
  const statusCfg = STATUS_CFG[statusLabel] ?? STATUS_CFG.Inactive;

  async function handleSaveTeam(userIds: string[], leadUserIds: string[]) {
    const leadSet = new Set(leadUserIds);
    await updateMembers(
      {
        members: userIds.map((user_id) => ({
          user_id,
          status: "ACTIVE" as const,
          role: leadSet.has(user_id) ? PROJECT_LEAD_ROLE : "MEMBER",
        })),
      },
      leadUserIds
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
        <div>
          <div style={{ fontSize: "12px", color: "#8E8E93", fontFamily: "ui-monospace, monospace", marginBottom: "4px" }}>
            {project!.code}
          </div>
          <div style={{ fontSize: "26px", fontWeight: 600, color: "#1C1C1E" }}>{project!.name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", background: statusCfg.bg, color: statusCfg.color, borderRadius: "9999px", padding: "4px 12px", fontWeight: 500 }}>
            {statusLabel}
          </span>
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setShowStageModal(true)}
                style={{
                  height: "30px",
                  padding: "0 12px",
                  background: "rgba(212,169,106,0.12)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "#C9894A",
                }}
              >
                Manage Stages
              </button>
              <button
                type="button"
                onClick={() => setShowEditBrief(true)}
                style={{
                  width: "30px",
                  height: "30px",
                  background: "rgba(60,60,67,0.06)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Edit2 size={13} color="#6C6C70" />
              </button>
            </>
          )}
        </div>
      </div>

      <ProjectPhaseBar stages={stages} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: showAdminInsights ? "repeat(5, 1fr)" : "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <ProjectStatCard
          label="Open tasks"
          value={String(stats.openCount)}
          subtitle={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : undefined}
          icon={<AlertCircle size={16} />}
          trend={stats.overdueCount > 0 ? "down" : "neutral"}
        />
        <ProjectStatCard label="Team" value={String(stats.memberCount)} icon={<UsersIcon size={16} />} />
        <ProjectStatCard label="Files" value={String(stats.fileCount)} icon={<FileText size={16} />} />
        <ProjectStatCard
          label="Next due"
          value={stats.nextDue?.date ?? "—"}
          subtitle={stats.nextDue?.label}
          icon={<Clock size={16} />}
        />
        {showAdminInsights && stats.health !== null && (
          <ProjectStatCard
            label="Health"
            value={`${stats.health}%`}
            subtitle="On track"
            icon={<TrendingUp size={16} />}
            trend="up"
          />
        )}
      </div>

      {showAdminInsights && stats.overdueCount > 0 && (
        <div
          style={{
            background: "rgba(255,159,10,0.08)",
            border: "1px solid rgba(255,159,10,0.2)",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <AlertCircle size={16} color="#FF9F0A" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "#C85000" }}>
              {stats.overdueCount} task{stats.overdueCount === 1 ? "" : "s"} overdue
            </div>
            <div style={{ fontSize: "12px", color: "#8E8E93" }}>{stats.overdueTitles.join(", ")}</div>
          </div>
          <Link
            href={projectTabRoute(projectId, "tasks")}
            style={{
              height: "28px",
              padding: "0 12px",
              background: "#FF9F0A",
              borderRadius: "6px",
              fontSize: "12px",
              color: "white",
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            Review
          </Link>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: showAdminInsights ? "1fr 360px" : "1fr 320px", gap: "20px" }}>
        <div>
          <ProjectRecentFiles projectId={projectId} images={project!.images} />
          <ProjectRecentTasks projectId={projectId} tasks={projectTasks} />
        </div>
        <div>
          <ProjectTeamPanel
            members={members}
            canManage={canManage}
            onManage={() => setShowManageTeam(true)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>Project brief</div>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowEditBrief(true)}
                style={{ background: "none", border: "none", color: "#D4A96A", cursor: "pointer", fontSize: "13px" }}
              >
                Edit
              </button>
            )}
          </div>
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
              padding: "14px",
            }}
          >
            <div style={{ fontSize: "13px", color: "#6C6C70", lineHeight: 1.65 }}>
              {project!.description?.trim() || "No brief added yet."}
            </div>
          </div>
        </div>
      </div>

      {showManageTeam && (
        <ManageTeamSheet
          projectName={project!.name}
          members={members}
          projectLeadUserIds={projectLeadUserIds}
          onSave={handleSaveTeam}
          onClose={() => setShowManageTeam(false)}
          isSaving={membersSaving}
        />
      )}

      {showStageModal && (
        <StageManagementModal projectId={projectId} onClose={() => setShowStageModal(false)} />
      )}

      <EditProjectBriefSheet
        projectId={projectId}
        brief={project!.description ?? ""}
        open={showEditBrief}
        onClose={() => setShowEditBrief(false)}
        onSaved={() => void refetch()}
      />
    </>
  );
}
