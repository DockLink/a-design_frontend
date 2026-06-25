"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { toast } from "sonner";

import { ProjectMemberAvatar } from "@/components/projects/project-recent-tasks";
import { useUsers } from "@/hooks/use-users";
import { getUserDisplayName, getUserInitials } from "@/lib/user/display";
import type { ProjectMember } from "@/types/projects";
import type { User } from "@/types/users";

export function ManageTeamSheet({
  projectName,
  members,
  onSave,
  onClose,
  isSaving,
}: {
  projectName: string;
  members: ProjectMember[];
  onSave: (userIds: string[]) => Promise<void>;
  onClose: () => void;
  isSaving?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [draftIds, setDraftIds] = useState<string[]>(
    members.filter((m) => m.status === "ACTIVE").map((m) => m.user_id)
  );

  const { users: orgUsers, isLoading } = useUsers({ page: 1, limit: 100, status: "ACTIVE" });

  const memberUsers = useMemo(() => {
    return draftIds
      .map((id) => {
        const fromOrg = orgUsers.find((u) => u.id === id);
        const fromMembers = members.find((m) => m.user_id === id)?.assignee;
        if (fromOrg) return fromOrg;
        if (fromMembers) {
          return {
            id,
            email: fromMembers.email ?? "",
            first_name: fromMembers.first_name ?? fromMembers.firstName ?? "",
            last_name: fromMembers.last_name ?? fromMembers.lastName ?? "",
            roles: (fromMembers.roles as User["roles"]) ?? ["MEMBER"],
            status: "ACTIVE" as const,
          };
        }
        return null;
      })
      .filter(Boolean) as User[];
  }, [draftIds, orgUsers, members]);

  const available = orgUsers.filter(
    (u) =>
      !draftIds.includes(u.id) &&
      getUserDisplayName(u).toLowerCase().includes(search.toLowerCase())
  );

  async function handleDone() {
    try {
      await onSave(draftIds);
      toast.success("Team updated");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update team");
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.2)",
          zIndex: 40,
          backdropFilter: "blur(2px)",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "52px",
          right: 0,
          bottom: 0,
          width: "380px",
          background: "#FFFFFF",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "0.5px solid rgba(60,60,67,0.12)",
          }}
        >
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#1C1C1E" }}>Manage team</div>
            <div style={{ fontSize: "12px", color: "#8E8E93", marginTop: "2px" }}>{projectName}</div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} color="#6C6C70" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          <div style={{ fontSize: "12px", fontWeight: 500, color: "#8E8E93", marginBottom: "8px", textTransform: "uppercase" }}>
            Current members · {memberUsers.length}
          </div>
          <div style={{ border: "0.5px solid rgba(60,60,67,0.12)", borderRadius: "12px", marginBottom: "20px" }}>
            {memberUsers.map((user, i) => (
              <div
                key={user.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderBottom: i < memberUsers.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                }}
              >
                <ProjectMemberAvatar initials={getUserInitials(user)} size={32} fontSize={11} />
                <div style={{ flex: 1, fontSize: "13px", fontWeight: 500 }}>{getUserDisplayName(user)}</div>
                <button
                  type="button"
                  onClick={() => setDraftIds((ids) => ids.filter((id) => id !== user.id))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8E8E93" }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "12px", fontWeight: 500, color: "#8E8E93", marginBottom: "8px", textTransform: "uppercase" }}>
            Add from organisation
          </div>
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <Search size={14} color="#8E8E93" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members…"
              style={{
                width: "100%",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(118,118,128,0.1)",
                border: "none",
                paddingLeft: "32px",
                fontSize: "14px",
              }}
            />
          </div>

          {isLoading ? (
            <div style={{ fontSize: "13px", color: "#8E8E93" }}>Loading users…</div>
          ) : available.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#8E8E93", textAlign: "center", padding: "20px 0" }}>
              {search ? "No members found." : "All organisation members are in this project."}
            </div>
          ) : (
            <div style={{ border: "0.5px solid rgba(60,60,67,0.12)", borderRadius: "12px" }}>
              {available.map((user, i) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    borderBottom: i < available.length - 1 ? "0.5px solid rgba(60,60,67,0.10)" : "none",
                  }}
                >
                  <ProjectMemberAvatar initials={getUserInitials(user)} size={32} fontSize={11} />
                  <div style={{ flex: 1, fontSize: "13px", fontWeight: 500 }}>{getUserDisplayName(user)}</div>
                  <button
                    type="button"
                    onClick={() => setDraftIds((ids) => [...ids, user.id])}
                    style={{
                      height: "28px",
                      padding: "0 12px",
                      background: "rgba(212,169,106,0.12)",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "#C9894A",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Plus size={12} />
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "0.5px solid rgba(60,60,67,0.12)" }}>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void handleDone()}
            style={{
              width: "100%",
              height: "40px",
              background: "#D4A96A",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              color: "white",
              cursor: "pointer",
            }}
          >
            {isSaving ? "Saving…" : "Done"}
          </button>
        </div>
      </div>
    </>
  );
}
