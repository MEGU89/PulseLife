"use client";

import { useState } from "react";

import { FieldShell, LoadingView, PageSection, Panel, inputClassName } from "@/components/app-ui";
import { RoleLayout } from "@/components/role-layout";
import { apiJson, jsonBody } from "@/lib/api";
import { useRoleSession } from "@/hooks/useRoleSession";

const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const urgencies = ["HIGH", "MODERATE", "LOW"];

export default function HospitalAddRequestPage() {
  const { user, ready } = useRoleSession("hospital");
  const [form, setForm] = useState({
    bloodType: "O+",
    unitsNeeded: "1",
    urgency: "HIGH",
    recipientName: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const createRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!user.location?.latitude || !user.location?.longitude) {
      setMessage("Hospital profile location is missing. Please update your hospital profile location first.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await apiJson("/request/add", {
        method: "POST",
        body: jsonBody({
          requestType: "blood",
          bloodType: form.bloodType,
          unitsNeeded: Number(form.unitsNeeded),
          hospital: user.fullName,
          urgency: form.urgency,
          requestedBy: user.id || user._id,
          recipientName: form.recipientName || undefined,
          location: user.location,
        }),
      });

      setMessage("Request created successfully and is now visible to donors.");
      setForm({
        bloodType: "O+",
        unitsNeeded: "1",
        urgency: "HIGH",
        recipientName: "",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create request.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !user) {
    return <LoadingView label="Loading request form..." />;
  }

  return (
    <RoleLayout
      role="hospital"
      userName={user.fullName}
      title="Create hospital request"
      description="Publish a clear blood request so donors can understand what is needed right away."
    >
      <PageSection
        title="Request details"
        description="Keep the form short and specific so the request becomes easier for donors to act on."
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
              
            </div>

            <FieldShell label="Recipient name" hint="Optional if this request is for a specific patient.">
              <input className={inputClassName()} value={form.recipientName} onChange={(event) => setForm((current) => ({ ...current, recipientName: event.target.value }))} placeholder="Patient or recipient name" />
            </FieldShell>

            {message && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</div>}

            <button type="submit" disabled={saving} className="inline-flex rounded-full bg-rose-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60">
              {saving ? "Creating request..." : "Create request"}
            </button>
          </form>
        </Panel>
      </PageSection>
    </RoleLayout>
  );
}
