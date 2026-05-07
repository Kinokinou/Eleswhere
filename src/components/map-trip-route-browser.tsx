"use client";

import { CalendarDays, ImageIcon, MapPinned } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AmapMap } from "@/components/amap-map";
import { PhotoLightbox } from "@/components/photo-lightbox";
import {
  getInitialRoutePointId,
  getRoutePointPhotos,
} from "@/components/trip-route-utils";
import { fetchTrip } from "@/lib/api-client";
import type { RoutePoint, TripDraft } from "@/lib/trips";

export function MapTripRouteBrowser({
  trips,
  loadTripDetail = fetchTrip,
}: {
  trips: TripDraft[];
  loadTripDetail?: (tripId: string) => Promise<TripDraft | null>;
}) {
  const [selectedTripId, setSelectedTripId] = useState<string | undefined>(
    () => trips[0]?.id,
  );
  const [loadedTrip, setLoadedTrip] = useState<TripDraft | null>(null);
  const [selectedPointId, setSelectedPointId] = useState<string | undefined>();
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(
    null,
  );

  const activeTrip =
    trips.find((trip) => trip.id === selectedTripId) ?? trips[0] ?? null;
  const activeTripId = activeTrip?.id;

  useEffect(() => {
    if (!activeTripId) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      loadTripDetail(activeTripId)
        .then((trip) => {
          if (cancelled) return;
          setLoadedTrip(trip);
          setSelectedPointId(undefined);
          setLightboxPhotoIndex(null);
        })
        .catch(() => {
          if (cancelled) return;
          setLoadedTrip(null);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeTripId, loadTripDetail]);

  const tripDetail = loadedTrip?.id === activeTripId ? loadedTrip : activeTrip;
  const activePointId =
    selectedPointId &&
    tripDetail?.routePoints.some((point) => point.id === selectedPointId)
      ? selectedPointId
      : getInitialRoutePointId(tripDetail?.routePoints ?? []);
  const selectedPoint =
    tripDetail?.routePoints.find((point) => point.id === activePointId) ??
    tripDetail?.routePoints[0];
  const selectedPhotos = useMemo(
    () =>
      selectedPoint && tripDetail
        ? getRoutePointPhotos(selectedPoint, tripDetail.photos)
        : [],
    [selectedPoint, tripDetail],
  );
  const currentLightboxPhoto =
    lightboxPhotoIndex === null ? undefined : selectedPhotos[lightboxPhotoIndex];

  const selectPoint = useCallback((point: RoutePoint) => {
    setSelectedPointId(point.id);
    setLightboxPhotoIndex(null);
  }, []);

  function selectTrip(trip: TripDraft) {
    setSelectedTripId(trip.id);
    setSelectedPointId(undefined);
    setLightboxPhotoIndex(null);
  }

  function showPreviousPhoto() {
    setLightboxPhotoIndex((currentIndex) =>
      currentIndex === null ? currentIndex : Math.max(0, currentIndex - 1),
    );
  }

  function showNextPhoto() {
    setLightboxPhotoIndex((currentIndex) =>
      currentIndex === null
        ? currentIndex
        : Math.min(selectedPhotos.length - 1, currentIndex + 1),
    );
  }

  if (trips.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/20 bg-white p-10 text-center">
        <p className="text-lg font-semibold">还没有旅行路线</p>
        <p className="mt-2 text-sm text-black/55">
          新建旅行后，可以在这里选择 Trip 并查看地图路线。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div aria-label="旅行路线地图">
          <AmapMap
            points={tripDetail?.routePoints ?? []}
            selectedPointId={selectedPoint?.id}
            onPointSelect={selectPoint}
            className="h-full"
          />
        </div>

        <aside className="rounded-lg border border-black/10 bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-black/65">
            <MapPinned size={18} />
            Trips
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {trips.map((trip) => (
              <TripCoverButton
                key={trip.id}
                trip={trip}
                selected={trip.id === activeTripId}
                onSelect={() => selectTrip(trip)}
              />
            ))}
          </div>
        </aside>
      </div>

      <section className="rounded-lg border border-black/10 bg-white p-5">
        {selectedPoint ? (
          <>
            <div className="flex flex-col justify-between gap-3 border-b border-black/10 pb-4 md:flex-row md:items-end">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0px] text-black/45">
                  当前路线点
                </div>
                <h2 className="mt-1 text-2xl font-semibold tracking-[0px]">
                  {selectedPoint.placeName}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-black/55">
                <span className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-3 py-2">
                  <CalendarDays size={14} />
                  {selectedPoint.date}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-black/[0.04] px-3 py-2">
                  <ImageIcon size={14} />
                  {selectedPhotos.length} 张照片
                </span>
              </div>
            </div>

            {selectedPhotos.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                {selectedPhotos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setLightboxPhotoIndex(index)}
                    aria-label={`查看照片 ${photo.fileName}`}
                    className="h-28 overflow-hidden rounded-lg bg-[#eef1ec] ring-black/20 transition hover:ring-2"
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
              <div className="mt-4 rounded-lg bg-[#f7f7f5] p-5 text-sm text-black/55">
                这个路线点暂时没有关联照片。
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-[#f7f7f5] p-5 text-sm text-black/55">
            当前 Trip 暂时没有路线点。
          </div>
        )}
      </section>

      {currentLightboxPhoto ? (
        <PhotoLightbox
          photo={currentLightboxPhoto}
          currentIndex={lightboxPhotoIndex ?? 0}
          total={selectedPhotos.length}
          onClose={() => setLightboxPhotoIndex(null)}
          onPrevious={showPreviousPhoto}
          onNext={showNextPhoto}
        />
      ) : null}
    </div>
  );
}

function TripCoverButton({
  trip,
  selected,
  onSelect,
}: {
  trip: TripDraft;
  selected: boolean;
  onSelect: () => void;
}) {
  const coverPhoto = trip.photos[0];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative min-h-36 overflow-hidden rounded-lg border p-3 text-left text-white transition ${
        selected ? "border-black" : "border-black/10 hover:border-black/25"
      }`}
    >
      {coverPhoto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverPhoto.previewUrl}
            alt={`${trip.title} 封面`}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/35 to-black/85" />
        </>
      ) : (
        <div className="absolute inset-0 bg-black" />
      )}

      <div className="relative z-10 flex h-full min-h-30 flex-col justify-between">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
          <MapPinned size={16} />
        </div>
        <div>
          <span className="block line-clamp-2 text-xs font-semibold">
            {trip.title}
          </span>
          <span className="mt-2 block text-[11px] leading-4 text-white/75">
            {trip.startDate}
            <br />
            {trip.photos.length} 张照片
          </span>
        </div>
      </div>
    </button>
  );
}
