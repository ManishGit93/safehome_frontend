"use client";

import useSWR from "swr";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { PageHeader } from "../../components/ui/page-header";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, swrFetcher } from "../../lib/apiClient";

interface LinkResponse {
  links: Array<{
    _id: string;
    parentId: { _id: string; name: string; email: string };
  }>;
}

const ChildLinksPage = () => {
  const { user } = useAuth();
  const { data, mutate } = useSWR<LinkResponse>("/links/pending", swrFetcher);

  const respond = async (endpoint: "/links/accept" | "/links/decline", linkId: string) => {
    await apiFetch(endpoint, { method: "POST", body: { linkId } });
    await mutate();
  };

  if (user?.role !== "child") {
    return <p className="text-sm text-slate-500">Only child accounts can accept link requests.</p>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Requests"
        title="Pending link requests"
        subtitle="Approve only the parents you trust. They’ll be notified immediately."
      />
      <Card>
        <CardHeader>
          <CardTitle>Incoming requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.links.length ? (
            data.links.map((link) => (
              <div key={link._id} className="rounded-2xl border border-slate-100 p-4">
                <p className="font-semibold text-slate-900">{link.parentId.name}</p>
                <p className="text-sm text-slate-500">{link.parentId.email}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => respond("/links/accept", link._id)}>
                    Accept
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => respond("/links/decline", link._id)}>
                    Decline
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No pending requests.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChildLinksPage;


