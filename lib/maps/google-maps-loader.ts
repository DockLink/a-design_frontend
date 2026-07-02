import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;
let mapsReady: Promise<void> | null = null;
let resolvedKey: string | null = null;

export function getGoogleMapsApiKey(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || resolvedKey || undefined;
}

export function isGoogleMapsConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || resolvedKey);
}

export async function resolveGoogleMapsApiKey(): Promise<string> {
  if (resolvedKey) return resolvedKey;

  const fromEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (fromEnv) {
    resolvedKey = fromEnv;
    return fromEnv;
  }

  const res = await fetch("/api/maps/config");
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof body.message === "string"
        ? body.message
        : "Google Maps API key is not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to the frontend .env."
    );
  }

  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!apiKey) {
    throw new Error("Google Maps API key is missing from server config.");
  }

  resolvedKey = apiKey;
  return apiKey;
}

export async function loadGoogleMaps(): Promise<typeof google> {
  const apiKey = await resolveGoogleMapsApiKey();

  if (!configured) {
    setOptions({ key: apiKey, v: "weekly" });
    configured = true;
  }

  if (!mapsReady) {
    mapsReady = Promise.all([
      importLibrary("maps"),
      importLibrary("places"),
      importLibrary("geocoding"),
      importLibrary("marker"),
    ]).then(() => undefined);
  }

  await mapsReady;
  return google;
}
