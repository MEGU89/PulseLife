"use client";

import { useEffect, useState } from "react";

import { EmptyState, LoadingView, PageSection, Panel, StatCard } from "@/components/app-ui";
import { RequestCard, ScheduleCard } from "@/components/data-cards";
import { RoleLayout } from "@/components/role-layout";
import { apiJson } from "@/lib/api";
import type { BloodRequest, DonationSchedule } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

export default function HospitalHistoryPage() {
  const { user, ready } = useRoleSession("hospital");
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [schedules, setSchedules] = useState<DonationSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const [requestData, scheduleData] = await Promise.all([
        apiJson<{ requests: BloodRequest[] }>("/request/all"),
        apiJson<{ schedules: DonationSchedule[] }>(`/hospital/schedules/${encodeURIComponent(user.fullName)}`),
      ]);

      const ownRequests = (requestData.requests || []).filter((request) => {
        const userId = user.id || user._id;
        return request.requestedBy?._id === userId || request.hospital === user.fullName || request.hospitalName === user.fullName;
      });

      setRequests(ownRequests);
      setSchedules(scheduleData.schedules || []);
      setLoading(false);
    };

    void load();
  }, [user]);

  if (!ready || !user) {
    return <LoadingView label="Loading hospital history..." />;
  }

  const fulfilledRequests = requests.filter((request) => request.status === "Fulfilled");

  return (
    <RoleLayout
      role="hospital"
      userName={user.fullName}
      title="Hospital history"
      description="Use this page to review your past requests and the donor schedules connected to them."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total requests" value={requests.length} helper="All requests linked to your hospital." />
        <StatCard label="Fulfilled requests" value={fulfilledRequests.length} helper="Requests that reached a completed outcome." />
        <StatCard label="Schedules received" value={schedules.length} helper="Donor schedules submitted to your hospital." />
      </div>

      <PageSection title="Request records" description="Each request keeps its status, urgency, and current confirmation state visible.">
        {loading ? (
          <Panel>Loading request records...</Panel>
        ) : requests.length === 0 ? (
          <EmptyState title="No hospital requests found" description="Create a request first and the history will start building here." />
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <RequestCard key={request._id} request={request} />
            ))}
          </div>
        )}
      </PageSection>

      <PageSection title="Schedule records" description="Review donor schedules even after they have been accepted, rejected, or completed.">
        {loading ? (
          <Panel>Loading schedule records...</Panel>
        ) : schedules.length === 0 ? (
          <EmptyState title="No schedules found" description="Schedules will appear here after donors begin responding to your requests." />
        ) : (
          <div className="grid gap-4">
            {schedules.map((schedule) => (
              <ScheduleCard key={schedule._id} schedule={schedule} />
            ))}
          </div>
        )}
      </PageSection>
    </RoleLayout>
  );
}
