"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, MapPinned, TriangleAlert } from "lucide-react";

import { Panel } from "@/components/app-ui";

type LocationDetectorProps = {
  label?: string;
  description?: string;
  onLocationDetected: (latitude: number, longitude: number, address?: string) => void;
};

async function getAddressFromCoordinates(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
    );
    const data = await response.json();

    return data?.display_name || "Current location detected";
  } catch {
    return "Current location detected";
  }
}

export function LocationDetector({
  label = "Location",
  description = "Use your current device location for faster matching.",
  onLocationDetected,
}: LocationDetectorProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState(description);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("This browser does not support location detection.");
      return;
    }

    setStatus("loading");
    setMessage("Finding your current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const address = await getAddressFromCoordinates(latitude, longitude);

        onLocationDetected(latitude, longitude, address);
        setStatus("success");
        setMessage(address);
      },
      () => {
        setStatus("error");
        setMessage("Location access was blocked or unavailable. You can try again.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 25000,
      },
    );
  };

  return (
    <Panel className="space-y-4 bg-slate-50">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <MapPinned className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight text-slate-900">{label}</h3>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={detectLocation}
        className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        {status === "loading" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : status === "success" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : status === "error" ? (
          <TriangleAlert className="h-4 w-4" />
        ) : (
          <MapPinned className="h-4 w-4" />
        )}
        {status === "success" ? "Location captured" : "Detect current location"}
      </button>
    </Panel>
  );
}
