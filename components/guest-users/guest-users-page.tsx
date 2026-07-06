"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

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
import type { User, UserStatus } from "@/types/users";

const PAGE_SIZE = 20;
const GUEST_ROLE_OPTIONS = [{ value: "GUEST" as const, label: "Guest" }];

const STATUS_PILL: Record<UserStatus, { bg: string; color: string }> = {
  ACTIVE: { bg: "#D8F3DC", color: "#2D6A4F" },
  INACTIVE: { bg: "#F5EFE6", color: "#9C8573" },
};

function formatLastActive(user: User): string {
  if (!user.updatedAt) return "—";
  const date = new Date(user.updatedAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function GuestUsersPage() {
  const { primaryRole } = useAuth();
  const isSuperAdmin = isSuperAdminRole(primaryRole);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { users, meta, isLoading, isMutating, error, createUser, setUserStatus, deleteUser } =
    useUsers({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      roles: ["GUEST"],
    });

  const activeGuests = useMemo(
    () => users.filter((u) => u.status === "ACTIVE"),
    [users],
  );
  const inactiveGuests = useMemo(
    () => users.filter((u) => u.status === "INACTIVE"),
    [users],
  );

  async function confirmDeactivate(userId: string) {
    try {
      await setUserStatus(userId, "INACTIVE");
      setDeactivateTarget(null);
      setFeedback("Guest account deactivated.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to deactivate guest");
    }
  }

  async function confirmDelete(user: User) {
    try {
      await deleteUser(user.id);
      setDeleteTarget(null);
      setFeedback("Guest account permanently deleted.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to delete guest");
    }
  }

  async function handleCreateGuest(payload: Parameters<typeof createUser>[0]) {
    await createUser({ ...payload, role: "GUEST" });
    setFeedback("Guest account created. Assign them to projects from each project's overview.");
  }

  function renderRow(user: User, idx: number, list: User[]) {
    const statusCfg = STATUS_PILL[user.status];
    const showConfirm = deactivateTarget === user.id;
    const isLast = idx === list.length - 1 && !showConfirm;
    const canDelete = isSuperAdmin && user.status === "INACTIVE";

    return (
      <div key={user.id} style={{ minWidth: "820px" }}>
        <div
          style={{
            height: "56px",
            borderBottom: showConfirm ? "none" : isLast ? "none" : "1px solid rgba(90,60,30,0.08)",
            padding: "0 16px",
            display: "grid",
            gridTemplateColumns: "1fr 220px 110px 130px 40px",
            alignItems: "center",
            opacity: isMutating && deactivateTarget === user.id ? 0.7 : 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <UserAvatar user={user} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--ds-label)",
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
                  color: "var(--ds-secondary-label)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "var(--ds-secondary-label)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {user.email}
          </div>

          <div>
            <UserPill bg={statusCfg.bg} color={statusCfg.color}>
              {user.status === "ACTIVE" ? "Active" : "Inactive"}
            </UserPill>
          </div>

          <div style={{ fontSize: "13px", color: "var(--ds-secondary-label)" }}>
            {formatLastActive(user)}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <UserActionMenu
              disabled={isMutating}
              canDeactivate={user.status === "ACTIVE"}
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
            <span style={{ fontSize: "13px", color: "var(--ds-destructive)", flex: 1 }}>
              <strong>{[user.first_name, user.last_name].filter(Boolean).join(" ")}</strong> will
              no longer be able to sign in. Continue?
            </span>
            <Button
              variant="outline"
              onClick={() => setDeactivateTarget(null)}
              className="h-8"
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void confirmDeactivate(user.id)}
              className="h-8 bg-[var(--ds-destructive)] text-white hover:bg-[#7f1919]"
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
          background: "var(--ds-surface-elevated)",
          borderRadius: "12px",
          border: "1px solid var(--ds-separator)",
          overflow: "visible",
        }}
      >
        <div
          style={{
            minWidth: "820px",
            height: "40px",
            background: "var(--ds-bg)",
            borderBottom: "1px solid rgba(90,60,30,0.10)",
            padding: "0 16px",
            display: "grid",
            gridTemplateColumns: "1fr 220px 110px 130px 40px",
            alignItems: "center",
            fontSize: "12px",
            color: "var(--ds-secondary-label)",
            fontWeight: 500,
          }}
        >
          <span>Name</span>
          <span>Email</span>
          <span>Status</span>
          <span>Last active</span>
          <span />
        </div>
        {list.map((user, idx) => renderRow(user, idx, list))}
      </div>
    );
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
          <div style={{ fontSize: "28px", fontWeight: 500, color: "var(--ds-label)" }}>
            Guest users
          </div>
          <div style={{ fontSize: "13px", color: "var(--ds-secondary-label)", marginTop: "2px" }}>
            {meta?.total ?? users.length} guest accounts · assign per project from project overview
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              color="var(--ds-secondary-label)"
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
            />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search guests..."
              className="h-8 w-[220px] bg-[var(--ds-bg)] pl-8"
            />
          </div>
          <Button
            onClick={() => setShowCreateSheet(true)}
            className="h-8 rounded-lg bg-[var(--ds-accent)] px-3 text-sm font-medium text-white hover:bg-[#C4956A]"
          >
            + Create guest
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
            color: "var(--ds-destructive)",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div
          style={{
            background: "var(--ds-surface-elevated)",
            borderRadius: "12px",
            border: "1px solid var(--ds-separator)",
            padding: "24px",
            fontSize: "13px",
            color: "var(--ds-secondary-label)",
          }}
        >
          Loading guests...
        </div>
      ) : users.length === 0 ? (
        <div
          style={{
            background: "var(--ds-surface-elevated)",
            borderRadius: "12px",
            border: "1px solid var(--ds-separator)",
            padding: "24px",
            fontSize: "13px",
            color: "var(--ds-secondary-label)",
          }}
        >
          No guest accounts yet. Create one, then assign it from a project&apos;s overview page.
        </div>
      ) : (
        <>
          {activeGuests.length > 0 && renderTable(activeGuests)}
          {inactiveGuests.length > 0 && (
            <div style={{ marginTop: activeGuests.length > 0 ? "28px" : 0 }}>
              <div style={{ marginBottom: "10px", fontSize: "14px", fontWeight: 600, color: "var(--ds-label)" }}>
                Deactivated guests ({inactiveGuests.length})
              </div>
              {renderTable(inactiveGuests)}
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
        onSubmit={handleCreateGuest}
        isSubmitting={isMutating}
        roleOptions={GUEST_ROLE_OPTIONS}
        defaultRole="GUEST"
        title="Create guest account"
        subtitle="Guests get view-only access to projects you assign them to."
      />

      {deleteTarget && (
        <>
          <div
            onClick={() => setDeleteTarget(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "var(--ds-surface-elevated)",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "420px",
              width: "90%",
              zIndex: 201,
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--ds-destructive)", marginBottom: "8px" }}>
              Delete guest permanently?
            </div>
            <p style={{ fontSize: "14px", color: "var(--ds-secondary-label)", margin: "0 0 20px" }}>
              <strong>{[deleteTarget.first_name, deleteTarget.last_name].filter(Boolean).join(" ")}</strong>{" "}
              will be removed from the system.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <Button
                onClick={() => void confirmDelete(deleteTarget)}
                disabled={isMutating}
                className="flex-1 bg-[var(--ds-destructive)] text-white hover:bg-[#7f1919]"
              >
                {isMutating ? "Deleting…" : "Delete permanently"}
              </Button>
              <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
