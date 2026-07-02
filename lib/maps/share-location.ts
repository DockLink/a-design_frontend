export interface LocationShareInput {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export function buildGoogleMapsUrl({ address, latitude, longitude }: LocationShareInput): string | null {
  if (latitude != null && longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }
  if (address?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
  }
  return null;
}

export function getLocationShareTitle(input: LocationShareInput): string {
  if (input.address?.trim()) return input.address.trim();
  if (input.latitude != null && input.longitude != null) {
    return `${input.latitude}, ${input.longitude}`;
  }
  return "Project location";
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function shareViaDevice({
  title,
  url,
}: {
  title: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.share) {
    return false;
  }
  try {
    await navigator.share({ title, text: title, url });
    return true;
  } catch {
    return false;
  }
}
