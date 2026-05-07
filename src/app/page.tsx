"use client";

import { MapPinned, Plus, Route, Timer, Upload } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/page-header";
import { useStoredTrips } from "@/lib/hooks";
import { mockTrip } from "@/lib/mock-data";

export default function DashboardPage() {
  const trips = useStoredTrips();
  const visibleTrips = useMemo(
    () => (trips.length > 0 ? trips : [mockTrip]),
    [trips],
  );
  const stats = useMemo(() => {
    const days = visibleTrips.reduce((sum, trip) => sum + trip.days.length, 0);
    const routeCount = visibleTrips.reduce(
      (sum, trip) => sum + trip.routePoints.length,
      0,
    );
    const photoCount = visibleTrips.reduce(
      (sum, trip) => sum + trip.photos.length,
      0,
    );

    return { days, routeCount, photoCount };
  }, [visibleTrips]);

  const recentTrip = visibleTrips[0];

  return (
    <section>
      <PageHeader
        title="Eleswhere"
        description="把照片、地点和时间线整理成一张个人旅行记忆地图。"
        action={
          <Link
            href="/trips/new"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-black px-4 text-sm font-semibold text-white"
          >
            <Plus size={17} />
            新建旅行
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-lg border border-black/10 bg-white p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-black/60">
            <Upload size={18} />
            照片驱动的旅行创建流程
          </div>
          <h2 className="mt-8 max-w-2xl text-5xl font-semibold leading-tight tracking-[0px]">
            把照片丢进来，Eleswhere 自动整理出一次旅行。
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-6 text-black/55">
            一阶段会读取照片时间和 GPS，通过后端调用高德逆地理编码，把旅行整理成每日段落、路线点和详情页。
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <StatCard icon={<Timer size={18} />} label="旅行天数" value={`${stats.days}`} />
            <StatCard icon={<Route size={18} />} label="路线点" value={`${stats.routeCount}`} />
            <StatCard icon={<MapPinned size={18} />} label="照片数量" value={`${stats.photoCount}`} />
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-[#d8f35f] p-6">
          <div className="text-sm font-semibold text-black/60">最近一次旅行</div>
          <h3 className="mt-5 text-3xl font-semibold tracking-[0px]">
            {recentTrip.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-black/65">
            {recentTrip.subtitle ?? "从照片中自动生成旅行时间线。"}
          </p>
          <div className="mt-8 space-y-3">
            {recentTrip.routePoints.slice(0, 4).map((point) => (
              <div
                key={point.id}
                className="flex items-center justify-between rounded-lg bg-white/70 p-3 text-sm"
              >
                <span>{point.placeName}</span>
                <span className="text-black/45">#{point.order}</span>
              </div>
            ))}
          </div>
          <Link
            href={`/trips/${recentTrip.id}`}
            className="mt-6 inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-semibold text-white"
          >
            查看详情
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-black/10 bg-[#f7f7f5] p-4">
      <div className="flex items-center gap-2 text-black/55">{icon}</div>
      <div className="mt-4 text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-black/50">{label}</div>
    </div>
  );
}
