"use client";

import { useEffect, useRef, useState } from "react";

import { loadGoogleMaps } from "@/lib/maps/google-maps-loader";

const TERRAIN = "terrain" as const;

function forceTerrain(map: google.maps.Map) {
  map.setMapTypeId(TERRAIN);
}

export function TerrainMapPreview({
  latitude,
  longitude,
  address,
  className,
}: {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  className?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const listeners: google.maps.MapsEventListener[] = [];

    async function init() {
      setStatus("loading");
      setErrorMessage(null);

      if (!mapRef.current) return;

      try {
        const googleMaps = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        let center: google.maps.LatLngLiteral | null =
          latitude != null && longitude != null
            ? { lat: Number(latitude), lng: Number(longitude) }
            : null;

        // Address-only projects: geocode first so we never fall back to roadmap iframe.
        if (!center && address?.trim()) {
          const geocoder = new googleMaps.maps.Geocoder();
          const result = await new Promise<google.maps.GeocoderResult | null>((resolve) => {
            geocoder.geocode({ address: address.trim() }, (results, geocodeStatus) => {
              if (geocodeStatus === "OK" && results?.[0]?.geometry?.location) {
                resolve(results[0]);
              } else {
                resolve(null);
              }
            });
          });
          if (result?.geometry?.location) {
            center = {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
            };
          }
        }

        if (!center) {
          throw new Error("No coordinates available for this location.");
        }

        const map = new googleMaps.maps.Map(mapRef.current, {
          center,
          zoom: 15,
          mapTypeId: TERRAIN,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: googleMaps.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ["terrain", "roadmap", "satellite", "hybrid"],
          },
          gestureHandling: "cooperative",
        });
        mapInstanceRef.current = map;

        new googleMaps.maps.Marker({
          map,
          position: center,
          title: address?.trim() || undefined,
        });

        forceTerrain(map);

        listeners.push(
          map.addListener("idle", () => forceTerrain(map)),
          map.addListener("tilesloaded", () => forceTerrain(map)),
        );

        // After layout settles, re-assert terrain (resize often resets type).
        window.setTimeout(() => {
          if (cancelled || !mapInstanceRef.current) return;
          googleMaps.maps.event.trigger(map, "resize");
          map.setCenter(center!);
          forceTerrain(map);
        }, 50);
        window.setTimeout(() => {
          if (cancelled || !mapInstanceRef.current) return;
          forceTerrain(map);
        }, 400);

        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "Failed to load terrain map");
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      for (const listener of listeners) listener.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, address]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 220,
        borderRadius: 10,
        overflow: "hidden",
        background: "#E8DFD3",
      }}
    >
      <div ref={mapRef} style={{ position: "absolute", inset: 0 }} />
      {status === "loading" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(252,248,244,0.72)",
            color: "var(--ds-secondary-label)",
            fontSize: 13,
            zIndex: 1,
          }}
        >
          Loading terrain map…
        </div>
      ) : null}
      {status === "error" ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            textAlign: "center",
            background: "rgba(252,248,244,0.92)",
            color: "var(--ds-secondary-label)",
            fontSize: 13,
            zIndex: 1,
          }}
        >
          {errorMessage ?? "Could not load terrain map."}
        </div>
      ) : null}
    </div>
  );
}
