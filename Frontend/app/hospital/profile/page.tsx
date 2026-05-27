"use client";

import { useEffect, useState } from "react";

import { FieldShell, LoadingView, PageSection, Panel, inputClassName } from "@/components/app-ui";
import { LocationDetector } from "@/components/location-detector";
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
    latitude: "",
    longitude: "",
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
      latitude: user.location?.latitude ? String(user.location.latitude) : "",
      longitude: user.location?.longitude ? String(user.location.longitude) : "",
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
          location:
            form.latitude && form.longitude
              ? {
                  latitude: Number(form.latitude),
                  longitude: Number(form.longitude),
                }
              : undefined,
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

            <LocationDetector
              label="Hospital address and location"
              description="You can auto-detect the hospital location or type the address and convert it into latitude and longitude."
              initialAddress={form.address}
              initialLocation={
                form.latitude && form.longitude
                  ? {
                      latitude: Number(form.latitude),
                      longitude: Number(form.longitude),
                    }
                  : null
              }
              onLocationDetected={(latitude, longitude, address) =>
                setForm((current) => ({
                  ...current,
                  latitude: String(latitude),
                  longitude: String(longitude),
                  address: address || current.address,
                }))
              }
              onAddressChange={(address) => setForm((current) => ({ ...current, address }))}
            />

            {message && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</div>}

            <button type="submit" disabled={saving} className="inline-flex rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              {saving ? "Saving..." : "Save hospital profile"}
            </button>
          </form>
        </Panel>
      </PageSection>
    </RoleLayout>
  );
}
