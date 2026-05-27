"use client";

import { useEffect, useState } from "react";

import { LoadingView, PageSection, Panel, StatCard } from "@/components/app-ui";
import { RoleLayout } from "@/components/role-layout";
import { apiJson } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { DonationSchedule } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

type DonationRecord = {
  _id: string;
  units: number;
};

type DonationPolicySummary = {
  nextEligibleDate?: string | null;
  annualDonationCount?: number;
  annualDonationLimit?: number;
  annualDonationRemaining?: number;
  nextAnnualEligibleDate?: string | null;
};

export default function DonorStatsPage() {
  const { user, ready } = useRoleSession("donor");
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [schedules, setSchedules] = useState<DonationSchedule[]>([]);
  const [policy, setPolicy] = useState<DonationPolicySummary | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const [donationData, scheduleData, policyData] = await Promise.all([
        apiJson<{ donations: DonationRecord[] }>(`/donor/history/${user.id || user._id}`),
        apiJson<{ schedules: DonationSchedule[] }>(`/schedule/donor/${user.id || user._id}`),
        apiJson<DonationPolicySummary>(`/donor/last-donation/${user.id || user._id}`),
      ]);

      setDonations(donationData.donations || []);
      setSchedules(scheduleData.schedules || []);
      setPolicy(policyData);
    };

    void load();
  }, [user]);

  if (!ready || !user) {
    return <LoadingView label="Loading donor stats..." />;
  }

  const totalUnits = donations.reduce((total, donation) => total + (donation.units || 0), 0);
  const acceptedSchedules = schedules.filter((schedule) => schedule.status === "accepted").length;
  const completedSchedules = schedules.filter((schedule) => schedule.status === "completed").length;
  const activePriorityAppointment = (user.perks || []).find(
    (perk) => perk.type === "priority_appointment" && perk.status === "available"
  );

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
        <StatCard label="Yearly donations" value={`${policy?.annualDonationCount || 0}/${policy?.annualDonationLimit || 0}`} helper="Rolling one-year donation count." />
        <StatCard label="Remaining this year" value={policy?.annualDonationRemaining ?? "0"} helper="How many more donations you can complete in the current rolling year." />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Accepted schedules" value={acceptedSchedules} helper="Schedules approved by hospitals." />
        <StatCard label="Completed schedules" value={completedSchedules} helper="Schedules fully closed out." />
        <StatCard label="Next eligible date" value={formatDate(policy?.nextEligibleDate)} helper="56-day cooling period after your last donation." />
        <StatCard label="Priority appointment" value={activePriorityAppointment ? "Active" : "Inactive"} helper={activePriorityAppointment ? `Valid until ${formatDate(activePriorityAppointment.expiryDate)}` : "Unlocks after your third donation in one year."} />
      </div>

      <PageSection
        title="What these numbers mean"
        description="This page now combines contribution counts with the donor rules that control cooldowns, yearly limits, and reward access."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Panel>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Cooling period and yearly cap</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Whole blood donations follow a 56-day cooling period. Your yearly donation cap also follows a rolling
              one-year window, and the next annual opening date is {formatDate(policy?.nextAnnualEligibleDate)}.
            </p>
          </Panel>
          <Panel>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Perk progression</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Every successful donation unlocks a basic health checkup, while higher yearly donation counts unlock
              appointment priority, blood-test perks, and premium donor benefits.
            </p>
          </Panel>
        </div>
      </PageSection>
    </RoleLayout>
  );
}
