"use client";

import { Plus } from "lucide-react";

import { ProjectMemberAvatar } from "@/components/projects/project-recent-tasks";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { getUserDisplayName, getUserInitials } from "@/lib/user/display";
import type { ProjectMember } from "@/types/projects";
import type { UserRole } from "@/types/users";

const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  TEAM_LEAD: "Team Lead",
  MEMBER: "Member",
  GUEST: "Guest",
};

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  "Team Lead": { bg: "rgba(212,169,106,0.14)", color: "#C9894A" },
  Admin: { bg: "rgba(212,169,106,0.14)", color: "#C9894A" },
  Member: { bg: "rgba(60,60,67,0.08)", color: "#3C3C43" },
};

function memberRoleLabel(member: ProjectMember): string {
  const roles = member.assignee?.roles as UserRole[] | undefined;
  if (!roles?.length) return "Member";
  const primary = getPrimaryRole(roles);
  return primary ? ROLE_LABEL[primary] : "Member";
}

export function ProjectTeamPanel({
  members,
  canManage,
  onManage,
}: {
  members: ProjectMember[];
  canManage: boolean;
  onManage: () => void;
}) {
  const active = members.filter((m) => m.status === "ACTIVE");

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1C1C1E" }}>Project team</div>
        {canManage && (
          <button
            type="button"
            onClick={onManage}
            style={{
              height: "28px",
              padding: "0 12px",
              background: "rgba(212,169,106,0.12)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 500,
              color: "#C9894A",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Plus size={12} />
            Manage
          </button>
        )}
      </div>

      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 0 0 0.5px rgba(0,0,0,0.05)",
          marginBottom: "20px",
        }}
      >
        {active.length === 0 ? (
          <div style={{ padding: "16px", fontSize: "13px", color: "#8E8E93" }}>
            No team members yet. {canManage ? "Add members to get started." : ""}
          </div>
        ) : (
          active.map((member, i) => {
            const assignee = member.assignee;
            const name = assignee
              ? getUserDisplayName({
                  id: member.user_id,
                  email: assignee.email ?? "",
                  first_name: assignee.first_name ?? assignee.firstName ?? "",
                  last_name: assignee.last_name ?? assignee.lastName ?? "",
                  roles: (assignee.roles as UserRole[]) ?? ["MEMBER"],
                  status: "ACTIVE",
                })
              : member.user_id;
            const initials = assignee
              ? getUserInitials({
                  id: member.user_id,
                  email: assignee.email ?? "",
                  first_name: assignee.first_name ?? assignee.firstName ?? "",
                  last_name: assignee.last_name ?? assignee.lastName ?? "",
                  roles: (assignee.roles as UserRole[]) ?? ["MEMBER"],
                  status: "ACTIVE",
                })
              : "?";
            const roleLabel = memberRoleLabel(member);
            const rcfg = ROLE_STYLE[roleLabel] ?? ROLE_STYLE.Member;

            return (
              <div
                key={member.user_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "0 14px",
                  height: "48px",
                  borderBottom: i < active.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                }}
              >
                <ProjectMemberAvatar initials={initials} size={32} fontSize={11} />
                <div
                  style={{
                    flex: 1,
                    fontSize: "13px",
                    color: "#1C1C1E",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    background: rcfg.bg,
                    color: rcfg.color,
                    borderRadius: "6px",
                    padding: "3px 8px",
                    fontWeight: 500,
                    flexShrink: 0,
                  }}
                >
                  {roleLabel}
                </span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
