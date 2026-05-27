"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ReceiptText,
  Settings,
  UserRound,
  X,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/format";
import { clearStoredSession, getRoleLabel } from "@/lib/session";
import type { AppRole } from "@/lib/types";

const roleLinks: Record<AppRole, Array<{ href: string; label: string; icon: typeof LayoutDashboard }>> = {
  donor: [
    { href: "/donor/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/donor/requests", label: "Requests", icon: ReceiptText },
    { href: "/donor/history", label: "History", icon: HeartHandshake },
    { href: "/donor/stats", label: "Stats", icon: Settings },
    { href: "/donor/perks", label: "Perks", icon: PlusCircle },
    { href: "/donor/profile", label: "Profile", icon: UserRound },
  ],
  hospital: [
    { href: "/hospital/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/hospital/add-request", label: "Add Request", icon: PlusCircle },
    { href: "/hospital/schedules", label: "Schedules", icon: ReceiptText },
    { href: "/hospital/history", label: "History", icon: HeartHandshake },
    { href: "/hospital/profile", label: "Profile", icon: UserRound },
  ],
  recipient: [
    { href: "/recipient/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/recipient/create-request", label: "Create Request", icon: PlusCircle },
    { href: "/recipient/history", label: "History", icon: HeartHandshake },
    { href: "/recipient/settings", label: "Settings", icon: Settings },
    { href: "/recipient/profile", label: "Profile", icon: UserRound },
  ],
};

export function RoleLayout({
  role,
  title,
  description,
  userName,
  actions,
  children,
}: {
  role: AppRole;
  title: string;
  description: string;
  userName?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  const navigation = (
    <>
      <div className="mt-6 rounded-[24px] bg-slate-950 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-rose-200">{getRoleLabel(role)} workspace</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight">{userName || "Pulselife user"}</h1>
        <p className="mt-2 text-sm text-slate-300">{description}</p>
      </div>

      <nav className="mt-6 space-y-2">
        {roleLinks[role].map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                active
                  ? "bg-rose-600 text-white shadow-[0_16px_36px_-22px_rgba(225,29,72,0.85)]"
                  : "text-slate-600 hover:bg-rose-50 hover:text-rose-700",
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => {
          clearStoredSession();
          router.push("/auth");
        }}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-700"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </>
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffe4e6,transparent_35%),linear-gradient(180deg,#fff7ed_0%,#f8fafc_54%,#eef2ff_100%)]">
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />
          <aside className="absolute inset-y-0 left-0 z-10 w-[min(88vw,360px)] overflow-y-auto rounded-r-[32px] border-r border-slate-200 bg-white p-5 shadow-[0_35px_120px_-60px_rgba(15,23,42,0.65)]">
            <div className="flex items-center justify-between gap-3">
              <BrandMark compact />
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileNavOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:border-rose-200 hover:text-rose-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {navigation}
          </aside>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-4 px-3 py-3 md:gap-6 md:px-4 md:py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden rounded-[32px] border border-white/70 bg-white/92 p-5 shadow-[0_30px_100px_-55px_rgba(15,23,42,0.45)] backdrop-blur lg:block">
          <BrandMark />
          {navigation}
        </aside>

        <div className="space-y-4 md:space-y-6">
          <div className="sticky top-3 z-40 lg:hidden">
            <div className="flex items-center justify-between gap-3 rounded-[26px] border border-white/70 bg-white/92 px-4 py-3 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.4)] backdrop-blur">
              <BrandMark compact className="min-w-0" />
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileNavOpen(true)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:border-rose-200 hover:text-rose-700"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>

          <header className="rounded-[28px] border border-white/70 bg-white/92 p-4 shadow-[0_30px_100px_-55px_rgba(15,23,42,0.45)] backdrop-blur md:rounded-[32px] md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
                  {getRoleLabel(role)}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{description}</p>
              </div>
              {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
            </div>
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}
