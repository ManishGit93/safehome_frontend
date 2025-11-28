"use client";

import { BoltIcon, WifiIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import { ChildMapView } from "../../../components/map/ChildMapView";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useRealtimeLocation } from "../../../hooks/useRealtimeLocation";
import { useAuth } from "../../../hooks/useAuth";
import { swrFetcher } from "../../../lib/apiClient";
import { LinkedChild, LocationPing } from "../../../types/api";

interface HistoryResponse {
  pings: LocationPing[];
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

  const path = useMemo(() => data?.pings ?? [], [data?.pings]);

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

      {data && (
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <ChildMapView latest={latest} history={path} />
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
    </div>
  );
};

export default ChildDetailPage;


