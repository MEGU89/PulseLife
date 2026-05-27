"use client";

import { useEffect, useState } from "react";

import { EmptyState, LoadingView, PageSection, Panel } from "@/components/app-ui";
import { ScheduleCard } from "@/components/data-cards";
import { RoleLayout } from "@/components/role-layout";
import { apiJson, jsonBody } from "@/lib/api";
import type { DonationSchedule } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

function getScheduledAt(schedule: DonationSchedule) {
  if (!schedule.date || !schedule.date.includes("-")) {
    return null;
  }

  const dateParts = schedule.date.split("-").map(Number);
  const timeParts = (schedule.time || "00:00").split(":").map(Number);

  if (dateParts.length !== 3 || timeParts.length !== 2 || [...dateParts, ...timeParts].some(Number.isNaN)) {
    return null;
  }

  const [first, second, third] = dateParts;
  const isIsoFormat = String(first).length === 4;
  const year = isIsoFormat ? first : third;
  const month = second;
  const day = isIsoFormat ? third : first;
  const [hours, minutes] = timeParts;

  const pad = (value: number) => String(value).padStart(2, "0");
  const parsed = new Date(`${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00+05:30`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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

      setMessage(
        action === "completed"
          ? "Schedule marked as completed and both email confirmations were triggered."
          : `Schedule marked as ${action}.`
      );
      await loadSchedules();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update schedule.");
    }
  };

  if (!ready || !user) {
    return <LoadingView label="Loading hospital schedules..." />;
  }

  const activeSchedules = schedules.filter((schedule) => {
    const status = schedule.status?.toLowerCase() || "";
    return status === "pending" || status === "accepted";
  });

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
        description="Accept or reject incoming donor schedules. Once an accepted schedule reaches its booked time, it completes automatically."
      >
        {loading ? (
          <Panel>Loading schedules...</Panel>
        ) : activeSchedules.length === 0 ? (
          <EmptyState title="No active schedules available" description="New donor schedule submissions will appear here, and completed ones move to history automatically." />
        ) : (
          <div className="grid gap-4">
            {activeSchedules.map((schedule) => (
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
                  {schedule.status === "accepted" && (() => {
                    const scheduledAt = getScheduledAt(schedule);
                    const isPastScheduledTime = scheduledAt ? Date.now() >= scheduledAt.getTime() : false;

                    return (
                      <p className="w-full text-xs text-slate-500">
                        {isPastScheduledTime
                          ? "This accepted schedule is waiting for the automatic completion refresh."
                          : "This accepted schedule will move to completed automatically after the donor's scheduled time."}
                      </p>
                    );
                  })()}
                </div>
              </ScheduleCard>
            ))}
          </div>
        )}
      </PageSection>
    </RoleLayout>
  );
}
