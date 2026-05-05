"use client";

import { Suspense, useMemo, useState } from "react";
import type React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  HeartPulse,
  Mail,
  MapPinned,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { FieldShell, LoadingView, Panel, inputClassName } from "@/components/app-ui";
import { BrandMark } from "@/components/brand-mark";
import { LocationDetector } from "@/components/location-detector";
import { apiJson, jsonBody } from "@/lib/api";
import { getDashboardPath, saveStoredSession } from "@/lib/session";
import type { AppRole, AppUser } from "@/lib/types";

type AuthMode = "login" | "register";

type FormState = {
  fullName: string;
  hospitalName: string;
  recipientName: string;
  email: string;
  password: string;
  phone: string;
  bloodType: string;
  hospitalId: string;
  latitude: string;
  longitude: string;
  address: string;
};

const roleCards: Array<{
  role: AppRole;
  title: string;
  subtitle: string;
  icon: typeof HeartPulse;
}> = [
  {
    role: "donor",
    title: "Donor",
    subtitle: "Respond to urgent requests and schedule donations.",
    icon: HeartPulse,
  },
  {
    role: "hospital",
    title: "Hospital",
    subtitle: "Create requests, review schedules, and manage blood demand.",
    icon: Building2,
  },
  {
    role: "recipient",
    title: "Recipient",
    subtitle: "Submit blood requests and track request progress simply.",
    icon: UserRound,
  },
];

