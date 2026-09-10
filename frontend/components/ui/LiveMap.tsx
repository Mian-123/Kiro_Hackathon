"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Map as MapLibreMap } from "maplibre-gl";

export interface MapMarker {
  id: string;
  lng: number;
  lat: number;
  color: string;
  label: string;
  category: string;
}

interface LiveMapProps {
  height?: string;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  interactive?: boolean;
  onLocationPick?: (lng: number, lat: number) => void;
}

// Lahore city center
const LAHORE_CENTER: [number, number] = [74.3587, 31.5204];

const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

export function LiveMap({
  height = "300px",
  center = LAHORE_CENTER,
  zoom = 13,
  markers = [],
  className = "",
  interactive = true,
  onLocationPick,
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<import("maplibre-gl").Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: MapLibreMap;
    // Dynamic import to avoid SSR issues
    import("maplibre-gl").then(({ default: maplibregl }) => {
      if (!containerRef.current || mapRef.current) return;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: OSM_STYLE,
        center,
        zoom,
        attributionControl: false,
        interactive,
      });

      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right"
      );

      if (interactive) {
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      }

      // Location pick mode
      if (onLocationPick) {
        map.getCanvas().style.cursor = "crosshair";
        map.on("click", (e) => {
          onLocationPick(e.lngLat.lng, e.lngLat.lat);
        });
      }

      mapRef.current = map;

      // Add markers
      markers.forEach((m) => {
        const el = document.createElement("div");
        el.style.cssText = [
          `width:14px`,
          `height:14px`,
          `border-radius:50%`,
          `background:${m.color}`,
          `border:2.5px solid white`,
          `box-shadow:0 2px 8px rgba(0,0,0,0.45)`,
          `cursor:pointer`,
          `transition:transform 0.15s`,
        ].join(";");
        el.addEventListener("mouseenter", () => { el.style.transform = "scale(1.4)"; });
        el.addEventListener("mouseleave", () => { el.style.transform = "scale(1)"; });

        const popup = new maplibregl.Popup({ offset: 14, closeButton: false })
          .setHTML(
            `<div style="font-size:12px;font-weight:600;color:#16233A;font-family:Outfit,sans-serif">${m.label}</div>` +
            `<div style="font-size:11px;color:#5A6B84;margin-top:2px">${m.category}</div>`
          );

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when they change
  useEffect(() => {
    if (!mapRef.current) return;
    import("maplibre-gl").then(({ default: maplibregl }) => {
      // Remove old
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Add new
      markers.forEach((m) => {
        const el = document.createElement("div");
        el.style.cssText = [
          `width:14px`,
          `height:14px`,
          `border-radius:50%`,
          `background:${m.color}`,
          `border:2.5px solid white`,
          `box-shadow:0 2px 8px rgba(0,0,0,0.45)`,
          `cursor:pointer`,
        ].join(";");

        const popup = new maplibregl.Popup({ offset: 14, closeButton: false })
          .setHTML(
            `<div style="font-size:12px;font-weight:600;color:#16233A;font-family:Outfit,sans-serif">${m.label}</div>` +
            `<div style="font-size:11px;color:#5A6B84;margin-top:2px">${m.category}</div>`
          );

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .setPopup(popup)
          .addTo(mapRef.current!);

        markersRef.current.push(marker);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers)]);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ height }}
    />
  );
}

// ── Geolocation hook ──────────────────────────────────────────────────────────

export interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  address: string | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    address: null,
    loading: false,
    error: null,
  });

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const a = data.address || {};
      const parts = [
        a.road || a.pedestrian || a.footway,
        a.suburb || a.neighbourhood || a.quarter,
        a.city || a.town || a.village || "Lahore",
      ].filter(Boolean);
      return parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(", ") || null;
    } catch {
      return null;
    }
  }, []);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation not supported" }));
      return;
    }
    setState({ lat: null, lng: null, accuracy: null, address: null, loading: true, error: null });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const address = await reverseGeocode(lat, lng);
        setState({
          lat,
          lng,
          accuracy: pos.coords.accuracy,
          address,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({ lat: null, lng: null, accuracy: null, address: null, loading: false, error: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [reverseGeocode]);

  return { ...state, request };
}

// ── Pin marker for picked location ───────────────────────────────────────────
export function LocationPickerMap({
  height = "200px",
  onPick,
  picked,
}: {
  height?: string;
  onPick: (lng: number, lat: number) => void;
  picked: { lng: number; lat: number } | null;
}) {
  const pickedMarkers: MapMarker[] = picked
    ? [{ id: "picked", lng: picked.lng, lat: picked.lat, color: "#0E8A5F", label: "Your location", category: "" }]
    : [];

  return (
    <LiveMap
      height={height}
      center={picked ? [picked.lng, picked.lat] : LAHORE_CENTER}
      zoom={picked ? 15 : 13}
      markers={pickedMarkers}
      onLocationPick={onPick}
      interactive
    />
  );
}
