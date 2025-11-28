"use client";

import useSWR from "swr";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { PageHeader } from "../../components/ui/page-header";
import { apiFetch, swrFetcher } from "../../lib/apiClient";
import { useAuth } from "../../hooks/useAuth";

interface LinkResponse {
  links: Array<{
    _id: string;
    parentId: { _id: string; name: string; email: string };
  }>;
}

const MyPrivacyPage = () => {
  const { user, refreshUser } = useAuth();
  const { data, mutate } = useSWR<LinkResponse>("/links/child", swrFetcher);

  const toggleConsent = async () => {
    await apiFetch("/me/consent", {
      method: "POST",
      body: { consentGiven: !user?.consentGiven, consentTextVersion: "v1" },
    });
    await refreshUser();
  };

  const revoke = async (parentId: string) => {
    await apiFetch("/me/revoke-parent", { method: "POST", body: { parentId } });
    await mutate();
  };

  const deleteAccount = async () => {
    await apiFetch("/me/delete-account", { method: "POST" });
    await refreshUser();
  };

  if (user?.role !== "child") {
    return <p className="text-sm text-slate-500">Only child accounts can manage privacy here.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Privacy"
        title="Your data, your call"
        subtitle="Control consent, revoke parents, export data, or delete your account entirely."
      />

      <Card className="border-brand/20 bg-brand-muted">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Consent status</CardTitle>
            <p className="text-sm text-slate-600">
              Toggle anytime. When disabled, SafeHome stops new location updates immediately.
            </p>
          </div>
          <Badge variant={user?.consentGiven ? "brand" : "warning"}>
            {user?.consentGiven ? "Enabled" : "Disabled"}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={toggleConsent} variant={user?.consentGiven ? "danger" : "primary"}>
            {user?.consentGiven ? "Disable consent" : "Enable consent"}
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = "/links")}>
            Review pending parents
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linked parents</CardTitle>
          <p className="text-sm text-slate-500">Tap revoke to instantly remove their dashboard access.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.links.length ? (
            data.links.map((link) => (
              <div key={link._id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{link.parentId.name}</p>
                  <p className="text-sm text-slate-500">{link.parentId.email}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => revoke(link.parentId._id)}>
                  Revoke access
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No linked parents.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-danger bg-danger-light/60">
        <CardHeader>
          <CardTitle className="text-danger">Danger zone</CardTitle>
          <p className="text-sm text-danger">
            Deleting your account removes all linked parents and location history. This can’t be undone.
          </p>
        </CardHeader>
        <CardContent>
          <Button variant="danger" onClick={deleteAccount}>
            Delete my account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyPrivacyPage;


