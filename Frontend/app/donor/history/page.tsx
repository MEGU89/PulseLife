"use client";

import { useEffect, useState } from "react";

import { EmptyState, LoadingView, PageSection, Panel, StatCard } from "@/components/app-ui";
import { ScheduleCard } from "@/components/data-cards";
import { RoleLayout } from "@/components/role-layout";
import { apiJson } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { DonationSchedule } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

type DonationRecord = {
  _id: string;
  units: number;
  date: string;
  location?: string;
};

export default function DonorHistoryPage() {
  const { user, ready } = useRoleSession("donor");
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [schedules, setSchedules] = useState<DonationSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      try {
        const [donationData, scheduleData] = await Promise.all([
          apiJson<{ donations: DonationRecord[] }>(`/donor/history/${user.id || user._id}`),
          apiJson<{ history: DonationSchedule[] }>(`/donor/schedules/${user.id || user._id}`),
        ]);

        setDonations(donationData.donations || []);
        setSchedules(scheduleData.history || []);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user]);

  if (!ready || !user) {
    return <LoadingView label="Loading donor history..." />;
  }

  return (
    <RoleLayout
      role="donor"
      userName={user.fullName}
      title="Donation history"
      description="Review your completed donations and previous schedule decisions in one clean timeline."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Completed donations" value={donations.length} helper="Recorded after hospital completion." />
        <StatCard label="All schedules" value={schedules.length} helper="Every accepted, rejected, or pending schedule." />
        <StatCard label="Total units helped" value={donations.reduce((total, donation) => total + (donation.units || 0), 0)} helper="Combined units across recorded donations." />
      </div>

      <PageSection
        title="Donation records"
        description="These entries were created when a donation was marked complete."
      >
        {loading ? (
          <Panel>Loading donation records...</Panel>
        ) : donations.length === 0 ? (
          <EmptyState
            title="No completed donations yet"
            description="Once a hospital completes a donation schedule, the record will appear here."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {donations.map((donation) => (
              <Panel key={donation._id} className="space-y-3">
                <h3 className="text-xl font-black tracking-tight text-slate-950">{donation.units} units contributed</h3>
                <p className="text-sm text-slate-600">Donation date: {formatDate(donation.date)}</p>
                {donation.location && <p className="text-sm text-slate-600">Location: {donation.location}</p>}
              </Panel>
            ))}
          </div>
        )}
      </PageSection>

      <PageSection
        title="Schedule timeline"
        description="This timeline keeps your earlier schedule outcomes visible."
      >
        {loading ? (
          <Panel>Loading schedule timeline...</Panel>
        ) : schedules.length === 0 ? (
          <EmptyState
            title="No schedule history yet"
            description="Create a schedule from the request feed and it will appear here."
          />
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
