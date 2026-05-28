import Link from "next/link";
import { ArrowRight, HeartHandshake, Landmark, ShieldPlus } from "lucide-react";

import { ActionLink, Panel, PageSection } from "@/components/app-ui";
import { PublicSiteHeader } from "@/components/public-site-header";

const pillars = [
  {
    icon: HeartHandshake,
    title: "Human-first emergency support",
    description: "The product is built around moments when people need quick clarity, not heavy dashboards or confusing forms.",
  },
  {
    icon: Landmark,
    title: "One platform for three roles",
    description: "Donors, hospitals, and recipients each get their own tools while staying connected through the same request and scheduling flow.",
  },
  {
    icon: ShieldPlus,
    title: "Simple records and safer handoff",
    description: "Requests, confirmations, schedules, and completed donations are easier to track so teams can respond with less friction.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#fffdf8_50%,#f8fafc_100%)]">
      <PublicSiteHeader
        items={[
          { href: "/", label: "Home" },
          { href: "/about", label: "About" },
          { href: "/auth", label: "Sign in" },
        ]}
        primaryAction={{ href: "/auth", label: "Enter the platform" }}
      />

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <header className="flex flex-col gap-6 rounded-[28px] border border-white/70 bg-white/92 p-6 shadow-[0_30px_100px_-55px_rgba(15,23,42,0.45)] backdrop-blur md:rounded-[32px] md:flex-row md:items-end md:justify-between md:p-8">
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">About the project</p>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Pulselife is designed to make urgent blood and organ coordination feel lighter.</h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                The project brings donors, hospitals, and recipients into one shared system where requests, schedules,
                and outcomes are easier to understand. Instead of cluttered screens, the product aims for clear
                actions, readable data, and a calmer experience during sensitive moments.
              </p>
            </div>
          </div>
          <ActionLink href="/auth" label="Enter the platform" />
        </header>

        <PageSection
          title="What makes it useful"
          description="These are the core product values this project is trying to deliver."
        >
          <div className="grid gap-5 md:grid-cols-3">
            {pillars.map(({ icon: Icon, title, description }) => (
              <Panel key={title} className="space-y-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
                </div>
              </Panel>
            ))}
          </div>
        </PageSection>

        <Panel className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight text-slate-950">Current role flows inside Pulselife</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[24px] bg-slate-50 p-5">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Donor</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">Review blood and organ requests, share availability, schedule eligible blood donations, and follow benefits or completed contributions.</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-5">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Hospital</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">Create urgent blood and organ requests, manage schedules, and keep a clean history of ongoing and fulfilled needs.</p>
              </div>
              <div className="rounded-[24px] bg-slate-50 p-5">
                <h3 className="text-lg font-black tracking-tight text-slate-900">Recipient</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">Submit blood and organ requests through hospitals, watch request progress, and manage profile and notification preferences.</p>
              </div>
            </div>
        </Panel>

        <div className="flex items-center justify-between rounded-[28px] border border-rose-100 bg-rose-50 px-6 py-5">
          <p className="max-w-2xl text-sm font-medium text-slate-700">
            The current refresh focuses on reducing unused code, simplifying every screen, and making the interface more comfortable for real users.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-rose-700">
            Back home
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
