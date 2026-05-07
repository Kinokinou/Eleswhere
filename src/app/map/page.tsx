"use client";

import { useMemo } from "react";
import { AmapMap } from "@/components/amap-map";
import { PageHeader } from "@/components/page-header";
import { useStoredTrips } from "@/lib/hooks";

export default function MapPage() {
  const trips = useStoredTrips();

  const routePoints = useMemo(() => {
    return trips.flatMap((trip) => trip.routePoints);
  }, [trips]);

  return (
    <section>
      <PageHeader
        title="Map"
        description="展示旅行中的城市点和路线点。没有高德配置时会显示占位提示。"
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <AmapMap points={routePoints} />
        <aside className="rounded-lg border border-black/10 bg-white p-5">
          <div className="text-sm font-semibold text-black/60">路线点</div>
          <div className="mt-4 space-y-3">
            {routePoints.map((point) => (
              <div
                key={point.id}
                className="rounded-lg bg-[#f7f7f5] p-3 text-sm"
              >
                <div className="font-semibold">{point.placeName}</div>
                <div className="mt-1 text-xs text-black/50">
                  {point.date} · {point.photoIds.length} 张照片
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
