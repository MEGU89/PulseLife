"use client";

import { useEffect, useState } from "react";

import { LoadingView, PageSection, Panel, StatCard } from "@/components/app-ui";
import { RoleLayout } from "@/components/role-layout";
import { apiJson } from "@/lib/api";
import type { DonationSchedule } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

type DonationRecord = {
  _id: string;
  units: number;
};

export default function DonorStatsPage() {
  const { user, ready } = useRoleSession("donor");
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [schedules, setSchedules] = useState<DonationSchedule[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const [donationData, scheduleData] = await Promise.all([
        apiJson<{ donations: DonationRecord[] }>(`/donor/history/${user.id || user._id}`),
        apiJson<{ schedules: DonationSchedule[] }>(`/schedule/donor/${user.id || user._id}`),
      ]);

      setDonations(donationData.donations || []);
      setSchedules(scheduleData.schedules || []);
    };

    void load();
  }, [user]);

  if (!ready || !user) {
    return <LoadingView label="Loading donor stats..." />;
  }

  const totalUnits = donations.reduce((total, donation) => total + (donation.units || 0), 0);
  const acceptedSchedules = schedules.filter((schedule) => schedule.status === "accepted").length;
  const completedSchedules = schedules.filter((schedule) => schedule.status === "completed").length;

  return (
    <RoleLayout
      role="donor"
      userName={user.fullName}
      title="Donor stats"
      description="A quick summary of how often you have helped and how your scheduling activity is progressing."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Recorded donations" value={donations.length} helper="Completed donations only." />
        <StatCard label="Total units helped" value={totalUnits} helper="Combined contribution across records." />
        <StatCard label="Accepted schedules" value={acceptedSchedules} helper="Schedules approved by hospitals." />
        <StatCard label="Completed schedules" value={completedSchedules} helper="Schedules fully closed out." />
      </div>

      <PageSection
        title="What these numbers mean"
        description="This page is intentionally simple so you can understand your contribution without digging through tables."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Panel>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Contribution summary</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Your dashboard tracks completed donations separately from schedules. That keeps the difference between
              offers to help and actual finished donations easier to understand.
            </p>
          </Panel>
          <Panel>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Why it matters</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Hospitals and recipients benefit from clear donor availability, while donors benefit from a readable record
              of what has already been completed and what still needs action.
            </p>
          </Panel>
        </div>
      </PageSection>
    </RoleLayout>
  );
}
