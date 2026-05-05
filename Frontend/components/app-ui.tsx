import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/format";

export function PageSection({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">{title}</h2>
          {description && <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-white/70 bg-white/92 p-4 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.4)] backdrop-blur md:rounded-[28px] md:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: ReactNode;
  helper?: string;
}) {
  return (
    <Panel className="space-y-2">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-3xl font-black tracking-tight text-slate-900">{value}</p>
      {helper && <p className="text-sm text-slate-600">{helper}</p>}
    </Panel>
  );
}

export function StatusBadge({
  value,
  tone,
}: {
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-700",
  };

  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", styles[tone || "neutral"])}>
      {value}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Panel className="border-dashed text-center">
      <div className="mx-auto max-w-xl space-y-3 py-6">
        <h3 className="text-xl font-black tracking-tight text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{description}</p>
        {action}
      </div>
    </Panel>
  );
}

export function LoadingView({ label = "Loading your workspace..." }: { label?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#ffe4e6,transparent_45%),linear-gradient(180deg,#fff7ed_0%,#f8fafc_55%,#f1f5f9_100%)] px-4">
      <Panel className="max-w-md text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-rose-100" />
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Pulse Bank</h1>
        <p className="mt-2 text-sm text-slate-600">{label}</p>
      </Panel>
    </main>
  );
}

export function ActionLink({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition",
        variant === "primary"
          ? "bg-rose-600 text-white hover:bg-rose-700"
          : "border border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:text-rose-700",
      )}
    >
      {label}
    </Link>
  );
}

export function FieldShell({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function inputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-rose-300 focus:bg-white focus:ring-4 focus:ring-rose-100";
}
