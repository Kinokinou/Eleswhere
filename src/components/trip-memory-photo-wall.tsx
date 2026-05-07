"use client";

import { useState } from "react";
import { PhotoLightbox } from "@/components/photo-lightbox";
import { getPhotosByIds } from "@/components/trip-route-utils";
import type { PhotoMeta, TripDraft } from "@/lib/trips";

export type TripSegmentPhotoBlock = {
  id: string;
  title: string;
  photos: PhotoMeta[];
};

export function TripMemoryPhotoWall({ trip }: { trip: TripDraft }) {
  const blocks = buildTripSegmentPhotoBlocks(trip);
  const [lightbox, setLightbox] = useState<{
    photos: PhotoMeta[];
    index: number;
  } | null>(null);
  const currentPhoto = lightbox?.photos[lightbox.index];

  function showPreviousPhoto() {
    setLightbox((current) =>
      current
        ? { ...current, index: Math.max(0, current.index - 1) }
        : current,
    );
  }

  function showNextPhoto() {
    setLightbox((current) =>
      current
        ? {
            ...current,
            index: Math.min(current.photos.length - 1, current.index + 1),
          }
        : current,
    );
  }

  return (
    <section className="mt-5 rounded-lg border border-black/10 bg-white p-5">
      <div className="text-sm font-semibold text-black/65">照片墙</div>
      <div className="mt-4 space-y-5">
        {blocks.length > 0 ? (
          blocks.map((block) => (
            <article
              key={block.id}
              aria-label={`${block.title} 照片墙`}
              className="rounded-lg bg-[#f7f7f5] p-4"
            >
              <h3 className="text-sm font-semibold">{block.title}</h3>
              {block.photos.length > 0 ? (
                <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                  {block.photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => setLightbox({ photos: block.photos, index })}
                      aria-label={`查看照片 ${photo.fileName}`}
                      className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-[#eef1ec] ring-black/20 transition hover:ring-2"
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
                <div className="mt-3 rounded-lg bg-white p-4 text-sm text-black/45">
                  这个时间段暂时没有照片。
                </div>
              )}
              <textarea
                readOnly
                value="AI 旅行回忆将在这里生成。"
                className="mt-4 min-h-24 w-full resize-none rounded-lg border border-black/10 bg-white p-3 text-sm leading-6 text-black/45 outline-none"
                aria-label={`${block.title} AI 回忆占位`}
              />
            </article>
          ))
        ) : (
          <div className="rounded-lg bg-[#f7f7f5] p-5 text-sm text-black/55">
            这条旅行暂时没有可展示的照片段落。
          </div>
        )}
      </div>

      {lightbox && currentPhoto ? (
        <PhotoLightbox
          photo={currentPhoto}
          currentIndex={lightbox.index}
          total={lightbox.photos.length}
          onClose={() => setLightbox(null)}
          onPrevious={showPreviousPhoto}
          onNext={showNextPhoto}
        />
      ) : null}
    </section>
  );
}

export function buildTripSegmentPhotoBlocks(
  trip: TripDraft,
): TripSegmentPhotoBlock[] {
  return trip.days.flatMap((day) =>
    day.segments.map((segment) => ({
      id: segment.id,
      title: `${day.title} · ${formatIsoTime(segment.startTime)}-${formatIsoTime(
        segment.endTime,
      )} · ${segment.placeName ?? segment.title ?? "未知地点"}`,
      photos: getPhotosByIds(segment.photoIds, trip.photos),
    })),
  );
}

function formatIsoTime(value: string) {
  const timePart = value.includes("T") ? value.split("T")[1] : "";
  return timePart ? timePart.slice(0, 5) : value;
}
