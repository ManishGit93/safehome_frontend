"use client";

/**
 * ChildLocationMap Component
 * 
 * Displays a Leaflet map showing the child's current location and path history.
 * Uses OpenStreetMap tiles (free, no API key required).
 * 
 * To change the tile provider in the future, update the TileLayer url prop below.
 * Popular alternatives:
 * - OpenStreetMap (current): https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
 * - CartoDB: https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
 * - Stamen: http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg
 */

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Next.js (Leaflet requires explicit icon setup)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Custom icon for current location (purple marker)
const currentLocationIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Set default icon globally
if (typeof window !== "undefined") {
  L.Marker.prototype.options.icon = defaultIcon;
}

/**
 * LocationPoint type matching the backend LocationPing structure
 * If your backend API shape differs, update this type accordingly.
 */
export type LocationPoint = {
  lat: number;
  lng: number;
  ts?: string;
  accuracy?: number;
  speed?: number;
};

interface ChildLocationMapProps {
  /** Current location of the child (most recent ping) */
  currentLocation: LocationPoint | null;
  /** Array of historical location points to draw as a path */
  history: LocationPoint[];
  /** Height of the map container (e.g., "400px", "450px", "100vh") */
  height?: string;
  /** Whether Socket.IO is connected (for status display) */
  connected?: boolean;
}

/**
 * Component to automatically recenter the map when currentLocation changes
 */
function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

/**
 * ChildLocationMap - Main map component
 * 
 * Features:
 * - Shows current location with a marker
 * - Displays historical path as a polyline
 * - Auto-centers on current location when available
 * - Responsive design with configurable height
 */
export default function ChildLocationMap({
  currentLocation,
  history,
  height = "400px",
  connected = false,
}: ChildLocationMapProps) {
  // Calculate center point for the map
  const center: [number, number] = useMemo(() => {
    if (currentLocation) {
      return [currentLocation.lat, currentLocation.lng];
    }
    if (history.length > 0) {
      // Use the most recent history point (first in array if sorted newest-first)
      const latest = history[0];
      return [latest.lat, latest.lng];
    }
    // Default center (India) - adjust if your users are primarily elsewhere
    return [20.5937, 78.9629];
  }, [currentLocation, history]);

  // Calculate zoom level
  const zoom = useMemo(() => {
    if (currentLocation || history.length > 0) {
      return 14; // City-level detail
    }
    return 5; // Country-level for default location
  }, [currentLocation, history.length]);

  // Convert history to polyline coordinates
  const polylinePositions: [number, number][] = useMemo(() => {
    // Reverse history if it's sorted newest-first (to show chronological path)
    const reversed = [...history].reverse();
    return reversed.map((point) => [point.lat, point.lng] as [number, number]);
  }, [history]);

  // Get current location coordinates for marker
  const markerPosition: [number, number] | null = useMemo(() => {
    if (currentLocation) {
      return [currentLocation.lat, currentLocation.lng];
    }
    return null;
  }, [currentLocation]);

  return (
    <div className="relative w-full rounded-3xl border border-slate-200 shadow-card overflow-hidden" style={{ height }}>
      {/* Map Container */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        className="z-0"
      >
        {/* OpenStreetMap Tile Layer */}
        {/* 
          To switch to a different tile provider, change the url below.
          Make sure to also update the attribution text.
        */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Historical path as polyline */}
        {polylinePositions.length > 1 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: "#7C3AED", // Purple color matching your brand
              weight: 4,
              opacity: 0.6,
            }}
          />
        )}

        {/* Current location marker */}
        {markerPosition && (
          <Marker
            position={markerPosition}
            icon={currentLocationIcon}
          >
            {/* Optional: Add popup with timestamp if needed */}
            {/* <Popup>
              <div>
                <strong>Current Location</strong>
                <br />
                {currentLocation?.ts
                  ? new Date(currentLocation.ts).toLocaleString()
                  : "Now"}
              </div>
            </Popup> */}
          </Marker>
        )}

        {/* Auto-recenter when currentLocation changes */}
        {markerPosition && <MapRecenter center={markerPosition} zoom={zoom} />}
      </MapContainer>

      {/* Status indicator overlay (optional) */}
      {connected !== undefined && (
        <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm">
          <span
            className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`}
          />
          <span className="text-xs font-medium text-slate-700">
            {connected ? "Live" : "Offline"}
          </span>
        </div>
      )}
    </div>
  );
}

