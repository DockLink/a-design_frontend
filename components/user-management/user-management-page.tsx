"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { EditRoleSheet } from "@/components/user-management/edit-role-sheet";
import { CreateUserSheet } from "@/components/user-management/create-user-sheet";
import { UserActionMenu } from "@/components/user-management/user-action-menu";
import { UserAvatar } from "@/components/user-management/user-avatar";
import { UserPagination } from "@/components/user-management/user-pagination";
import { UserPill } from "@/components/user-management/user-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-users";
import { isSuperAdminRole } from "@/lib/navigation/sidebar-role";
import type { User, UserRole, UserStatus } from "@/types/users";

type FilterType = "ALL" | "ADMINS" | "MEMBERS" | "INACTIVE";

const PAGE_SIZE = 20;

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: "ALL", label: "All users" },
  { key: "ADMINS", label: "Admins" },
  { key: "MEMBERS", label: "Members" },
  { key: "INACTIVE", label: "Inactive" },
];

const ROLE_PILL: Record<UserRole, { bg: string; color: string; label: string }> = {
  SUPER_ADMIN: { bg: "#F5E6D0", color: "#D4A96A", label: "Super Admin" },
  ADMIN: { bg: "#F5E6D0", color: "#D4A96A", label: "Admin" },
  TEAM_LEAD: { bg: "#DBEAFE", color: "#1E3A8A", label: "Team Lead" },
  MEMBER: { bg: "#F5EFE6", color: "#6B5744", label: "Member" },
  GUEST: { bg: "#F5EFE6", color: "#6B5744", label: "Guest" },
};

const STATUS_PILL: Record<UserStatus, { bg: string; color: string }> = {
  ACTIVE: { bg: "#D8F3DC", color: "#2D6A4F" },
  INACTIVE: { bg: "#F5EFE6", color: "#9C8573" },
};

function getPrimaryRole(user: User): UserRole {
  return user.roles[0] ?? "MEMBER";
}

function formatLastActive(user: User): string {
  if (!user.updatedAt) return "—";
  const date = new Date(user.updatedAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SUPER_ADMIN_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "MEMBER", label: "Member" },
];

// Admins can only create/manage members — only super admins can mint admins.
const ADMIN_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "MEMBER", label: "Member" },
];

