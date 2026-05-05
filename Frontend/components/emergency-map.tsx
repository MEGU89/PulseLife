import dynamic from "next/dynamic";

import { Panel } from "@/components/app-ui";
import type { MapPoint } from "@/components/leaflet-map-client";

const LeafletMapClient = dynamic(() => import("@/components/leaflet-map-client"), {
  ssr: false,
  loading: () => <Panel>Loading map...</Panel>,
});

export type { MapPoint } from "@/components/leaflet-map-client";

export function EmergencyMap({
  points,
  center,
  summary,
}: {
  points: MapPoint[];
  center?: [number, number];
  summary?: string;
}) {
  return (
    <div className="space-y-4">
      <LeafletMapClient points={points} center={center} />
      {summary && <p className="text-sm text-slate-600">{summary}</p>}
      <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-600" />
          Requests
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          Donors
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-600" />
          Your location
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-600" />
          Hospitals
        </span>
      </div>
    </div>
  );
}
