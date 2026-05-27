"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, FilePlus2, RefreshCcw, UsersRound } from "lucide-react";

import { EmptyState, LoadingView, PageSection, Panel, StatCard } from "@/components/app-ui";
import { RequestCard, ScheduleCard } from "@/components/data-cards";
import { EmergencyMap, type MapPoint } from "@/components/emergency-map";
import { RoleLayout } from "@/components/role-layout";
import { apiJson, jsonBody } from "@/lib/api";
import { getRequestMapSummary } from "@/lib/request-display";
import { isOpenRequestForMatching } from "@/lib/request-state";
import type { BloodRequest, DonationSchedule } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

type ActiveDonor = {
  _id: string;
  fullName: string;
  bloodType?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

type HospitalDashboardStats = {
  donorsNearby: number;
  avgMatchTime: number;
  totalSchedules: number;
  pendingSchedules: number;
  completedDonations: number;
  fulfilledRequests: number;
};

export default function HospitalDashboardPage() {
  const { user, ready } = useRoleSession("hospital");
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [schedules, setSchedules] = useState<DonationSchedule[]>([]);
  const [activeDonors, setActiveDonors] = useState<ActiveDonor[]>([]);
  const [stats, setStats] = useState<HospitalDashboardStats>({
    donorsNearby: 0,
    avgMatchTime: 0,
    totalSchedules: 0,
    pendingSchedules: 0,
    completedDonations: 0,
    fulfilledRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const [requestData, scheduleData, statsData, donorData] = await Promise.all([
        apiJson<{ requests: BloodRequest[] }>("/request/all"),
        apiJson<{ schedules: DonationSchedule[] }>(`/hospital/schedules/${encodeURIComponent(user.fullName)}`),
        apiJson<HospitalDashboardStats>(`/hospital/stats?hospitalName=${encodeURIComponent(user.fullName)}`),
        apiJson<{ donors: ActiveDonor[] }>("/hospital/active-donors"),
      ]);

      const ownRequests = (requestData.requests || []).filter((request) => {
        const requestOwner = request.requestedBy?._id;
        const userId = user.id || user._id;
        return (
          (requestOwner === userId || request.hospital === user.fullName || request.hospitalName === user.fullName) &&
          isOpenRequestForMatching(request)
        );
      });

      setRequests(ownRequests);
      setSchedules(scheduleData.schedules || []);
      setActiveDonors(donorData.donors || []);
      setStats({
        donorsNearby: statsData.donorsNearby || 0,
        avgMatchTime: statsData.avgMatchTime || 0,
        totalSchedules: statsData.totalSchedules || 0,
        pendingSchedules: statsData.pendingSchedules || 0,
        completedDonations: statsData.completedDonations || 0,
        fulfilledRequests: statsData.fulfilledRequests || 0,
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load hospital dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, [user]);

  const updateRecipientRequest = async (requestId: string, action: "Confirmed" | "Rejected") => {
    if (!user) return;

    setError("");
    setMessage("");

    try {
      await apiJson(`/request/${requestId}/confirm`, {
        method: "POST",
        body: jsonBody({
          action,
          hospitalId: user.id || user._id,
        }),
      });

      setMessage(`Recipient request ${action.toLowerCase()} by hospital.`);
      await loadDashboard();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update recipient request.");
    }
  };

  if (!ready || !user) {
    return <LoadingView label="Loading hospital dashboard..." />;
  }

  const activeSchedules = schedules.filter((schedule) => {
    const status = schedule.status?.toLowerCase() || "";
    return status === "pending" || status === "accepted";
  });

  const mapPoints: MapPoint[] = [
    ...(user.location?.latitude && user.location?.longitude
      ? [
          {
            id: "hospital-self",
            latitude: user.location.latitude,
            longitude: user.location.longitude,
            title: user.fullName,
            subtitle: "Your hospital location",
            detail: user.address || "Hospital profile location",
            tone: "sky" as const,
          },
        ]
      : []),
    ...requests
      .filter((request) => request.location?.latitude && request.location?.longitude)
      .map((request) => ({
        id: `request-${request._id}`,
        latitude: request.location!.latitude!,
        longitude: request.location!.longitude!,
        title: request.hospitalName || request.hospital || "Hospital request",
        subtitle: getRequestMapSummary(request),
        detail: request.location?.address || request.address || "Request location",
        tone: "rose" as const,
      })),
    ...activeDonors
      .filter((donor) => donor.location?.latitude && donor.location?.longitude)
      .slice(0, 30)
      .map((donor) => ({
        id: `donor-${donor._id}`,
        latitude: donor.location!.latitude!,
        longitude: donor.location!.longitude!,
        title: donor.fullName,
        subtitle: donor.bloodType ? `${donor.bloodType} donor` : "Available donor",
        detail: "Currently marked available",
        tone: "emerald" as const,
      })),
  ];

  return (
    <RoleLayout
      role="hospital"
      userName={user.fullName}
      title="Hospital dashboard"
      description="Create urgent blood or organ requests, review donor schedules, and keep hospital demand visible with a clearer workspace."
      actions={
        <div className="flex flex-wrap gap-3">
          <Link href="/hospital/add-request" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            <FilePlus2 className="h-4 w-4" />
            Add request
          </Link>
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
      {message && <Panel className="bg-slate-50 text-sm text-slate-600">{message}</Panel>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Your open requests" value={requests.length} helper="Requests tied to your hospital workspace." />
        <StatCard label="Pending donor requests" value={stats.pendingSchedules} helper="Schedules waiting for review or final completion." />
        <StatCard label="Completed donations" value={stats.completedDonations} helper="Hospital-confirmed donations finished successfully." />
        <StatCard label="Fulfilled requests" value={stats.fulfilledRequests} helper="Requests closed after successful donation completion." />
        <StatCard label="Average match time" value={`${stats.avgMatchTime} min`} helper="Calculated from request to schedule creation." />
      </div>

      <PageSection
        title="Live donor and request map"
        description="Watch your hospital location, incoming request points, and donors currently marked available."
      >
        {mapPoints.length === 0 ? (
          <EmptyState
            title="No map data available yet"
            description="Add your hospital location and wait for donors or requests with coordinates to appear here."
          />
        ) : (
          <EmergencyMap
            points={mapPoints}
            center={
              user.location?.latitude && user.location?.longitude
                ? [user.location.latitude, user.location.longitude]
                : undefined
            }
            summary="Blue marks your hospital, red marks request locations, and green marks available donors."
          />
        )}
      </PageSection>

      <PageSection
        title="Current hospital requests"
        description="These are the requests currently associated with your hospital account."
        action={<Link href="/hospital/history" className="text-sm font-semibold text-rose-700">See request history</Link>}
      >
        {loading ? (
          <Panel>Loading requests...</Panel>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No requests created yet"
            description="Create your first blood or organ request so your hospital team can start tracking it."
            action={<Link href="/hospital/add-request" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Create request</Link>}
          />
        ) : (
          <div className="grid gap-4">
            {requests.slice(0, 3).map((request) => (
              <RequestCard key={request._id} request={request}>
                {request.isRecipientRequest && request.confirmationStatus === "Pending" && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => void updateRecipientRequest(request._id, "Confirmed")}
                      className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                    >
                      Confirm for recipient
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateRecipientRequest(request._id, "Rejected")}
                      className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                    >
                      Reject request
                    </button>
                  </div>
                )}
              </RequestCard>
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        title="Donor requests and schedules"
        description="Every donor schedule sent to your hospital appears here for review, approval, and final completion."
        action={<Link href="/hospital/schedules" className="text-sm font-semibold text-rose-700">Manage schedules</Link>}
      >
        {loading ? (
          <Panel>Loading schedules...</Panel>
        ) : activeSchedules.length === 0 ? (
          <EmptyState
            title="No active donor schedules"
            description="Pending or accepted donor schedules will appear here until the scheduled time is completed."
          />
        ) : (
          <div className="grid gap-4">
            {activeSchedules.slice(0, 3).map((schedule) => (
              <ScheduleCard key={schedule._id} schedule={schedule} />
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        title="Hospital shortcuts"
        description="Common tools for request creation, schedule review, and donor awareness."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Panel className="space-y-3">
            <FilePlus2 className="h-6 w-6 text-rose-600" />
            <h3 className="text-xl font-black tracking-tight text-slate-950">Create request</h3>
            <p className="text-sm leading-7 text-slate-600">Add a clean emergency blood or organ request with the right urgency and quantity details.</p>
            <Link href="/hospital/add-request" className="text-sm font-semibold text-rose-700">Open form</Link>
          </Panel>
          <Panel className="space-y-3">
            <Activity className="h-6 w-6 text-rose-600" />
            <h3 className="text-xl font-black tracking-tight text-slate-950">Manage schedules</h3>
            <p className="text-sm leading-7 text-slate-600">Accept, reject, or complete donor schedules using a smaller and clearer review flow.</p>
            <Link href="/hospital/schedules" className="text-sm font-semibold text-rose-700">Open schedules</Link>
          </Panel>
          <Panel className="space-y-3">
            <UsersRound className="h-6 w-6 text-rose-600" />
            <h3 className="text-xl font-black tracking-tight text-slate-950">Profile and location</h3>
            <p className="text-sm leading-7 text-slate-600">Keep hospital identity and address current so donors receive trustworthy details.</p>
            <Link href="/hospital/profile" className="text-sm font-semibold text-rose-700">Update profile</Link>
          </Panel>
        </div>
      </PageSection>
    </RoleLayout>
  );
}
