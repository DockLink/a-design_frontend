"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CreateProjectSheet } from "@/components/projects/create-project-sheet";
import { ProjectCard } from "@/components/projects/project-card";
import { useAuth } from "@/hooks/use-auth";
import { useInfiniteProjects } from "@/hooks/use-infinite-projects";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import { isGuestFullViewAccess } from "@/lib/user/guest";
import {
  dsActionBtn,
  dsCallout,
  dsLargeTitle,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { projectRoute } from "@/types/navigation";
import type { ProjectCardView } from "@/types/projects";
import { PROJECT_LEAD_ROLE } from "@/types/projects";

const PAGE_SIZE = 12;

function ProjectCardGrid({
  cards,
  isSuperAdmin,
  isDeleting,
  onOpen,
  onDelete,
  renderExtra,
}: {
  cards: ProjectCardView[];
  isSuperAdmin: boolean;
  isDeleting: boolean;
  onOpen: (id: string) => void;
  onDelete: (card: ProjectCardView) => void;
  renderExtra?: (card: ProjectCardView) => React.ReactNode;
}) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="project-card-grid">
      {cards.map((p) => {
        const isHovered = hoveredProject === p.id;
        return (
          <div
            key={p.id}
            onMouseEnter={() => setHoveredProject(p.id)}
            onMouseLeave={() => setHoveredProject(null)}
          >
            <ProjectCard
              project={p}
              onClick={() => onOpen(p.id)}
              renderExtra={renderExtra}
              renderOverlay={
                isSuperAdmin && isHovered
                  ? () => (
                      <button
                        type="button"
                        title="Delete project permanently"
                        disabled={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(p);
                        }}
                        style={{
                          position: "absolute",
                          top: "10px",
                          right: "10px",
                          width: "32px",
                          height: "32px",
                          borderRadius: "8px",
                          border: "none",
                          background: "rgba(255,59,48,0.85)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: isDeleting ? "not-allowed" : "pointer",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                        }}
                      >
                        <Trash2 size={15} color="white" />
                      </button>
                    )
                  : undefined
              }
            />
          </div>
        );
      })}
    </div>
  );
}

function ScrollSentinel({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={sentinelRef} style={{ height: 1 }}>
      {isFetchingNextPage && (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: "var(--ds-accent)" }} />
        </div>
      )}
    </div>
  );
}

