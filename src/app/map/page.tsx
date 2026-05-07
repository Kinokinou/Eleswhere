"use client";

import { MapTripRouteBrowser } from "@/components/map-trip-route-browser";
import { PageHeader } from "@/components/page-header";
import { useStoredTrips } from "@/lib/hooks";

export default function MapPage() {
  const trips = useStoredTrips();

  return (
    <section>
      <PageHeader
        title="Map"
        description="选择一条 Trip，在地图上查看路线点和对应照片。"
      />
      <MapTripRouteBrowser trips={trips} />
    </section>
  );
}
