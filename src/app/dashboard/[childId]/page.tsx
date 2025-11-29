"use client";

import { BoltIcon, WifiIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useRealtimeLocation } from "../../../hooks/useRealtimeLocation";
import { useAuth } from "../../../hooks/useAuth";
import { swrFetcher } from "../../../lib/apiClient";
import { LinkedChild, LocationPing } from "../../../types/api";
import type { LocationPoint } from "../../../components/map/ChildLocationMap";

// Dynamically import the map component to avoid SSR issues (Leaflet requires window object)
const ChildLocationMap = dynamic(
  () => import("../../../components/map/ChildLocationMap"),
  { ssr: false }
);

interface HistoryResponse {
  pings: LocationPing[];
  debug?: {
    totalPings?: number;
    dateRange?: {
      from: string;
      to: string;
    };
    childConsentGiven?: boolean;
    linkStatus?: string;
  };
}

type ChildrenResponse = { children: LinkedChild[] };

const ranges = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
];

const ChildDetailPage = () => {
  const params = useParams<{ childId: string }>();
  const { user } = useAuth();
  const childId = params.childId;
  const [hours, setHours] = useState(24);
  const fromIso = useMemo(() => new Date(Date.now() - hours * 3600 * 1000).toISOString(), [hours]);
  const queryKey = childId ? `/children/${childId}/locations?from=${fromIso}` : null;
  const { data, isLoading, error, mutate } = useSWR<HistoryResponse>(queryKey, swrFetcher);
  const { data: childrenData } = useSWR<ChildrenResponse>("/children", swrFetcher);
  const selectedChild = childrenData?.children.find((child) => child.id === childId);

  const latest = data?.pings?.[0] ?? null;

  const handleRealtime = useCallback(
    (payload: LocationPing) => {
      mutate((current) => {
        const existing = current?.pings ?? [];
        return { pings: [payload, ...existing].slice(0, 200) };
      }, false);
    },
    [mutate],
  );

  const { connected } = useRealtimeLocation(childId ?? null, handleRealtime);

  // Debug logging to help diagnose issues
  useEffect(() => {
    if (data) {
      console.log("[ChildDetailPage] Location data received:", {
        pingsCount: data.pings.length,
        queryKey,
        selectedChild: {
          id: selectedChild?.id,
          name: selectedChild?.name,
          consentGiven: selectedChild?.consentGiven,
        },
        connected,
      });
    }
    if (error) {
      console.error("[ChildDetailPage] Error fetching location data:", error);
    }
  }, [data, error, queryKey, selectedChild, connected]);

  const path = useMemo(() => data?.pings ?? [], [data?.pings]);

  // Transform LocationPing[] to LocationPoint[] for the map component
  // If your backend API shape differs, adjust this transformation accordingly
  const mapHistory: LocationPoint[] = useMemo(() => {
    return path.map((ping) => ({
      lat: ping.lat,
      lng: ping.lng,
      ts: ping.ts,
      accuracy: ping.accuracy,
      speed: ping.speed,
    }));
  }, [path]);

  const mapCurrentLocation: LocationPoint | null = useMemo(() => {
    if (!latest) return null;
    return {
      lat: latest.lat,
      lng: latest.lng,
      ts: latest.ts,
      accuracy: latest.accuracy,
      speed: latest.speed,
    };
  }, [latest]);

  if (!childId) {
    return <p className="text-sm text-slate-500">Missing child id.</p>;
  }

  if (user?.role !== "parent") {
    return <p className="text-sm text-slate-500">Only parents can view this page.</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">Unable to load child: {error.message}</p>;
  }

  const statusLabel = connected ? "Live tracking" : "Reconnecting";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">{selectedChild?.name ?? "Live view"}</h1>
          <p className="text-sm text-slate-600">
            Streaming updates {selectedChild?.email ? `for ${selectedChild.email}` : "in real time"}.
          </p>
        </div>
        <Link href="/dashboard" className="text-sm text-brand hover:text-brand-dark">
          ← Back to dashboard
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={connected ? "success" : "warning"} className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-amber-500"} pulse-dot`} />
          {statusLabel}
        </Badge>
        <Badge variant={selectedChild?.consentGiven ? "brand" : "warning"}>
          {selectedChild?.consentGiven ? "Consent active" : "Consent pending"}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-3">
        {ranges.map((range) => (
          <Button
            key={range.hours}
            variant={hours === range.hours ? "primary" : "subtle"}
            size="sm"
            onClick={() => setHours(range.hours)}
          >
            {range.label}
          </Button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading track…</p>}

      {/* Show diagnostic information when no data */}
      {!isLoading && data && data.pings.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">No location data available</h3>
                
                {/* Show backend debug info if available */}
                {data.debug && (
                  <div className="mb-4 p-4 bg-white rounded-lg border border-amber-200">
                    <p className="font-medium text-amber-900 mb-3">Status Check:</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${data.debug.childConsentGiven ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="text-amber-800">
                          Consent: <strong>{data.debug.childConsentGiven ? "Given ✓" : "Not Given ✗"}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${data.debug.linkStatus === "ACCEPTED" ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="text-amber-800">
                          Link: <strong>{data.debug.linkStatus === "ACCEPTED" ? "Active ✓" : data.debug.linkStatus || "Unknown"}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-amber-800">
                          Total Pings: <strong>{data.debug.totalPings ?? 0}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="text-amber-800">
                          Socket.IO: <strong>{connected ? "Connected ✓" : "Disconnected ✗"}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show specific message based on debug info */}
                {data.debug?.childConsentGiven && data.debug?.linkStatus === "ACCEPTED" && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-900 mb-2">✓ Setup Complete</p>
                    <p className="text-sm text-blue-800">
                      Consent is given and the link is active. However, <strong>no location data has been received</strong> from the child's device yet.
                    </p>
                    <div className="mt-3 text-sm text-blue-700">
                      <p className="font-medium mb-1">Next Steps:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Ensure the child's mobile app is installed and running</li>
                        <li>Check that location permissions are granted on the device</li>
                        <li>Verify the app is sending location updates to the backend</li>
                        <li>Location data will appear here once the first ping is received</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Show generic troubleshooting if no debug info */}
                {!data.debug && (
                  <div className="space-y-2 text-sm text-amber-800">
                    <p>This could be because:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>
                        <strong>Consent not given:</strong> The child needs to grant consent in their dashboard
                        {!selectedChild?.consentGiven && (
                          <span className="ml-1 text-amber-600">(Currently: Consent pending)</span>
                        )}
                      </li>
                      <li>
                        <strong>No location sent:</strong> The child's device/app hasn't sent any location updates yet
                      </li>
                      <li>
                        <strong>Time range:</strong> No location data exists in the selected time range ({hours}h)
                      </li>
                      <li>
                        <strong>Link status:</strong> Ensure the parent-child link is active and approved
                      </li>
                    </ul>
                  </div>
                )}

                {/* Debug info section */}
                <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                  <p className="font-medium text-amber-900 mb-2">Technical Details:</p>
                  <div className="space-y-1 text-xs text-amber-700 font-mono">
                    <p>API: {queryKey}</p>
                    {data.debug?.dateRange && (
                      <>
                        <p>Date Range: {new Date(data.debug.dateRange.from).toLocaleString()} → {new Date(data.debug.dateRange.to).toLocaleString()}</p>
                      </>
                    )}
                    <p>Response: {JSON.stringify(data, null, 2)}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.pings.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Live Location</CardTitle>
                  <Badge variant={connected ? "success" : "warning"} className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`}
                    />
                    {connected ? "Live" : "Offline"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ChildLocationMap
                  currentLocation={mapCurrentLocation}
                  history={mapHistory}
                  height="450px"
                  connected={connected}
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex items-center gap-3">
                <BoltIcon className="h-6 w-6 text-brand" />
                <div>
                  <CardTitle>Latest reading</CardTitle>
                  <p className="text-sm text-slate-500">
                    {latest ? new Date(latest.ts).toLocaleString() : "Awaiting first ping"}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm text-slate-600">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Latitude</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {latest ? latest.lat.toFixed(4) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Longitude</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {latest ? latest.lng.toFixed(4) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Speed</p>
                  <p className="text-lg font-semibold text-slate-900">{latest?.speed ?? "—"} m/s</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Accuracy</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {latest?.accuracy ? `${latest.accuracy} m` : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center gap-3">
                <WifiIcon className="h-5 w-5 text-brand" />
                <div>
                  <CardTitle>Recent pings</CardTitle>
                  <p className="text-sm text-slate-500">Last {Math.min(path.length, 15)} updates (newest first)</p>
                </div>
              </CardHeader>
              <CardContent className="max-h-80 space-y-3 overflow-y-auto pr-2">
                {path.slice(0, 15).map((ping) => (
                  <div key={ping.ts} className="rounded-xl border border-slate-100 p-3 text-sm">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{new Date(ping.ts).toLocaleTimeString()}</span>
                      <span>{new Date(ping.ts).toLocaleDateString()}</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {ping.lat.toFixed(4)}, {ping.lng.toFixed(4)}
                    </p>
                    <p className="text-xs text-slate-500">Speed: {ping.speed ?? "—"} m/s</p>
                  </div>
                ))}
                {!path.length && <p className="text-sm text-slate-500">No location history in this range.</p>}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Show map even when no data, so parent can see the empty state */}
      {!isLoading && data && data.pings.length === 0 && (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle>Live Location</CardTitle>
                <Badge variant={connected ? "success" : "warning"} className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`}
                  />
                  {connected ? "Live" : "Offline"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ChildLocationMap
                currentLocation={mapCurrentLocation}
                history={mapHistory}
                height="450px"
                connected={connected}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChildDetailPage;


