"use client";

import { parseVimeoVideoId } from "@/lib/vimeo/parse-vimeo-url";

export function VimeoEmbed({ url }: { url: string }) {
  const videoId = parseVimeoVideoId(url);
  if (!videoId) return null;

  return (
    <div style={{ position: "relative", width: "100%", paddingTop: "56.25%", borderRadius: "12px", overflow: "hidden", background: "#000" }}>
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`}
        title="Project video"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
}
