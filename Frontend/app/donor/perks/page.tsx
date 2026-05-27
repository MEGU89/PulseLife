"use client";

import { useEffect, useState } from "react";

import { EmptyState, LoadingView, PageSection, Panel, StatCard, StatusBadge } from "@/components/app-ui";
import { RoleLayout } from "@/components/role-layout";
import { apiJson } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { saveStoredSession } from "@/lib/session";
import type { AppUser } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

type DonationPolicySummary = {
  nextEligibleDate?: string | null;
  cooldownRemainingDays?: number;
  annualDonationCount?: number;
  annualDonationLimit?: number;
  annualDonationRemaining?: number;
  nextAnnualEligibleDate?: string | null;
};

const PERK_TIERS = [
  { label: "1 donation", reward: "Free BP + Hemoglobin Check" },
  { label: "2 donations", reward: "Free Basic Health Checkup" },
  { label: "3 donations", reward: "Priority Appointment Booking for 30 days" },
  { label: "4 donations", reward: "Free Blood Test Report" },
  { label: "5+ donations", reward: "Premium Donor Badge + Family Emergency Priority" },
] as const;

export default function DonorPerksPage() {
  const { user, ready, setUser } = useRoleSession("donor");
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState<DonationPolicySummary | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      try {
        const [profileResponse, policyResponse] = await Promise.all([
          apiJson<{ user: AppUser }>(`/auth/user/${user.id || user._id}`),
          apiJson<DonationPolicySummary>(`/donor/last-donation/${user.id || user._id}`),
        ]);

        setUser(profileResponse.user);
        saveStoredSession(profileResponse.user);
        setPolicy(policyResponse);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user, setUser]);

  if (!ready || !user) {
    return <LoadingView label="Loading donor perks..." />;
  }

  const perks = [...(user.perks || [])].sort((left, right) => {
    const leftDate = new Date(left.benefitDate || left.donationDate || 0).getTime();
    const rightDate = new Date(right.benefitDate || right.donationDate || 0).getTime();
    return rightDate - leftDate;
  });
  const availablePerks = perks.filter((perk) => perk.status === "available");
  const activePriorityAppointment = availablePerks.find((perk) => perk.type === "priority_appointment");
  const cooldownText =
    policy?.cooldownRemainingDays && policy.cooldownRemainingDays > 0
      ? `${policy.cooldownRemainingDays} days left in cooldown`
      : "You can schedule your next donation";

  return (
    <RoleLayout
      role="donor"
      userName={user.fullName}
      title="Donor perks"
      description="Track your 56-day cooling period, yearly donation cap, and the reward tiers unlocked by successful donations."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Perks available" value={availablePerks.length} helper="Benefits that are still active for use." />
        <StatCard label="Yearly donations" value={`${policy?.annualDonationCount || 0}/${policy?.annualDonationLimit || 0}`} helper="Rolling one-year donation progress." />
        <StatCard label="Next eligible date" value={formatDate(policy?.nextEligibleDate)} helper={cooldownText} />
        <StatCard label="Priority appointment" value={activePriorityAppointment ? "Active" : "Inactive"} helper={activePriorityAppointment ? `Valid until ${formatDate(activePriorityAppointment.expiryDate)}` : "Unlocks after your third donation in one year."} />
      </div>

      <PageSection
        title="Donation rules"
        description="These rules decide when you can donate again and how your benefits grow."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Panel>
            <h3 className="text-xl font-black tracking-tight text-slate-950">56-day cooling period</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              After every whole-blood donation, scheduling stays locked until {formatDate(policy?.nextEligibleDate)}.
            </p>
          </Panel>
          <Panel>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Yearly limit</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              You have {policy?.annualDonationRemaining || 0} donation slots remaining in the current rolling year window. If you hit the cap, the next yearly opening date is {formatDate(policy?.nextAnnualEligibleDate)}.
            </p>
          </Panel>
          <Panel>
            <h3 className="text-xl font-black tracking-tight text-slate-950">Basic checkup after donation</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Every successful donation unlocks a basic health checkup with blood pressure, sugar test, hemoglobin, BMI, and pulse rate.
            </p>
          </Panel>
        </div>
      </PageSection>

      <PageSection
        title="Tier rewards"
        description="Perks unlock based on how many successful donations you complete within one year."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {PERK_TIERS.map((tier) => (
            <Panel key={tier.label} className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-600">{tier.label}</p>
              <h3 className="text-xl font-black tracking-tight text-slate-950">{tier.reward}</h3>
            </Panel>
          ))}
        </div>
      </PageSection>

      <PageSection
        title="Reward history"
        description="Every donation-linked perk is listed below with its status and validity."
      >
        {loading ? (
          <Panel>Loading perk details...</Panel>
        ) : perks.length === 0 ? (
          <EmptyState
            title="No perks unlocked yet"
            description="Once a donation is completed, the matching donor benefits will appear here."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {perks.map((perk, index) => (
              <Panel key={`${perk.title}-${index}`} className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-950">{perk.title || "Donor perk"}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{perk.description || "A reward connected to your donation activity."}</p>
                  </div>
                  <StatusBadge value={perk.status || "available"} tone={perk.status === "used" ? "neutral" : perk.status === "expired" ? "danger" : "success"} />
                </div>
                <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-700">Donation date</p>
                    <p className="mt-2">{formatDate(perk.donationDate)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-700">Expiry</p>
                    <p className="mt-2">{formatDate(perk.expiryDate)}</p>
                  </div>
                </div>
                <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-700">Benefit start</p>
                    <p className="mt-2">{formatDate(perk.benefitDate)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-700">Reward cycle</p>
                    <p className="mt-2">{perk.awardYear ? String(perk.awardYear) : "Donation-linked"}</p>
                  </div>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </PageSection>
    </RoleLayout>
  );
}
