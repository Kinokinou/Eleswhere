"use client";

import { CalendarDays, ImageIcon, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { useStoredTrips } from "@/lib/hooks";
import { mockTrip } from "@/lib/mock-data";

export default function TripsPage() {
  const trips = useStoredTrips();

  const visibleTrips = trips.length > 0 ? trips : [mockTrip];

  return (
    <section>
      <PageHeader
        title="Trips"
        description="浏览已经创建的旅行记录。一阶段数据保存在本地浏览器。"
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleTrips.map((trip) => {
          const cover = trip.photos.find((photo) => photo.id === trip.coverPhotoId);

          return (
            <article
              key={trip.id}
              className="overflow-hidden rounded-lg border border-black/10 bg-white"
            >
              <div className="flex h-48 items-center justify-center bg-[#eef1ec]">
                {cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover.dataUrl ?? cover.previewUrl}
                    alt={trip.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="text-black/35" size={32} />
                )}
              </div>
              <div className="p-5">
                <h2 className="text-xl font-semibold">{trip.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-black/55">
                  {trip.subtitle ?? "由照片时间和地点自动整理出的旅行记录。"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-black/55">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-2 py-1">
                    <CalendarDays size={13} />
                    {trip.startDate} - {trip.endDate}
                  </span>
                  <span className="rounded-lg bg-black/[0.04] px-2 py-1">
                    {trip.photos.length} 张照片
                  </span>
                  <span className="rounded-lg bg-black/[0.04] px-2 py-1">
                    {trip.days.length} 天
                  </span>
                </div>
                <Link
                  href={`/trips/${trip.id}`}
                  className="mt-5 inline-flex h-10 items-center rounded-lg border border-black/10 px-4 text-sm font-semibold"
                >
                  查看详情
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
