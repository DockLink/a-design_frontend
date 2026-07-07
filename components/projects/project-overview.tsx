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
import { EditProjectSheet } from "@/components/projects/edit-project-sheet";
import { ProjectBriefAttachmentsList } from "@/components/projects/project-brief-attachments";
import { ManageTeamSheet } from "@/components/projects/manage-team-sheet";
import { ManageGuestsSheet } from "@/components/projects/manage-guests-sheet";
import { ProjectPhaseBar } from "@/components/projects/project-phase-bar";
import { ProjectImageGallery } from "@/components/projects/project-image-gallery";
import { ProjectLocationSection } from "@/components/projects/project-location-section";
import { ProjectVimeoSection } from "@/components/projects/project-vimeo-section";
import { ProjectRecentFiles } from "@/components/projects/project-recent-files";
import { ProjectRecentTasks } from "@/components/projects/project-recent-tasks";
import { ProjectStatCard } from "@/components/projects/project-stat-card";
import { ProjectTeamPanel } from "@/components/projects/project-team-panel";
import { StageManagementModal } from "@/components/projects/stage-management-modal";
import { MilestoneManagementModal } from "@/components/projects/milestone-management-modal";
import { useAuth } from "@/hooks/use-auth";
import { useProjectMembers } from "@/hooks/use-project-members";
import { useProjectFileCount } from "@/hooks/use-project-file-count";
import { useProjectTaskables } from "@/hooks/use-project-taskables";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import { formatProjectStatus } from "@/lib/projects/duration";
import {
  canEditProjectDetails,
  canManageProject,
  canViewAdminInsights,
} from "@/lib/projects/permissions";
import { computeProjectStats, mapStageToView } from "@/lib/projects/map-stages";
import { isGuestProjectMember } from "@/lib/user/guest";
import { getUserDisplayName } from "@/lib/user/display";
import { projectTabRoute } from "@/types/navigation";
import { PROJECT_LEAD_ROLE, type ProjectMemberProjectRole } from "@/types/projects";

const STATUS_CFG: Record<string, { bg: string; color: string }> = {
  Active: { bg: "rgba(52,199,89,0.12)", color: "#248A3D" },
  Inactive: { bg: "rgba(142,142,147,0.12)", color: "#6C6C70" },
};

