"use client";

import { useEffect, useState } from "react";

import { FieldShell, LoadingView, PageSection, Panel, inputClassName } from "@/components/app-ui";
import { RoleLayout } from "@/components/role-layout";
import { apiJson, jsonBody } from "@/lib/api";
import { saveStoredSession } from "@/lib/session";
import type { AppUser } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

export default function HospitalProfilePage() {
  const { user, ready, setUser } = useRoleSession("hospital");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    hospitalId: "",
    address: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      hospitalId: user.hospitalId || "",
      address: user.address || "",
    });
  }, [user]);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await apiJson<{ user: AppUser }>("/auth/update-profile", {
        method: "POST",
        body: jsonBody({
          userId: user.id || user._id,
          ...form,
        }),
      });

      const updatedUser = { ...response.user, hospitalId: form.hospitalId };
      setUser(updatedUser);
      saveStoredSession(updatedUser);
      setMessage("Hospital profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save hospital profile.");
    } finally {
      setSaving(false);
    }
  };

  const refreshLocation = () => {
    if (!user) return;

    setMessage("");

    if (!navigator.geolocation) {
      setMessage("This browser cannot share location.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await apiJson<{ hospital: { location?: { latitude?: number; longitude?: number } } }>("/hospital/update-location", {
            method: "POST",
            body: jsonBody({
              hospitalId: user.id || user._id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: form.address,
            }),
          });

          const updatedUser = {
            ...user,
            location: response.hospital.location || user.location,
            address: form.address,
          };

          setUser(updatedUser);
          saveStoredSession(updatedUser);
          setMessage("Hospital location updated.");
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Unable to update location.");
        }
      },
      () => setMessage("Location access was blocked."),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  if (!ready || !user) {
    return <LoadingView label="Loading hospital profile..." />;
  }

  return (
    <RoleLayout
      role="hospital"
      userName={user.fullName}
      title="Hospital profile"
      description="Maintain clear identity, address, and location details so donors know exactly where they are headed."
    >
      <PageSection title="Hospital details" description="This information appears across requests, schedules, and contact views.">
        <Panel>
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FieldShell label="Hospital name">
                <input className={inputClassName()} value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required />
              </FieldShell>
              <FieldShell label="Hospital email">
                <input className={inputClassName()} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
              </FieldShell>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FieldShell label="Contact phone">
                <input className={inputClassName()} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required />
              </FieldShell>
              <FieldShell label="Hospital ID">
                <input className={inputClassName()} value={form.hospitalId} onChange={(event) => setForm((current) => ({ ...current, hospitalId: event.target.value }))} />
              </FieldShell>
            </div>

            <FieldShell label="Address">
              <textarea className={`${inputClassName()} min-h-28 resize-y`} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Hospital address" />
            </FieldShell>

            {user.location?.latitude && user.location?.longitude && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Current coordinates: {user.location.latitude.toFixed(5)}, {user.location.longitude.toFixed(5)}
              </div>
            )}

            {message && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</div>}

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="inline-flex rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
                {saving ? "Saving..." : "Save hospital profile"}
              </button>
              <button type="button" onClick={refreshLocation} className="inline-flex rounded-full border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-700">
                Refresh hospital location
              </button>
            </div>
          </form>
        </Panel>
      </PageSection>
    </RoleLayout>
  );
}
