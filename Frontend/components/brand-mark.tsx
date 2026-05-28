import Link from "next/link";

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
      <PulseLifeIcon className="h-11 w-11 shrink-0" />
      <span className="flex flex-col">
        <span className={cn("font-black tracking-tight text-current", compact ? "text-lg" : "text-xl")}>
          Pulselife
        </span>
        {!compact && (
          <span className="text-xs font-medium uppercase tracking-[0.28em] text-current/65">
            Blood & Emergency Care
          </span>
        )}
      </span>
    </Link>
  );
}

export function PulseLifeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("rounded-[28px] shadow-[0_16px_40px_-24px_rgba(225,29,72,0.9)]", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pulselife-mark-gradient" x1="18" y1="18" x2="112" y2="112" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff0f4f" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="120" height="120" rx="34" fill="url(#pulselife-mark-gradient)" />
      <path
        d="M64 93.5L35.5 65.2C26.9 56.7 26.9 42.9 35.4 34.4C42.8 27 54.6 26.5 62.7 33.1L64 34.2L65.3 33.1C73.4 26.5 85.2 27 92.6 34.4C101.1 42.9 101.1 56.7 92.5 65.2L64 93.5Z"
        stroke="white"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35 67.5H50.6L56.7 57.6L64 79.3L71.4 45.8L77.5 67.5H93"
        stroke="white"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
