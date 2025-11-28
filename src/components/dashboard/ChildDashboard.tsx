"use client";

import { ArrowDownTrayIcon, CheckBadgeIcon, EnvelopeOpenIcon } from "@heroicons/react/24/outline";
import useSWR from "swr";
import { apiFetch, swrFetcher } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useAuth";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { PageHeader } from "../ui/page-header";

interface LinkResponse {
  links: Array<{
    _id: string;
    parentId: { _id: string; name: string; email: string };
    status: string;
  }>;
}

export const ChildDashboard = () => {
  const { user } = useAuth();
  const acceptedQuery = useSWR<LinkResponse>("/links/child", swrFetcher);
  const pendingQuery = useSWR<LinkResponse>("/links/pending", swrFetcher);

  const respondToLink = async (endpoint: "/links/accept" | "/links/decline", linkId: string) => {
    await apiFetch(endpoint, { method: "POST", body: { linkId } });
    await Promise.all([acceptedQuery.mutate(), pendingQuery.mutate()]);
  };

  const handleExport = async () => {
    const payload = await apiFetch<string>("/me/export", { method: "POST" });
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "safehome-export.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My space"
        title={`Hi ${user?.name ?? ""}, you're in control`}
        subtitle="You decide who can see your location and for how long."
      />

      <Card className="border-brand/10 bg-gradient-to-r from-brand-muted to-white">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckBadgeIcon className="h-4 w-4 text-brand" />
              Consent status
            </div>
            <CardTitle>{user?.consentGiven ? "Consent active" : "Awaiting approval"}</CardTitle>
            <CardDescription>
              {user?.consentGiven
                ? `Granted on ${user.consentAt ? new Date(user.consentAt).toLocaleString() : "—"}`
                : "Review the privacy notice above to enable tracking."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="sm" onClick={handleExport} icon={<ArrowDownTrayIcon className="h-4 w-4" />}>
              Export my data
            </Button>
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/my-privacy")}>
              Privacy controls
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Linked parents</CardTitle>
            <CardDescription>Only the parents you approve will see your updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {acceptedQuery.data?.links.length ? (
              acceptedQuery.data.links.map((link) => (
                <div key={link._id} className="rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{link.parentId.name}</p>
                      <p className="text-sm text-slate-500">{link.parentId.email}</p>
                    </div>
                    <Badge>Approved</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No approved parents yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <EnvelopeOpenIcon className="h-5 w-5 text-accent" />
              <div>
                <CardTitle>Pending requests</CardTitle>
                <CardDescription>Accept when you’re ready, or decline if you don’t recognize them.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingQuery.data?.links.length ? (
              pendingQuery.data.links.map((link) => (
                <div key={link._id} className="rounded-2xl border border-slate-100 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{link.parentId.name}</p>
                    <p className="text-sm text-slate-500">{link.parentId.email}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => respondToLink("/links/accept", link._id)}>
                      Accept
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => respondToLink("/links/decline", link._id)}>
                      Decline
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No pending requests right now.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