export function ProjectOverview() {
  const { project, refetch } = useProjectContext();
  const { user } = useAuth();
  const orgSidebarRole = toSidebarRole(user?.roles ? getPrimaryRole(user.roles) : null);
  const { members, updateMembers, refetchMembers, effectiveRole, projectLeadUserIds, isLoading: membersSaving, isViewer } = useProjectMembers();
  const canManage = canManageProject(effectiveRole, isViewer);
  const canEditDetails = canEditProjectDetails(orgSidebarRole);
  const showAdminInsights = canViewAdminInsights(orgSidebarRole);
  const canManageGuests = showAdminInsights;

  const [showManageTeam, setShowManageTeam] = useState(false);
  const [showManageGuests, setShowManageGuests] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showEditBrief, setShowEditBrief] = useState(false);

  const projectId = project!.id;
  const { fileCount } = useProjectFileCount(projectId);
  const { tasks: projectTasks } = useProjectTaskables(projectId, "TASK", { depth: 1, limit: 100 });
  const { tasks: stageTasks } = useProjectTaskables(projectId, "STAGE", { limit: 100 });

  const stages = useMemo(() => stageTasks.map((s) => mapStageToView(s)), [stageTasks]);
  const stats = useMemo(
    () => computeProjectStats(projectTasks, members.filter((m) => m.status === "ACTIVE").length, fileCount),
    [projectTasks, members, fileCount]
  );

  const statusLabel = formatProjectStatus(project!.status);
  const statusCfg = STATUS_CFG[statusLabel] ?? STATUS_CFG.Inactive;

  const guestMembers = useMemo(
    () => members.filter((m) => m.status === "ACTIVE" && isGuestProjectMember(m)),
    [members],
  );

  async function handleSaveTeam(userIds: string[], leadUserIds: string[]) {
    const leadSet = new Set(leadUserIds);
    const teamMembers = userIds.map((user_id) => ({
      user_id,
      status: "ACTIVE" as const,
      role: (leadSet.has(user_id) ? PROJECT_LEAD_ROLE : "MEMBER") as ProjectMemberProjectRole,
    }));
    const guestRows = guestMembers.map((m) => ({
      user_id: m.user_id,
      status: "ACTIVE" as const,
      role: "VIEWER" as const,
    }));
    await updateMembers({ members: [...teamMembers, ...guestRows] }, leadUserIds);
  }

  async function handleSaveGuests(guestUserIds: string[]) {
    const teamRows = members
      .filter((m) => m.status === "ACTIVE" && !isGuestProjectMember(m))
      .map((m) => ({
        user_id: m.user_id,
        status: "ACTIVE" as const,
        role: (m.role ?? "MEMBER") as ProjectMemberProjectRole,
      }));
    const guestRows = guestUserIds.map((user_id) => ({
      user_id,
      status: "ACTIVE" as const,
      role: "VIEWER" as const,
    }));
    await updateMembers({ members: [...teamRows, ...guestRows] });
  }

  return (
    <>
      <div className="project-overview">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "11px", color: "var(--ds-secondary-label)", fontFamily: "var(--ds-font-sans)", marginBottom: "4px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Ref · {project!.code?.toUpperCase()}
          </div>
          <div style={{ fontSize: "26px", fontWeight: 600, color: "var(--ds-label)" }}>{project!.name}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", background: statusCfg.bg, color: statusCfg.color, borderRadius: "9999px", padding: "4px 12px", fontWeight: 500 }}>
            {statusLabel}
          </span>
          {canEditDetails && (
            <button
              type="button"
              onClick={() => setShowEditProject(true)}
              style={{
                height: "30px",
                padding: "0 12px",
                background: "var(--ds-accent)",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
                color: "white",
              }}
            >
              Edit project
            </button>
          )}
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => setShowStageModal(true)}
                style={{
                  height: "30px",
                  padding: "0 12px",
                  background: "var(--ds-accent-muted)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "var(--ds-accent-hover)",
                }}
              >
                Manage Stages
              </button>
              <button
                type="button"
                onClick={() => setShowMilestoneModal(true)}
                style={{
                  height: "30px",
                  padding: "0 12px",
                  background: "var(--ds-accent-muted)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "12px",
                  color: "var(--ds-accent-hover)",
                }}
              >
                Manage Milestones
              </button>
              <button
                type="button"
                onClick={() => (canEditDetails ? setShowEditProject(true) : setShowEditBrief(true))}
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

      <div className="project-overview-stats" style={{ marginBottom: "24px" }}>
        <ProjectStatCard
          label="Open tasks"
          value={String(stats.openCount)}
          subtitle={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : undefined}
          icon={<AlertCircle size={16} />}
          trend={stats.overdueCount > 0 ? "down" : "neutral"}
        />
        <ProjectStatCard label="Team" value={String(stats.memberCount)} icon={<UsersIcon size={16} />} />
        <ProjectStatCard
          label="Files"
          value={String(stats.fileCount)}
          icon={<FileText size={16} />}
          href={projectTabRoute(projectId, "files")}
        />
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
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--ds-warning)" }}>
              {stats.overdueCount} task{stats.overdueCount === 1 ? "" : "s"} overdue
            </div>
            <div style={{ fontSize: "12px", color: "var(--ds-tertiary-label)" }}>{stats.overdueTitles.join(", ")}</div>
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

      <div className="project-overview-main-grid">
        <div className="project-overview-col-left-top">
          <ProjectRecentFiles projectId={projectId} />
          <ProjectRecentTasks projectId={projectId} tasks={projectTasks} />
        </div>
        <div className="project-overview-col-right-top">
          <ProjectTeamPanel
            members={members.filter((m) => !isGuestProjectMember(m))}
            canManage={canManage}
            onManage={() => setShowManageTeam(true)}
          />
          {canManageGuests && (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  padding: "16px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ds-label)" }}>
                    Guests
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ds-tertiary-label)", marginTop: "2px" }}>
                    {guestMembers.length} view-only
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManageGuests(true)}
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    background: "var(--ds-accent-muted)",
                    border: "none",
                    borderRadius: "8px",
                    color: "var(--ds-accent-hover)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  Manage guests
                </button>
              </div>
              {guestMembers.length > 0 && (
                <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {guestMembers.map((m) => (
                    <div key={m.user_id} style={{ fontSize: "13px", color: "var(--ds-secondary-label)" }}>
                      {m.assignee
                        ? getUserDisplayName({
                            first_name: m.assignee.first_name ?? m.assignee.firstName,
                            last_name: m.assignee.last_name ?? m.assignee.lastName,
                            email: m.assignee.email ?? "",
                          })
                        : "Guest user"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="project-overview-gallery">
          <ProjectImageGallery
            projectId={projectId}
            images={project!.images}
            canEdit={canManage || canEditDetails}
            onUpdated={refetch}
            variant="sidebar"
          />
        </div>
        <div className="project-overview-brief">
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
              overflow: "hidden",
              height: "100%",
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ds-label)" }}>Project brief</div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => (canEditDetails ? setShowEditProject(true) : setShowEditBrief(true))}
                  style={{
                    height: "28px",
                    padding: "0 12px",
                    background: "transparent",
                    border: "1px solid rgba(90,60,30,0.18)",
                    borderRadius: "8px",
                    color: "var(--ds-secondary-label)",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {canEditDetails ? "Edit project" : "Edit"}
                </button>
              )}
            </div>
            <div style={{ padding: "0 18px 18px" }}>
              <div style={{ fontSize: "13px", color: "#6C6C70", lineHeight: 1.65 }}>
                {project!.description?.trim() || "No brief added yet."}
              </div>
              {(project!.brief_attachments?.length ?? 0) > 0 ? (
                <ProjectBriefAttachmentsList attachments={project!.brief_attachments ?? []} />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="project-overview-bottom-grid">
        <ProjectLocationSection
          projectId={projectId}
          address={project!.location}
          latitude={project!.latitude}
          longitude={project!.longitude}
          canEdit={canManage && !canEditDetails}
          onUpdated={refetch}
        />
        <ProjectVimeoSection
          projectId={projectId}
          vimeoUrl={project!.vimeo_url}
          canEdit={canManage && !canEditDetails}
          onUpdated={refetch}
        />
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

      {showManageGuests && (
        <ManageGuestsSheet
          projectName={project!.name}
          members={members}
          onSave={handleSaveGuests}
          onClose={() => setShowManageGuests(false)}
          isSaving={membersSaving}
        />
      )}

      {showStageModal && (
        <StageManagementModal projectId={projectId} onClose={() => setShowStageModal(false)} />
      )}

      {showMilestoneModal && (
        <MilestoneManagementModal projectId={projectId} onClose={() => setShowMilestoneModal(false)} />
      )}

      <EditProjectSheet
        project={project!}
        members={members}
        projectLeadUserIds={projectLeadUserIds}
        open={showEditProject}
        onClose={() => setShowEditProject(false)}
        onSaved={() => {
          void refetch();
          void refetchMembers();
        }}
        onUpdateMembers={updateMembers}
      />

      {!canEditDetails && (
        <EditProjectBriefSheet
          projectId={projectId}
          brief={project!.description ?? ""}
          attachments={project!.brief_attachments ?? []}
          open={showEditBrief}
          onClose={() => setShowEditBrief(false)}
          onSaved={() => void refetch()}
        />
      )}
    </>
  );
}