export function UserManagementPage() {
  const { primaryRole } = useAuth();
  const isSuperAdmin = isSuperAdminRole(primaryRole);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [page, setPage] = useState(1);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState<User | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, activeFilter]);

  const apiFilterRoles = useMemo<UserRole[] | undefined>(() => {
    if (activeFilter === "ADMINS") return isSuperAdmin ? ["ADMIN", "SUPER_ADMIN"] : ["ADMIN"];
    if (activeFilter === "MEMBERS") return ["MEMBER"];
    return undefined;
  }, [activeFilter, isSuperAdmin]);

  const apiFilterStatus = activeFilter === "INACTIVE" ? "INACTIVE" : undefined;

  const { users, meta, isLoading, isMutating, error, createUser, setUserRole, setUserStatus, deleteUser } =
    useUsers({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      roles: apiFilterRoles,
      status: apiFilterStatus,
    });

  // Admins must not see super admin accounts in team management.
  const visibleUsers = useMemo(
    () => (isSuperAdmin ? users : users.filter((u) => !u.roles.includes("SUPER_ADMIN"))),
    [users, isSuperAdmin]
  );

  const activeUsers = useMemo(
    () => visibleUsers.filter((u) => u.status === "ACTIVE"),
    [visibleUsers]
  );
  const inactiveUsers = useMemo(
    () => visibleUsers.filter((u) => u.status === "INACTIVE"),
    [visibleUsers]
  );

  async function confirmDeactivate(userId: string) {
    try {
      await setUserStatus(userId, "INACTIVE");
      setDeactivateTarget(null);
      setFeedback("User has been deactivated.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to deactivate user");
    }
  }

  async function confirmDelete(user: User) {
    try {
      await deleteUser(user.id);
      setDeleteTarget(null);
      setFeedback("Account permanently deleted.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to delete user");
    }
  }

  async function handleRoleSave(userId: string, role: UserRole) {
    await setUserRole(userId, role);
    setFeedback("Role updated successfully.");
  }

  function renderRow(user: User, idx: number, list: User[]) {
    const role = getPrimaryRole(user);
    const roleCfg = ROLE_PILL[role];
    const statusCfg = STATUS_PILL[user.status];
    const showConfirm = deactivateTarget === user.id;
    const isLast = idx === list.length - 1 && !showConfirm;
    const canDelete = isSuperAdmin && user.status === "INACTIVE";

    return (
      <div key={user.id} style={{ minWidth: "900px" }}>
        <div
          style={{
            height: "56px",
            borderBottom: showConfirm ? "none" : isLast ? "none" : "1px solid rgba(90,60,30,0.08)",
            padding: "0 16px",
            display: "grid",
            gridTemplateColumns: "1fr 220px 130px 110px 130px 40px",
            alignItems: "center",
            cursor: "default",
            opacity: isMutating && (deactivateTarget === user.id || editRoleUser?.id === user.id) ? 0.7 : 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <UserAvatar user={user} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#1A1410",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {[user.first_name, user.last_name].filter(Boolean).join(" ") || "Unnamed"}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#9C8573",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>
          </div>

          <div style={{ fontSize: "13px", color: "#6B5744", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </div>

          <div>
            <UserPill bg={roleCfg.bg} color={roleCfg.color}>
              {roleCfg.label}
            </UserPill>
          </div>

          <div>
            <UserPill bg={statusCfg.bg} color={statusCfg.color}>
              {user.status === "ACTIVE" ? "Active" : "Inactive"}
            </UserPill>
          </div>

          <div style={{ fontSize: "13px", color: "#9C8573" }}>{formatLastActive(user)}</div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <UserActionMenu
              disabled={isMutating}
              canDeactivate={user.status === "ACTIVE"}
              onEditRole={() => setEditRoleUser(user)}
              onDeactivate={() => setDeactivateTarget(user.id)}
              onDelete={canDelete ? () => setDeleteTarget(user) : undefined}
            />
          </div>
        </div>

        {showConfirm && (
          <div
            style={{
              background: "#FEE2E2",
              borderBottom: idx === list.length - 1 ? "none" : "1px solid rgba(90,60,30,0.08)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "13px", color: "#9B1C1C", flex: 1 }}>
              <strong>{[user.first_name, user.last_name].filter(Boolean).join(" ")}</strong> will no longer be able to sign in. Continue?
            </span>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)} className="h-8" disabled={isMutating}>
              Cancel
            </Button>
            <Button
              onClick={() => void confirmDeactivate(user.id)}
              className="h-8 bg-[#9B1C1C] text-white hover:bg-[#7f1919]"
              disabled={isMutating}
            >
              {isMutating ? "Deactivating…" : "Deactivate"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  function renderTable(list: User[]) {
    return (
      <div
        style={{
          background: "#FDFAF6",
          borderRadius: "12px",
          border: "1px solid rgba(90,60,30,0.12)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            minWidth: "900px",
            height: "40px",
            background: "#F5EFE6",
            borderBottom: "1px solid rgba(90,60,30,0.10)",
            padding: "0 16px",
            display: "grid",
            gridTemplateColumns: "1fr 220px 130px 110px 130px 40px",
            alignItems: "center",
            fontSize: "12px",
            color: "#9C8573",
            fontWeight: 500,
          }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Last active</span>
          <span />
        </div>
        {list.map((user, idx) => renderRow(user, idx, list))}
      </div>
    );
  }

  async function handleCreateUser(payload: Parameters<typeof createUser>[0]) {
    await createUser(payload);
    setFeedback("User created successfully.");
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "28px", fontWeight: 500, color: "#1A1410" }}>
            User management
          </div>
          <div style={{ fontSize: "13px", color: "#9C8573", marginTop: "2px" }}>
            {meta?.total ?? users.length} users
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              color="#9C8573"
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search users..."
              className="h-8 w-[220px] bg-[#F5EFE6] pl-8"
            />
          </div>
          <Button
            onClick={() => setShowCreateSheet(true)}
            className="h-8 rounded-lg bg-[#D4A96A] px-3 text-sm font-medium text-white hover:bg-[#C4956A]"
          >
            + Create user
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "#D8F3DC",
            color: "#2D6A4F",
            fontSize: "13px",
          }}
        >
          {feedback}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "#FEE2E2",
            color: "#9B1C1C",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(90,60,30,0.10)",
          marginBottom: "16px",
          gap: "0",
          overflowX: "auto",
        }}
      >
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid #D4A96A" : "2px solid transparent",
                marginBottom: "-1px",
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: active ? 500 : 400,
                color: active ? "#D4A96A" : "#9C8573",
                whiteSpace: "nowrap",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div
          style={{
            background: "#FDFAF6",
            borderRadius: "12px",
            border: "1px solid rgba(90,60,30,0.12)",
            padding: "24px",
            fontSize: "13px",
            color: "#9C8573",
          }}
        >
          Loading users...
        </div>
      ) : visibleUsers.length === 0 ? (
        <div
          style={{
            background: "#FDFAF6",
            borderRadius: "12px",
            border: "1px solid rgba(90,60,30,0.12)",
            padding: "24px",
            fontSize: "13px",
            color: "#9C8573",
          }}
        >
          No users match your filters.
        </div>
      ) : (
        <>
          {activeUsers.length > 0 && renderTable(activeUsers)}

          {inactiveUsers.length > 0 && (
            <div style={{ marginTop: activeUsers.length > 0 ? "28px" : 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#1A1410" }}>
                  Deactivated accounts
                </span>
                <span style={{ fontSize: "12px", color: "#9C8573" }}>
                  ({inactiveUsers.length})
                </span>
              </div>
              {renderTable(inactiveUsers)}
            </div>
          )}
        </>
      )}

      <UserPagination
        meta={meta}
        page={page}
        onPageChange={setPage}
        disabled={isLoading || isMutating}
      />

      <CreateUserSheet
        open={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onSubmit={handleCreateUser}
        isSubmitting={isMutating}
        roleOptions={isSuperAdmin ? SUPER_ADMIN_ROLE_OPTIONS : ADMIN_ROLE_OPTIONS}
        subtitle={
          isSuperAdmin
            ? "Super admins can create administrators and team leads."
            : "Only super admins can create admins. Project lead is assigned per project."
        }
      />

      <EditRoleSheet
        user={editRoleUser}
        open={!!editRoleUser}
        onClose={() => setEditRoleUser(null)}
        onSave={handleRoleSave}
        isSaving={isMutating}
        roleOptions={isSuperAdmin ? SUPER_ADMIN_ROLE_OPTIONS : ADMIN_ROLE_OPTIONS}
      />

      {deleteTarget && (
        <>
          <div
            onClick={() => !isMutating && setDeleteTarget(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 60 }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#FDFAF6",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "440px",
              width: "90%",
              zIndex: 61,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#FF3B30", marginBottom: "8px" }}>
              Delete account permanently?
            </div>
            <p style={{ fontSize: "14px", color: "#6B5744", margin: "0 0 20px", lineHeight: 1.5 }}>
              <strong style={{ color: "#1A1410" }}>
                {[deleteTarget.first_name, deleteTarget.last_name].filter(Boolean).join(" ") || deleteTarget.email}
              </strong>{" "}
              will be permanently removed from the database and the authentication provider. Their project
              memberships and access requests are deleted; data they created (files, assignments) is reassigned to you.
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                onClick={() => void confirmDelete(deleteTarget)}
                disabled={isMutating}
                className="h-10 flex-1 bg-[#FF3B30] text-white hover:bg-[#e0352b]"
              >
                {isMutating ? "Deleting…" : "Delete permanently"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isMutating}
                className="h-10 flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