const bloodTypes = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const defaultForm: FormState = {
  fullName: "",
  hospitalName: "",
  recipientName: "",
  email: "",
  password: "",
  phone: "",
  bloodType: "O+",
  hospitalId: "",
  latitude: "",
  longitude: "",
  address: "",
};

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromQuery = searchParams.get("type");

  const initialRole = useMemo<AppRole>(() => {
    return roleFromQuery === "hospital" || roleFromQuery === "recipient" ? roleFromQuery : "donor";
  }, [roleFromQuery]);

  const [role, setRole] = useState<AppRole>(initialRole);
  const [mode, setMode] = useState<AuthMode>("register");
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const title = mode === "login" ? "Welcome back to Pulse Bank" : "Join Pulse Bank";
  const subtitle =
    mode === "login"
      ? "Pick your role and return to your dashboard."
      : "Create the right account once, then use a simpler workspace built for your role.";

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const isHospital = role === "hospital";
    const isRecipient = role === "recipient";

    const fullName =
      role === "hospital" ? form.hospitalName : isRecipient ? form.recipientName : form.fullName;

    const payload: Record<string, unknown> = {
      fullName,
      email: form.email,
      password: form.password,
      phone: form.phone,
      role,
    };

    if (role === "donor") {
      payload.bloodType = form.bloodType;
    }

    if (isHospital) {
      payload.hospitalId = form.hospitalId;
    }

    if (mode === "register" && isHospital) {
      if (!form.latitude || !form.longitude) {
        setError("Hospital registration needs a current location before you continue.");
        setLoading(false);
        return;
      }

      payload.location = {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };
      payload.address = form.address;
    }

    if (mode === "login" && isHospital) {
      payload.hospitalId = form.hospitalId;
    }

    try {
      const response = await apiJson<{ token?: string; user: AppUser }>(
        mode === "login" ? "/auth/login" : "/auth/register",
        {
          method: "POST",
          body: jsonBody(payload),
        },
      );

      saveStoredSession(response.user, response.token);
      router.push(getDashboardPath(response.user.role));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to continue right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fecdd3,transparent_30%),radial-gradient(circle_at_bottom_right,#fde68a,transparent_20%),linear-gradient(180deg,#fff7ed_0%,#fffdf8_55%,#f8fafc_100%)] px-4 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        <section className="flex-1 rounded-[36px] border border-white/70 bg-slate-950 p-8 text-white shadow-[0_32px_120px_-60px_rgba(2,6,23,0.7)]">
          <div className="flex items-start justify-between gap-4">
            <BrandMark href="/" className="text-white hover:text-rose-200" />
            <Link
              href="/"
              className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-rose-300 hover:text-white"
            >
              Back home
            </Link>
          </div>

          <div className="mt-14 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-rose-100">
              <ShieldCheck className="h-4 w-4" />
              Designed to feel clear during urgent moments
            </div>
            <h1 className="text-5xl font-black tracking-tight text-white md:text-6xl">
              A better sign-in experience for every Pulse Bank role.
            </h1>
            <p className="text-base leading-8 text-slate-300">
              This login and registration space is intentionally simpler. Donors focus on response and scheduling,
              hospitals focus on operations, and recipients focus on request status and support.
            </p>
          </div>

          <div className="mt-10 grid gap-4">
            {roleCards.map(({ role: cardRole, title: cardTitle, subtitle: cardSubtitle, icon: Icon }) => (
              <button
                key={cardRole}
                type="button"
                onClick={() => setRole(cardRole)}
                className={`flex items-start gap-4 rounded-[24px] border px-5 py-5 text-left transition ${
                  role === cardRole
                    ? "border-rose-300 bg-white/12"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                }`}
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-rose-200">
                  <Icon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-lg font-black tracking-tight text-white">{cardTitle}</span>
                  <span className="mt-1 block text-sm leading-7 text-slate-300">{cardSubtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="w-full lg:max-w-2xl">
          <Panel className="rounded-[36px] p-8 md:p-10">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
                {mode === "login" ? "Sign in" : "Create account"}
              </p>
              <h2 className="text-4xl font-black tracking-tight text-slate-950">{title}</h2>
              <p className="text-sm leading-7 text-slate-600">{subtitle}</p>
            </div>

            <form onSubmit={submit} className="mt-8 space-y-5">
              {mode === "register" && (
                <FieldShell
                  label={role === "hospital" ? "Hospital name" : role === "recipient" ? "Recipient name" : "Full name"}
                >
                  <input
                    className={inputClassName()}
                    name={role === "hospital" ? "hospitalName" : role === "recipient" ? "recipientName" : "fullName"}
                    value={role === "hospital" ? form.hospitalName : role === "recipient" ? form.recipientName : form.fullName}
                    onChange={handleChange}
                    placeholder={role === "hospital" ? "Enter hospital name" : "Enter your name"}
                    required
                  />
                </FieldShell>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <FieldShell label="Email address">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${inputClassName()} pl-11`}
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </FieldShell>

                <FieldShell label="Phone number">
                  <input
                    className={inputClassName()}
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    required={mode === "register"}
                  />
                </FieldShell>
              </div>

              {role === "hospital" && (
                <FieldShell label="Hospital ID" hint="Hospitals use this during login and registration.">
                  <input
                    className={inputClassName()}
                    name="hospitalId"
                    value={form.hospitalId}
                    onChange={handleChange}
                    placeholder="Enter hospital ID"
                    required
                  />
                </FieldShell>
              )}

              {role === "donor" && mode === "register" && (
                <FieldShell label="Blood type">
                  <select
                    className={inputClassName()}
                    name="bloodType"
                    value={form.bloodType}
                    onChange={handleChange}
                  >
                    {bloodTypes.map((bloodType) => (
                      <option key={bloodType} value={bloodType}>
                        {bloodType}
                      </option>
                    ))}
                  </select>
                </FieldShell>
              )}

              {role === "hospital" && mode === "register" && (
                <LocationDetector
                  label="Hospital location"
                  description="Capture your current location so donors can find your hospital faster."
                  onLocationDetected={(latitude, longitude, address) => {
                    setForm((current) => ({
                      ...current,
                      latitude: latitude.toString(),
                      longitude: longitude.toString(),
                      address: address || current.address,
                    }));
                  }}
                />
              )}

              {role === "hospital" && mode === "register" && (
                <FieldShell label="Address" hint="You can refine the detected address if needed.">
                  <textarea
                    className={`${inputClassName()} min-h-28 resize-y`}
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Hospital address"
                  />
                </FieldShell>
              )}

              <FieldShell label="Password">
                <input
                  className={inputClassName()}
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
              </FieldShell>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {role === "hospital" ? <Building2 className="h-4 w-4" /> : role === "recipient" ? <MapPinned className="h-4 w-4" /> : <HeartPulse className="h-4 w-4" />}
                {loading ? "Please wait..." : mode === "login" ? "Sign in to dashboard" : `Create ${role} account`}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-4 rounded-[24px] bg-slate-50 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {mode === "login" ? "Need a new account?" : "Already registered?"}
                </p>
                <p className="text-xs text-slate-500">
                  Switch mode without leaving the screen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMode((current) => (current === "login" ? "register" : "login"));
                  setError("");
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-700"
              >
                {mode === "login" ? "Create account" : "Use existing login"}
              </button>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<LoadingView label="Preparing the sign in experience..." />}>
      <AuthPageContent />
    </Suspense>
  );
}
