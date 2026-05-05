import Link from "next/link";
import { HeartPulse } from "lucide-react";

import { cn } from "@/lib/format";

type BrandMarkProps = {
  compact?: boolean;
  href?: string;
  className?: string;
};

export function BrandMark({
  compact = false,
  href = "/",
  className,
}: BrandMarkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-3 text-slate-900 transition hover:text-rose-700",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-[0_16px_40px_-22px_rgba(225,29,72,0.85)]">
        <HeartPulse className="h-5 w-5" />
      </span>
      <span className="flex flex-col">
        <span className={cn("font-black tracking-tight", compact ? "text-lg" : "text-xl")}>
          Pulse Bank
        </span>
        {!compact && (
          <span className="text-xs font-medium uppercase tracking-[0.28em] text-slate-500">
            Blood & Emergency Care
          </span>
        )}
      </span>
    </Link>
  );
}
