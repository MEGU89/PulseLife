"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { FieldShell, LoadingView, PageSection, Panel, inputClassName } from "@/components/app-ui";
import { LocationDetector } from "@/components/location-detector";
import { RoleLayout } from "@/components/role-layout";
import { apiJson, jsonBody } from "@/lib/api";
import type { AppUser } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

type HospitalOption = {
  id: string;
  hospitalName: string;
  address?: string;
  phone?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const urgencies = ["HIGH", "MODERATE", "LOW"];

export default function RecipientCreateRequestPage() {
  const router = useRouter();
  const { user, ready } = useRoleSession("recipient");
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [form, setForm] = useState({
    bloodType: "O+",
    unitsNeeded: "1",
    urgency: "HIGH",
    hospital: "",
    searchRadiusKm: "5",
  });
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadHospitals = async () => {
      const response = await apiJson<{ hospitals: HospitalOption[] }>("/hospital/all");
      setHospitals(response.hospitals || []);
      if (response.hospitals?.[0]) {
        setForm((current) => ({ ...current, hospital: response.hospitals[0].hospitalName }));
      }
    };

    if (user) {
      void loadHospitals();
    }
  }, [user]);

  const selectedHospital = hospitals.find((hospital) => hospital.hospitalName === form.hospital);

  const createRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      await apiJson("/request/add", {
        method: "POST",
        body: jsonBody({
          requestType: "blood",
          bloodType: form.bloodType,
          unitsNeeded: Number(form.unitsNeeded),
          hospital: form.hospital,
          urgency: form.urgency,
          searchRadiusKm: Number(form.searchRadiusKm),
          requestedBy: user.id || user._id,
          recipientName: user.fullName,
          isRecipientRequest: true,
          location: location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
              }
            : selectedHospital?.location,
        }),
      });

      setMessage("Request created successfully.");
      setTimeout(() => router.push("/recipient/dashboard"), 1200);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create request.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !user) {
    return <LoadingView label="Loading recipient request form..." />;
  }

  return (
    <RoleLayout
      role="recipient"
      userName={user.fullName}
      title="Create a recipient request"
      description="Choose a hospital, blood type, urgency, and location details so your request is easier to route."
    >
      <PageSection
        title="Request form"
        description="This form sends your need into the hospital and donor workflow with a cleaner set of fields."
      >
        <Panel>
          <form onSubmit={createRequest} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FieldShell label="Blood type needed">
                <select className={inputClassName()} value={form.bloodType} onChange={(event) => setForm((current) => ({ ...current, bloodType: event.target.value }))}>
                  {bloodTypes.map((bloodType) => (
                    <option key={bloodType} value={bloodType}>
                      {bloodType}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell label="Units needed">
                <input className={inputClassName()} type="number" min="1" value={form.unitsNeeded} onChange={(event) => setForm((current) => ({ ...current, unitsNeeded: event.target.value }))} required />
              </FieldShell>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FieldShell label="Urgency">
                <select className={inputClassName()} value={form.urgency} onChange={(event) => setForm((current) => ({ ...current, urgency: event.target.value }))}>
                  {urgencies.map((urgency) => (
                    <option key={urgency} value={urgency}>
                      {urgency}
                    </option>
                  ))}
                </select>
              </FieldShell>
              <FieldShell label="Search radius in km">
                <input className={inputClassName()} type="number" min="1" value={form.searchRadiusKm} onChange={(event) => setForm((current) => ({ ...current, searchRadiusKm: event.target.value }))} required />
              </FieldShell>
            </div>

            <FieldShell label="Destination hospital">
              <select className={inputClassName()} value={form.hospital} onChange={(event) => setForm((current) => ({ ...current, hospital: event.target.value }))}>
                {hospitals.map((hospital) => (
                  <option key={hospital.id} value={hospital.hospitalName}>
                    {hospital.hospitalName}
                  </option>
                ))}
              </select>
            </FieldShell>

            {selectedHospital && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-slate-700">{selectedHospital.hospitalName}</p>
                {selectedHospital.address && <p className="mt-1">{selectedHospital.address}</p>}
                {selectedHospital.phone && <p className="mt-1">Phone: {selectedHospital.phone}</p>}
              </div>
            )}

            <LocationDetector
              label="Recipient location"
              description="Optional but helpful if you want to share a more accurate handoff point."
              onLocationDetected={(latitude, longitude, address) => {
                setLocation({ latitude, longitude, address });
              }}
            />

            {message && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</div>}

            <button type="submit" disabled={saving} className="inline-flex rounded-full bg-rose-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60">
              {saving ? "Creating request..." : "Create recipient request"}
            </button>
          </form>
        </Panel>
      </PageSection>
    </RoleLayout>
  );
}
