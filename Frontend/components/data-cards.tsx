import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, Droplets, HeartPulse, Hospital, MapPinned, Phone } from "lucide-react";

import { Panel, StatusBadge } from "@/components/app-ui";
import { formatDate, formatDateTime, titleCase } from "@/lib/format";
import {
  getRequestMapSummary,
  getRequestQuantityLabel,
  getRequestTitle,
  getRequestTypeLabel,
} from "@/lib/request-display";
import { getRequestPrimaryStatus, shouldShowRequestConfirmationBadge } from "@/lib/request-state";
import type { BloodRequest, DonationSchedule } from "@/lib/types";

function getTone(value?: string) {
  const normalized = (value || "").toLowerCase();

  if (normalized.includes("accept") || normalized.includes("confirm") || normalized.includes("fulfilled") || normalized.includes("complete")) {
    return "success" as const;
  }

  if (normalized.includes("reject") || normalized.includes("cancel")) {
    return "danger" as const;
  }

  if (normalized.includes("pending") || normalized.includes("high") || normalized.includes("moderate")) {
    return "warning" as const;
  }

  return "neutral" as const;
}

export function RequestCard({
  request,
  actionHref,
  actionLabel,
  children,
}: {
  request: BloodRequest;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
}) {
  const hasActualDistance = typeof request.distanceKm === "number";
  const hasSearchRadius = typeof request.searchRadiusKm === "number" || typeof request.locationKm === "number";
  const primaryStatus = getRequestPrimaryStatus(request);
  const RequestNeedIcon = request.requestType === "organ" ? HeartPulse : Droplets;
  const cardCount = [true, hasActualDistance, hasSearchRadius, true, true].filter(Boolean).length;
  const gridClassName =
    cardCount >= 5
      ? "xl:grid-cols-5"
      : cardCount === 4
        ? "xl:grid-cols-4"
        : "xl:grid-cols-3";

  return (
    <Panel className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Hospital className="h-4 w-4" />
            <span>{request.hospitalName || request.hospital || "Hospital request"}</span>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">
            {getRequestTitle(request)}
          </h3>
          <p className="text-sm leading-7 text-slate-600">
            {request.recipientName
              ? `Created for ${request.recipientName}.`
              : `Created inside Pulselife for emergency ${getRequestTypeLabel(request.requestType)} support.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={titleCase(request.urgency)} tone={getTone(request.urgency)} />
          <StatusBadge value={titleCase(primaryStatus)} tone={getTone(primaryStatus)} />
          {shouldShowRequestConfirmationBadge(request) && request.confirmationStatus && (
            <StatusBadge value={titleCase(request.confirmationStatus)} tone={getTone(request.confirmationStatus)} />
          )}
        </div>
      </div>

      <div className={`grid gap-3 text-sm text-slate-600 md:grid-cols-2 ${gridClassName}`}>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <RequestNeedIcon className="h-4 w-4 text-rose-500" />
            {getRequestQuantityLabel(request.requestType)}
          </div>
          <p className="mt-2 text-lg font-black text-slate-950">{request.unitsNeeded}</p>
        </div>
        {hasActualDistance && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <MapPinned className="h-4 w-4 text-rose-500" />
              Distance from you
            </div>
            <p className="mt-2 text-lg font-black text-slate-950">{request.distanceKm} km</p>
          </div>
        )}
        {hasSearchRadius && (
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-700">
              <MapPinned className="h-4 w-4 text-rose-500" />
              Search radius
            </div>
            <p className="mt-2 text-lg font-black text-slate-950">{request.searchRadiusKm ?? request.locationKm} km</p>
          </div>
        )}
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Phone className="h-4 w-4 text-rose-500" />
            Contact
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-950">{request.phone || request.requestedBy?.phone || "Not shared"}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <CalendarDays className="h-4 w-4 text-rose-500" />
            Created
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(request.createdAt)}</p>
        </div>
      </div>

      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {actionLabel}
        </Link>
      )}
      {children}
    </Panel>
  );
}

export function ScheduleCard({
  schedule,
  children,
}: {
  schedule: DonationSchedule;
  children?: ReactNode;
}) {
  const request = typeof schedule.requestId === "object" ? schedule.requestId : null;
  const title = schedule.donorName || request?.hospital || "Donation schedule";
  const subtitle = request
    ? schedule.donorName && request?.hospital
      ? `${getRequestMapSummary(request)} for ${request.hospital}`
      : getRequestTitle(request)
    : "Scheduled Pulselife donation";

  return (
    <Panel className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-950">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {subtitle}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {schedule.status && <StatusBadge value={titleCase(schedule.status)} tone={getTone(schedule.status)} />}
          {schedule.hospitalResponse && schedule.hospitalResponse !== "none" && (
            <StatusBadge value={titleCase(schedule.hospitalResponse)} tone={getTone(schedule.hospitalResponse)} />
          )}
        </div>
      </div>

      <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <CalendarDays className="h-4 w-4 text-rose-500" />
            Date
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-950">{formatDate(schedule.date)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Clock3 className="h-4 w-4 text-rose-500" />
            Time
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-950">{schedule.time || "Not set"}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Phone className="h-4 w-4 text-rose-500" />
            Contact
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-950">{schedule.contact || "Not shared"}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <Droplets className="h-4 w-4 text-rose-500" />
            Units
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-950">{request?.unitsNeeded || schedule.unitsNeeded || "N/A"}</p>
        </div>
      </div>

      {schedule.notes && <p className="text-sm leading-7 text-slate-600">{schedule.notes}</p>}
      {children}
    </Panel>
  );
}
