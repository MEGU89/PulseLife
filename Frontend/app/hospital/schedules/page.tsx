"use client";

import { useEffect, useState } from "react";

import { EmptyState, LoadingView, PageSection, Panel } from "@/components/app-ui";
import { ScheduleCard } from "@/components/data-cards";
import { RoleLayout } from "@/components/role-layout";
import { apiJson, jsonBody } from "@/lib/api";
import type { DonationSchedule } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

export default function HospitalSchedulesPage() {
  const { user, ready } = useRoleSession("hospital");
  const [schedules, setSchedules] = useState<DonationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadSchedules = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await apiJson<{ schedules: DonationSchedule[] }>(`/hospital/schedules/${encodeURIComponent(user.fullName)}`);
      setSchedules(response.schedules || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedules();
  }, [user]);

  const updateSchedule = async (scheduleId: string, action: "accepted" | "rejected" | "completed") => {
    setMessage("");

    try {
      if (action === "completed") {
        await apiJson("/schedule/complete", {
          method: "POST",
          body: jsonBody({ scheduleId }),
        });
      } else {
        await apiJson("/schedule/update-status", {
          method: "POST",
          body: jsonBody({ scheduleId, action }),
        });
      }

      setMessage(`Schedule marked as ${action}.`);
      await loadSchedules();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update schedule.");
    }
  };

  if (!ready || !user) {
    return <LoadingView label="Loading hospital schedules..." />;
  }

  return (
    <RoleLayout
      role="hospital"
      userName={user.fullName}
      title="Donation schedules"
      description="Approve, reject, or complete donor schedules through a smaller review flow."
    >
      {message && <Panel className="bg-slate-50 text-sm text-slate-600">{message}</Panel>}

      <PageSection
        title="Schedule queue"
        description="Accept incoming donor schedules when they fit hospital capacity, then mark them complete after donation."
      >
        {loading ? (
          <Panel>Loading schedules...</Panel>
        ) : schedules.length === 0 ? (
          <EmptyState title="No schedules available" description="You will see donor schedule submissions here after requests start receiving responses." />
        ) : (
          <div className="grid gap-4">
            {schedules.map((schedule) => (
              <ScheduleCard key={schedule._id} schedule={schedule}>
                <div className="flex flex-wrap gap-3">
                  {schedule.status === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => void updateSchedule(schedule._id, "accepted")}
                        className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateSchedule(schedule._id, "rejected")}
                        className="rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-200"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {schedule.status === "accepted" && (
                    <button
                      type="button"
                      onClick={() => void updateSchedule(schedule._id, "completed")}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Mark completed
                    </button>
                  )}
                </div>
              </ScheduleCard>
            ))}
          </div>
        )}
      </PageSection>
    </RoleLayout>
  );
}
