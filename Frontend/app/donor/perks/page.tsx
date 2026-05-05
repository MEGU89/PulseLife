"use client";

import { useEffect, useState } from "react";

import { EmptyState, LoadingView, PageSection, Panel, StatCard, StatusBadge } from "@/components/app-ui";
import { RoleLayout } from "@/components/role-layout";
import { apiJson } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AppUser } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

export default function DonorPerksPage() {
  const { user, ready, setUser } = useRoleSession("donor");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      try {
        const response = await apiJson<{ user: AppUser }>(`/auth/user/${user.id || user._id}`);
        setUser(response.user);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user, setUser]);

  if (!ready || !user) {
    return <LoadingView label="Loading donor perks..." />;
  }

  const perks = user.perks || [];

  return (
    <RoleLayout
      role="donor"
      userName={user.fullName}
      title="Donor perks"
      description="Completed donations can unlock simple rewards like health checkup benefits."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Perks available" value={perks.filter((perk) => perk.status === "available").length} helper="Benefits you can still use." />
        <StatCard label="Total donations" value={user.totalDonations || 0} helper="Running count stored in your profile." />
        <StatCard label="Last health checkup" value={formatDate(user.lastHealthCheckupDate)} helper="Updated after eligible donation completion." />
      </div>

      <PageSection
        title="Reward history"
        description="Every donation-linked perk is listed below with its current availability."
      >
        {loading ? (
          <Panel>Loading perk details...</Panel>
        ) : perks.length === 0 ? (
          <EmptyState
            title="No perks unlocked yet"
            description="Once a donation is completed, any matching donor benefits will appear here."
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
              </Panel>
            ))}
          </div>
        )}
      </PageSection>
    </RoleLayout>
  );
}
