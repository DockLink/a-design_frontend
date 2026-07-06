"use client";

import { Plus } from "lucide-react";

import { ProjectMemberAvatar } from "@/components/projects/project-recent-tasks";
import { useUsers } from "@/hooks/use-users";
import { memberDisplayInitials, memberDisplayName } from "@/lib/projects/member-display";
import { memberRoleLabel } from "@/lib/projects/project-member-roles";
import type { ProjectMember } from "@/types/projects";

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  "Project Lead": { bg: "rgba(212,169,106,0.14)", color: "#C9894A" },
  Member: { bg: "rgba(60,60,67,0.08)", color: "#3C3C43" },
};

export function ProjectTeamPanel({
  members,
  canManage,
  onManage,
}: {
  members: ProjectMember[];
  canManage: boolean;
  onManage: () => void;
}) {
  const { users: orgUsers } = useUsers({ page: 1, limit: 100, status: "ACTIVE" });
  const active = members.filter((m) => m.status === "ACTIVE");

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--ds-label)" }}>Project team</div>
        {canManage && (
          <button
            type="button"
            onClick={onManage}
            style={{
              height: "28px",
              padding: "0 12px",
              background: "var(--ds-accent-muted)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--ds-accent-hover)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Plus size={12} />
            Manage team
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
          <div style={{ padding: "16px", fontSize: "13px", color: "var(--ds-tertiary-label)" }}>
            No team members yet. {canManage ? "Add members to get started." : ""}
          </div>
        ) : (
          active.map((member, i) => {
            const name = memberDisplayName(member, orgUsers);
            const initials = memberDisplayInitials(member, orgUsers);
            const roleLabel = memberRoleLabel(member.role);
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
                    color: "var(--ds-label)",
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
