"use client";

import { ArrowLeft, CalendarDays, ImageIcon, MapPinned } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AmapMap } from "@/components/amap-map";
import { PageHeader } from "@/components/page-header";
import { fetchTrip } from "@/lib/api-client";
import type { TripDraft } from "@/lib/trips";

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const [trip, setTrip] = useState<TripDraft | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTrip(params.id).then(setTrip).catch(() => setTrip(null));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [params.id]);

  if (!trip) {
    return (
      <section>
        <PageHeader title="Trip Detail" description="没有找到这条旅行记录。" />
        <Link
          href="/trips/new"
          className="inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-semibold text-white"
        >
          重新创建旅行
        </Link>
      </section>
    );
  }

  const cover = trip.photos.find((photo) => photo.id === trip.coverPhotoId);

  return (
    <section>
      <PageHeader
        title="Trip Detail"
        description="查看由照片自动整理出的旅行时间线、地点段落和路线。"
        action={
          <Link
            href="/trips"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-black/10 px-4 text-sm font-semibold"
          >
            <ArrowLeft size={16} />
            返回列表
          </Link>
        }
      />

      <div className="overflow-hidden rounded-lg border border-black/10 bg-white">
        <div className="h-72 bg-[#eef1ec]">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.dataUrl ?? cover.previewUrl}
              alt={trip.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="text-black/35" size={36} />
            </div>
          )}
        </div>
        <div className="p-6">
          <h2 className="text-4xl font-semibold tracking-[0px]">{trip.title}</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-black/55">
            <span className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-3 py-2">
              <CalendarDays size={15} />
              {trip.startDate} - {trip.endDate}
            </span>
            <span className="rounded-lg bg-black/[0.04] px-3 py-2">
              {trip.days.length} 天
            </span>
            <span className="rounded-lg bg-black/[0.04] px-3 py-2">
              {trip.photos.length} 张照片
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-black/65">
            <MapPinned size={18} />
            旅行时间线
          </div>
          <div className="mt-5 space-y-5">
            {trip.days.map((day) => (
              <div key={day.id}>
                <h3 className="font-semibold">
                  {day.title} · {day.date}
                </h3>
                <div className="mt-3 space-y-2">
                  {day.segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="rounded-lg bg-[#f7f7f5] p-4 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">
                          {segment.placeName ?? "未知地点"}
                        </span>
                        <span className="text-xs text-black/45">
                          {segment.photoIds.length} 张照片
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-black/50">
                        {formatTime(segment.startTime)} -{" "}
                        {formatTime(segment.endTime)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <AmapMap points={trip.routePoints} />
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="text-sm font-semibold text-black/65">照片墙</div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {trip.photos.map((photo) => (
                <div key={photo.id} className="h-32 overflow-hidden rounded-lg bg-[#eef1ec]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.dataUrl ?? photo.previewUrl}
                    alt={photo.fileName}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
