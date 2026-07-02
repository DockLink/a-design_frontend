"use client";

import { MapPin } from "lucide-react";

import { dsCard, dsFootnote, dsHeadline } from "@/lib/styles/dashboard-tokens";
import type { ProjectCardView } from "@/types/projects";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  Active: { bg: "rgba(52,199,89,0.12)", color: "#248A3D" },
  Inactive: { bg: "rgba(142,142,147,0.12)", color: "#6C6C70" },
};

export function ProjectCard({
  project,
  onClick,
  heroHeight = 220,
  renderExtra,
  renderOverlay,
}: {
  project: ProjectCardView;
  onClick?: () => void;
  heroHeight?: number;
  renderExtra?: (project: ProjectCardView) => React.ReactNode;
  renderOverlay?: (project: ProjectCardView) => React.ReactNode;
}) {
  const statusCfg = STATUS_COLORS[project.status] ?? STATUS_COLORS.Inactive;
  const interactive = Boolean(onClick) && !renderExtra;

  return (
    <div style={{ ...dsCard, position: "relative", overflow: "hidden" }}>
      <div
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        style={{ cursor: interactive ? "pointer" : renderExtra ? "default" : "pointer" }}
        onClick={() => interactive && onClick?.()}
        onKeyDown={(e) => interactive && e.key === "Enter" && onClick?.()}
      >
        <div
          style={{
            position: "relative",
            height: `${heroHeight}px`,
            backgroundImage: `url(${project.thumbnail})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(28,28,30,0.08) 0%, rgba(28,28,30,0.72) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "14px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.9)",
              fontFamily: "var(--ds-font-sans)",
            }}
          >
            {project.number}
          </div>
          <div style={{ position: "absolute", left: "14px", right: "14px", bottom: "14px", color: "#fff" }}>
            <div style={{ fontSize: "17px", fontWeight: 600, lineHeight: 1.25, textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
              {project.name}
            </div>
          </div>
          {renderOverlay?.(project)}
        </div>

        <div style={{ padding: "16px 18px" }}>
          <div style={dsFootnote}>{project.client}</div>
          {project.location ? (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", fontSize: "12px", color: "#8E8E93" }}>
              <MapPin size={13} color="#C9894A" style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.location}</span>
            </div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            {project.currentStage ? (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "rgba(212,169,106,0.14)",
                  color: "#C9894A",
                  borderRadius: "9999px",
                  padding: "3px 10px",
                  fontSize: "11px",
                  fontWeight: 500,
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "9999px", background: "#D4A96A" }} />
                {project.currentStage}
              </div>
            ) : (
              <span />
            )}
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                background: statusCfg.bg,
                color: statusCfg.color,
                borderRadius: "9999px",
                padding: "3px 10px",
              }}
            >
              {project.status}
            </span>
          </div>
          {renderExtra?.(project)}
        </div>
      </div>
    </div>
  );
}

export function projectCardGridStyle(): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
  };
}
