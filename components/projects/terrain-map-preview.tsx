"use client";

import { useEffect, useRef, useState } from "react";

import { loadGoogleMaps } from "@/lib/maps/google-maps-loader";

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: google.maps.Map | null = null;

    async function init() {
      if (!mapRef.current) return;
      if (latitude == null || longitude == null) {
        setError(null);
        return;
      }

      try {
        const googleMaps = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const center = { lat: latitude, lng: longitude };
        map = new googleMaps.maps.Map(mapRef.current, {
          center,
          zoom: 15,
          mapTypeId: googleMaps.maps.MapTypeId.TERRAIN,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: googleMaps.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: [
              googleMaps.maps.MapTypeId.TERRAIN,
              googleMaps.maps.MapTypeId.ROADMAP,
              googleMaps.maps.MapTypeId.SATELLITE,
              googleMaps.maps.MapTypeId.HYBRID,
            ],
          },
          gestureHandling: "cooperative",
        });

        new googleMaps.maps.Marker({
          map,
          position: center,
          title: address?.trim() || undefined,
        });

        window.setTimeout(() => {
          if (!map || cancelled) return;
          googleMaps.maps.event.trigger(map, "resize");
          map.setCenter(center);
          map.setMapTypeId(googleMaps.maps.MapTypeId.TERRAIN);
        }, 120);

        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load map");
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      map = null;
    };
  }, [latitude, longitude, address]);

  if (latitude == null || longitude == null) {
    if (address?.trim()) {
      return (
        <iframe
          title="Project location map"
          src={`https://www.google.com/maps?q=${encodeURIComponent(address.trim())}&z=15&t=p&output=embed`}
          className={className}
          style={{ width: "100%", height: "100%", minHeight: 220, border: 0, borderRadius: 10 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      );
    }
    return null;
  }

  if (error) {
    return (
      <iframe
        title="Project location map"
        src={`https://www.google.com/maps?q=${latitude},${longitude}&z=15&t=p&output=embed`}
        className={className}
        style={{ width: "100%", height: "100%", minHeight: 220, border: 0, borderRadius: 10 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    );
  }

  return (
    <div
      ref={mapRef}
      className={className}
      style={{ width: "100%", height: "100%", minHeight: 220, borderRadius: 10, overflow: "hidden" }}
    />
  );
}
