"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, MapPinned, Search, TriangleAlert } from "lucide-react";

import { Panel, inputClassName } from "@/components/app-ui";

type LocationDetectorProps = {
  label?: string;
  description?: string;
  required?: boolean;
  initialAddress?: string;
  initialLocation?: {
    latitude?: number;
    longitude?: number;
  } | null;
  onLocationDetected: (latitude: number, longitude: number, address?: string) => void;
  onAddressChange?: (address: string) => void;
};

type GeocodedLocation = {
  latitude: number;
  longitude: number;
  address: string;
};

async function getAddressFromCoordinates(latitude: number, longitude: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    const data = await response.json();

    return data?.display_name || "Current location detected";
  } catch {
    return "Current location detected";
  }
}

async function getCoordinatesFromAddress(address: string): Promise<GeocodedLocation | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );
    const data = await response.json();
    const firstMatch = Array.isArray(data) ? data[0] : null;

    if (!firstMatch?.lat || !firstMatch?.lon) {
      return null;
    }

    return {
      latitude: Number(firstMatch.lat),
      longitude: Number(firstMatch.lon),
      address: firstMatch.display_name || address,
    };
  } catch {
    return null;
  }
}

export function LocationDetector({
  label = "Location",
  description = "Use your current device location for faster matching.",
  required = false,
  initialAddress = "",
  initialLocation = null,
  onLocationDetected,
  onAddressChange,
}: LocationDetectorProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState(description);
  const [address, setAddress] = useState(initialAddress);
  const [coordinates, setCoordinates] = useState<{
    latitude?: number;
    longitude?: number;
  } | null>(initialLocation);

  useEffect(() => {
    setAddress(initialAddress);
  }, [initialAddress]);

  useEffect(() => {
    setCoordinates(initialLocation);
  }, [initialLocation]);

  const updateAddress = (value: string) => {
    setAddress(value);
    onAddressChange?.(value);
  };

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
        const detectedAddress = await getAddressFromCoordinates(latitude, longitude);

        setCoordinates({ latitude, longitude });
        updateAddress(detectedAddress);
        onLocationDetected(latitude, longitude, detectedAddress);
        setStatus("success");
        setMessage(detectedAddress);
      },
      () => {
        setStatus("error");
        setMessage("Location access was blocked or unavailable. You can try again or type the address manually.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 25000,
      },
    );
  };

  const geocodeAddress = async () => {
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setStatus("error");
      setMessage("Type an address first, then convert it to latitude and longitude.");
      return;
    }

    setStatus("loading");
    setMessage("Converting address into coordinates...");

    const geocoded = await getCoordinatesFromAddress(trimmedAddress);
    if (!geocoded) {
      setStatus("error");
      setMessage("We could not convert that address. Please try a more complete address or use auto-detect.");
      return;
    }

    setCoordinates({
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
    });
    updateAddress(geocoded.address);
    onLocationDetected(geocoded.latitude, geocoded.longitude, geocoded.address);
    setStatus("success");
    setMessage(`Address converted successfully: ${geocoded.address}`);
  };

  return (
    <Panel className="space-y-4 bg-slate-50">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <MapPinned className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <h3 className="text-lg font-black tracking-tight text-slate-900">
            {label}
            {required ? " *" : ""}
          </h3>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">Manual address entry</label>
        <textarea
          className={`${inputClassName()} min-h-28 resize-y`}
          value={address}
          onChange={(event) => updateAddress(event.target.value)}
          placeholder="Type a full address and convert it to coordinates"
        />
      </div>

      <div className="flex flex-wrap gap-3">
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
          Detect current location
        </button>

        <button
          type="button"
          onClick={() => void geocodeAddress()}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:text-rose-700"
        >
          <Search className="h-4 w-4" />
          Convert address to coordinates
        </button>
      </div>

      {coordinates?.latitude && coordinates?.longitude && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Coordinates ready: {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
        </div>
      )}
    </Panel>
  );
}
