"use client";

import {
  CalendarDays,
  Download,
  Edit3,
  ImageIcon,
  MoreHorizontal,
  Plus,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { deleteTrip } from "@/lib/api-client";
import { useStoredTrips } from "@/lib/hooks";
import type { TripDraft } from "@/lib/trips";

export default function TripsPage() {
  const trips = useStoredTrips();
  const [hiddenTripIds, setHiddenTripIds] = useState<Set<string>>(new Set());
  const [openMenuTripId, setOpenMenuTripId] = useState<string | null>(null);
  const [deletingTrip, setDeletingTrip] = useState<TripDraft | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const visibleTrips = useMemo(
    () => trips.filter((trip) => !hiddenTripIds.has(trip.id)),
    [hiddenTripIds, trips],
  );

  async function confirmDeleteTrip() {
    if (!deletingTrip || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteMessage(null);

    try {
      await deleteTrip(deletingTrip.id);
      setHiddenTripIds((current) => new Set(current).add(deletingTrip.id));
      setDeletingTrip(null);
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : "删除旅行失败");
    } finally {
      setIsDeleting(false);
    }
  }

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

      {visibleTrips.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/20 bg-white p-10 text-center">
          <p className="text-lg font-semibold">还没有旅行记录</p>
          <p className="mt-2 text-sm text-black/55">
            新建旅行后，数据库里的记录会显示在这里。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleTrips.map((trip) => {
          const cover = trip.photos.find((photo) => photo.id === trip.coverPhotoId);

          return (
            <article
              key={trip.id}
              className="relative overflow-visible rounded-lg border border-black/10 bg-white"
            >
              <div className="overflow-hidden rounded-t-lg">
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
              <div className="absolute bottom-4 right-4">
                <button
                  type="button"
                  aria-label="打开旅行操作菜单"
                  onClick={() =>
                    setOpenMenuTripId((current) =>
                      current === trip.id ? null : trip.id,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-black shadow-sm hover:bg-[#f7f7f5]"
                >
                  <MoreHorizontal size={18} />
                </button>

                {openMenuTripId === trip.id ? (
                  <div
                    role="menu"
                    className="absolute bottom-11 right-0 z-10 w-44 overflow-hidden rounded-lg border border-black/10 bg-white p-1 text-sm shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-black/70"
                      disabled
                    >
                      <Edit3 size={15} />
                      编辑（暂未实现）
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-black/70"
                      disabled
                    >
                      <Share2 size={15} />
                      分享（暂未实现）
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-black/70"
                      disabled
                    >
                      <Download size={15} />
                      导出（暂未实现）
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setDeletingTrip(trip);
                        setOpenMenuTripId(null);
                        setDeleteMessage(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={15} />
                      删除旅行
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
        </div>
      )}

      {deletingTrip ? (
        <div
          role="dialog"
          aria-label="确认删除旅行"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">确认删除旅行</h2>
                <p className="mt-2 text-sm leading-6 text-black/55">
                  删除后会移除「{deletingTrip.title}」和关联照片记录。这个操作不可撤销。
                </p>
              </div>
              <button
                type="button"
                aria-label="关闭删除确认"
                onClick={() => setDeletingTrip(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/[0.04]"
              >
                <X size={16} />
              </button>
            </div>

            {deleteMessage ? (
              <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {deleteMessage}
              </div>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTrip(null)}
                className="h-10 rounded-lg border border-black/10 px-4 text-sm font-semibold"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDeleteTrip}
                disabled={isDeleting}
                className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "正在删除..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
