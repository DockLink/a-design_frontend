"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";

import { loadGoogleMaps } from "@/lib/maps/google-maps-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface LocationPickerValue {
  address: string;
  latitude: number;
  longitude: number;
}

const DEFAULT_CENTER = { lat: 7.2906, lng: 80.6337 }; // Sri Lanka center

export function LocationPickerModal({
  open,
  onClose,
  initialValue,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  initialValue?: Partial<LocationPickerValue> | null;
  onConfirm: (value: LocationPickerValue) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [address, setAddress] = useState(initialValue?.address ?? "");
  const [latitude, setLatitude] = useState(initialValue?.latitude ?? DEFAULT_CENTER.lat);
  const [longitude, setLongitude] = useState(initialValue?.longitude ?? DEFAULT_CENTER.lng);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const applyPosition = useCallback(
    (lat: number, lng: number, nextAddress?: string) => {
      setLatitude(lat);
      setLongitude(lng);
      if (nextAddress) setAddress(nextAddress);

      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      if (map && marker) {
        const pos = { lat, lng };
        marker.setPosition(pos);
        map.panTo(pos);
        map.setZoom(15);
      }
    },
    []
  );

  const reverseGeocode = useCallback(
    (lat: number, lng: number) => {
      const geocoder = geocoderRef.current;
      if (!geocoder) return;
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.[0]?.formatted_address) {
          setAddress(results[0].formatted_address);
        }
      });
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    setAddress(initialValue?.address ?? "");
    setLatitude(initialValue?.latitude ?? DEFAULT_CENTER.lat);
    setLongitude(initialValue?.longitude ?? DEFAULT_CENTER.lng);
    setError(null);
    setMapReady(false);
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    async function initMap() {
      setLoading(true);
      setError(null);
      try {
        const googleMaps = await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const center = {
          lat: initialValue?.latitude ?? DEFAULT_CENTER.lat,
          lng: initialValue?.longitude ?? DEFAULT_CENTER.lng,
        };

        const map = new googleMaps.maps.Map(mapRef.current, {
          center,
          zoom: initialValue?.latitude != null ? 15 : 8,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        });
        mapInstanceRef.current = map;

        const marker = new googleMaps.maps.Marker({
          map,
          position: center,
          draggable: true,
          animation: googleMaps.maps.Animation.DROP,
        });
        markerRef.current = marker;

        const geocoder = new googleMaps.maps.Geocoder();
        geocoderRef.current = geocoder;

        if (inputRef.current) {
          const autocomplete = new googleMaps.maps.places.Autocomplete(inputRef.current, {
            fields: ["formatted_address", "geometry", "name"],
          });
          autocomplete.bindTo("bounds", map);
          autocompleteRef.current = autocomplete;

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry?.location) return;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const formatted =
              place.formatted_address ?? place.name ?? "";
            applyPosition(lat, lng, formatted);
          });
        }

        marker.addListener("dragend", () => {
          const pos = marker.getPosition();
          if (!pos) return;
          const lat = pos.lat();
          const lng = pos.lng();
          setLatitude(lat);
          setLongitude(lng);
          reverseGeocode(lat, lng);
        });

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setLatitude(lat);
          setLongitude(lng);
          marker.setPosition({ lat, lng });
          reverseGeocode(lat, lng);
        });

        // Fix blank map when opened inside a modal
        window.setTimeout(() => {
          googleMaps.maps.event.trigger(map, "resize");
          map.setCenter(center);
        }, 150);

        if (!cancelled) setMapReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load Google Maps");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void initMap();

    return () => {
      cancelled = true;
      autocompleteRef.current = null;
      markerRef.current = null;
      mapInstanceRef.current = null;
      geocoderRef.current = null;
      setMapReady(false);
    };
  }, [open, initialValue?.latitude, initialValue?.longitude, applyPosition, reverseGeocode]);

  async function handleSearchAddress() {
    const query = address.trim();
    if (!query) return;

    setSearching(true);
    setError(null);
    try {
      await loadGoogleMaps();
      const geocoder = geocoderRef.current;
      if (!geocoder) {
        setError("Map is still loading. Please wait a moment.");
        return;
      }

      geocoder.geocode({ address: query }, (results, status) => {
        setSearching(false);
        if (status !== "OK" || !results?.[0]?.geometry?.location) {
          setError("Could not find that address. Try a more specific search.");
          return;
        }
        const lat = results[0].geometry.location.lat();
        const lng = results[0].geometry.location.lng();
        applyPosition(lat, lng, results[0].formatted_address ?? query);
      });
    } catch (err) {
      setSearching(false);
      setError(err instanceof Error ? err.message : "Search failed");
    }
  }

  if (!open) return null;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 200 }} />
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201,
          width: "min(820px, 96vw)",
          maxHeight: "92vh",
          overflow: "hidden",
          borderRadius: "16px",
          background: "#FDFAF6",
          boxShadow: "0 24px 70px rgba(60,40,20,0.28)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid rgba(90,60,30,0.12)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
            <MapPin size={18} color="#C9894A" />
            Pick project location
          </div>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 22px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="space-y-2">
            <Label htmlFor="location-address">Search address</Label>
            <div style={{ display: "flex", gap: "8px" }}>
              <Input
                id="location-address"
                ref={inputRef}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSearchAddress();
                  }
                }}
                placeholder="Type an address or place name…"
                className="bg-[#F5EFE6] h-10 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0"
                disabled={searching || !address.trim()}
                onClick={() => void handleSearchAddress()}
              >
                {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Search
              </Button>
            </div>
            <p style={{ fontSize: "12px", color: "#8E8E93", lineHeight: 1.4 }}>
              Search above, click on the map, or drag the pin to set the exact location.
            </p>
          </div>

          <div style={{ position: "relative" }}>
            <div
              ref={mapRef}
              style={{
                width: "100%",
                height: "400px",
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid rgba(90,60,30,0.12)",
                background: "#E8DFD3",
              }}
            />
            {(loading || !mapReady) && !error ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(253,250,246,0.85)",
                  borderRadius: "12px",
                  fontSize: "13px",
                  color: "#8E8E93",
                  gap: "8px",
                }}
              >
                <Loader2 size={18} className="animate-spin" />
                Loading map…
              </div>
            ) : null}
          </div>

          {error ? (
            <div style={{ fontSize: "13px", color: "#C62828", lineHeight: 1.5 }}>{error}</div>
          ) : null}

          {mapReady ? (
            <div style={{ fontSize: "12px", color: "#8E8E93" }}>
              Pin: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </div>
          ) : null}
        </div>

        <div
          style={{
            padding: "16px 22px",
            borderTop: "1px solid rgba(90,60,30,0.12)",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
          }}
        >
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-[#D4A96A] hover:bg-[#C4956A]"
            disabled={!address.trim() || loading}
            onClick={() => {
              onConfirm({
                address: address.trim(),
                latitude,
                longitude,
              });
              onClose();
            }}
          >
            Save location
          </Button>
        </div>
      </div>
    </>
  );
}
