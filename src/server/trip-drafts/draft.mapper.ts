import type { TripDraftPhoto } from "@prisma/client";
import type { DraftWithPhotos } from "./draft.repository";
import type { RoutePoint, TripDay } from "@/lib/trips";

export function mapDraft(draft: DraftWithPhotos) {
  return {
    id: draft.id,
    title: draft.title,
    subtitle: draft.subtitle ?? undefined,
    startDate: toDateKey(draft.startDate),
    endDate: toDateKey(draft.endDate),
    coverPhotoId: draft.coverClientPhotoId ?? undefined,
    tags: draft.tags,
    moodTags: draft.moodTags,
    notes: draft.notes ?? undefined,
    status: draft.status.toLowerCase(),
    failureMessage: draft.failureMessage ?? undefined,
    photos: draft.photos.map(mapDraftPhoto),
    days: normalizeJsonArray<TripDay>(draft.daysJson),
    routePoints: normalizeJsonArray<RoutePoint>(draft.routePointsJson),
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
  };
}

function mapDraftPhoto(photo: TripDraftPhoto) {
  return {
    id: photo.clientId,
    draftPhotoId: photo.id,
    fileName: photo.originalName,
    previewUrl: photo.publicUrl,
    takenAt: photo.takenAt.toISOString(),
    lat: photo.lat ?? undefined,
    lng: photo.lng ?? undefined,
    geo: {
      formattedAddress: photo.formattedAddress ?? undefined,
      country: photo.country ?? undefined,
      province: photo.province ?? undefined,
      city: photo.city ?? undefined,
      district: photo.district ?? undefined,
      township: photo.township ?? undefined,
      adcode: photo.adcode ?? undefined,
      poiName: photo.poiName ?? undefined,
      aoiName: photo.aoiName ?? undefined,
      placeName: photo.placeName ?? undefined,
    },
    placeName: photo.placeName ?? undefined,
    country: photo.country ?? undefined,
    selected: true,
  };
}

function normalizeJsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function toDateKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}
