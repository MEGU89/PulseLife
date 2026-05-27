"use client";

import { useEffect, useState } from "react";

import { EmptyState, LoadingView, PageSection, Panel } from "@/components/app-ui";
import { RequestCard } from "@/components/data-cards";
import { RoleLayout } from "@/components/role-layout";
import { apiJson } from "@/lib/api";
import { haversineKm, roundDistanceKm } from "@/lib/distance";
import { canDonorScheduleRequest, isOpenRequestForDonors } from "@/lib/request-state";
import type { BloodRequest } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

export default function DonorRequestsPage() {
  const { user, ready } = useRoleSession("donor");
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiJson<{ requests: BloodRequest[] }>("/request/all");
        const requestList = (response.requests || []).filter(isOpenRequestForDonors).map((request) => {
          if (
            !user?.location?.latitude ||
            !user.location.longitude ||
            !request.location?.latitude ||
            !request.location.longitude
          ) {
            return { ...request, distanceKm: null };
          }

          return {
            ...request,
            distanceKm: roundDistanceKm(
              haversineKm(
                user.location.latitude,
                user.location.longitude,
                request.location.latitude,
                request.location.longitude,
              ),
            ),
          };
        });

        setRequests(requestList);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load requests.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      void load();
    }
  }, [user]);

  if (!ready || !user) {
    return <LoadingView label="Loading request list..." />;
  }

  return (
    <RoleLayout
      role="donor"
      userName={user.fullName}
      title="Emergency requests"
      description="Use this page to scan all active requests before deciding whether you can schedule a donation."
    >
      <PageSection
        title="Request feed"
        description="Each card shows urgency, units needed, contact details, and whether the request can move into scheduling."
      >
        {loading ? (
          <Panel>Loading requests...</Panel>
        ) : error ? (
          <Panel className="border-rose-200 bg-rose-50 text-sm font-medium text-rose-700">{error}</Panel>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No active requests found"
            description="Check back later or refresh the dashboard when new requests are created."
          />
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <RequestCard
                key={request._id}
                request={request}
                actionHref={
                  canDonorScheduleRequest(request) ? `/donor/schedule-donation?requestId=${request._id}` : undefined
                }
                actionLabel={canDonorScheduleRequest(request) ? "Schedule for this request" : undefined}
              >
                {request.requestType === "organ" && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    This organ request is visible to donors for awareness, but scheduling is currently available for blood requests only.
                  </div>
                )}
              </RequestCard>
            ))}
          </div>
        )}
      </PageSection>
    </RoleLayout>
  );
}
