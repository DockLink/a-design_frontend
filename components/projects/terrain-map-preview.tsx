"use client";

import { useEffect, useRef, useState } from "react";

import { loadGoogleMaps } from "@/lib/maps/google-maps-loader";

/** Satellite imagery with 3D terrain tilt — user can still switch map types. */
const DEFAULT_MAP_TYPE = "satellite" as const;
const MAP_TYPE_OPTIONS = ["satellite", "hybrid", "terrain", "roadmap"] as const;
const DEFAULT_TILT = 45;

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
          zoom: 16,
          mapTypeId: DEFAULT_MAP_TYPE,
          tilt: DEFAULT_TILT,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          mapTypeControl: true,
          rotateControl: true,
          mapTypeControlOptions: {
            style: googleMaps.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: googleMaps.maps.ControlPosition.TOP_RIGHT,
            mapTypeIds: [...MAP_TYPE_OPTIONS],
          },
          gestureHandling: "cooperative",
        });
        mapInstanceRef.current = map;
        map.setMapTypeId(DEFAULT_MAP_TYPE);
        map.setTilt(DEFAULT_TILT);

        new googleMaps.maps.Marker({
          map,
          position: center,
          title: address?.trim() || undefined,
        });

        // When user picks satellite/hybrid, restore terrain tilt; flat types stay flat.
        map.addListener("maptypeid_changed", () => {
          const type = String(map.getMapTypeId() ?? "");
          if (type === "satellite" || type === "hybrid") {
            map.setTilt(DEFAULT_TILT);
          } else {
            map.setTilt(0);
          }
        });

        window.setTimeout(() => {
          if (cancelled || !mapInstanceRef.current) return;
          googleMaps.maps.event.trigger(map, "resize");
          map.setCenter(center!);
          map.setMapTypeId(DEFAULT_MAP_TYPE);
          map.setTilt(DEFAULT_TILT);
        }, 80);

        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "Failed to load map");
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
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
          Loading satellite terrain…
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
          {errorMessage ?? "Could not load map."}
        </div>
      ) : null}
    </div>
  );
}
