"use client";

import { useEffect, useState } from "react";

import { FieldShell, LoadingView, PageSection, Panel, inputClassName } from "@/components/app-ui";
import { RoleLayout } from "@/components/role-layout";
import { apiJson, jsonBody } from "@/lib/api";
import { saveStoredSession } from "@/lib/session";
import type { AppUser } from "@/lib/types";
import { useRoleSession } from "@/hooks/useRoleSession";

export default function RecipientProfilePage() {
  const { user, ready, setUser } = useRoleSession("recipient");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
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

      setUser(response.user);
      saveStoredSession(response.user);
      setMessage("Recipient profile saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!ready || !user) {
    return <LoadingView label="Loading recipient profile..." />;
  }

  return (
    <RoleLayout
      role="recipient"
      userName={user.fullName}
      title="Recipient profile"
      description="Keep the contact and address details connected to your requests accurate and easy to trust."
    >
      <PageSection title="Profile details" description="Hospitals and request records rely on this information being current.">
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
              <FieldShell label="Address">
                <input className={inputClassName()} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Address or area" />
              </FieldShell>
            </div>

            {message && <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{message}</div>}

            <button type="submit" disabled={saving} className="inline-flex rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60">
              {saving ? "Saving..." : "Save recipient profile"}
            </button>
          </form>
        </Panel>
      </PageSection>
    </RoleLayout>
  );
}
