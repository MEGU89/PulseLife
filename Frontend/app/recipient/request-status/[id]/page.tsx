"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState, LoadingView, PageSection, Panel, StatusBadge } from "@/components/app-ui";
import { RequestCard } from "@/components/data-cards";
import { RoleLayout } from "@/components/role-layout";
import { apiJson } from "@/lib/api";
import { titleCase } from "@/lib/format";
import {
  getRequestPrimaryStatus,
  shouldShowRequestConfirmationBadge,
} from "@/lib/request-state";
import type { BloodRequest } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

export default function RequestStatusPage() {
  const params = useParams<{ id: string }>();
  const { user, ready } = useRoleSession("recipient");
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const response = await apiJson<{ requests: BloodRequest[] }>("/request/all");
      setRequest((response.requests || []).find((item) => item._id === params.id) || null);
      setLoading(false);
    };

    if (user) {
      void load();
    }
  }, [params.id, user]);

  if (!ready || !user) {
    return <LoadingView label="Loading request status..." />;
  }

  return (
    <RoleLayout
      role="recipient"
      userName={user.fullName}
      title="Request status"
      description="This page narrows the view down to a single request so its progress is easier to read."
    >
      <PageSection
        title="Status snapshot"
        description="Follow this request from creation through hospital confirmation and final fulfilment."
      >
        {loading ? (
          <Panel>Loading request status...</Panel>
        ) : !request ? (
          <EmptyState
            title="Request not found"
            description="Return to your request history and choose another request."
            action={<Link href="/recipient/history" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Back to history</Link>}
          />
        ) : (
          <div className="space-y-4">
            <RequestCard request={request} />
            <Panel className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const primaryStatus = getRequestPrimaryStatus(request);
                  const primaryTone =
                    primaryStatus.toLowerCase().includes("fulfilled") ||
                    primaryStatus.toLowerCase().includes("confirmed")
                      ? "success"
                      : primaryStatus.toLowerCase().includes("reject")
                        ? "danger"
                        : "warning";

                  return (
                    <StatusBadge
                      value={titleCase(primaryStatus)}
                      tone={primaryTone}
                    />
                  );
                })()}
                {shouldShowRequestConfirmationBadge(request) && request.confirmationStatus && (
                  <StatusBadge
                    value={titleCase(request.confirmationStatus)}
                    tone={
                      request.confirmationStatus === "Confirmed"
                        ? "success"
                        : request.confirmationStatus === "Rejected"
                          ? "danger"
                          : "warning"
                    }
                  />
                )}
              </div>
              <p className="text-sm leading-7 text-slate-600">
                {request.confirmationNotes
                  ? request.confirmationNotes
                  : "No extra confirmation notes have been added for this request yet."}
              </p>
            </Panel>
          </div>
        )}
      </PageSection>
    </RoleLayout>
  );
}
