export function parseVimeoVideoId(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const value = input.trim();

  const patterns = [
    /vimeo\.com\/(\d+)/i,
    /player\.vimeo\.com\/video\/(\d+)/i,
    /vimeo\.com\/channels\/[^/]+\/(\d+)/i,
    /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  if (/^\d+$/.test(value)) return value;
  return null;
}

export function isValidVimeoUrl(input: string | null | undefined): boolean {
  return parseVimeoVideoId(input) !== null;
}
