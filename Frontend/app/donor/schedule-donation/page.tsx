"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { EmptyState, FieldShell, LoadingView, PageSection, Panel, inputClassName } from "@/components/app-ui";
import { RequestCard } from "@/components/data-cards";
import { RoleLayout } from "@/components/role-layout";
import { apiJson, jsonBody } from "@/lib/api";
import { haversineKm, roundDistanceKm } from "@/lib/distance";
import { formatDate } from "@/lib/format";
import { isOpenRequestForDonors } from "@/lib/request-state";
import type { BloodRequest } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

const DONOR_MEDICAL_RULES = {
  minAge: 18,
  maxAge: 65,
  minWeightKg: 50,
} as const;

function ScheduleDonationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const { user, ready } = useRoleSession("donor");
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [cooldownInfo, setCooldownInfo] = useState<{ nextEligibleDate?: string | null; cooldownActive?: boolean } | null>(null);
  const [form, setForm] = useState({
    contact: "",
    date: "",
    time: "",
    notes: "",
    age: "",
    weightKg: "",
    hasRecentFeverOrInfection: "no",
  });

  useEffect(() => {
    const loadRequest = async () => {
      if (!requestId) {
        setLoading(false);
        return;
      }
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [requestResponse, cooldownResponse] = await Promise.all([
          apiJson<{ requests: BloodRequest[] }>("/request/all"),
          apiJson<{ nextEligibleDate?: string | null; cooldownActive?: boolean }>(`/donor/last-donation/${user.id || user._id}`),
        ]);

        setCooldownInfo(cooldownResponse);

        const baseRequest = (requestResponse.requests || []).find((item) => item._id === requestId && isOpenRequestForDonors(item)) || null;
        const matchedRequest =
          baseRequest &&
          user?.location?.latitude &&
          user.location.longitude &&
          baseRequest.location?.latitude &&
          baseRequest.location.longitude
            ? {
                ...baseRequest,
                distanceKm: roundDistanceKm(
                  haversineKm(
                    user.location.latitude,
                    user.location.longitude,
                    baseRequest.location.latitude,
                    baseRequest.location.longitude,
                  ),
                ),
              }
            : baseRequest;
        setRequest(matchedRequest);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load request details.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      setForm((current) => ({ ...current, contact: user.phone || current.contact }));
      if (user.location?.latitude && user.location?.longitude) {
        setLocation({
          latitude: user.location.latitude,
          longitude: user.location.longitude,
        });
      }
      void loadRequest();
    }
  }, [requestId, user]);

  const minDate = useMemo(() => {
    const today = new Date();
    const todayValue = today.toISOString().slice(0, 10);
    const cooldownValue = cooldownInfo?.nextEligibleDate;

    if (!cooldownValue) return todayValue;
    return cooldownValue > todayValue ? cooldownValue : todayValue;
  }, [cooldownInfo]);

  const nextEligibleDate = cooldownInfo?.nextEligibleDate || null;
  const showCooldownNotice = Boolean(nextEligibleDate && nextEligibleDate > new Date().toISOString().slice(0, 10));

  const captureCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError("Location is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => setError("Location access is required before scheduling a donation."),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const submitSchedule = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user || !requestId) return;

    if (!location) {
      setError("Please capture your current location before submitting.");
      return;
    }

    if (nextEligibleDate && form.date < nextEligibleDate) {
      setError(`You can schedule your next donation after ${formatDate(nextEligibleDate)}.`);
      return;
    }

    const age = Number(form.age);
    const weightKg = Number(form.weightKg);
    const hasRecentFeverOrInfection = form.hasRecentFeverOrInfection === "yes";

    if (Number.isNaN(age) || age < DONOR_MEDICAL_RULES.minAge || age > DONOR_MEDICAL_RULES.maxAge) {
      setError(`Age must be between ${DONOR_MEDICAL_RULES.minAge} and ${DONOR_MEDICAL_RULES.maxAge} years before scheduling.`);
      return;
    }

    if (Number.isNaN(weightKg) || weightKg < DONOR_MEDICAL_RULES.minWeightKg) {
      setError(`Weight must be at least ${DONOR_MEDICAL_RULES.minWeightKg} kg before scheduling.`);
      return;
    }

    if (hasRecentFeverOrInfection) {
      setError("You cannot schedule a donation if you have had a recent fever or infection.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await apiJson("/schedule/create", {
        method: "POST",
        body: jsonBody({
          donorId: user.id || user._id,
          requestId,
          donorLocation: location,
          contact: form.contact,
          date: form.date,
          time: form.time,
          notes: form.notes,
          medicalEligibility: {
            age,
            weightKg,
            hasRecentFeverOrInfection,
          },
        }),
      });

      setSuccess("Donation schedule created successfully. The hospital can now review it.");
      setTimeout(() => router.push("/donor/dashboard"), 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || !user) {
    return <LoadingView label="Preparing schedule form..." />;
  }

  return (
    <RoleLayout
      role="donor"
      userName={user.fullName}
      title="Schedule a donation"
      description="Choose a date, time, contact method, and location so the hospital can review your donation offer clearly."
    >
      <PageSection
        title="Selected request"
        description="Confirm the request details before you submit a schedule."
      >
        {loading ? (
          <Panel>Loading request details...</Panel>
        ) : !request ? (
          <EmptyState
            title="No request selected"
            description="Go back to the donor request feed and choose the request you want to support."
            action={<Link href="/donor/requests" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Back to requests</Link>}
          />
        ) : (
          <RequestCard request={request} />
        )}
      </PageSection>

      {request && (
        <PageSection
          title="Donation schedule form"
          description="The details below are shared with the hospital so they can accept or reject the slot."
        >
          <Panel>
            <form onSubmit={submitSchedule} className="space-y-5">
              {showCooldownNotice && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                  Your next available donation date is {formatDate(nextEligibleDate)}. You can still book a slot on or after that date.
                </div>
              )}

              <div className="rounded-[24px] border border-rose-100 bg-rose-50/70 p-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-black tracking-tight text-slate-950">Important medical checks before donation</h3>
                  <p className="text-sm text-slate-600">
                    Complete these eligibility details first. Scheduling continues only when the donor meets these basic rules.
                  </p>
                </div>
                <div className="mt-4 grid gap-5 md:grid-cols-2">
                  <FieldShell label="Age" hint="Allowed range: 18 to 65 years">
                    <input
                      className={inputClassName()}
                      type="number"
                      min={DONOR_MEDICAL_RULES.minAge}
                      max={DONOR_MEDICAL_RULES.maxAge}
                      value={form.age}
                      onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))}
                      placeholder="Enter your age"
                      required
                    />
                  </FieldShell>

                  <FieldShell label="Weight (kg)" hint="Minimum required: 50 kg">
                    <input
                      className={inputClassName()}
                      type="number"
                      min={DONOR_MEDICAL_RULES.minWeightKg}
                      step="0.1"
                      value={form.weightKg}
                      onChange={(event) => setForm((current) => ({ ...current, weightKg: event.target.value }))}
                      placeholder="Enter your weight"
                      required
                    />
                  </FieldShell>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-1">
                  <FieldShell label="Recent fever or infection?" hint="Donor must not have a recent fever or infection">
                    <select
                      className={inputClassName()}
                      value={form.hasRecentFeverOrInfection}
                      onChange={(event) => setForm((current) => ({ ...current, hasRecentFeverOrInfection: event.target.value }))}
                      required
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </FieldShell>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell label="Contact number">
                  <input
                    className={inputClassName()}
                    name="contact"
                    value={form.contact}
                    onChange={(event) => setForm((current) => ({ ...current, contact: event.target.value }))}
                    placeholder="Best number for the hospital to reach you"
                    required
                  />
                </FieldShell>

                <FieldShell label="Preferred date">
                  <input
                    className={inputClassName()}
                    type="date"
                    min={minDate}
                    name="date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                    required
                  />
                </FieldShell>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell label="Preferred time">
                  <input
                    className={inputClassName()}
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                    required
                  />
                </FieldShell>

                <FieldShell label="Current location">
                  <button
                    type="button"
                    onClick={captureCurrentLocation}
                    className="inline-flex h-[54px] items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {location ? "Refresh live location" : "Capture live location"}
                  </button>
                </FieldShell>
              </div>

              {location && (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Current coordinates: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </div>
              )}

              <FieldShell label="Notes for the hospital" hint="Optional details like arrival flexibility or special instructions.">
                <textarea
                  className={`${inputClassName()} min-h-28 resize-y`}
                  name="notes"
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  placeholder="Add anything helpful for the hospital team"
                />
              </FieldShell>

              {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
              {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-rose-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting schedule..." : "Submit donation schedule"}
              </button>
            </form>
          </Panel>
        </PageSection>
      )}
    </RoleLayout>
  );
}

export default function ScheduleDonationPage() {
  return (
    <Suspense fallback={<LoadingView label="Preparing schedule form..." />}>
      <ScheduleDonationPageContent />
    </Suspense>
  );
}
