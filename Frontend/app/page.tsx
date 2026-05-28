"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundPlus,
} from "lucide-react";

import { ActionLink, Panel, PageSection, StatCard } from "@/components/app-ui";
import { PublicSiteHeader } from "@/components/public-site-header";

const highlights = [
  {
    title: "Donor-friendly flow",
    description: "Donors can spot active blood and organ requests, share availability, schedule eligible blood visits, and track completed donations in one place.",
    icon: HeartHandshake,
  },
  {
    title: "Hospital control desk",
    description: "Hospitals can publish blood and organ requests, review schedules, and watch confirmed activity without jumping through heavy screens.",
    icon: Building2,
  },
  {
    title: "Recipient support",
    description: "Recipients can submit requests to nearby hospitals, monitor progress, and keep their information organized.",
    icon: UserRoundPlus,
  },
];

const steps = [
  "Hospitals or recipients create a blood or organ request with urgency, units needed, and location details.",
  "Donors review requests, and eligible blood requests can move into scheduling with contact information.",
  "Hospitals accept or reject schedules, then mark donations complete after handoff.",
  "Pulselife keeps a clearer record of blood and organ requests, schedules, donor perks, and profile details.",
];

export default function HomePage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fecdd3,transparent_30%),linear-gradient(180deg,#fff7ed_0%,#fffdf8_42%,#f8fafc_100%)] text-slate-900">
      <PublicSiteHeader
        items={[
          { href: "#overview", label: "Overview" },
          { href: "#workflow", label: "Workflow" },
          { href: "/about", label: "About" },
        ]}
        secondaryAction={{ href: "/auth", label: "Sign in" }}
        primaryAction={{ href: "/auth?type=donor", label: "Start saving lives" }}
      />

      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/90 px-4 py-2 text-sm font-semibold text-rose-700">
              <Sparkles className="h-4 w-4" />
              Simple emergency blood and organ coordination
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-7xl">
                Pulselife is a calmer way to connect donors, hospitals, and recipients fast.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                This project is built to reduce confusion during urgent blood and organ needs. It gives hospitals a request desk,
                donors a clear action path, and recipients a simpler way to ask for help. The goal is to make emergency
                coordination feel more human, more readable, and easier to act on.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/auth?type=donor"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Explore donor experience
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth?type=hospital"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-700"
              >
                Open hospital workspace
              </Link>
            </div>
          </div>

          <Panel className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Project summary</p>
                <h2 className="text-2xl font-black tracking-tight text-slate-950">What this app includes</h2>
              </div>
            </div>
            <div className="space-y-4 text-sm leading-7 text-slate-600">
              <p>Pulselife currently supports three major roles: donor, hospital, and recipient.</p>
              <p>Hospitals can add emergency blood and organ requests, review donor schedules, and track request history.</p>
              <p>Donors can review active requests, set availability, book donation slots, and see perks or stats after completed donations.</p>
              <p>Recipients can create requests, check current status, and keep their personal details and settings updated.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard label="Roles supported" value="3" helper="Donor, hospital, recipient" />
              <StatCard label="Core flows" value="4" helper="Request, match, schedule, complete" />
            </div>
          </Panel>
        </div>
      </section>

      <section id="overview" className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <PageSection
            title="Built for real users"
            description="Every role gets a lighter interface, clearer language, and faster actions so the product feels comfortable during urgent moments."
          >
            <div className="grid gap-5 lg:grid-cols-3">
              {highlights.map(({ title, description, icon: Icon }) => (
                <Panel key={title} className="space-y-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                    <Icon className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-950">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                  </div>
                </Panel>
              ))}
            </div>
          </PageSection>
        </div>
      </section>

      <section id="workflow" className="px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <PageSection
            title="How the project works"
            description="This is the full operating loop Pulselife is designed around."
          >
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <Panel className="space-y-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Stethoscope className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-slate-950">Main workflow</h3>
                    <p className="text-sm text-slate-600">Each step is meant to keep decisions simple.</p>
                  </div>
                </div>
                <ol className="space-y-4 text-sm leading-7 text-slate-600">
                  {steps.map((step, index) => (
                    <li key={step} className="flex gap-4">
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel className="space-y-4">
                <h3 className="text-xl font-black tracking-tight text-slate-950">Why this version is easier to use</h3>
                <ul className="space-y-4 text-sm leading-7 text-slate-600">
                  <li>The screens are being simplified so users are not buried under too many controls.</li>
                  <li>Navigation is grouped by role so each user sees only the tools that matter to them.</li>
                  <li>Icons and typography are cleaner and more human, without the over-designed AI-template look.</li>
                  <li>Home and auth screens now explain the project clearly instead of dropping users into forms too early.</li>
                </ul>
              </Panel>
            </div>
          </PageSection>
        </div>
      </section>

      <footer className="border-t border-white/70 px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>Pulselife focuses on emergency blood and organ coordination with cleaner donor, hospital, and recipient journeys.</p>
            <p>Copyright {currentYear} PulseLife. All rights reserved.</p>
          </div>
          <div className="flex gap-5">
            <Link href="/about" className="font-semibold transition hover:text-rose-700">
              About
            </Link>
            <Link href="/auth" className="font-semibold transition hover:text-rose-700">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
