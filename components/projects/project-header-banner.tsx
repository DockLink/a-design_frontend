"use client";

import { projectThumbnailUrl } from "@/lib/projects/map-projects";
import type { ProjectImage } from "@/types/projects";

export function ProjectHeaderBanner({
  projectName,
  images,
}: {
  projectName: string;
  images: ProjectImage[];
}) {
  const src = projectThumbnailUrl(images);

  return (
    <div
      style={{
        position: "relative",
        height: "200px",
        margin: "0 -28px",
        background: `center/cover no-repeat url(${src})`,
        backgroundColor: "#E8DFD3",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(28,28,30,0.05) 0%, rgba(28,28,30,0.55) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "28px",
          right: "28px",
          bottom: "18px",
          color: "#FFFFFF",
        }}
      >
        <div style={{ fontSize: "22px", fontWeight: 600, textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
          {projectName}
        </div>
      </div>
    </div>
  );
}
