"use client";

import { useEffect, useState } from "react";

import { FieldShell, LoadingView, PageSection, Panel, inputClassName } from "@/components/app-ui";
import { LocationDetector } from "@/components/location-detector";
import { RoleLayout } from "@/components/role-layout";
import { apiJson, jsonBody } from "@/lib/api";
import { saveStoredSession } from "@/lib/session";
import type { AppUser } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function DonorProfilePage() {
  const { user, ready, setUser } = useRoleSession("donor");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    bloodType: "O+",
    gender: "male",
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
      bloodType: user.bloodType || "O+",
      gender: user.gender === "female" ? "female" : "male",
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

      setUser(response.user);
      saveStoredSession(response.user);
      setMessage("Profile saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !user) {
    return <LoadingView label="Loading donor profile..." />;
  }

  return (
    <RoleLayout
      role="donor"
      userName={user.fullName}
      title="Donor profile"
      description="Keep your identity, blood type, and contact details clean so hospitals can trust the information they see."
    >
      <PageSection
        title="Profile details"
        description="This information is used across requests, schedules, and donor records."
      >
        <Panel>
          <form onSubmit={saveProfile} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FieldShell label="Full name">
                <input className={inputClassName()} value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required />
              </FieldShell>
              <FieldShell label="Email">
                <input className={inputClassName()} type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
              </FieldShell>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FieldShell label="Phone">
                <input className={inputClassName()} value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required />
              </FieldShell>
              <FieldShell label="Blood type">
                <select className={inputClassName()} value={form.bloodType} onChange={(event) => setForm((current) => ({ ...current, bloodType: event.target.value }))}>
                  {bloodTypes.map((bloodType) => (
                    <option key={bloodType} value={bloodType}>
                      {bloodType}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell label="Gender">
                <select className={inputClassName()} value={form.gender} onChange={(event) => setForm((current) => ({ ...current, gender: event.target.value }))}>
                  {genderOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </FieldShell>
            </div>

            <LocationDetector
              label="Address to coordinates"
              description="Optional. Auto-detect your location or type your address and convert it into latitude and longitude."
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
              {saving ? "Saving..." : "Save donor profile"}
            </button>
          </form>
        </Panel>
      </PageSection>
    </RoleLayout>
  );
}
