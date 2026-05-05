"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { EmptyState, LoadingView, PageSection, Panel, StatCard } from "@/components/app-ui";
import { RequestCard } from "@/components/data-cards";
import { EmergencyMap, type MapPoint } from "@/components/emergency-map";
import { RoleLayout } from "@/components/role-layout";
import { apiJson } from "@/lib/api";
import { isActiveRequest } from "@/lib/request-state";
import type { BloodRequest } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

type HospitalOption = {
  id: string;
  hospitalName: string;
  address?: string;
  phone?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
};

export default function RecipientDashboardPage() {
  const { user, ready } = useRoleSession("recipient");
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const [requestResponse, hospitalResponse] = await Promise.all([
        apiJson<{ requests: BloodRequest[] }>("/request/all"),
        apiJson<{ hospitals: HospitalOption[] }>("/hospital/all"),
      ]);

      const userId = user.id || user._id;
      const ownRequests = (requestResponse.requests || []).filter(
        (request) => (request.requestedBy?._id === userId || request.recipientName === user.fullName) && isActiveRequest(request),
      );

      setRequests(ownRequests);
      setHospitals(hospitalResponse.hospitals || []);
      setLoading(false);
    };

    void load();
  }, [user]);

  if (!ready || !user) {
    return <LoadingView label="Loading recipient dashboard..." />;
  }

  const pendingRequests = requests.filter((request) => request.status === "Pending").length;
  const confirmedRequests = requests.filter((request) => request.confirmationStatus === "Confirmed").length;
  const mapPoints: MapPoint[] = [
    ...hospitals
      .filter((hospital) => hospital.location?.latitude && hospital.location?.longitude)
      .map((hospital) => ({
        id: `hospital-${hospital.id}`,
        latitude: hospital.location!.latitude!,
        longitude: hospital.location!.longitude!,
        title: hospital.hospitalName,
        subtitle: hospital.phone || "Hospital",
        detail: hospital.address || hospital.location?.address || "Registered hospital location",
        tone: "amber" as const,
      })),
    ...requests
      .filter((request) => request.location?.latitude && request.location?.longitude)
      .map((request) => ({
        id: `request-${request._id}`,
        latitude: request.location!.latitude!,
        longitude: request.location!.longitude!,
        title: request.hospitalName || request.hospital || "Recipient request",
        subtitle: `${request.bloodType || "Blood"} • ${request.unitsNeeded} units • ${request.status}`,
        detail: request.location?.address || request.address || "Request-linked location",
        tone: "rose" as const,
      })),
  ];

  return (
    <RoleLayout
      role="recipient"
      userName={user.fullName}
      title="Recipient dashboard"
      description="Track the requests you have created, see where they stand, and move to the next step without extra noise."
      actions={<Link href="/recipient/create-request" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">Create request</Link>}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Active requests" value={requests.length} helper="Requests still active on your dashboard." />
        <StatCard label="Pending now" value={pendingRequests} helper="Requests still waiting for fulfilment." />
        <StatCard label="Confirmed" value={confirmedRequests} helper="Requests where a donor has already confirmed." />
      </div>

      <PageSection
        title="Hospitals and request map"
        description="Use the map to understand where nearby hospitals are and where your tracked requests are connected."
      >
        {mapPoints.length === 0 ? (
          <EmptyState
            title="No mapped hospitals yet"
            description="Once hospitals with saved locations are available, they will appear here."
          />
        ) : (
          <EmergencyMap
            points={mapPoints}
            summary="Amber points show hospitals and red points show the locations attached to your requests."
          />
        )}
      </PageSection>

      <PageSection
        title="Your active requests"
        description="Only active requests stay on the dashboard. Completed requests move to history."
        action={<Link href="/recipient/history" className="text-sm font-semibold text-rose-700">Open request history</Link>}
      >
        {loading ? (
          <Panel>Loading recipient requests...</Panel>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No requests created yet"
            description="Create a request when you need hospital support and status tracking."
            action={<Link href="/recipient/create-request" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Create request</Link>}
          />
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <RequestCard
                key={request._id}
                request={request}
                actionHref={`/recipient/request-status/${request._id}`}
                actionLabel="Open status view"
              />
            ))}
          </div>
        )}
      </PageSection>
    </RoleLayout>
  );
}
