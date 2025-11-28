"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef } from "react";
import { MAPBOX_KEY } from "../../lib/config";
import { LocationPing } from "../../types/api";

mapboxgl.accessToken = MAPBOX_KEY;

interface Props {
  latest?: LocationPing | null;
  history: LocationPing[];
}

export const ChildMapView = ({ latest, history }: Props) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const coordinates = useMemo(() => history.map((ping) => [ping.lng, ping.lat] as [number, number]), [history]);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_KEY) return;
    if (mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: latest ? [latest.lng, latest.lat] : [-98.5795, 39.8283],
      zoom: latest ? 12 : 3,
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !coordinates.length) return;

    const drawRoute = () => {
      if (map.getSource("route")) {
        map.removeLayer("route-line");
        map.removeSource("route");
      }

      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates,
          },
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#7C3AED", "line-width": 4, "line-opacity": 0.6 },
      });

      const bounds = coordinates.reduce(
        (acc, coord) => acc.extend(coord as [number, number]),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]),
      );
      map.fitBounds(bounds, { padding: 40 });
    };

    if (map.isStyleLoaded()) {
      drawRoute();
    } else {
      map.once("load", drawRoute);
    }
  }, [coordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !latest) return;

    const marker = new mapboxgl.Marker({ color: "#7C3AED" })
      .setLngLat([latest.lng, latest.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>Last ping</strong><br/>${new Date(latest.ts).toLocaleString()}`))
      .addTo(map);
    map.flyTo({ center: [latest.lng, latest.lat], zoom: 13 });

    return () => {
      marker.remove();
    };
  }, [latest]);

  return (
    <div>
      {!MAPBOX_KEY && (
        <p className="mb-2 rounded-md bg-amber-50 p-2 text-sm text-amber-700">
          Set NEXT_PUBLIC_MAPBOX_KEY to visualize the map.
        </p>
      )}
      <div ref={mapContainer} className="h-96 w-full rounded-3xl border border-slate-200 shadow-card" />
    </div>
  );
};


