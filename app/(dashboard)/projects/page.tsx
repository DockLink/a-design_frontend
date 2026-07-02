"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RequestAccessDialog } from "@/components/access-requests/request-access-dialog";
import { CreateProjectSheet } from "@/components/projects/create-project-sheet";
import { ProjectCard } from "@/components/projects/project-card";
import { useAuth } from "@/hooks/use-auth";
import { useAccessRequests } from "@/hooks/use-access-requests";
import { useProjects } from "@/hooks/use-projects";
import { authApiClient } from "@/lib/api/authenticated-client";
import { getPrimaryRole } from "@/lib/auth/rbac";
import { toSidebarRole } from "@/lib/navigation/sidebar-role";
import { mapProjectToCard } from "@/lib/projects/map-projects";
import { toProjectsQueryString } from "@/lib/projects/query-string";
import {
  dsActionBtn,
  dsCallout,
  dsLargeTitle,
  dsSubtitle,
} from "@/lib/styles/dashboard-tokens";
import { projectRoute } from "@/types/navigation";
import type { ProjectCardView, ProjectsListResponse } from "@/types/projects";
import { PROJECT_LEAD_ROLE } from "@/types/projects";

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
              onClick={renderExtra ? undefined : () => onOpen(p.id)}
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

export default function ProjectsListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const sidebarRole = toSidebarRole(user?.roles ? getPrimaryRole(user.roles) : null);
  const canCreateProject = sidebarRole === "admin" || sidebarRole === "superadmin";
  const isSuperAdmin = sidebarRole === "superadmin";
  const showSplitView = !canCreateProject;

  const { projects: allProjects, isLoading: allLoading, error, refetch, deleteProject, isDeleting } =
    useProjects({ page: 1, limit: 100, status: "ACTIVE" });

  const [myProjects, setMyProjects] = useState<ProjectCardView[]>([]);
  const [ledProjectIds, setLedProjectIds] = useState<Set<string>>(new Set());
  const [myLoading, setMyLoading] = useState(showSplitView);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectCardView | null>(null);
  const [requestTarget, setRequestTarget] = useState<ProjectCardView | null>(null);

  const userId = user?.id;
  const { requests: myAccessRequests, createRequest } = useAccessRequests(
    { page: 1, limit: 100, requested_by_id: userId },
    { enabled: showSplitView && !!userId }
  );

  const pendingByProjectId = useMemo(() => {
    const map = new Set<string>();
    for (const r of myAccessRequests) {
      if (r.status === "PENDING") map.add(r.projectId);
    }
    return map;
  }, [myAccessRequests]);

  const fetchMyProjects = useCallback(async () => {
    if (!showSplitView) return;

    setMyLoading(true);
    // Resolve the two queries independently so a failure in the "led" lookup
    // never wipes out the member projects (and vice-versa).
    const [memberRes, ledRes] = await Promise.allSettled([
      authApiClient<ProjectsListResponse>(
        `/projects${toProjectsQueryString({ page: 1, limit: 100, status: "ACTIVE", as_member: true })}`
      ),
      authApiClient<ProjectsListResponse>(
        `/projects${toProjectsQueryString({
          page: 1,
          limit: 100,
          status: "ACTIVE",
          as_member: true,
          as_member_role: PROJECT_LEAD_ROLE,
        })}`
      ),
    ]);

    if (memberRes.status === "fulfilled") {
      setMyProjects(memberRes.value.data.map(mapProjectToCard));
    } else {
      setMyProjects([]);
    }

    setLedProjectIds(
      ledRes.status === "fulfilled"
        ? new Set(ledRes.value.data.map((p) => p.id))
        : new Set()
    );

    setMyLoading(false);
  }, [showSplitView]);

  useEffect(() => {
    void fetchMyProjects();
  }, [fetchMyProjects]);

  const myProjectIds = useMemo(() => new Set(myProjects.map((p) => p.id)), [myProjects]);

  const leadProjects = useMemo(
    () => myProjects.filter((p) => ledProjectIds.has(p.id)),
    [myProjects, ledProjectIds]
  );

  const memberProjects = useMemo(
    () => myProjects.filter((p) => !ledProjectIds.has(p.id)),
    [myProjects, ledProjectIds]
  );

  const discoverProjects = useMemo(
    () => (showSplitView ? allProjects.filter((p) => !myProjectIds.has(p.id)) : []),
    [showSplitView, allProjects, myProjectIds]
  );

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

  async function handleRequestAccess(note?: string) {
    if (!requestTarget) return;
    await createRequest({ project_id: requestTarget.id, request_note: note });
    toast.success("Access request submitted");
    setRequestTarget(null);
  }

  const isLoading = allLoading || (showSplitView && myLoading);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={dsLargeTitle}>Projects</div>
          <div style={{ ...dsSubtitle, marginTop: "8px" }}>
            {canCreateProject
              ? "All organisation projects"
              : "Your assigned projects and others you can request access to"}
          </div>
        </div>
        {canCreateProject && (
          <button
            type="button"
            onClick={() => setShowCreateProject(true)}
            style={{ ...dsActionBtn, background: "#D4A96A", color: "white", marginTop: "4px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#C4956A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#D4A96A")}
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
      ) : showSplitView ? (
        <>
          {leadProjects.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1410", marginBottom: 12 }}>
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
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1410", marginBottom: 12 }}>
              Projects you&apos;re a member of ({memberProjects.length})
            </div>
            {memberProjects.length === 0 ? (
              <div style={dsCallout}>You are not a member of any other projects yet.</div>
            ) : (
              <ProjectCardGrid
                cards={memberProjects}
                isSuperAdmin={false}
                isDeleting={isDeleting}
                onOpen={(id) => router.push(projectRoute(id))}
                onDelete={() => undefined}
              />
            )}
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1A1410", marginBottom: 12 }}>
              Other projects ({discoverProjects.length})
            </div>
            {discoverProjects.length === 0 ? (
              <div style={dsCallout}>No other projects to discover.</div>
            ) : (
              <ProjectCardGrid
                cards={discoverProjects}
                isSuperAdmin={false}
                isDeleting={isDeleting}
                onOpen={() => undefined}
                onDelete={() => undefined}
                renderExtra={(p) => (
                  <div style={{ marginTop: 12 }}>
                    {pendingByProjectId.has(p.id) ? (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          height: 32,
                          padding: "0 12px",
                          borderRadius: 8,
                          background: "rgba(212,169,106,0.14)",
                          color: "#C9894A",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        Request pending
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRequestTarget(p)}
                        style={{
                          height: 32,
                          padding: "0 14px",
                          borderRadius: 8,
                          border: "none",
                          background: "#D4A96A",
                          color: "white",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Request access
                      </button>
                    )}
                  </div>
                )}
              />
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
                style={{ background: "none", border: "none", padding: 0, color: "#D4A96A", cursor: "pointer", fontWeight: 500 }}
              >
                Create your first project
              </button>
            </>
          )}
        </div>
      ) : (
        <ProjectCardGrid
          cards={allProjects}
          isSuperAdmin={isSuperAdmin}
          isDeleting={isDeleting}
          onOpen={(id) => router.push(projectRoute(id))}
          onDelete={(p) => setDeleteTarget(p)}
        />
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
              background: "#FDFAF6",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "420px",
              width: "90%",
              zIndex: 201,
              boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#FF3B30", marginBottom: "8px" }}>
              Delete project permanently?
            </div>
            <p style={{ fontSize: "14px", color: "#6B5744", margin: "0 0 20px", lineHeight: 1.5 }}>
              <strong style={{ color: "#1A1410" }}>{deleteTarget.name}</strong> and all its files,
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
                  background: "#FF3B30",
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
                  color: "#6B5744",
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

      <RequestAccessDialog
        open={!!requestTarget}
        onOpenChange={(open) => !open && setRequestTarget(null)}
        projectName={requestTarget?.name ?? ""}
        onSubmit={handleRequestAccess}
      />

      <CreateProjectSheet
        open={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onCreated={(id) => {
          void refetch();
          void fetchMyProjects();
          router.push(projectRoute(id));
        }}
      />
    </div>
  );
}
