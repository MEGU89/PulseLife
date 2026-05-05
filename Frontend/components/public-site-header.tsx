"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { ActionLink } from "@/components/app-ui";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/format";

type PublicNavItem = {
  href: string;
  label: string;
};

export function PublicSiteHeader({
  items,
  secondaryAction,
  primaryAction,
  className,
}: {
  items: PublicNavItem[];
  secondaryAction?: { href: string; label: string };
  primaryAction?: { href: string; label: string };
  className?: string;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileNavOpen(false)}
            className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-700"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {(secondaryAction || primaryAction) && (
        <div className="mt-6 flex flex-col gap-3">
          {secondaryAction && (
            <ActionLink href={secondaryAction.href} label={secondaryAction.label} variant="secondary" />
          )}
          {primaryAction && <ActionLink href={primaryAction.href} label={primaryAction.label} />}
        </div>
      )}
    </>
  );

  return (
    <>
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />
          <aside className="absolute inset-y-0 right-0 z-10 w-[min(86vw,340px)] overflow-y-auto rounded-l-[32px] border-l border-slate-200 bg-white p-5 shadow-[0_35px_120px_-60px_rgba(15,23,42,0.65)]">
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

            <div className="mt-6">{navigation}</div>
          </aside>
        </div>
      )}

      <header className={cn("sticky top-0 z-30 border-b border-white/70 bg-white/85 backdrop-blur", className)}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <BrandMark compact />

          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            {items.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-rose-700">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {secondaryAction && (
              <ActionLink href={secondaryAction.href} label={secondaryAction.label} variant="secondary" />
            )}
            {primaryAction && <ActionLink href={primaryAction.href} label={primaryAction.label} />}
          </div>

          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileNavOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 transition hover:border-rose-200 hover:text-rose-700 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>
    </>
  );
}
