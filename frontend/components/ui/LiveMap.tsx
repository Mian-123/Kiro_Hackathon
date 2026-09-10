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
  address?: string;
  status?: string;
  priority?: string;
  firstReported?: string;
  lastReported?: string;
  citizenReports?: number;
  department?: string;
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

// Status label + colour lookup for popups
const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  VERIFIED: "Verified",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLUTION_SUBMITTED: "Resolution Submitted",
  AWAITING_CITIZEN_VERIFICATION: "Awaiting Verification",
  RESOLVED: "Resolved",
  REOPENED: "Reopened",
  REJECTED: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#5A6B84",
  VERIFIED: "#2563EB",
  ASSIGNED: "#7C3AED",
  IN_PROGRESS: "#E0A400",
  RESOLUTION_SUBMITTED: "#C6A55C",
  AWAITING_CITIZEN_VERIFICATION: "#C6A55C",
  RESOLVED: "#0E8A5F",
  REOPENED: "#C0392B",
  REJECTED: "#C0392B",
};

// Build a prominent, non-drifting marker DOM element
function createMarkerElement(m: MapMarker): HTMLDivElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = [
    "width:22px",
    "height:22px",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "cursor:pointer",
  ].join(";");

  const dot = document.createElement("div");
  dot.style.cssText = [
    "width:18px",
    "height:18px",
    "border-radius:50%",
    `background:${m.color}`,
    "border:3px solid white",
    "box-shadow:0 2px 10px rgba(0,0,0,0.5)",
    "transition:transform 0.15s ease",
  ].join(";");

  wrap.appendChild(dot);
  wrap.addEventListener("mouseenter", () => { dot.style.transform = "scale(1.5)"; });
  wrap.addEventListener("mouseleave", () => { dot.style.transform = "scale(1)"; });
  return wrap;
}

// Build detailed popup HTML: Location, First/Last reported, Citizen reports, Status, Department
function buildPopupHTML(m: MapMarker): string {
  const statusKey = (m.status || "").toUpperCase();
  const statusLabel = STATUS_LABELS[statusKey] || m.status || "Pending Verification";
  const statusColor = STATUS_COLORS[statusKey] || "#E0A400";

  const row = (label: string, value: string, valueColor = "#16233A") =>
    `<div style="display:flex;justify-content:space-between;gap:12px;margin-top:5px">` +
    `<span style="font-size:11px;color:#5A6B84">${label}</span>` +
    `<span style="font-size:11px;font-weight:700;color:${valueColor};text-align:right">${value}</span>` +
    `</div>`;

  const parts: string[] = [];

  // Title (short code)
  parts.push(
    `<div style="font-size:14px;font-weight:800;color:#16233A;font-family:Outfit,sans-serif;letter-spacing:0.02em">${m.label}</div>`
  );

  // Category subtitle (uppercase, muted)
  parts.push(
    `<div style="font-size:11px;font-weight:700;color:#5A6B84;text-transform:uppercase;letter-spacing:0.04em;margin-top:2px">${m.category}</div>`
  );

  // Divider
  parts.push(`<div style="height:1px;background:#E6E3DC;margin:8px 0"></div>`);

  // Detail rows
  if (m.address)        parts.push(row("Location", m.address));
  if (m.firstReported)  parts.push(row("First reported", m.firstReported));
  if (m.lastReported)   parts.push(row("Last reported", m.lastReported));
  if (m.citizenReports != null) parts.push(row("Citizen reports", String(m.citizenReports)));

  // Status row with coloured dot
  parts.push(
    `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:5px">` +
    `<span style="font-size:11px;color:#5A6B84">Status</span>` +
    `<span style="font-size:11px;font-weight:700;color:${statusColor};display:flex;align-items:center;gap:5px">` +
    `<span style="width:9px;height:9px;border-radius:50%;background:${statusColor};display:inline-block"></span>${statusLabel}</span>` +
    `</div>`
  );

  if (m.department)     parts.push(row("Department", m.department));

  // View Incident button
  parts.push(
    `<div style="margin-top:10px">` +
    `<div style="text-align:center;font-size:12px;font-weight:700;color:#0A1F3C;border:1px solid #E6E3DC;border-radius:10px;padding:8px 0;cursor:pointer">[ View Incident ]</div>` +
    `</div>`
  );

  return `<div style="min-width:210px;padding:4px 2px">${parts.join("")}</div>`;
}

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

      // Add markers — anchored at bottom so they don't drift on zoom
      markers.forEach((m) => {
        const el = createMarkerElement(m);
        const popup = new maplibregl.Popup({ offset: 16, closeButton: true })
          .setHTML(buildPopupHTML(m));
        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
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

      // Add new — anchored at center so they stay pinned on zoom
      markers.forEach((m) => {
        const el = createMarkerElement(m);
        const popup = new maplibregl.Popup({ offset: 16, closeButton: true })
          .setHTML(buildPopupHTML(m));
        const marker = new maplibregl.Marker({ element: el, anchor: "center" })
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
