"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useMemo, useRef } from "react";
import { LocationPing } from "../../types/api";

interface Props {
  latest?: LocationPing | null;
  history: LocationPing[];
}

export const ChildMapView = ({ latest, history }: Props) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const coordinates = useMemo(() => history.map((ping) => [ping.lng, ping.lat] as [number, number]), [history]);

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://demotiles.maplibre.org/style.json",
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
        new maplibregl.LngLatBounds(coordinates[0], coordinates[0]),
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

    const marker = new maplibregl.Marker({ color: "#7C3AED" })
      .setLngLat([latest.lng, latest.lat])
      .setPopup(new maplibregl.Popup().setHTML(`<strong>Last ping</strong><br/>${new Date(latest.ts).toLocaleString()}`))
      .addTo(map);
    map.flyTo({ center: [latest.lng, latest.lat], zoom: 13 });

    return () => {
      marker.remove();
    };
  }, [latest]);

  return (
    <div>
      <div ref={mapContainer} className="h-96 w-full rounded-3xl border border-slate-200 shadow-card" />
    </div>
  );
};


