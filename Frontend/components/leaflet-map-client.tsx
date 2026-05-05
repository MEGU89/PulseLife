"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { latLngBounds, type LatLngExpression } from "leaflet";

export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  detail?: string;
  tone?: "rose" | "emerald" | "amber" | "sky";
};

const toneStyles: Record<NonNullable<MapPoint["tone"]>, { fill: string; stroke: string }> = {
  rose: { fill: "#e11d48", stroke: "#881337" },
  emerald: { fill: "#059669", stroke: "#064e3b" },
  amber: { fill: "#d97706", stroke: "#78350f" },
  sky: { fill: "#0284c7", stroke: "#0c4a6e" },
};

function FitToPoints({ points, center }: { points: MapPoint[]; center?: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0 && center) {
      map.setView(center, 11);
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 12);
      return;
    }

    if (points.length > 1) {
      const bounds = latLngBounds(points.map((point) => [point.latitude, point.longitude]));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [center, map, points]);

  return null;
}

export default function LeafletMapClient({
  points,
  center,
}: {
  points: MapPoint[];
  center?: [number, number];
}) {
  const initialCenter: LatLngExpression = center || (points[0] ? [points[0].latitude, points[0].longitude] : [20.5937, 78.9629]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200">
      <MapContainer
        center={initialCenter}
        zoom={6}
        scrollWheelZoom
        className="h-[360px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitToPoints points={points} center={center} />
        {points.map((point) => {
          const tone = toneStyles[point.tone || "rose"];

          return (
            <CircleMarker
              key={point.id}
              center={[point.latitude, point.longitude]}
              radius={10}
              pathOptions={{
                fillColor: tone.fill,
                color: tone.stroke,
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{point.title}</p>
                  {point.subtitle && <p className="text-sm text-slate-700">{point.subtitle}</p>}
                  {point.detail && <p className="text-xs text-slate-500">{point.detail}</p>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
