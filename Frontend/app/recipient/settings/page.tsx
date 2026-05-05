"use client";

import { useEffect, useState } from "react";

import { LoadingView, PageSection, Panel } from "@/components/app-ui";
import { RoleLayout } from "@/components/role-layout";
import { useRoleSession } from "@/hooks/useRoleSession";

type SettingsState = {
  emailUpdates: boolean;
  quickContact: boolean;
  cleanerDashboard: boolean;
};

const defaultSettings: SettingsState = {
  emailUpdates: true,
  quickContact: true,
  cleanerDashboard: true,
};

export default function RecipientSettingsPage() {
  const { user, ready } = useRoleSession("recipient");
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem("recipientSettings");
    if (!raw) return;

    try {
      setSettings(JSON.parse(raw) as SettingsState);
    } catch {
      setSettings(defaultSettings);
    }
  }, []);

  const toggle = (key: keyof SettingsState) => {
    const nextSettings = { ...settings, [key]: !settings[key] };
    setSettings(nextSettings);
    window.localStorage.setItem("recipientSettings", JSON.stringify(nextSettings));
    setMessage("Settings saved locally on this device.");
  };

  if (!ready || !user) {
    return <LoadingView label="Loading recipient settings..." />;
  }

  return (
    <RoleLayout
      role="recipient"
      userName={user.fullName}
      title="Recipient settings"
      description="Keep only the preferences that make request tracking easier for you."
    >
      <PageSection
        title="Preferences"
        description="These settings are stored locally to keep the recipient experience simpler."
      >
        <Panel className="space-y-4">
          {[
            ["emailUpdates", "Email progress reminders", "Keep lightweight reminders enabled for important request updates."],
            ["quickContact", "Show hospital contact details quickly", "Make contact information easier to spot in your request cards."],
            ["cleanerDashboard", "Prefer reduced dashboard clutter", "Keep the interface focused on only the most important request details."],
          ].map(([key, label, description]) => {
            const typedKey = key as keyof SettingsState;

            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(typedKey)}
                className="flex w-full items-start justify-between gap-4 rounded-2xl bg-slate-50 px-5 py-4 text-left transition hover:bg-slate-100"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">{label}</p>
                  <p className="mt-1 text-sm leading-7 text-slate-600">{description}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${settings[typedKey] ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {settings[typedKey] ? "On" : "Off"}
                </span>
              </button>
            );
          })}

          {message && <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">{message}</div>}
        </Panel>
      </PageSection>
    </RoleLayout>
  );
}
