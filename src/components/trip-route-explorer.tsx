"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MapPin,
  Route,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { AmapMap } from "@/components/amap-map";
import type { PhotoMeta, RoutePoint } from "@/lib/trips";

type RoutePointPhotoView = {
  point: RoutePoint;
  photos: PhotoMeta[];
};

export function TripRouteExplorer({
  points,
  photos,
}: {
  points: RoutePoint[];
  photos: PhotoMeta[];
}) {
  const [selectedPointId, setSelectedPointId] = useState<string | undefined>(
    () => getInitialRoutePointId(points),
  );
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(
    null,
  );

  const activePointId =
    selectedPointId && points.some((point) => point.id === selectedPointId)
      ? selectedPointId
      : getInitialRoutePointId(points);
  const selectedPoint =
    points.find((point) => point.id === activePointId) ?? points[0];
  const selectedView: RoutePointPhotoView | null = selectedPoint
    ? {
        point: selectedPoint,
        photos: getRoutePointPhotos(selectedPoint, photos),
      }
    : null;

  const currentLightboxPhoto =
    lightboxPhotoIndex === null
      ? undefined
      : selectedView?.photos[lightboxPhotoIndex];

  const selectPoint = useCallback((point: RoutePoint) => {
    setSelectedPointId(point.id);
    setLightboxPhotoIndex(null);
  }, []);

  function showPreviousPhoto() {
    setLightboxPhotoIndex((currentIndex) =>
      currentIndex === null ? currentIndex : Math.max(0, currentIndex - 1),
    );
  }

  function showNextPhoto() {
    setLightboxPhotoIndex((currentIndex) => {
      if (currentIndex === null || !selectedView) {
        return currentIndex;
      }

      return Math.min(selectedView.photos.length - 1, currentIndex + 1);
    });
  }

  if (!selectedView) {
    return (
      <div className="rounded-lg border border-black/10 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-black/65">
          <Route size={18} />
          路线浏览
        </div>
        <div className="mt-4 rounded-lg bg-[#f7f7f5] p-5 text-sm text-black/55">
          这条旅行暂时没有路线点。
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AmapMap
        points={points}
        selectedPointId={selectedView.point.id}
        onPointSelect={selectPoint}
      />

      <div className="rounded-lg border border-black/10 bg-white p-5">
        <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
          <aside className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-black/65">
              <Route size={18} />
              路线点
            </div>
            <div className="space-y-2">
              {points.map((point) => (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => selectPoint(point)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                    point.id === selectedView.point.id
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-[#f7f7f5] text-black hover:border-black/25"
                  }`}
                >
                  <span className="block font-semibold">{point.placeName}</span>
                  <span
                    className={`mt-1 block text-xs ${
                      point.id === selectedView.point.id
                        ? "text-white/70"
                        : "text-black/45"
                    }`}
                  >
                    {point.date} · {point.photoIds.length} 张照片
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section>
            <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-4 md:flex-row md:items-end">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0px] text-black/45">
                  当前地点
                </div>
                <h2 className="mt-1 text-2xl font-semibold tracking-[0px]">
                  {selectedView.point.placeName}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-black/55">
                <span className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-3 py-2">
                  <CalendarDays size={14} />
                  {selectedView.point.date} ·{" "}
                  {formatTime(selectedView.point.startTime)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-3 py-2">
                  <ImageIcon size={14} />
                  {selectedView.photos.length} 张照片
                </span>
                {formatCoordinate(selectedView.point) ? (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-3 py-2">
                    <MapPin size={14} />
                    {formatCoordinate(selectedView.point)}
                  </span>
                ) : null}
              </div>
            </div>

            <div aria-label="当前地点照片墙" className="mt-4">
              {selectedView.photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {selectedView.photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightboxPhotoIndex(index)}
                      className="h-32 overflow-hidden rounded-lg bg-[#eef1ec] text-left ring-black/20 transition hover:ring-2"
                      aria-label={`查看照片 ${photo.fileName}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.previewUrl}
                        alt={photo.fileName}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg bg-[#f7f7f5] p-5 text-sm text-black/55">
                  这个地点暂时没有关联照片。
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {currentLightboxPhoto && selectedView ? (
        <PhotoLightbox
          photo={currentLightboxPhoto}
          currentIndex={lightboxPhotoIndex ?? 0}
          total={selectedView.photos.length}
          onClose={() => setLightboxPhotoIndex(null)}
          onPrevious={showPreviousPhoto}
          onNext={showNextPhoto}
        />
      ) : null}
    </div>
  );
}

// 关键逻辑：优先选择能在地图上显示的点；没有坐标时退回第一个路线点。
export function getInitialRoutePointId(points: RoutePoint[]) {
  return (
    points.find(
      (point) => typeof point.lat === "number" && typeof point.lng === "number",
    )?.id ?? points[0]?.id
  );
}

// 关键逻辑：路线点只存 photoIds，这里负责补齐照片对象并按拍摄时间排序。
export function getRoutePointPhotos(point: RoutePoint, photos: PhotoMeta[]) {
  const photoById = new Map(photos.map((photo) => [photo.id, photo]));

  return point.photoIds
    .map((photoId) => photoById.get(photoId))
    .filter((photo): photo is PhotoMeta => Boolean(photo))
    .sort(
      (left, right) =>
        new Date(left.takenAt).getTime() - new Date(right.takenAt).getTime(),
    );
}

function PhotoLightbox({
  photo,
  currentIndex,
  total,
  onClose,
  onPrevious,
  onNext,
}: {
  photo: PhotoMeta;
  currentIndex: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  return (
    <div
      role="dialog"
      aria-label="照片预览"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-full w-full max-w-5xl flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between text-white">
          <div className="text-sm">
            {currentIndex + 1} / {total} · {photo.fileName}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="关闭预览"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative flex min-h-[60vh] items-center justify-center">
          <button
            type="button"
            onClick={onPrevious}
            disabled={isFirst}
            className="absolute left-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="上一张"
          >
            <ChevronLeft size={22} />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.previewUrl}
            alt={photo.fileName}
            className="max-h-[76vh] max-w-full rounded-lg object-contain"
          />

          <button
            type="button"
            onClick={onNext}
            disabled={isLast}
            className="absolute right-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="下一张"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCoordinate(point: RoutePoint) {
  if (typeof point.lat !== "number" || typeof point.lng !== "number") {
    return undefined;
  }

  return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
}
