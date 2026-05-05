"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, Clock3, MapPinned, RefreshCcw } from "lucide-react";

import { EmptyState, LoadingView, PageSection, Panel, StatCard } from "@/components/app-ui";
import { RequestCard, ScheduleCard } from "@/components/data-cards";
import { EmergencyMap, type MapPoint } from "@/components/emergency-map";
import { RoleLayout } from "@/components/role-layout";
import { apiJson, jsonBody } from "@/lib/api";
import { haversineKm, roundDistanceKm } from "@/lib/distance";
import { isActiveRequest } from "@/lib/request-state";
import { saveStoredSession } from "@/lib/session";
import type { BloodRequest, DonationSchedule } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

export default function DonorDashboardPage() {
  const { user, ready, setUser } = useRoleSession("donor");
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [schedules, setSchedules] = useState<DonationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [error, setError] = useState("");

  const withDistance = (requestList: BloodRequest[]) => {
    if (!user?.location?.latitude || !user.location.longitude) {
      return requestList;
    }

    const donorLatitude = user.location.latitude;
    const donorLongitude = user.location.longitude;

    return requestList.map((request) => {
      if (!request.location?.latitude || !request.location.longitude) {
        return { ...request, distanceKm: null };
      }

      return {
        ...request,
        distanceKm: roundDistanceKm(
          haversineKm(
            donorLatitude,
            donorLongitude,
            request.location.latitude,
            request.location.longitude,
          ),
        ),
      };
    });
  };

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const [requestData, scheduleData] = await Promise.all([
        apiJson<{ requests: BloodRequest[] }>("/request/all"),
        apiJson<{ schedules: DonationSchedule[] }>(`/schedule/donor/${user.id || user._id}`),
      ]);

      setRequests(withDistance((requestData.requests || []).filter(isActiveRequest)));
      setSchedules(scheduleData.schedules || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load donor dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [user]);

  const changeAvailability = (available: boolean) => {
    if (!user) return;

    setUpdatingAvailability(true);
    setError("");

    const submit = async (latitude?: number, longitude?: number) => {
      try {
        const response = await apiJson<{ donor: { available: boolean; location?: { latitude?: number; longitude?: number } } }>(
          "/donor/availability",
          {
            method: "POST",
            body: jsonBody({
              donorId: user.id || user._id,
              available,
              latitude,
              longitude,
            }),
          },
        );

        const nextUser = {
          ...user,
          available: response.donor.available,
          location: response.donor.location || user.location,
        };

        setUser(nextUser);
        saveStoredSession(nextUser);
      } catch (availabilityError) {
        setError(availabilityError instanceof Error ? availabilityError.message : "Unable to update availability.");
      } finally {
        setUpdatingAvailability(false);
      }
    };

    if (!available) {
      void submit();
      return;
    }

    if (!navigator.geolocation) {
      setError("Location sharing is not supported in this browser.");
      setUpdatingAvailability(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void submit(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setError("Location access is needed before you can appear as available.");
        setUpdatingAvailability(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  if (!ready || !user) {
    return <LoadingView label="Loading donor dashboard..." />;
  }

  const activeSchedules = schedules.filter((schedule) => {
    const status = schedule.status?.toLowerCase() || "";
    return status !== "completed" && status !== "rejected";
  });

  const mapPoints: MapPoint[] = [
    ...(user.location?.latitude && user.location?.longitude
      ? [
          {
            id: "donor-self",
            latitude: user.location.latitude,
            longitude: user.location.longitude,
            title: "Your shared location",
            subtitle: user.fullName,
            detail: user.available ? "Currently visible to hospitals" : "Location stored on your profile",
            tone: "sky" as const,
          },
        ]
      : []),
    ...requests
      .filter((request) => request.location?.latitude && request.location?.longitude)
      .slice(0, 15)
      .map((request) => ({
        id: request._id,
        latitude: request.location!.latitude!,
        longitude: request.location!.longitude!,
        title: request.hospitalName || request.hospital || "Hospital request",
        subtitle: `${request.bloodType || "Blood"} • ${request.unitsNeeded} units • ${request.urgency}`,
        detail: request.location?.address || request.address || "Request location",
        tone: "rose" as const,
      })),
  ];

  return (
    <RoleLayout
      role="donor"
      userName={user.fullName}
      title="Donor dashboard"
      description="Review active blood requests, update your availability, and manage donation schedules without extra clutter."
      actions={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => changeAvailability(!user.available)}
            disabled={updatingAvailability}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              user.available
                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : "bg-slate-950 text-white hover:bg-slate-800"
            }`}
          >
            {updatingAvailability ? "Updating..." : user.available ? "Pause availability" : "Share availability"}
          </button>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-700"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      }
    >
      {error && <Panel className="border-rose-200 bg-rose-50 text-sm font-medium text-rose-700">{error}</Panel>}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Open requests" value={requests.length} helper="Live requests currently visible to you." />
        <StatCard label="Upcoming schedules" value={activeSchedules.length} helper="Donation visits that still need attention." />
        <StatCard
          label="Availability"
          value={user.available ? "Active" : "Paused"}
          helper={user.available ? "Hospitals can currently see your response status." : "Turn it on when you are ready to help."}
        />
      </div>

      <PageSection
        title="Request map"
        description="Use the map to understand where active hospital requests are coming from around you."
      >
        {mapPoints.length === 0 ? (
          <EmptyState
            title="No mapped locations yet"
            description="Share your location and wait for requests with hospital coordinates to appear here."
          />
        ) : (
          <EmergencyMap
            points={mapPoints}
            center={
              user.location?.latitude && user.location?.longitude
                ? [user.location.latitude, user.location.longitude]
                : undefined
            }
            summary="Blue shows your own location. Red points show hospitals linked to active requests."
          />
        )}
      </PageSection>

      <PageSection
        title="What needs your attention"
        description="These are the newest requests from the platform."
        action={<Link href="/donor/requests" className="text-sm font-semibold text-rose-700">View full request list</Link>}
      >
        {loading ? (
          <Panel>Loading request feed...</Panel>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No requests are active right now"
            description="When a hospital or recipient creates a new emergency request, it will appear here."
          />
        ) : (
          <div className="grid gap-4">
            {requests.slice(0, 3).map((request) => (
              <RequestCard
                key={request._id}
                request={request}
                actionHref={`/donor/schedule-donation?requestId=${request._id}`}
                actionLabel="Schedule donation"
              />
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        title="Upcoming donation plans"
        description="Keep your next donation visit visible in one place."
        action={<Link href="/donor/history" className="text-sm font-semibold text-rose-700">Open full history</Link>}
      >
        {loading ? (
          <Panel>Loading schedule details...</Panel>
        ) : activeSchedules.length === 0 ? (
          <EmptyState
            title="No active schedules yet"
            description="Choose a request and book a donation slot when you are ready."
            action={<Link href="/donor/requests" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Browse requests</Link>}
          />
        ) : (
          <div className="grid gap-4">
            {activeSchedules.slice(0, 2).map((schedule) => (
              <ScheduleCard key={schedule._id} schedule={schedule} />
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        title="Quick actions"
        description="Shortcuts to the donor tools you are most likely to use."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Panel className="space-y-3">
            <BellRing className="h-6 w-6 text-rose-600" />
            <h3 className="text-xl font-black tracking-tight text-slate-950">Emergency requests</h3>
            <p className="text-sm leading-7 text-slate-600">See the full request list and choose where you want to help next.</p>
            <Link href="/donor/requests" className="text-sm font-semibold text-rose-700">Open requests</Link>
          </Panel>
          <Panel className="space-y-3">
            <Clock3 className="h-6 w-6 text-rose-600" />
            <h3 className="text-xl font-black tracking-tight text-slate-950">Donation history</h3>
            <p className="text-sm leading-7 text-slate-600">Review your completed donations and earlier schedule decisions.</p>
            <Link href="/donor/history" className="text-sm font-semibold text-rose-700">View history</Link>
          </Panel>
          <Panel className="space-y-3">
            <MapPinned className="h-6 w-6 text-rose-600" />
            <h3 className="text-xl font-black tracking-tight text-slate-950">Profile and location</h3>
            <p className="text-sm leading-7 text-slate-600">Keep contact details, blood type, and address information current.</p>
            <Link href="/donor/profile" className="text-sm font-semibold text-rose-700">Update profile</Link>
          </Panel>
        </div>
      </PageSection>
    </RoleLayout>
  );
}
