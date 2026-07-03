export type VimeoEmbedInfo = {
  videoId: string;
  /** Privacy hash required for unlisted / private Vimeo links (e.g. vimeo.com/123/abc123). */
  hash?: string;
};

function tryParseUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    try {
      return new URL(`https://${input}`);
    } catch {
      return null;
    }
  }
}

/**
 * Parses a Vimeo share or player URL into embed parameters.
 * Supports public links and unlisted links with a privacy hash.
 */
export function parseVimeoEmbed(input: string | null | undefined): VimeoEmbedInfo | null {
  if (!input?.trim()) return null;
  const value = input.trim();

  if (/^\d+$/.test(value)) {
    return { videoId: value };
  }

  const idHashOnly = value.match(/^(\d+)\/([a-f0-9]+)$/i);
  if (idHashOnly) {
    return { videoId: idHashOnly[1], hash: idHashOnly[2] };
  }

  const parsed = tryParseUrl(value);
  if (parsed) {
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname;

    if (host === "player.vimeo.com") {
      const playerMatch = path.match(/^\/video\/(\d+)/i);
      if (playerMatch?.[1]) {
        const hash = parsed.searchParams.get("h") ?? undefined;
        return { videoId: playerMatch[1], hash: hash || undefined };
      }
    }

    if (host === "vimeo.com") {
      const directMatch = path.match(/^\/(\d+)(?:\/([a-f0-9]+))?\/?$/i);
      if (directMatch?.[1]) {
        return {
          videoId: directMatch[1],
          hash: directMatch[2] || undefined,
        };
      }

      const channelMatch = path.match(/^\/channels\/[^/]+\/(\d+)(?:\/([a-f0-9]+))?\/?$/i);
      if (channelMatch?.[1]) {
        return {
          videoId: channelMatch[1],
          hash: channelMatch[2] || undefined,
        };
      }

      const groupMatch = path.match(/^\/groups\/[^/]+\/videos\/(\d+)(?:\/([a-f0-9]+))?\/?$/i);
      if (groupMatch?.[1]) {
        return {
          videoId: groupMatch[1],
          hash: groupMatch[2] || undefined,
        };
      }
    }
  }

  // Fallback for pasted strings without a scheme.
  const patterns = [
    /vimeo\.com\/(\d+)(?:\/([a-f0-9]+))?/i,
    /player\.vimeo\.com\/video\/(\d+)/i,
    /vimeo\.com\/channels\/[^/]+\/(\d+)(?:\/([a-f0-9]+))?/i,
    /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)(?:\/([a-f0-9]+))?/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) {
      const hashFromQuery = value.match(/[?&]h=([a-f0-9]+)/i)?.[1];
      return {
        videoId: match[1],
        hash: match[2] || hashFromQuery || undefined,
      };
    }
  }

  return null;
}

export function buildVimeoEmbedSrc(info: VimeoEmbedInfo): string {
  const params = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
  });
  if (info.hash) {
    params.set("h", info.hash);
  }
  return `https://player.vimeo.com/video/${info.videoId}?${params.toString()}`;
}

export function parseVimeoVideoId(input: string | null | undefined): string | null {
  return parseVimeoEmbed(input)?.videoId ?? null;
}

export function isValidVimeoUrl(input: string | null | undefined): boolean {
  return parseVimeoEmbed(input) !== null;
}