export default function ProjectsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const sidebarRole = toSidebarRole(user?.roles ? getPrimaryRole(user.roles) : null);
  const isGuest = sidebarRole === "guest";
  const isFullViewGuest = isGuestFullViewAccess(user?.roles);
  const isAssignedGuest = isGuest && !isFullViewGuest;
  const canCreateProject = sidebarRole === "admin" || sidebarRole === "superadmin";
  const isSuperAdmin = sidebarRole === "superadmin";
  const showSplitView = !canCreateProject && !isGuest;

  const {
    projects: allProjects,
    isLoading: allLoading,
    isFetchingNextPage: allFetchingNext,
    hasNextPage: allHasNext,
    fetchNextPage: allFetchNext,
    error,
    refetch,
    deleteProject,
    isDeleting,
  } = useInfiniteProjects({ limit: PAGE_SIZE, status: "ACTIVE" });

  const {
    projects: memberProjectsRaw,
    isLoading: memberLoading,
    isFetchingNextPage: memberFetchingNext,
    hasNextPage: memberHasNext,
    fetchNextPage: memberFetchNext,
  } = useInfiniteProjects(
    { limit: PAGE_SIZE, status: "ACTIVE", as_member: true },
    { enabled: showSplitView || isAssignedGuest },
  );

  const {
    projects: ledProjectsRaw,
    isLoading: ledLoading,
  } = useInfiniteProjects(
    { limit: PAGE_SIZE, status: "ACTIVE", as_member: true, as_member_role: PROJECT_LEAD_ROLE },
    { enabled: showSplitView },
  );

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCardView | null>(null);

  const ledProjectIds = useMemo(
    () => new Set(ledProjectsRaw.map((p) => p.id)),
    [ledProjectsRaw],
  );

  const myProjectIds = useMemo(
    () => new Set(memberProjectsRaw.map((p) => p.id)),
    [memberProjectsRaw],
  );

  const leadProjects = useMemo(
    () => memberProjectsRaw.filter((p) => ledProjectIds.has(p.id)),
    [memberProjectsRaw, ledProjectIds],
  );

  const memberProjects = useMemo(
    () => memberProjectsRaw.filter((p) => !ledProjectIds.has(p.id)),
    [memberProjectsRaw, ledProjectIds],
  );

  const discoverProjects = useMemo(
    () => (showSplitView ? allProjects.filter((p) => !myProjectIds.has(p.id)) : []),
    [showSplitView, allProjects, myProjectIds],
  );

  const myLoading = isAssignedGuest ? memberLoading : showSplitView && (memberLoading || ledLoading);
  const isLoading = allLoading || myLoading;

  useEffect(() => {
    if (!isAssignedGuest || memberLoading || memberProjectsRaw.length !== 1) return;
    router.replace(projectRoute(memberProjectsRaw[0].id));
  }, [isAssignedGuest, memberLoading, memberProjectsRaw, router]);

  async function handleDeleteProject() {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" permanently deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  const handleAllFetchNext = useCallback(() => allFetchNext(), [allFetchNext]);
  const handleMemberFetchNext = useCallback(() => memberFetchNext(), [memberFetchNext]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={dsLargeTitle}>Projects</div>
          <div style={{ ...dsSubtitle, marginTop: "8px" }}>
            {canCreateProject
              ? "All organisation projects"
              : isFullViewGuest
                ? "All organisation projects — view only"
                : isAssignedGuest
                  ? "Projects you have been assigned to"
                  : "Projects you lead, projects you're on, and all others with complete view access"}
          </div>
        </div>
        {canCreateProject && (
          <button
            type="button"
            onClick={() => setShowCreateProject(true)}
            style={{ ...dsActionBtn, background: "var(--ds-accent)", color: "white", marginTop: "4px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--ds-accent)")}
          >
            + New project
          </button>
        )}
      </div>

      <div style={{ marginBottom: "24px" }} />

      {error && (
        <div style={{ padding: "14px", background: "#FEE2E2", color: "#9B1C1C", borderRadius: "var(--ds-radius-control)", marginBottom: "18px", fontSize: "var(--ds-text-callout)" }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={dsCallout}>Loading projects…</div>
      ) : isAssignedGuest ? (
        <>
          {memberProjectsRaw.length === 0 ? (
            <div style={dsCallout}>No projects assigned yet.</div>
          ) : (
            <>
              <ProjectCardGrid
                cards={memberProjectsRaw}
                isSuperAdmin={false}
                isDeleting={isDeleting}
                onOpen={(id) => router.push(projectRoute(id))}
                onDelete={() => undefined}
              />
              <ScrollSentinel
                hasNextPage={memberHasNext}
                isFetchingNextPage={memberFetchingNext}
                fetchNextPage={handleMemberFetchNext}
              />
            </>
          )}
        </>
      ) : showSplitView ? (
        <>
          {leadProjects.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ds-label)", marginBottom: 12 }}>
                Projects you lead ({leadProjects.length})
              </div>
              <ProjectCardGrid
                cards={leadProjects}
                isSuperAdmin={false}
                isDeleting={isDeleting}
                onOpen={(id) => router.push(projectRoute(id))}
                onDelete={() => undefined}
              />
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ds-label)", marginBottom: 12 }}>
              Projects you&apos;re a member of ({memberProjects.length})
            </div>
            {memberProjects.length === 0 ? (
              <div style={dsCallout}>You are not a member of any other projects yet.</div>
            ) : (
              <>
                <ProjectCardGrid
                  cards={memberProjects}
                  isSuperAdmin={false}
                  isDeleting={isDeleting}
                  onOpen={(id) => router.push(projectRoute(id))}
                  onDelete={() => undefined}
                />
                <ScrollSentinel
                  hasNextPage={memberHasNext}
                  isFetchingNextPage={memberFetchingNext}
                  fetchNextPage={handleMemberFetchNext}
                />
              </>
            )}
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ds-label)", marginBottom: 12 }}>
              All other projects — view access ({discoverProjects.length})
            </div>
            {discoverProjects.length === 0 ? (
              <div style={dsCallout}>You can already access every active project from the sections above.</div>
            ) : (
              <>
                <ProjectCardGrid
                  cards={discoverProjects}
                  isSuperAdmin={false}
                  isDeleting={isDeleting}
                  onOpen={(id) => router.push(projectRoute(id))}
                  onDelete={() => undefined}
                  renderExtra={() => (
                    <div style={{ marginTop: 12 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: 32,
                          padding: "0 12px",
                          borderRadius: 8,
                          background: "rgba(142,142,147,0.12)",
                          color: "var(--ds-secondary-label)",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        View access
                      </span>
                    </div>
                  )}
                />
                <ScrollSentinel
                  hasNextPage={allHasNext}
                  isFetchingNextPage={allFetchingNext}
                  fetchNextPage={handleAllFetchNext}
                />
              </>
            )}
          </div>
        </>
      ) : allProjects.length === 0 ? (
        <div style={dsCallout}>
          No projects found.
          {canCreateProject && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setShowCreateProject(true)}
                style={{ background: "none", border: "none", padding: 0, color: "var(--ds-accent)", cursor: "pointer", fontWeight: 500 }}
              >
                Create your first project
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <ProjectCardGrid
            cards={allProjects}
            isSuperAdmin={isSuperAdmin}
            isDeleting={isDeleting}
            onOpen={(id) => router.push(projectRoute(id))}
            onDelete={(p) => setDeleteTarget(p)}
          />
          <ScrollSentinel
            hasNextPage={allHasNext}
            isFetchingNextPage={allFetchingNext}
            fetchNextPage={handleAllFetchNext}
          />
        </>
      )}

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
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--ds-destructive)", marginBottom: "8px" }}>
              Delete project permanently?
            </div>
            <p style={{ fontSize: "14px", color: "var(--ds-secondary-label)", margin: "0 0 20px", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--ds-label)" }}>{deleteTarget.name}</strong> and all its files,
              tasks, members, and timeline data will be permanently removed. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => void handleDeleteProject()}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  height: "40px",
                  borderRadius: "10px",
                  border: "none",
                  background: "var(--ds-destructive)",
                  color: "white",
                  fontWeight: 500,
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.7 : 1,
                }}
              >
                {isDeleting ? "Deleting…" : "Delete permanently"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  height: "40px",
                  borderRadius: "10px",
                  border: "1px solid rgba(90,60,30,0.15)",
                  background: "white",
                  color: "var(--ds-secondary-label)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      <CreateProjectSheet
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreated={(id) => {
          void refetch();
          router.push(projectRoute(id));
        }}
      />
    </div>
  );
}
