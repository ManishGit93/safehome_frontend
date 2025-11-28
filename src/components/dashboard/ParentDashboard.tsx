"use client";

import { ClockIcon, MapPinIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "../../hooks/useAuth";
import { swrFetcher } from "../../lib/apiClient";
import { LinkedChild } from "../../types/api";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { EmptyState } from "../ui/empty-state";
import { PageHeader } from "../ui/page-header";

type ChildrenResponse = { children: LinkedChild[] };

const formatLastSeen = (timestamp?: string | null) => {
  if (!timestamp) return "No location yet";
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 5) return "Online now";
  if (minutes < 60) return `Last seen ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `Last seen ${hours}h ago`;
};

const isOnline = (timestamp?: string | null) => {
  if (!timestamp) return false;
  return Date.now() - new Date(timestamp).getTime() < 5 * 60 * 1000;
};

export const ParentDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, error } = useSWR<ChildrenResponse>("/children", swrFetcher);

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading your linked children…</p>;
  }

  if (error) {
    return <p className="text-sm text-danger">Failed to load children: {error.message}</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${user?.name ?? "caregiver"}`}
        subtitle="Live snapshots of every linked child with a privacy-first approach."
        actions={
          <Link
            href="/links/manage"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5"
          >
            Manage links
          </Link>
        }
      />

      <Card variant="muted">
        <CardHeader className="flex items-center gap-4">
          <span className="rounded-full bg-brand/10 p-3 text-brand">
            <ShieldCheckIcon className="h-6 w-6" />
          </span>
          <div>
            <CardTitle className="text-2xl">Safety tip of the day</CardTitle>
            <CardDescription>
              Remind your child they can revoke access any time – SafeHome will notify you instantly so you can reconnect
              transparently.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {data?.children.length ? (
        <motion.div
          className="grid gap-5 md:grid-cols-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.08 },
            },
          }}
        >
          {data.children.map((child) => (
            <motion.div
              key={child.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Card className="h-full">
                <CardHeader className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-lg font-semibold text-brand">
                    {child.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <CardTitle>{child.name}</CardTitle>
                    <CardDescription>{child.email}</CardDescription>
                  </div>
                  <Badge variant={isOnline(child.lastLocation?.ts) ? "success" : "muted"}>
                    {isOnline(child.lastLocation?.ts) ? "Online" : "Offline"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <ClockIcon className="h-4 w-4" />
                    {formatLastSeen(child.lastLocation?.ts)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPinIcon className="h-4 w-4" />
                    {child.lastLocation ? (
                      <span>
                        Lat {child.lastLocation.lat.toFixed(3)}, Lng {child.lastLocation.lng.toFixed(3)}
                      </span>
                    ) : (
                      <span>Waiting for first ping</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge variant={child.consentGiven ? "brand" : "warning"}>
                      {child.consentGiven ? "Consent active" : "Awaiting consent"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <Link href={`/dashboard/${child.id}`} className="text-sm font-semibold text-brand hover:text-brand-dark">
                      View location →
                    </Link>
                    <Link href="/links/manage" className="text-sm text-slate-500 hover:text-brand">
                      Manage link
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          title="No linked children"
          description="Send a request from the Manage Links page once your child has created their SafeHome account."
          icon="👪"
          action={{
            label: "Send link request",
            onClick: () => {
              window.location.href = "/links/manage";
            },
          }}
        />
      )}
    </div>
  );
};


