"use client";

import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import useSWR from "swr";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { FormField, helperInputClass } from "../../../components/ui/form-field";
import { PageHeader } from "../../../components/ui/page-header";
import { useAuth } from "../../../hooks/useAuth";
import { apiFetch, swrFetcher } from "../../../lib/apiClient";

interface ManageResponse {
  links: Array<{
    _id: string;
    childId: { _id: string; name: string; email: string };
    status: string;
  }>;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "ACCEPTED":
      return "brand";
    case "PENDING":
      return "warning";
    case "DECLINED":
    case "REVOKED":
      return "danger";
    default:
      return "muted";
  }
};

const ManageLinksPage = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const { data, error, mutate } = useSWR<ManageResponse>("/links", swrFetcher, {
    // Don't retry on 500 errors
    onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
      const errorMessage = error.message || String(error);
      if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) return;
      if (retryCount >= 3) return;
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
  });
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await apiFetch("/links/request", { method: "POST", body: { childEmail: email } });
    setEmail("");
    setMessage("Request sent. Waiting for your child’s approval.");
    await mutate();
  };

  if (user?.role !== "parent") {
    return <p className="text-sm text-slate-500">Only parents can manage link requests.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Links"
        title="Invite your child"
        subtitle="Each request stays pending until your child accepts inside their SafeHome account."
      />

      <Card>
        <CardHeader className="flex items-center gap-3">
          <EnvelopeIcon className="h-6 w-6 text-brand" />
          <div>
            <CardTitle>Send a new request</CardTitle>
            <p className="text-sm text-slate-500">Use the email they used to sign up as a child.</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <FormField label="Child email">
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="child@example.com"
                className={helperInputClass}
              />
            </FormField>
            {message && <p className="rounded-xl bg-brand-muted px-3 py-2 text-sm text-brand-dark">{message}</p>}
            <Button type="submit" size="lg" className="w-full">
              Send request
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current link statuses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-900">Unable to load links</p>
              <p className="text-xs text-amber-700 mt-1">
                {error.message || "An error occurred. This might be because you haven't sent any link requests yet."}
              </p>
            </div>
          ) : data?.links && data.links.length > 0 ? (
            data.links
              .filter((link) => link != null && link.childId != null) // Filter out null links
              .map((link) => (
                <div key={link._id} className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                  <div>
                    <p className="font-semibold text-slate-900">{link.childId?.name || "Unknown"}</p>
                    <p className="text-sm text-slate-500">{link.childId?.email || "No email"}</p>
                  </div>
                  <Badge variant={statusVariant(link.status)}>{link.status}</Badge>
                </div>
              ))
          ) : (
            <p className="text-sm text-slate-500">You haven't sent any requests yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageLinksPage;


