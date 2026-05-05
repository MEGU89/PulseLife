"use client";

import { useEffect, useState } from "react";

import { EmptyState, LoadingView, PageSection, Panel, StatCard } from "@/components/app-ui";
import { RequestCard } from "@/components/data-cards";
import { RoleLayout } from "@/components/role-layout";
import { apiJson } from "@/lib/api";
import type { BloodRequest } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

export default function RecipientHistoryPage() {
  const { user, ready } = useRoleSession("recipient");
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const response = await apiJson<{ requests: BloodRequest[] }>("/request/all");
      const userId = user.id || user._id;
      setRequests((response.requests || []).filter((request) => request.requestedBy?._id === userId || request.recipientName === user.fullName));
      setLoading(false);
    };

    void load();
  }, [user]);

  if (!ready || !user) {
    return <LoadingView label="Loading recipient history..." />;
  }

  return (
    <RoleLayout
      role="recipient"
      userName={user.fullName}
      title="Recipient history"
      description="Look back at every request created from your recipient account and keep progress easy to follow."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Requests created" value={requests.length} helper="All requests associated with your account." />
        <StatCard label="Pending requests" value={requests.filter((request) => request.status === "Pending").length} helper="Requests still waiting for completion." />
        <StatCard label="Fulfilled requests" value={requests.filter((request) => request.status === "Fulfilled").length} helper="Requests that reached a completed outcome." />
      </div>

      <PageSection
        title="Request history"
        description="Open any card to check its status in more detail."
      >
        {loading ? (
          <Panel>Loading history...</Panel>
        ) : requests.length === 0 ? (
          <EmptyState title="No request history yet" description="Once you create a request, the full timeline will be tracked here." />
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <RequestCard key={request._id} request={request} actionHref={`/recipient/request-status/${request._id}`} actionLabel="View status" />
            ))}
          </div>
        )}
      </PageSection>
    </RoleLayout>
  );
}
