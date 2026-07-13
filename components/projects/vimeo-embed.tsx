"use client";

import { buildVimeoEmbedSrc, parseVimeoEmbed } from "@/lib/vimeo/parse-vimeo-url";

export function VimeoEmbed({ url }: { url: string }) {
  const embed = parseVimeoEmbed(url);
  if (!embed) return null;

  return (
    <div className="project-overview-panel__embed">
      <iframe
        src={buildVimeoEmbedSrc(embed)}
        title="Project video"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}
